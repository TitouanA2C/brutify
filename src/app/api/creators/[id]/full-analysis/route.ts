import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkCredits, consumeCredits, getUserPlan, COSTS } from "@/lib/credits"
import { PLAN_FEATURES } from "@/lib/plans"
import { analyzeCreator, type AnalysisVideoData } from "@/lib/ai/creator-analysis"
import { transcribeVideo } from "@/lib/ai/whisper"

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
  console.log("[full-analysis] 🚀 Début de l'analyse concurrentielle")
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const creatorId = params.id
  console.log("[full-analysis] 👤 Creator ID:", creatorId)
  console.log("[full-analysis] 🔑 User ID:", user.id)
  
  const plan = await getUserPlan(user.id)
  console.log("[full-analysis] 📦 Plan utilisateur:", plan)
  const planFeatures = PLAN_FEATURES[plan]

  const serviceClient = createServiceClient()

  // Récupérer le créateur
  console.log("[full-analysis] 📥 Récupération du créateur...")
  const { data: creator } = await serviceClient
    .from("creators")
    .select("id, name, handle, niche, followers, platform")
    .eq("id", creatorId)
    .single()

  if (!creator) {
    console.error("[full-analysis] ❌ Créateur non trouvé")
    return NextResponse.json({ error: "Créateur non trouvé" }, { status: 404 })
  }
  console.log("[full-analysis] ✅ Créateur trouvé:", creator.name, `(@${creator.handle})`)

  // Récupérer les top vidéos par outlier score
  console.log("[full-analysis] 📹 Récupération des vidéos...")
  const { data: videos } = await serviceClient
    .from("videos")
    .select("id, title, description, url, views, likes, comments, shares, outlier_score, duration, posted_at")
    .eq("creator_id", creatorId)
    .order("outlier_score", { ascending: false })
    .limit(MAX_VIDEOS_TO_ANALYZE)

  console.log("[full-analysis] 📹 Vidéos trouvées:", videos?.length ?? 0)
  
  if (!videos || videos.length < MIN_VIDEOS_REQUIRED) {
    console.error("[full-analysis] ❌ Pas assez de vidéos:", videos?.length ?? 0)
    return NextResponse.json(
      { error: `Minimum ${MIN_VIDEOS_REQUIRED} vidéos nécessaires pour l'analyse` },
      { status: 400 }
    )
  }

  // Récupérer les transcriptions existantes
  const videoIds = videos.map((v) => v.id)
  console.log("[full-analysis] 📝 Vérification des transcriptions existantes...")
  const { data: existingTranscripts } = await serviceClient
    .from("transcriptions")
    .select("video_id, content")
    .in("video_id", videoIds)

  const transcriptMap = new Map(
    existingTranscripts?.map((t) => [t.video_id, t.content]) ?? []
  )
  console.log("[full-analysis] ✅ Transcriptions existantes:", transcriptMap.size)

  // Calculer le coût
  const untranscribedVideos = videos.filter((v) => !transcriptMap.has(v.id))
  console.log("[full-analysis] 🎙️ Vidéos à transcrire:", untranscribedVideos.length)

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
  console.log("[full-analysis] 💰 Coût total:", totalCost, "BP (base:", baseCost, "+ transcription:", transcriptionCost, ")")
  console.log("[full-analysis] 🎁 Analyse gratuite:", isFreeAnalysis)

  // Vérifier les crédits
  const { ok: canAfford } = await checkCredits(user.id, totalCost)
  console.log("[full-analysis] 💳 Crédits suffisants:", canAfford)
  if (!canAfford) {
    console.error("[full-analysis] ❌ Crédits insuffisants")
    return NextResponse.json(
      { error: `Crédits insuffisants. Coût: ${totalCost} BP`, cost: totalCost },
      { status: 402 }
    )
  }

  // Créer/mettre à jour l'entrée d'analyse en "processing"
  // Utiliser le client user pour respecter les RLS policies
  console.log("[full-analysis] 📊 Création de l'entrée en DB...")
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
    console.error("[full-analysis] ❌ Erreur création analyse en DB")
    console.error("[full-analysis] Upsert error:", JSON.stringify(upsertError, null, 2))
    return NextResponse.json({ 
      error: "Erreur lors de la création de l'analyse",
      details: upsertError?.message ?? "Erreur inconnue",
    }, { status: 500 })
  }
  console.log("[full-analysis] ✅ Analyse créée, ID:", analysisRow.id)

  try {
    // ── Étape 1: Transcrire les vidéos manquantes (par lots parallèles) ──
    if (untranscribedVideos.length > 0) {
      console.log("[full-analysis] 🎙️ Début de la transcription de", untranscribedVideos.length, "vidéos...")
      for (let i = 0; i < untranscribedVideos.length; i += PARALLEL_TRANSCRIPTIONS) {
        const batch = untranscribedVideos.slice(i, i + PARALLEL_TRANSCRIPTIONS)
        console.log("[full-analysis] 🎙️ Batch", Math.floor(i / PARALLEL_TRANSCRIPTIONS) + 1, ":", batch.length, "vidéos")
        const results = await Promise.allSettled(
          batch.map(async (video) => {
            if (!video.url) return { videoId: video.id, transcript: null }
            try {
              console.log("[full-analysis] 🎙️ Transcription vidéo:", video.title?.slice(0, 40))
              const transcript = await transcribeVideo(video.url)
              // Sauvegarder la transcription
              await serviceClient
                .from("transcriptions")
                .upsert({
                  video_id: video.id,
                  user_id: user.id,
                  content: transcript,
                  language: "fr",
                }, { onConflict: "video_id" })
              console.log("[full-analysis] ✅ Transcription OK:", video.id)
              return { videoId: video.id, transcript }
            } catch (err) {
              console.error("[full-analysis] ❌ Erreur transcription:", video.id, err)
              return { videoId: video.id, transcript: null }
            }
          })
        )

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.transcript) {
            transcriptMap.set(result.value.videoId, result.value.transcript)
          }
        }
      }
      console.log("[full-analysis] ✅ Transcriptions terminées. Total:", transcriptMap.size)
    } else {
      console.log("[full-analysis] ⏭️ Aucune transcription nécessaire")
    }

    // ── Étape 2: Préparer les données pour Claude ──
    console.log("[full-analysis] 📋 Préparation des données pour Claude...")
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
    console.log("[full-analysis] 📋 Vidéos avec transcription:", analysisVideos.filter(v => v.transcript).length)

    // ── Étape 3: Appeler Claude pour l'analyse ──
    console.log("[full-analysis] 🤖 Appel à Claude Sonnet 4.6...")
    const { analysis, usage } = await analyzeCreator({
      creatorName: creator.name ?? creator.handle,
      creatorHandle: creator.handle,
      creatorNiche: creator.niche ?? "Non définie",
      creatorFollowers: creator.followers ?? 0,
      creatorPlatform: creator.platform,
      userNiche: profile?.niche ?? "Non définie",
      videos: analysisVideos,
    })
    console.log("[full-analysis] ✅ Analyse Claude terminée. Tokens:", usage.promptTokens + usage.completionTokens)

    // ── Étape 4: Consommer les crédits ──
    if (totalCost > 0) {
      console.log("[full-analysis] 💰 Consommation de", totalCost, "BP...")
      await consumeCredits(user.id, totalCost, "creator_analysis", analysisRow.id)
      console.log("[full-analysis] ✅ Crédits consommés")
    }

    // Mettre à jour le compteur d'analyses gratuites
    if (isFreeAnalysis) {
      console.log("[full-analysis] 🎁 Mise à jour du compteur d'analyses gratuites...")
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
    }

    // ── Étape 5: Sauvegarder le résultat ──
    console.log("[full-analysis] 💾 Sauvegarde de l'analyse en DB...")
    const { error: updateError } = await supabase
      .from("creator_analyses")
      .update({
        analysis,
        status: "completed",
        tokens_used: usage.promptTokens + usage.completionTokens,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisRow.id)

    if (updateError) {
      console.error("[full-analysis] ⚠️ Erreur sauvegarde finale:", updateError)
    }

    console.log("[full-analysis] 🎉 SUCCÈS ! Analyse complète terminée")
    return NextResponse.json({
      analysis,
      videosAnalyzed: videos.length,
      videosWithTranscript: transcriptMap.size,
      totalCost,
      isFreeAnalysis,
      tokensUsed: usage.promptTokens + usage.completionTokens,
    })

  } catch (error) {
    // Logger l'erreur détaillée
    console.error("[full-analysis] ❌❌❌ ERREUR CRITIQUE ❌❌❌")
    console.error("[full-analysis] Error type:", error?.constructor?.name)
    console.error("[full-analysis] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[full-analysis] Error stack:", error instanceof Error ? error.stack : "No stack")
    console.error("[full-analysis] Full error object:", JSON.stringify(error, null, 2))
    
    // Marquer comme échoué (utiliser client user pour RLS)
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.log("[full-analysis] 💾 Marquage de l'analyse comme 'failed'...")
    await supabase
      .from("creator_analyses")
      .update({
        status: "failed",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisRow.id)

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
