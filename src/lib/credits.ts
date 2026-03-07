import { createClient } from "@/lib/supabase/server"

// Réexporte les constantes depuis credits-constants (safe pour client & server)
export { COSTS, ACTION_LABELS, type CreditAction } from "./credits-constants"

// ─── Fonctions serveur ───────────────────────────────────────────────────────

export async function checkCredits(
  userId: string,
  cost: number
): Promise<{ ok: boolean; current: number }> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()

  const current = profile?.credits ?? 0
  return { ok: current >= cost, current }
}

export async function consumeCredits(
  userId: string,
  cost: number,
  action: string,
  referenceId?: string | null
): Promise<boolean> {
  const supabase = createClient()

  const { data: consumed } = await supabase.rpc("consume_credits", {
    p_user_id: userId,
    p_amount: cost,
    p_action: action,
    p_reference_id: referenceId ?? null,
  })

  return !!consumed
}

export async function getUserPlan(
  userId: string
): Promise<"creator" | "growth" | "scale"> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single()

  return (profile?.plan as "creator" | "growth" | "scale") ?? "creator"
}
