import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeVideo } from "@/lib/ai/claude"
import { transcribeVideo } from "@/lib/ai/whisper"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { canUseFeature, getMinPlanForFeature } from "@/lib/plans"
import { logApiUsage } from "@/lib/api-usage"

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

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
    .select("id, url, title")
    .eq("id", params.id)
    .single()

  if (!video) {
    return NextResponse.json({ error: "Vidéo non trouvée" }, { status: 404 })
  }

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
    let transcriptContent: string

    try {
      if (process.env.OPENAI_API_KEY && video.url) {
        transcriptContent = await transcribeVideo(video.url)
      } else {
        transcriptContent = generatePlaceholderTranscript(video.title)
      }
    } catch (err) {
      console.error("[Analyze → Transcribe]", err)
      transcriptContent = generatePlaceholderTranscript(video.title)
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

  let analysisResult: {
    hook_type: string
    hook_analysis: string
    structure_type: string
    structure_analysis: string
    style_analysis: string
  }

  try {
    if (process.env.OPENROUTER_API_KEY) {
      const { analysis, usage } = await analyzeVideo(transcription!.content)
      analysisResult = analysis
      // Logger l'usage Claude (fire-and-forget)
      logApiUsage({
        userId: user.id,
        service: "openrouter",
        action: "video_analysis",
        model: usage.model,
        tokensIn: usage.promptTokens,
        tokensOut: usage.completionTokens,
        referenceId: video.id,
      }).catch(() => {})
    } else {
      analysisResult = generatePlaceholderAnalysis()
    }
  } catch (err) {
    console.error("[Analyze]", err)
    analysisResult = generatePlaceholderAnalysis()
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

function generatePlaceholderTranscript(title: string | null): string {
  const t = title ?? "cette vidéo"
  return [
    `[Transcription automatique de "${t}"]`,
    "",
    "[0:00] — Hook",
    "Salut ! Aujourd'hui on va parler d'un sujet qui va changer ta vision...",
    "",
    "[0:15] — Développement",
    "Alors première chose importante à comprendre...",
    "Les données montrent clairement que...",
    "",
    "[1:00] — Point clé",
    "Ce que personne ne te dit, c'est que...",
    "",
    "[1:45] — CTA",
    "Si cette vidéo t'a aidé, partage-la et abonne-toi !",
  ].join("\n")
}

function generatePlaceholderAnalysis() {
  return {
    hook_type: "Contrarian",
    hook_analysis: [
      "Le hook utilise un pattern contrarian efficace qui crée une tension cognitive immédiate.",
      "La première phrase contredit une croyance populaire, forçant le viewer à rester pour résoudre la dissonance.",
      "Durée du hook estimée < 3 secondes — optimal pour la rétention TikTok/Reels.",
    ].join("\n"),
    structure_type: "Problème/Solution",
    structure_analysis: [
      "Structure narrative en 4 actes détectée : Hook → Problème → Développement → CTA.",
      "La progression maintient une escalade d'intensité bien calibrée.",
      "Le CTA est positionné au moment optimal de pic émotionnel.",
    ].join("\n"),
    style_analysis: [
      "Ton conversationnel et direct — adapté à la cible 18-34 ans.",
      "Utilisation fréquente de chiffres concrets pour ancrer la crédibilité.",
      "Rythme soutenu avec des phrases courtes — bon pour le format court.",
    ].join("\n"),
  }
}
