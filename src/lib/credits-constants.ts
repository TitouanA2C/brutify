// ─── Coûts BP révisés ─────────────────────────────────────────────────────────
//
//  Basés sur les coûts API réels (OpenRouter Claude + Whisper + Apify)
//  avec une marge × 4-10 pour la viabilité business.
//
//  Coût API réel estimé :
//    Script       → ~€0.016/appel  →  2 BP  (marge ~5x au tarif Creator)
//    Transcription → ~€0.012/appel →  3 BP  (marge ~9.5x)
//    Analyse IA   → ~€0.018/appel  →  5 BP  (marge ~10x)
//    Scraping     → ~€0.05–0.10    →  5 BP  (marge ~2-4x, Apify est cher)
//    Inspiration  → ~€0.015/appel  →  4 BP  (marge ~10x)
// ─────────────────────────────────────────────────────────────────────────────

export const COSTS = {
  script_generation:  2,   // 2 BP — Claude Sonnet ~800t in + ~800t out
  transcription:      3,   // 3 BP — Whisper ~2 min audio
  analysis:           5,   // 5 BP — Claude Sonnet ~1200t in + ~600t out (appel lourd)
  inspire_vault:      4,   // 4 BP — Claude Sonnet ~1500t in + ~1000t out
  scraping:           5,   // 5 BP — Apify Instagram profile + 30 posts
  creator_analysis:  30,   // 30 BP — Claude Sonnet ~11K in + ~8K out (analyse complète)
} as const

export type CreditAction = keyof typeof COSTS

export const ACTION_LABELS: Record<string, string> = {
  script_generation:  "Script forgé",
  transcription:      "Transcription vidéo",
  video_analysis:     "Analyse IA",
  inspire_vault:      "Inspiration IA",
  scraping:           "Scraping créateur",
  creator_analysis:   "Analyse concurrentielle",
  credit_purchase:    "Achat de crédits",
  monthly_reset:      "Recharge mensuelle",
  plan_upgrade:       "Upgrade plan",
}
