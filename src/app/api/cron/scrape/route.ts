import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import {
  scrapeInstagramProfile,
  scrapeInstagramPosts,
  calculateOutlierScores,
  computeAvgViews,
} from "@/lib/scraping/instagram"
import { autoTranscribeIfEligible, PLATFORM_MAX_DURATION } from "@/lib/ai/auto-transcribe"

const STALE_DAYS = 3
const DELAY_BETWEEN_SCRAPES_MS = 2_000

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const supabase = createServiceClient()

  const staleDate = new Date(
    Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: staleCreators, error } = await supabase
    .from("creators")
    .select("id, handle, platform")
    .eq("platform", "instagram")
    .or(`last_scraped_at.is.null,last_scraped_at.lt.${staleDate}`)
    .limit(50)

  if (error) {
    console.error("[Cron Scrape] Erreur requête:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!staleCreators || staleCreators.length === 0) {
    return NextResponse.json({
      message: "Aucun créateur à scraper",
      scraped: 0,
    })
  }

  const results: { handle: string; success: boolean; error?: string; videos?: number }[] = []

  for (const creator of staleCreators) {
    try {
      const profile = await scrapeInstagramProfile(creator.handle)

      const scrapedVideos = await scrapeInstagramPosts(creator.handle, 30)
      const avgViews = computeAvgViews(scrapedVideos)
      // Score = views / followers (5× followers = outlier)
      const scoredVideos = calculateOutlierScores(scrapedVideos, profile.followers)

      await supabase
        .from("creators")
        .update({
          name: profile.name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          followers: profile.followers,
          avg_views: avgViews,
          posts_count: profile.posts_count,
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", creator.id)

      // Filtrer les vidéos trop longues pour éviter coûts excessifs
      const validVideos = scoredVideos.filter(v => {
        if (!v.duration) return true
        return v.duration <= PLATFORM_MAX_DURATION.instagram
      })

      for (const v of validVideos) {
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("id")
          .eq("creator_id", creator.id)
          .eq("platform_video_id", v.platform_video_id)
          .maybeSingle()

        const videoData = {
          creator_id: creator.id,
          platform: "instagram" as const,
          platform_video_id: v.platform_video_id,
          title: v.caption ? v.caption.slice(0, 200) : null,
          description: v.caption,
          url: v.url,
          thumbnail_url: v.thumbnail_url,
          duration: v.duration,
          views: v.views,
          likes: v.likes,
          comments: v.comments,
          shares: v.shares,
          outlier_score: v.outlier_score,
          posted_at: v.posted_at,
          scraped_at: new Date().toISOString(),
        }

        let videoId: string | null = null

        if (existingVideo) {
          await supabase
            .from("videos")
            .update({
              views: videoData.views,
              likes: videoData.likes,
              comments: videoData.comments,
              shares: videoData.shares,
              outlier_score: videoData.outlier_score,
              scraped_at: videoData.scraped_at,
            })
            .eq("id", existingVideo.id)
          videoId = existingVideo.id
        } else {
          const { data: inserted } = await supabase
            .from("videos")
            .insert(videoData)
            .select("id")
            .single()
          videoId = inserted?.id ?? null
        }

        // Auto-transcription pour les utilisateurs Growth/Scale qui suivent ce créateur
        if (videoId) {
          const { data: watchers } = await supabase
            .from("watchlist")
            .select("user_id, profiles!inner(plan)")
            .eq("creator_id", creator.id)

          if (watchers) {
            for (const watcher of watchers) {
              const userPlan = (watcher as any).profiles?.plan ?? "creator"
              if (userPlan === "growth" || userPlan === "scale") {
                await autoTranscribeIfEligible({
                  videoId,
                  videoUrl: v.url,
                  duration: v.duration ?? null,
                  userId: watcher.user_id,
                  userPlan,
                })
              }
            }
          }
        }
      }

      results.push({
        handle: creator.handle,
        success: true,
        videos: validVideos.length,
      })

      console.log(
        `[Cron Scrape] @${creator.handle}: ${validVideos.length} vidéos scrapées (${scoredVideos.length - validVideos.length} filtrées)`
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur inconnue"
      results.push({ handle: creator.handle, success: false, error: message })
      console.error(`[Cron Scrape] @${creator.handle}: ${message}`)
    }

    if (creator !== staleCreators[staleCreators.length - 1]) {
      await delay(DELAY_BETWEEN_SCRAPES_MS)
    }
  }

  const successCount = results.filter((r) => r.success).length

  return NextResponse.json({
    message: `${successCount}/${staleCreators.length} créateurs scrapés`,
    scraped: successCount,
    total: staleCreators.length,
    results,
  })
}
