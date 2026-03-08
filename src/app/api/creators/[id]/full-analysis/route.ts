import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkCredits, consumeCredits, getUserPlan, COSTS } from "@/lib/credits"
import { PLAN_FEATURES } from "@/lib/plans"
import { analyzeCreator, type AnalysisVideoData } from "@/lib/ai/creator-analysis"
import { transcribeVideo } from "@/lib/ai/whisper"
import { resolveVideoFileUrl, isPlaceholderTranscript } from "@/lib/video-url-resolver"

export const maxDuration = 300

const MAX_VIDEOS_TO_ANALYZE = 30
const MIN_VIDEOS_REQUIRED = 5
const PARALLEL_TRANSCRIPTIONS = 5

// ─── GET: Récupérer analyse existante + estimation du coût ───────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const creatorId = params.id

  // Vérifier si une analyse existe déjà
  const { data: existingAnalysis } = await supabase
    .from("creator_analyses")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("user_id", user.id)
    .single()

  // Calculer l'estimation du coût
  const serviceClient = createServiceClient()

  const { data: videos, count: totalVideos } = await serviceClient
    .from("videos")
    .select("id, title, views, outlier_score", { count: "exact" })
    .eq("creator_id", creatorId)
    .order("outlier_score", { ascending: false })
    .limit(MAX_VIDEOS_TO_ANALYZE)

  const videosToAnalyze = videos?.length ?? 0

  if (videosToAnalyze < MIN_VIDEOS_REQUIRED) {
    return NextResponse.json({
      existingAnalysis: existingAnalysis?.status === "completed" ? existingAnalysis : null,
      estimate: null,
      error: `Minimum ${MIN_VIDEOS_REQUIRED} vidéos nécessaires. Ce créateur en a ${videosToAnalyze}.`,
    })
  }

  // Compter les vidéos sans transcription
  const videoIds = videos!.map((v) => v.id)
  const { data: existingTranscripts } = await serviceClient
    .from("transcriptions")
    .select("video_id")
    .in("video_id", videoIds)

  const transcribedIds = new Set(existingTranscripts?.map((t) => t.video_id) ?? [])
  const untranscribedCount = videoIds.filter((id) => !transcribedIds.has(id)).length

  // Vérifier les analyses gratuites
  const plan = await getUserPlan(user.id)
  const planFeatures = PLAN_FEATURES[plan]
  const { data: profile } = await supabase
    .from("profiles")
    .select("free_analyses_used, free_analyses_reset_at, credits")
    .eq("id", user.id)
    .single()

  let freeAnalysesRemaining = 0
  if (planFeatures?.freeFullAnalyses && profile) {
    const resetAt = new Date(profile.free_analyses_reset_at ?? 0)
    const now = new Date()
    const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)
    const used = daysSinceReset > 30 ? 0 : (profile.free_analyses_used ?? 0)
    freeAnalysesRemaining = Math.max(0, planFeatures.freeFullAnalyses - used)
  }

  const baseCost = freeAnalysesRemaining > 0 ? 0 : COSTS.creator_analysis
  const transcriptionCost = untranscribedCount * COSTS.transcription
  const totalCost = baseCost + transcriptionCost

  return NextResponse.json({
    existingAnalysis: existingAnalysis?.status === "completed" ? existingAnalysis : null,
    processingAnalysis: existingAnalysis?.status === "processing" ? existingAnalysis : null,
    estimate: {
      videosToAnalyze,
      totalVideos: totalVideos ?? videosToAnalyze,
      alreadyTranscribed: videosToAnalyze - untranscribedCount,
      needsTranscription: untranscribedCount,
      baseCost,
      transcriptionCost,
      totalCost,
      freeAnalysesRemaining,
      canAfford: (profile?.credits ?? 0) >= totalCost,
      currentCredits: profile?.credits ?? 0,
    },
    canAccess: true,
    plan,
  })
}

