/**
 * Règles et constantes pour le système de crédits avancé
 */

// ─── Emprunt BP ──────────────────────────────────────────────────────────────

export const BORROW_RULES = {
  maxBorrowPercent: 0.2, // 20% du quota mensuel
  requiresActiveSubscription: true,
  blockIfCancelled: true,
}

// ─── Rollover BP ─────────────────────────────────────────────────────────────

export const ROLLOVER_RULES = {
  maxRolloverPercent: 0.5, // 50% du quota mensuel max en rollover
  enabled: true,
}

// ─── Transcriptions gratuites ────────────────────────────────────────────────

export const FREE_TRANSCRIPTS_LIMITS: Record<string, number> = {
  creator: 3, // 3 transcriptions gratuites/mois
  growth: 5,  // 5 transcriptions gratuites/mois
  scale: 10,  // 10 transcriptions gratuites/mois
}

// ─── Bonus d'activation (fidélisation essai) ─────────────────────────────────

export interface ActivationBonus {
  id: string
  name: string
  description: string
  reward: number
  condition: string
}

export const ACTIVATION_BONUSES: ActivationBonus[] = [
  {
    id: "follow_creators",
    name: "Premier radar",
    description: "Suivre 3 créateurs",
    reward: 50,
    condition: "watchlist_count >= 3",
  },
  {
    id: "scrape_videos",
    name: "Détection lancée",
    description: "Scraper 5 vidéos",
    reward: 50,
    condition: "scraped_videos_count >= 5",
  },
  {
    id: "generate_script",
    name: "Premier script",
    description: "Générer ton premier script",
    reward: 100,
    condition: "generated_scripts_count >= 1",
  },
  {
    id: "add_to_board",
    name: "Organisation pro",
    description: "Ajouter une idée au BrutBoard",
    reward: 50,
    condition: "board_items_count >= 1",
  },
]

// Bonus total possible: 250 BP

// ─── Bonus upgrade anticipé ──────────────────────────────────────────────────

export const EARLY_UPGRADE_BONUS = {
  id: "early_upgrade",
  name: "Upgrade anticipé",
  description: "Upgrade avant la fin de l'essai gratuit",
  reward: 300, // 300 BP bonus
  daysRequired: 7, // Doit être dans les 7 premiers jours
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Calcule le max de BP empruntables pour un plan
 */
export function getMaxBorrowable(planCredits: number): number {
  return Math.floor(planCredits * BORROW_RULES.maxBorrowPercent)
}

/**
 * Calcule le max de BP en rollover pour un plan
 */
export function getMaxRollover(planCredits: number): number {
  return Math.floor(planCredits * ROLLOVER_RULES.maxRolloverPercent)
}

/**
 * Calcule les BP disponibles au renouvellement (avec rollover + emprunt)
 */
export function calculateRenewalCredits(
  planCredits: number,
  currentCredits: number,
  borrowedCredits: number
): {
  rolloverAmount: number
  finalCredits: number
} {
  const maxRollover = getMaxRollover(planCredits)
  
  // Rollover = BP non utilisés, cappé à 50% du quota
  const rolloverAmount = Math.min(currentCredits, maxRollover)
  
  // Nouveaux BP = quota + rollover - emprunt, minimum 100 BP
  const finalCredits = Math.max(
    100,
    planCredits + rolloverAmount - borrowedCredits
  )
  
  return { rolloverAmount, finalCredits }
}

/**
 * Vérifie si un user est dans sa période d'essai
 */
export function isInTrialPeriod(createdAt: string, trialDays = 7): boolean {
  const accountAge = Date.now() - new Date(createdAt).getTime()
  const trialMs = trialDays * 24 * 60 * 60 * 1000
  return accountAge <= trialMs
}

/**
 * Vérifie si un bonus d'activation est déjà débloqué
 */
export function isBonusUnlocked(
  activationBonuses: Record<string, boolean> | null,
  bonusId: string
): boolean {
  return activationBonuses?.[bonusId] === true
}
