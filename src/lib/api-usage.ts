import { createClient } from "@/lib/supabase/server"

export type ApiService = "openrouter" | "openai_whisper" | "apify"

// Coûts réels approximatifs (USD) pour l'analyse interne
// OpenRouter Claude Sonnet: $3/M tokens in, $15/M tokens out
// OpenAI Whisper: $0.006/min audio
// Apify Instagram: ~$0.50/1000 résultats
const PRICE_PER_M_TOKENS_IN: Record<string, number> = {
  "anthropic/claude-sonnet-4.6": 3.0,
}
const PRICE_PER_M_TOKENS_OUT: Record<string, number> = {
  "anthropic/claude-sonnet-4.6": 15.0,
}
const WHISPER_PRICE_PER_MIN = 0.006
const APIFY_PRICE_PER_1000_RESULTS = 0.5

export interface ApiUsageData {
  userId: string | null
  service: ApiService
  action: string
  model?: string
  tokensIn?: number
  tokensOut?: number
  /** Apify: nb de résultats ; Whisper: taille du fichier en Ko */
  units?: number
  referenceId?: string | null
}

function estimateCostUsd(data: ApiUsageData): number {
  if (data.service === "openrouter" && data.model) {
    const inRate = PRICE_PER_M_TOKENS_IN[data.model] ?? 3.0
    const outRate = PRICE_PER_M_TOKENS_OUT[data.model] ?? 15.0
    const inCost = ((data.tokensIn ?? 0) / 1_000_000) * inRate
    const outCost = ((data.tokensOut ?? 0) / 1_000_000) * outRate
    return inCost + outCost
  }
  if (data.service === "openai_whisper") {
    // Estimation : 1 Ko de fichier audio ≈ 0.04s → ~0.0007 min
    // On use units (Ko) comme proxy de durée
    const estimatedMinutes = (data.units ?? 500) / 1500
    return estimatedMinutes * WHISPER_PRICE_PER_MIN
  }
  if (data.service === "apify") {
    return ((data.units ?? 30) / 1000) * APIFY_PRICE_PER_1000_RESULTS
  }
  return 0
}

/**
 * Enregistre un appel API dans api_usage_logs.
 * Ne throw jamais — les échecs de logging ne doivent jamais bloquer le flux principal.
 */
export async function logApiUsage(data: ApiUsageData): Promise<void> {
  try {
    const supabase = createClient()
    const estimatedCostUsd = estimateCostUsd(data)

    await supabase.from("api_usage_logs").insert({
      user_id: data.userId ?? null,
      service: data.service,
      action: data.action,
      model: data.model ?? null,
      tokens_in: data.tokensIn ?? null,
      tokens_out: data.tokensOut ?? null,
      units: data.units ?? null,
      estimated_cost_usd: estimatedCostUsd,
      reference_id: data.referenceId ?? null,
    })
  } catch (err) {
    console.error("[ApiUsage] Échec du logging (non bloquant):", err)
  }
}

/**
 * Estime les tokens d'un texte (approx : 1 token ≈ 4 caractères).
 * Utilisé pour les appels streaming où on n'a pas accès aux métadonnées.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
