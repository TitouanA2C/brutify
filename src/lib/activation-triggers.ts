/**
 * Triggers automatiques pour débloquer les bonus d'activation
 */

import { createServiceClient } from "@/lib/supabase/server"
import { ACTIVATION_BONUSES, isBonusUnlocked } from "@/lib/credits-rules"

/**
 * Vérifie et débloque automatiquement les bonus d'activation selon l'action
 */
export async function checkAndUnlockBonus(
  userId: string,
  action: "follow_creator" | "scrape_videos" | "generate_script" | "add_to_board"
) {
  const supabase = createServiceClient()

  // Récupérer le profil
  const { data: profile } = await supabase
    .from("profiles")
    .select("activation_bonuses, credits")
    .eq("id", userId)
    .single()

  if (!profile) return

  const activationBonuses = profile.activation_bonuses || {}

  // Mapping action → bonusId
  const bonusMapping: Record<string, string> = {
    follow_creator: "follow_creators",
    scrape_videos: "scrape_videos",
    generate_script: "generate_script",
    add_to_board: "add_to_board",
  }

  const bonusId = bonusMapping[action]
  if (!bonusId) return

  // Vérifier si déjà débloqué
  if (isBonusUnlocked(activationBonuses, bonusId)) return

  // Vérifier la condition
  const conditionMet = await checkBonusCondition(supabase, userId, bonusId)
  if (!conditionMet) return

  // Débloquer le bonus
  const bonus = ACTIVATION_BONUSES.find(b => b.id === bonusId)
  if (!bonus) return

  const newActivationBonuses = {
    ...activationBonuses,
    [bonusId]: true,
  }

  const newCredits = profile.credits + bonus.reward

  await supabase
    .from("profiles")
    .update({
      credits: newCredits,
      activation_bonuses: newActivationBonuses,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  // Logger
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: bonus.reward,
    action: `activation_bonus_${bonusId}`,
    reference_id: bonusId,
  })

  console.log(
    `[Activation] User ${userId} unlocked "${bonus.name}" (+${bonus.reward} BP)`
  )
}

/**
 * Vérifie si la condition d'un bonus est remplie
 */
async function checkBonusCondition(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  bonusId: string
): Promise<boolean> {
  switch (bonusId) {
    case "follow_creators": {
      const { count } = await supabase
        .from("watchlist")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
      return (count ?? 0) >= 3
    }

    case "scrape_videos": {
      // Compter les vidéos scrapées par l'utilisateur (via watchlist)
      const { data: watchlist } = await supabase
        .from("watchlist")
        .select("creator_id")
        .eq("user_id", userId)

      if (!watchlist || watchlist.length === 0) return false

      const creatorIds = watchlist.map(w => w.creator_id)
      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .in("creator_id", creatorIds)

      return (count ?? 0) >= 5
    }

    case "generate_script": {
      // Vérifier via les transactions de crédits
      const { count } = await supabase
        .from("credit_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", "script_generation")
      return (count ?? 0) >= 1
    }

    case "add_to_board": {
      const { count } = await supabase
        .from("board")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
      return (count ?? 0) >= 1
    }

    default:
      return false
  }
}
