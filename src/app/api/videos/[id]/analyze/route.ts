import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { analyzeVideo } from "@/lib/ai/claude"
import { transcribeVideo } from "@/lib/ai/whisper"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { canUseFeature, getMinPlanForFeature } from "@/lib/plans"
import { logApiUsage } from "@/lib/api-usage"
import { resolveVideoFileUrl, isPlaceholderTranscript } from "@/lib/video-url-resolver"

export async function POST(
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  const plan = profile?.plan ?? "creator"

  if (!canUseFeature(plan, "canAnalyze")) {
    return NextResponse.json(
      {
        error: "Feature non disponible",
        required_plan: getMinPlanForFeature("canAnalyze"),
        feature: "canAnalyze",
      },
      { status: 403 }
    )
  }

  const { data: video } = await supabase
    .from("videos")
    .select("id, url, title, platform")
    .eq("id", params.id)
    .single()

  if (!video) {
    return NextResponse.json({ error: "Vidéo non trouvée" }, { status: 404 })
  }

  // Essayer de lire media_url si la colonne existe
  let mediaUrl: string | null = null
  try {
    const { data: videoExtra } = await serviceSupabase
      .from("videos")
      .select("media_url" as never)
      .eq("id", params.id)
      .single()
    mediaUrl = (videoExtra as Record<string, unknown>)?.media_url as string | null
  } catch { /* colonne pas encore créée */ }

  const { data: existingAnalysis } = await supabase
    .from("video_analyses")
    .select("*")
    .eq("video_id", params.id)
    .maybeSingle()

  if (existingAnalysis) {
    return NextResponse.json({
      analysis: existingAnalysis,
      transcription: null,
      cached: true,
      credits_consumed: 0,
    })
  }

  let { data: transcription } = await supabase
    .from("transcriptions")
    .select("id, content, language, created_at")
    .eq("video_id", params.id)
    .maybeSingle()

  // Si la transcription existante est un placeholder, la supprimer
  if (transcription && isPlaceholderTranscript(transcription.content)) {
    console.log(`[Analyze] Suppression du faux transcript ${transcription.id} pour vidéo ${params.id}`)
    await serviceSupabase.from("transcriptions").delete().eq("id", transcription.id)
    transcription = null
  }

  const needsTranscription = !transcription
  const totalCost = needsTranscription
    ? COSTS.analysis + COSTS.transcription
    : COSTS.analysis

  const { ok, current } = await checkCredits(user.id, totalCost)
  if (!ok) {
    return NextResponse.json(
      {
        error: "Crédits insuffisants",
        credits_required: totalCost,
        credits_current: current,
        needs_transcription: needsTranscription,
      },
      { status: 402 }
    )
  }

  if (needsTranscription) {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Service de transcription non configuré (OPENAI_API_KEY manquante)." },
        { status: 503 }
      )
    }

    // Résoudre l'URL directe du fichier vidéo
    let videoFileUrl = mediaUrl || null
    if (!videoFileUrl && video.url) {
      videoFileUrl = await resolveVideoFileUrl(video.url, video.platform)
    }
    if (!videoFileUrl) {
      return NextResponse.json(
        { error: "Impossible d'obtenir l'URL directe de la vidéo. Re-scrapez le créateur pour récupérer les URLs vidéo." },
        { status: 400 }
      )
    }

    let transcriptContent: string
    try {
      transcriptContent = await transcribeVideo(videoFileUrl)
    } catch (err) {
      console.error("[Analyze → Transcribe]", err)
      const message = err instanceof Error ? err.message : "Erreur de transcription"
      return NextResponse.json({ error: `Transcription échouée : ${message}` }, { status: 400 })
    }

    const consumed = await consumeCredits(
      user.id,
      COSTS.transcription,
      "transcription",
      video.id
    )

    if (!consumed) {
      return NextResponse.json(
        { error: "Échec de la consommation de crédits (transcription)" },
        { status: 500 }
      )
    }

    const { data: newTranscription, error: tErr } = await supabase
      .from("transcriptions")
      .insert({
        video_id: video.id,
        user_id: user.id,
        content: transcriptContent,
        language: "fr",
      })
      .select("id, content, language, created_at")
      .single()

    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 500 })
    }

    transcription = newTranscription
  }

  // Analyse IA
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Service d'analyse non configuré (OPENROUTER_API_KEY manquante)." },
      { status: 503 }
    )
  }

  let analysisResult: {
    hook_type: string
    hook_analysis: string
    structure_type: string
    structure_analysis: string
    style_analysis: string
  }

  try {
    const { analysis, usage } = await analyzeVideo(transcription!.content)
    analysisResult = analysis
    logApiUsage({
      userId: user.id,
      service: "openrouter",
      action: "video_analysis",
      model: usage.model,
      tokensIn: usage.promptTokens,
      tokensOut: usage.completionTokens,
      referenceId: video.id,
    }).catch(() => {})
  } catch (err) {
    console.error("[Analyze]", err)
    const message = err instanceof Error ? err.message : "Erreur d'analyse"
    return NextResponse.json({ error: `Analyse IA échouée : ${message}` }, { status: 400 })
  }

  const consumed = await consumeCredits(
    user.id,
    COSTS.analysis,
    "video_analysis",
    video.id
  )

  if (!consumed) {
    return NextResponse.json(
      { error: "Échec de la consommation de crédits (analyse)" },
      { status: 500 }
    )
  }

  const { data: analysis, error: aErr } = await supabase
    .from("video_analyses")
    .insert({
      video_id: video.id,
      user_id: user.id,
      ...analysisResult,
    })
    .select("*")
    .single()

  if (aErr) {
    return NextResponse.json({ error: aErr.message }, { status: 500 })
  }

  return NextResponse.json({
    analysis,
    transcription: needsTranscription ? transcription : null,
    cached: false,
    credits_consumed: totalCost,
    transcription_was_created: needsTranscription,
  })
}