// ─── POST: Lancer une analyse complète ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const t0 = Date.now()
  const log = (step: string, extra?: Record<string, unknown>) =>
    console.log(`[VEILLE] ${step} (${Date.now() - t0}ms)`, extra ? JSON.stringify(extra) : "")

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const creatorId = params.id
  log("START", { creatorId, userId: user.id })

  const plan = await getUserPlan(user.id)
  const planFeatures = PLAN_FEATURES[plan]
  log("plan resolved", { plan })

  const serviceClient = createServiceClient()

  const { data: creator } = await serviceClient
    .from("creators")
    .select("id, name, handle, niche, followers, platform")
    .eq("id", creatorId)
    .single()

  if (!creator) {
    log("FAIL creator not found")
    return NextResponse.json({ error: "Créateur non trouvé" }, { status: 404 })
  }
  log("creator loaded", { name: creator.name, handle: creator.handle })

  const { data: videosRaw, error: videosErr } = await serviceClient
    .from("videos")
    .select("id, title, description, url, views, likes, comments, shares, outlier_score, duration, posted_at")
    .eq("creator_id", creatorId)
    .order("outlier_score", { ascending: false })
    .limit(MAX_VIDEOS_TO_ANALYZE)

  if (videosErr) {
    log("FAIL loading videos", { error: videosErr.message })
  }

  const videos = (videosRaw ?? []) as Array<{
    id: string; title: string | null; description: string | null; url: string | null;
    views: number | null; likes: number | null; comments: number | null; shares: number | null;
    outlier_score: number | string | null; duration: number | null; posted_at: string | null;
    media_url?: string | null;
  }>

  // Tenter de récupérer media_url séparément (colonne optionnelle)
  if (videos.length > 0) {
    try {
      const ids = videos.map(v => v.id)
      const { data: mediaRows } = await serviceClient
        .from("videos")
        .select("id, media_url" as never)
        .in("id", ids) as { data: Array<{ id: string; media_url?: string | null }> | null }

      if (mediaRows) {
        const mediaMap = new Map(mediaRows.map(r => [r.id, r.media_url]))
        for (const v of videos) {
          v.media_url = mediaMap.get(v.id) ?? null
        }
      }
    } catch {
      log("media_url column not available (non-blocking)")
    }
  }

  if (!videos || videos.length < MIN_VIDEOS_REQUIRED) {
    log("FAIL not enough videos", { count: videos?.length ?? 0 })
    return NextResponse.json(
      { error: `Minimum ${MIN_VIDEOS_REQUIRED} vidéos nécessaires pour l'analyse` },
      { status: 400 }
    )
  }
  log("videos loaded", { count: videos.length })

  const videoIds = videos.map((v) => v.id)
  const { data: existingTranscripts } = await serviceClient
    .from("transcriptions")
    .select("video_id, content")
    .in("video_id", videoIds)

  const transcriptMap = new Map<string, string>()
  const placeholderIds: string[] = []

  for (const t of existingTranscripts ?? []) {
    if (isPlaceholderTranscript(t.content)) {
      placeholderIds.push(t.video_id)
    } else {
      transcriptMap.set(t.video_id, t.content)
    }
  }

  const untranscribedVideos = videos.filter((v) => !transcriptMap.has(v.id))
  log("transcripts check", { cached: transcriptMap.size, placeholders: placeholderIds.length, toTranscribe: untranscribedVideos.length })

  const { data: profile } = await supabase
    .from("profiles")
    .select("free_analyses_used, free_analyses_reset_at, niche")
    .eq("id", user.id)
    .single()

  let isFreeAnalysis = false
  if (planFeatures.freeFullAnalyses && profile) {
    const resetAt = new Date(profile.free_analyses_reset_at ?? 0)
    const now = new Date()
    const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)
    const used = daysSinceReset > 30 ? 0 : (profile.free_analyses_used ?? 0)
    isFreeAnalysis = used < planFeatures.freeFullAnalyses
  }

  const baseCost = isFreeAnalysis ? 0 : COSTS.creator_analysis
  const transcriptionCost = untranscribedVideos.length * COSTS.transcription
  const totalCost = baseCost + transcriptionCost
  log("cost computed", { baseCost, transcriptionCost, totalCost, isFreeAnalysis })

  const { ok: canAfford } = await checkCredits(user.id, totalCost)
  if (!canAfford) {
    log("FAIL insufficient credits")
    return NextResponse.json(
      { error: `Crédits insuffisants. Coût: ${totalCost} BP`, cost: totalCost },
      { status: 402 }
    )
  }

  const { data: analysisRow, error: upsertError } = await supabase
    .from("creator_analyses")
    .upsert({
      creator_id: creatorId,
      user_id: user.id,
      status: "processing",
      videos_analyzed: videos.length,
      cost_bp: totalCost,
      analysis: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "creator_id,user_id" })
    .select("id")
    .single()

  if (upsertError || !analysisRow) {
    log("FAIL upsert analysis row", { error: upsertError?.message })
    return NextResponse.json({ 
      error: "Erreur lors de la création de l'analyse",
      details: upsertError?.message ?? "Erreur inconnue",
    }, { status: 500 })
  }
  log("analysis row created", { id: analysisRow.id })

  try {
    // ── Transcriptions ──────────────────────────────────────────────────────
    if (untranscribedVideos.length > 0) {
      for (let i = 0; i < untranscribedVideos.length; i += PARALLEL_TRANSCRIPTIONS) {
        const batch = untranscribedVideos.slice(i, i + PARALLEL_TRANSCRIPTIONS)
        const batchIdx = Math.floor(i / PARALLEL_TRANSCRIPTIONS) + 1
        const totalBatches = Math.ceil(untranscribedVideos.length / PARALLEL_TRANSCRIPTIONS)
        log(`transcription batch ${batchIdx}/${totalBatches}`, { size: batch.length })

        const results = await Promise.allSettled(
          batch.map(async (video) => {
            if (!video.url && !video.media_url) return { videoId: video.id, transcript: null }
            try {
              let fileUrl = video.media_url || null
              if (!fileUrl && video.url) {
                fileUrl = await resolveVideoFileUrl(video.url, creator.platform)
              }
              if (!fileUrl) {
                log(`no direct URL for video ${video.id}`, { postUrl: (video.url ?? "").slice(0, 80) })
                return { videoId: video.id, transcript: null }
              }
              const transcript = await transcribeVideo(fileUrl)
              await serviceClient
                .from("transcriptions")
                .upsert({
                  video_id: video.id,
                  user_id: user.id,
                  content: transcript,
                  language: "fr",
                }, { onConflict: "video_id" })
              return { videoId: video.id, transcript }
            } catch (err) {
              log(`transcription failed for video ${video.id}`, { error: (err as Error).message })
              return { videoId: video.id, transcript: null }
            }
          })
        )

        let batchSuccess = 0
        for (const result of results) {
          if (result.status === "fulfilled" && result.value.transcript) {
            transcriptMap.set(result.value.videoId, result.value.transcript)
            batchSuccess++
          }
        }
        log(`transcription batch ${batchIdx} done`, { success: batchSuccess, failed: batch.length - batchSuccess })
      }
      log("all transcriptions done", { total: transcriptMap.size })
    }

    // ── Claude Analysis ─────────────────────────────────────────────────────
    const analysisVideos: AnalysisVideoData[] = videos.map((v) => ({
      title: v.title ?? "Sans titre",
      caption: v.description ?? "",
      transcript: transcriptMap.get(v.id) ?? null,
      views: v.views ?? 0,
      likes: v.likes ?? 0,
      comments: v.comments ?? 0,
      shares: v.shares ?? 0,
      outlier_score: Number(v.outlier_score) || 1,
      duration: v.duration ?? 0,
      posted_at: v.posted_at ?? "",
    }))

    const videosWithTranscript = analysisVideos.filter(v => v.transcript).length
    log("calling Claude analyzeCreator", { videos: analysisVideos.length, withTranscript: videosWithTranscript })

    const { analysis, usage } = await analyzeCreator({
      creatorName: creator.name ?? creator.handle,
      creatorHandle: creator.handle,
      creatorNiche: creator.niche ?? "Non définie",
      creatorFollowers: creator.followers ?? 0,
      creatorPlatform: creator.platform,
      userNiche: profile?.niche ?? "Non définie",
      videos: analysisVideos,
    })
    log("Claude analysis done", { promptTokens: usage.promptTokens, completionTokens: usage.completionTokens })

    // ── Credits & free analysis ─────────────────────────────────────────────
    if (totalCost > 0) {
      await consumeCredits(user.id, totalCost, "creator_analysis", analysisRow.id)
      log("credits consumed", { totalCost })
    }

    if (isFreeAnalysis) {
      const resetAt = new Date(profile?.free_analyses_reset_at ?? 0)
      const now = new Date()
      const daysSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60 * 24)

      await supabase
        .from("profiles")
        .update({
          free_analyses_used: daysSinceReset > 30 ? 1 : (profile?.free_analyses_used ?? 0) + 1,
          free_analyses_reset_at: daysSinceReset > 30 ? now.toISOString() : profile?.free_analyses_reset_at,
        })
        .eq("id", user.id)
      log("free analysis counter updated")
    }

    // ── Save completed analysis ─────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from("creator_analyses")
      .update({
        analysis: analysis as unknown as Record<string, unknown>,
        status: "completed",
        tokens_used: usage.promptTokens + usage.completionTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisRow.id)

    if (updateError) {
      log("FAIL saving analysis to DB", { error: updateError.message })
      await supabase
        .from("creator_analyses")
        .update({
          status: "failed",
          error_message: updateError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id)
      return NextResponse.json(
        { error: "L'analyse a échoué lors de l'enregistrement.", details: updateError.message },
        { status: 500 }
      )
    }
    log("analysis saved to DB")

    // ── Persist content ideas to board (status: idea) ──────────────────────
    try {
      const aForIdeas = analysis as unknown as Record<string, unknown>
      const topics = aForIdeas.topics as {
        outlier_topics?: Array<{ topic: string; subject?: string; vision?: string; why_it_works: string; best_video_title?: string }>;
      } | undefined

      if (topics?.outlier_topics?.length) {
        const boardItems = topics.outlier_topics.slice(0, 10).map(t => {
          const title = t.subject || t.topic
          const notes = [
            t.vision || t.why_it_works,
            t.best_video_title ? `Ref: ${t.best_video_title}` : null,
            `Via @${creator.handle}`,
          ].filter(Boolean).join("\n\n")
          return {
            user_id: user.id,
            title,
            status: "idea" as const,
            notes,
            platform: (creator.platform as "instagram" | "tiktok" | "youtube") || null,
          }
        })
        const { error: boardErr } = await supabase.from("board_items").insert(boardItems)
        log("board ideas persisted", { count: boardItems.length, error: boardErr?.message ?? null })
      }
    } catch (err) {
      log("board ideas failed (non-blocking)", { error: (err as Error).message })
    }

    // ── Persist hooks & structures as user_templates ────────────────────────
    try {
      const templateItems: Array<{
        user_id: string; kind: string; name: string; template: string;
        hook_type?: string; skeleton?: string; description?: string;
        source: string; source_id: string; performance_score: number;
      }> = []

      const a = analysis as unknown as Record<string, unknown>
      const hooks = a.hooks as {
        reusable_templates?: Array<{ type: string; template: string; performance_score?: number }>;
        top_5?: Array<{ hook_text: string; type: string; why_it_works: string; outlier_score?: number }>;
      } | undefined

      if (hooks?.reusable_templates) {
        for (const h of hooks.reusable_templates) {
          templateItems.push({
            user_id: user.id,
            kind: "hook",
            name: h.type,
            template: h.template,
            hook_type: h.type,
            source: "veille",
            source_id: creatorId,
            performance_score: h.performance_score ?? 70,
          })
        }
      }
      if (hooks?.top_5) {
        for (const h of hooks.top_5) {
          const existing = templateItems.find(t => t.template === h.hook_text)
          if (!existing) {
            templateItems.push({
              user_id: user.id,
              kind: "hook",
              name: h.type,
              template: h.hook_text,
              hook_type: h.type,
              source: "veille",
              source_id: creatorId,
              performance_score: h.outlier_score ?? 80,
            })
          }
        }
      }

      const structures = a.script_structures as {
        detected_structures?: Array<{
          name: string; skeleton: string; frequency: number;
          avg_outlier_score?: number; example?: string;
        }>;
      } | undefined

      if (structures?.detected_structures) {
        for (const s of structures.detected_structures) {
          templateItems.push({
            user_id: user.id,
            kind: "structure",
            name: s.name,
            template: s.skeleton,
            skeleton: s.skeleton,
            description: s.example ?? `Fréquence: ${s.frequency}×`,
            source: "veille",
            source_id: creatorId,
            performance_score: s.avg_outlier_score ?? 50,
          })
        }
      }

      const validTemplates = templateItems.filter(t => t.name && t.template)
      if (validTemplates.length > 0) {
        const { error: tplErr } = await supabase.from("user_templates").insert(validTemplates)
        log("templates persisted", { hooks: validTemplates.filter(t => t.kind === "hook").length, structures: validTemplates.filter(t => t.kind === "structure").length, skipped: templateItems.length - validTemplates.length, error: tplErr?.message ?? null })
      }
    } catch (err) {
      log("templates failed (non-blocking)", { error: (err as Error).message })
    }

    log("SUCCESS — returning response", { videosAnalyzed: videos.length, transcripts: transcriptMap.size })

    return NextResponse.json({
      analysis,
      videosAnalyzed: videos.length,
      videosWithTranscript: transcriptMap.size,
      totalCost,
      isFreeAnalysis,
      tokensUsed: usage.promptTokens + usage.completionTokens,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    const errorStack = error instanceof Error ? error.stack : undefined
    log("FATAL ERROR", { message: errorMessage, stack: errorStack })

    const { data: currentRow } = await supabase
      .from("creator_analyses")
      .select("status")
      .eq("id", analysisRow.id)
      .single()

    if (currentRow?.status !== "completed") {
      await supabase
        .from("creator_analyses")
        .update({
          status: "failed",
          error_message: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisRow.id)
      log("analysis marked as failed in DB")
    } else {
      log("analysis already completed in DB — not overwriting")
    }

    return NextResponse.json(
      { 
        error: "L'analyse a échoué. Vos crédits n'ont pas été débités.",
        details: errorMessage,
        creatorId,
        userId: user.id,
      },
      { status: 500 }
    )
  }
}
