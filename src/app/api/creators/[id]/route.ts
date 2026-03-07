import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { toCreatorDTO, toVideoDTO } from "@/lib/api/helpers"
import { getFollowersDelta } from "@/lib/followers"

function computeStatsFromVideos(
  videos: { views: number; likes: number; comments: number; posted_at: string | null }[],
  followers: number
) {
  if (videos.length === 0) return null

  const avgViews = Math.round(videos.reduce((s, v) => s + (v.views ?? 0), 0) / videos.length)
  const avgLikes = videos.reduce((s, v) => s + (v.likes ?? 0), 0) / videos.length
  const avgComments = videos.reduce((s, v) => s + (v.comments ?? 0), 0) / videos.length
  const engagementRate = followers > 0
    ? Math.round(((avgLikes + avgComments) / followers) * 10000) / 100 : 0

  // Growth rate: compare recent half vs older half (adaptive window)
  const dated = videos
    .filter(v => v.posted_at)
    .sort((a, b) => new Date(b.posted_at!).getTime() - new Date(a.posted_at!).getTime())

  let growthRate = 0
  if (dated.length >= 6) {
    const WINDOW = Math.min(15, Math.floor(dated.length / 2))
    const recent = dated.slice(0, WINDOW)
    const older = dated.slice(WINDOW, WINDOW * 2)
    if (recent.length >= 3 && older.length >= 3) {
      const avgRecent = recent.reduce((s, v) => s + v.views, 0) / recent.length
      const avgOlder = older.reduce((s, v) => s + v.views, 0) / older.length
      if (avgOlder > 0) growthRate = Math.round(((avgRecent - avgOlder) / avgOlder) * 10000) / 100
    }
  }

  return { avgViews, engagementRate, growthRate }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const serviceSupabase = createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { data: creator, error } = await supabase
    .from("creators")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !creator) {
    return NextResponse.json({ error: "Créateur non trouvé" }, { status: 404 })
  }

  const { data: videos, error: videosErr } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", creator.id)
    .order("outlier_score", { ascending: false })
    .limit(200)

  console.log(`[GET /api/creators/${params.id}] videos=${videos?.length ?? 0} err=${videosErr?.message ?? "none"}`)

  // Recalculate stats from existing videos if growth_rate is missing/zero
  const shouldRecalc = (videos?.length ?? 0) >= 6 && (!creator.growth_rate || creator.growth_rate === 0)
  if (shouldRecalc && videos) {
    const stats = computeStatsFromVideos(
      videos.map(v => ({
        views: v.views ?? 0,
        likes: v.likes ?? 0,
        comments: v.comments ?? 0,
        posted_at: v.posted_at ?? null,
      })),
      creator.followers ?? 0
    )
    if (stats) {
      await serviceSupabase.from("creators").update({
        avg_views: stats.avgViews > 0 ? stats.avgViews : creator.avg_views,
        engagement_rate: stats.engagementRate,
        growth_rate: stats.growthRate,
        updated_at: new Date().toISOString(),
      }).eq("id", creator.id)

      // Patch creator object so the response reflects fresh values
      creator.avg_views = stats.avgViews > 0 ? stats.avgViews : creator.avg_views
      creator.engagement_rate = stats.engagementRate
      creator.growth_rate = stats.growthRate
    }
  }

  const { data: watchlistRow } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", user.id)
    .eq("creator_id", creator.id)
    .maybeSingle()

  const { count: outlierCount } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creator.id)
    .gte("outlier_score", 5)

  const topOutlier = videos?.[0]?.outlier_score
    ? Number(videos[0].outlier_score)
    : 0

  // Follower growth delta from history
  const delta = await getFollowersDelta(serviceSupabase, creator.id, creator.followers ?? 0)

  return NextResponse.json({
    creator: toCreatorDTO(creator, {
      isInWatchlist: !!watchlistRow,
      outlierCount: outlierCount ?? 0,
      topOutlierRatio: topOutlier,
      followersDelta: delta.delta,
      followersDeltaPct: delta.deltaPercent,
      followersDeltaDays: delta.periodDays,
      followersHistory: delta.snapshots,
    }),
    videos: (videos ?? []).map(toVideoDTO),
  })
}
