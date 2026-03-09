import { NextResponse, type NextRequest } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import {
  getInstagramScrapeStatus,
  fetchScrapeResults,
  calculateOutlierScores,
  computeAvgViews,
} from "@/lib/scraping/instagram"
import { toVideoDTO } from "@/lib/api/helpers"
import { createNotification } from "@/lib/notifications"
import { checkAndUnlockBonus, getClaimableBonusAfterAction } from "@/lib/activation-triggers"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

// ── Shared: fetch dataset, upsert to DB, return videos ───────────────────────

async function processAndSave(
  supabase: SupabaseClient<Database>,
  datasetId: string,
  creator: { id: string; handle: string; followers: number; avg_views: number }
) {
  const scrapedVideos = await fetchScrapeResults(datasetId)
  if (scrapedVideos.length === 0) return { scored: [], videos: [] }

  const avgViews = computeAvgViews(scrapedVideos)
  // Score = views / followers (5× followers = outlier threshold)
  const scored = calculateOutlierScores(scrapedVideos, creator.followers)

  for (const v of scored) {
    const platform_video_id = String(v.platform_video_id).slice(0, 255)
    const upsertPayload: Record<string, unknown> = {
      creator_id: creator.id,
      platform: "instagram" as const,
      platform_video_id,
      title: v.caption ? v.caption.slice(0, 200) : null,
      description: v.caption,
      url: v.url,
      thumbnail_url: v.thumbnail_url,
      duration: v.duration != null ? Math.round(v.duration) : null,
      views: Math.round(v.views),
      likes: Math.round(v.likes),
      comments: Math.round(v.comments),
      shares: Math.round(v.shares),
      outlier_score: v.outlier_score,
      posted_at: v.posted_at,
      scraped_at: new Date().toISOString(),
    }
    if (v.media_url) upsertPayload.media_url = v.media_url
    await supabase.from("videos").upsert(
      upsertPayload as never,
      { onConflict: "platform,platform_video_id", ignoreDuplicates: false }
    )
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", creator.id)
    .order("outlier_score", { ascending: false })
    .limit(200)

  return { scored, videos: (videos ?? []).map(toVideoDTO) }
}

// ── GET /api/creators/[id]/scrape-status?runId=xxx ────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const runId = request.nextUrl.searchParams.get("runId")
  if (!runId) return NextResponse.json({ error: "runId requis" }, { status: 400 })

  const supabase = createServiceClient()

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!creator) return NextResponse.json({ error: "Créateur non trouvé" }, { status: 404 })

  let runInfo: Awaited<ReturnType<typeof getInstagramScrapeStatus>>
  try {
    runInfo = await getInstagramScrapeStatus(runId)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Apify" },
      { status: 502 }
    )
  }

  // ── RUNNING → fetch partial results already in dataset ───────────────────
  if (runInfo.status === "RUNNING" || (runInfo.status as string) === "READY") {
    let videos: ReturnType<typeof toVideoDTO>[] = []

    if (runInfo.datasetId) {
      try {
        const result = await processAndSave(supabase, runInfo.datasetId, creator)
        videos = result.videos
      } catch {
        // dataset might be empty early on — ignore errors
      }
    }

    return NextResponse.json({
      status: "running",
      requestsFinished: runInfo.requestsFinished,
      requestsTotal: runInfo.requestsTotal,
      videos, // partial results so far
    })
  }

  // ── FAILED / ABORTED ──────────────────────────────────────────────────────
  if (runInfo.status !== "SUCCEEDED") {
    return NextResponse.json({ status: "error", apifyStatus: runInfo.status })
  }

  // ── SUCCEEDED → final processing ─────────────────────────────────────────
  if (!runInfo.datasetId) {
    return NextResponse.json({ status: "error", error: "Dataset introuvable" })
  }

  const { scored, videos } = await processAndSave(supabase, runInfo.datasetId, creator)
  // Update creator stats on completion
  if (scored.length > 0) {
    const avgViews = computeAvgViews(scored.map(v => ({ ...v, outlier_score: v.outlier_score ?? 0 })))
    const avgLikes = scored.reduce((s, v) => s + v.likes, 0) / scored.length
    const avgComments = scored.reduce((s, v) => s + v.comments, 0) / scored.length
    const engagementRate = creator.followers > 0
      ? Math.round(((avgLikes + avgComments) / creator.followers) * 10000) / 100 : 0

    const sortedByDate = [...scored]
      .filter(v => v.posted_at)
      .sort((a, b) => new Date(b.posted_at!).getTime() - new Date(a.posted_at!).getTime())

    // Compare views-per-day velocity (not raw views) so older videos
    // that naturally accumulate more views don't skew the result negative.
    const vpd = (v: { views: number; posted_at: string | null }) => {
      if (!v.posted_at) return v.views
      const days = Math.max(1, (Date.now() - new Date(v.posted_at).getTime()) / 86_400_000)
      return v.views / days
    }

    let growthRate = 0
    if (sortedByDate.length >= 6) {
      const WINDOW = Math.min(15, Math.floor(sortedByDate.length / 2))
      const recent = sortedByDate.slice(0, WINDOW)
      const older  = sortedByDate.slice(WINDOW, WINDOW * 2)
      if (recent.length >= 3 && older.length >= 3) {
        const avgRecentVpd = recent.reduce((s, v) => s + vpd(v), 0) / recent.length
        const avgOlderVpd  = older.reduce((s, v) => s + vpd(v), 0)  / older.length
        if (avgOlderVpd > 0) growthRate = Math.round(((avgRecentVpd - avgOlderVpd) / avgOlderVpd) * 10000) / 100
      }
    }

    await supabase.from("creators").update({
      avg_views: avgViews > 0 ? avgViews : creator.avg_views,
      engagement_rate: engagementRate,
      growth_rate: growthRate,
      last_scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", creator.id)
  }

  // Notify user that scrape is complete
  createNotification({
    userId: user.id,
    type: "scrape_done",
    title: "Scraping terminé",
    description: `@${creator.handle} — ${scored.length} vidéo${scored.length > 1 ? "s" : ""} analysée${scored.length > 1 ? "s" : ""}`,
    metadata: { creatorId: creator.id, handle: creator.handle, videoCount: scored.length },
  }).catch(() => {})

  let bonusClaimable: { id: string; name: string; reward: number } | null = null
  if (scored.length >= 5) {
    checkAndUnlockBonus(user.id, "scrape_videos").catch(() => {})
    const serviceSupabase = createServiceClient()
    bonusClaimable = await getClaimableBonusAfterAction(serviceSupabase, user.id, "scrape_videos")
  }

  return NextResponse.json(
    bonusClaimable
      ? { status: "done", count: scored.length, videos, bonusClaimable }
      : { status: "done", count: scored.length, videos }
  )
}
