/**
 * Triggers pour les bonus d'activation.
 * On ne débloque plus automatiquement : la condition rend le bonus "réclamable"
 * et l'utilisateur récupère les BP au clic sur le dashboard.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { ACTIVATION_BONUSES, isBonusUnlocked } from "@/lib/credits-rules"

const BONUS_ACTION_MAP: Record<string, string> = {
  follow_creator: "follow_creators",
  scrape_videos: "scrape_videos",
  generate_script: "generate_script",
  add_to_board: "add_to_board",
}

export type ActivationAction = "follow_creator" | "scrape_videos" | "generate_script" | "add_to_board"

/**
 * Vérifie si une action vient de rendre un bonus réclamable (condition remplie, pas encore débloqué).
 * Retourne le bonus à réclamer ou null. N'accorde pas les BP (c'est le POST /api/activation/bonus qui le fait).
 */
export async function getClaimableBonusAfterAction(
  supabase: SupabaseClient,
  userId: string,
  action: ActivationAction
): Promise<{ id: string; name: string; reward: number } | null> {
  const bonusId = BONUS_ACTION_MAP[action]
  if (!bonusId) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("activation_bonuses")
    .eq("id", userId)
    .single()

  if (!profile || isBonusUnlocked(profile.activation_bonuses || {}, bonusId))
    return null

  const conditionMet = await checkBonusCondition(supabase, userId, bonusId)
  if (!conditionMet) return null

  const bonus = ACTIVATION_BONUSES.find(b => b.id === bonusId)
  if (!bonus) return null

  return { id: bonus.id, name: bonus.name, reward: bonus.reward }
}

/**
 * Vérifie la condition d'un bonus (sans accorder les BP).
 * Exporté pour que GET /api/activation/bonus puisse calculer claimable.
 */
export async function checkBonusCondition(
  supabase: SupabaseClient,
  userId: string,
  bonusId: string
): Promise<boolean> {
  switch (bonusId) {
    case "follow_creators": {
      const { count } = await supabase
        .from("watchlists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
      return (count ?? 0) >= 3
    }

    case "scrape_videos": {
      const { data: wl } = await supabase
        .from("watchlists")
        .select("creator_id")
        .eq("user_id", userId)
      if (!wl?.length) return false
      const creatorIds = wl.map(w => w.creator_id)
      const { count } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .in("creator_id", creatorIds)
      return (count ?? 0) >= 5
    }

    case "generate_script": {
      const { count } = await supabase
        .from("credit_transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("action", "script_generation")
      return (count ?? 0) >= 1
    }

    case "add_to_board": {
      const { count } = await supabase
        .from("board_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
      return (count ?? 0) >= 1
    }

    default:
      return false
  }
}

/**
 * @deprecated Ne plus accorder les BP ici : l'utilisateur réclame au clic sur le dashboard.
 * Conservé pour compatibilité des appels ; les APIs doivent utiliser getClaimableBonusAfterAction et retourner bonusClaimable.
 */
export async function checkAndUnlockBonus(
  _userId: string,
  _action: ActivationAction
) {
  // No-op : le bonus est désormais réclamable sur le dashboard au clic
}
