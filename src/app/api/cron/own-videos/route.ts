import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import {
  scrapeInstagramProfile,
  scrapeInstagramPosts,
  calculateOutlierScores,
  computeAvgViews,
} from "@/lib/scraping/instagram"
import { transcribeVideo } from "@/lib/ai/whisper"

export const maxDuration = 300

// Scrape le propre compte Instagram de chaque utilisateur toutes les 6h minimum
const MIN_INTERVAL_HOURS = 6
const DELAY_MS = 2_000

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 1. Tous les utilisateurs avec un handle Instagram lié
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, instagram_handle")
    .not("instagram_handle", "is", null)
    .neq("instagram_handle", "")

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles?.length) {
    return NextResponse.json({
      message: "Aucun utilisateur avec Instagram lié",
      processed: 0,
    })
  }

  const results: {
    userId: string
    handle: string
    totalVideos: number
    newVideos: number
    transcribed: number
    error?: string
  }[] = []

  for (const profile of profiles) {
    const handle = profile.instagram_handle!

    try {
      // 2. Vérifier si déjà scrappé récemment
      const { data: existingCreator } = await supabase
        .from("creators")
        .select("id, followers, last_scraped_at")
        .eq("handle", handle)
        .eq("platform", "instagram")
        .maybeSingle()

      if (existingCreator?.last_scraped_at) {
        const hoursSince =
          (Date.now() - new Date(existingCreator.last_scraped_at).getTime()) /
          (1000 * 60 * 60)

        if (hoursSince < MIN_INTERVAL_HOURS) {
          // S'assurer que toutes les vidéos existantes sont bien marquées
          await supabase
            .from("videos")
            .update({ owner_user_id: profile.id })
            .eq("creator_id", existingCreator.id)
            .is("owner_user_id", null)

          results.push({
            userId: profile.id,
            handle,
            totalVideos: 0,
            newVideos: 0,
            transcribed: 0,
          })
          continue
        }
      }

      // 3. Scraper le profil
      const scraped = await scrapeInstagramProfile(handle)

      // 4. Upsert creator (peut être le propre créateur de l'utilisateur)
      // Find existing creator by handle+platform, or create new
      let creator: { id: string } | null = null
      const { data: existingByHandle } = await supabase
        .from("creators")
        .select("id, platform_id")
        .eq("handle", handle)
        .eq("platform", "instagram")
        .maybeSingle()

      if (existingByHandle) {
        await supabase
          .from("creators")
          .update({
            name: scraped.name,
            avatar_url: scraped.avatar_url,
            bio: scraped.bio,
            followers: scraped.followers,
            posts_count: scraped.posts_count,
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingByHandle.id)
        creator = existingByHandle
      } else {
        const { data: inserted } = await supabase
          .from("creators")
          .insert({
            handle,
            platform: "instagram",
            platform_id: handle,
            name: scraped.name,
            avatar_url: scraped.avatar_url,
            bio: scraped.bio,
            followers: scraped.followers,
            posts_count: scraped.posts_count,
            last_scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single()
        creator = inserted
      }

      if (!creator) {
        results.push({
          userId: profile.id,
          handle,
          totalVideos: 0,
          newVideos: 0,
          transcribed: 0,
          error: "Impossible d'upsert le créateur",
        })
        continue
      }

      // 5. Scraper les 30 dernières vidéos
      const posts = await scrapeInstagramPosts(handle, 30)
      const avgViews = computeAvgViews(posts)
      const scored = calculateOutlierScores(posts, scraped.followers)

      await supabase
        .from("creators")
        .update({ avg_views: avgViews })
        .eq("id", creator.id)

      // 6. Upsert chaque vidéo avec owner_user_id
      let newVideoCount = 0
      const newVideoIds: string[] = []

      for (const v of scored) {
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
          owner_user_id: profile.id,
        }

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
              owner_user_id: profile.id,
            })
            .eq("id", existingVideo.id)
        } else {
          const { data: inserted } = await supabase
            .from("videos")
            .insert(videoData)
            .select("id")
            .single()

          if (inserted) {
            newVideoIds.push(inserted.id)
            newVideoCount++
          }
        }
      }

      // 7. Auto-transcription des nouvelles vidéos (gratuit pour le propre compte)
      let transcribed = 0

      if (process.env.OPENAI_API_KEY && newVideoIds.length > 0) {
        for (const videoId of newVideoIds) {
          const { data: video } = await supabase
            .from("videos")
            .select("id, url")
            .eq("id", videoId)
            .single()

          if (!video?.url) continue

          // Vérifier qu'il n'y a pas déjà de transcription
          const { data: existingTx } = await supabase
            .from("transcriptions")
            .select("id")
            .eq("video_id", videoId)
            .maybeSingle()

          if (existingTx) continue

          try {
            const content = await transcribeVideo(video.url)
            await supabase.from("transcriptions").insert({
              video_id: videoId,
              user_id: profile.id,
              content,
              language: "fr",
            })
            transcribed++
          } catch (txErr) {
            console.error(
              `[OwnVideos] Transcription échouée pour ${videoId}:`,
              txErr
            )
          }
        }
      }

      results.push({
        userId: profile.id,
        handle,
        totalVideos: scored.length,
        newVideos: newVideoCount,
        transcribed,
      })

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      results.push({
        userId: profile.id,
        handle,
        totalVideos: 0,
        newVideos: 0,
        transcribed: 0,
        error: message,
      })
      console.error(`[OwnVideos] @${handle}: ${message}`)
    }

    await delay(DELAY_MS)
  }

  const successCount = results.filter((r) => !r.error).length

  return NextResponse.json({
    message: `${successCount}/${profiles.length} comptes traités`,
    processed: successCount,
    total: profiles.length,
    results,
  })
}
