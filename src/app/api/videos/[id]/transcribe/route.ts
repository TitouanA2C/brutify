import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { transcribeVideo } from "@/lib/ai/whisper"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { canUseFeature, getMinPlanForFeature } from "@/lib/plans"
import { logApiUsage } from "@/lib/api-usage"
import { FREE_TRANSCRIPTS_LIMITS } from "@/lib/credits-rules"
import { resolveVideoFileUrl, isPlaceholderTranscript } from "@/lib/video-url-resolver"

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

  const serviceSupabase = createServiceClient()
  
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("plan, free_transcripts_used, free_transcripts_reset_at")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profil non trouvé" },
      { status: 404 }
    )
  }

  const plan = profile.plan ?? "creator"

  if (!canUseFeature(plan, "canTranscribe")) {
    return NextResponse.json(
      {
        error: "Feature non disponible",
        required_plan: getMinPlanForFeature("canTranscribe"),
        feature: "canTranscribe",
      },
      { status: 403 }
    )
  }

  const { data: video } = await supabase
    .from("videos")
    .select("id, url, title, platform, platform_video_id")
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

  const { data: existing } = await supabase
    .from("transcriptions")
    .select("id, content, language, created_at")
    .eq("video_id", params.id)
    .maybeSingle()

  if (existing) {
    if (isPlaceholderTranscript(existing.content)) {
      console.log(`[Transcribe] Suppression du faux transcript ${existing.id} pour vidéo ${params.id}`)
      await serviceSupabase.from("transcriptions").delete().eq("id", existing.id)
    } else {
      return NextResponse.json({
        transcription: existing,
        cached: true,
        credits_consumed: 0,
        used_free_transcript: false,
      })
    }
  }

  // Vérifier si reset mensuel des transcriptions gratuites nécessaire
  const lastReset = profile.free_transcripts_reset_at
    ? new Date(profile.free_transcripts_reset_at)
    : new Date(0)
  const now = new Date()
  const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
  
  let freeTranscriptsUsed = profile.free_transcripts_used || 0
  
  // Reset si plus de 30 jours
  if (daysSinceReset >= 30) {
    freeTranscriptsUsed = 0
    await serviceSupabase
      .from("profiles")
      .update({
        free_transcripts_used: 0,
        free_transcripts_reset_at: now.toISOString(),
      })
      .eq("id", user.id)
  }

  // Vérifier transcriptions gratuites disponibles
  const freeLimit = FREE_TRANSCRIPTS_LIMITS[plan] || 0
  const hasFreeTranscript = freeTranscriptsUsed < freeLimit
  
  // Si pas de transcription gratuite, vérifier BP
  let usedFreeTranscript = false
  if (!hasFreeTranscript) {
    const cost = COSTS.transcription
    const { ok, current } = await checkCredits(user.id, cost)
    if (!ok) {
      return NextResponse.json(
        {
          error: "Crédits insuffisants",
          credits_required: cost,
          credits_current: current,
          free_transcripts_used: freeTranscriptsUsed,
          free_transcripts_limit: freeLimit,
        },
        { status: 402 }
      )
    }
  } else {
    usedFreeTranscript = true
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Service de transcription non configuré." },
      { status: 503 }
    )
  }

  // Résoudre l'URL directe du fichier vidéo
  let videoFileUrl = mediaUrl || null

  // Si pas de media_url, essayer de résoudre depuis l'URL Instagram
  if (!videoFileUrl && video.url) {
    videoFileUrl = await resolveVideoFileUrl(video.url, video.platform)
  }

  if (!videoFileUrl) {
    return NextResponse.json(
      { error: "Impossible d'obtenir l'URL directe de la vidéo. L'URL du post Instagram ne peut pas être transcrite directement — veuillez re-scraper le créateur pour récupérer les URLs vidéo." },
      { status: 400 }
    )
  }

  let transcriptContent: string
  try {
    transcriptContent = await transcribeVideo(videoFileUrl)
  } catch (err) {
    console.error("[Transcribe]", err)
    const message = err instanceof Error ? err.message : "Erreur de transcription"
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }

  // Consommer BP ou transcription gratuite
  let creditsConsumed = 0
  
  if (usedFreeTranscript) {
    // Incrémenter le compteur de transcriptions gratuites
    await serviceSupabase
      .from("profiles")
      .update({
        free_transcripts_used: freeTranscriptsUsed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
    
    // Logger pour analytics
    await serviceSupabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: 0,
      action: "free_transcription",
      reference_id: video.id,
    })
    
    creditsConsumed = 0
  } else {
    // Consommer les BP normalement
    const cost = COSTS.transcription
    const consumed = await consumeCredits(
      user.id,
      cost,
      "transcription",
      video.id
    )

    if (!consumed) {
      return NextResponse.json(
        { error: "Échec de la consommation de crédits" },
        { status: 500 }
      )
    }
    
    creditsConsumed = cost
  }

  const { data: transcription, error: insertError } = await supabase
    .from("transcriptions")
    .insert({
      video_id: video.id,
      user_id: user.id,
      content: transcriptContent,
      language: "fr",
    })
    .select("id, content, language, created_at")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Logger l'usage Whisper (units = longueur du transcript en Ko, proxy de durée audio)
  logApiUsage({
    userId: user.id,
    service: "openai_whisper",
    action: usedFreeTranscript ? "free_transcription" : "transcription",
    model: "whisper-1",
    units: Math.ceil(transcriptContent.length / 1024),
    referenceId: video.id,
  }).catch(() => {})

  return NextResponse.json({
    transcription,
    cached: false,
    credits_consumed: creditsConsumed,
    used_free_transcript: usedFreeTranscript,
    free_transcripts_remaining: usedFreeTranscript 
      ? (FREE_TRANSCRIPTS_LIMITS[plan] || 0) - (freeTranscriptsUsed + 1)
      : undefined,
  })
}

