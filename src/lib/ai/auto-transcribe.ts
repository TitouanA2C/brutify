import { transcribeVideo } from "./whisper"
import { createServiceClient } from "@/lib/supabase/server"
import { logApiUsage } from "@/lib/api-usage"

interface AutoTranscribeOptions {
  videoId: string
  videoUrl: string
  duration: number | null
  userId: string
  userPlan: string
}

/**
 * Auto-transcription intelligente basée sur le plan utilisateur.
 * 
 * Règles :
 * - Growth : auto-transcription si durée ≤ 120s (2 min)
 * - Scale : auto-transcription si durée ≤ 600s (10 min)
 * - Creator : pas d'auto-transcription (manuel uniquement)
 * 
 * Ne consomme PAS de BP utilisateur (feature premium incluse).
 */
export async function autoTranscribeIfEligible(
  options: AutoTranscribeOptions
): Promise<{ transcribed: boolean; reason?: string }> {
  const { videoId, videoUrl, duration, userId, userPlan } = options

  // Vérifier l'éligibilité selon le plan
  const maxDuration = getMaxAutoTranscribeDuration(userPlan)
  if (maxDuration === 0) {
    return { transcribed: false, reason: "plan_not_eligible" }
  }

  // Vérifier la durée
  if (!duration || duration > maxDuration) {
    return { transcribed: false, reason: "duration_exceeded" }
  }

  // Vérifier si déjà transcrit
  const supabase = createServiceClient()
  const { data: existing } = await supabase
    .from("transcriptions")
    .select("id")
    .eq("video_id", videoId)
    .maybeSingle()

  if (existing) {
    return { transcribed: false, reason: "already_transcribed" }
  }

  // Transcription
  try {
    if (!process.env.OPENAI_API_KEY || !videoUrl) {
      return { transcribed: false, reason: "api_key_missing_or_no_url" }
    }

    const content = await transcribeVideo(videoUrl)

    // Sauvegarder le transcript
    await supabase.from("transcriptions").insert({
      video_id: videoId,
      user_id: userId,
      content,
      language: "fr",
    })

    // Logger l'usage API (pour analytics internes)
    logApiUsage({
      userId,
      service: "openai_whisper",
      action: "auto_transcription",
      model: "whisper-1",
      units: Math.ceil(content.length / 1024),
      referenceId: videoId,
    }).catch(() => {})

    console.log(
      `[Auto-Transcribe] ✓ Video ${videoId} transcribed (${duration}s, plan: ${userPlan})`
    )

    return { transcribed: true }
  } catch (err) {
    console.error(
      `[Auto-Transcribe] ✗ Video ${videoId} failed:`,
      err instanceof Error ? err.message : err
    )
    return { transcribed: false, reason: "transcription_failed" }
  }
}

/**
 * Retourne la durée max en secondes pour l'auto-transcription selon le plan.
 * 0 = pas d'auto-transcription.
 */
function getMaxAutoTranscribeDuration(plan: string): number {
  if (plan === "scale") return 600    // 10 minutes
  if (plan === "growth") return 120   // 2 minutes
  return 0                             // Creator : pas d'auto-transcription
}

/**
 * Filtre les vidéos éligibles à l'auto-transcription.
 * Utilisé pour éviter de scraper des vidéos trop longues.
 */
export function filterVideosByDuration(
  videos: Array<{ duration: number | null }>,
  maxDuration: number
): Array<{ duration: number | null }> {
  return videos.filter(v => {
    if (!v.duration) return false
    return v.duration <= maxDuration
  })
}

/**
 * Limite de durée recommandée pour le scraping selon la plateforme.
 * Toutes les vidéos scrapées doivent respecter ces limites pour éviter les coûts excessifs.
 */
export const PLATFORM_MAX_DURATION = {
  instagram: 120,    // Reels max 2 min
  tiktok: 60,        // TikTok max 60s
  youtube: 60,       // Shorts uniquement (60s)
} as const
