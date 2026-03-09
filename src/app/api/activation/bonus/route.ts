import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { checkBonusCondition } from "@/lib/activation-triggers"
import { ACTIVATION_BONUSES, EARLY_UPGRADE_BONUS, isBonusUnlocked, isInTrialPeriod } from "@/lib/credits-rules"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: "Body invalide" }, { status: 400 }) }
    const { bonusId } = body as { bonusId?: string }

    if (!bonusId || typeof bonusId !== "string") {
      return NextResponse.json(
        { error: "bonusId invalide" },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Récupérer le profil
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si déjà débloqué
    const activationBonuses = profile.activation_bonuses || {}
    if (isBonusUnlocked(activationBonuses, bonusId)) {
      return NextResponse.json(
        { error: "Bonus déjà débloqué" },
        { status: 403 }
      )
    }

    // Trouver le bonus
    let bonus = ACTIVATION_BONUSES.find(b => b.id === bonusId)
    
    // Bonus upgrade anticipé (special case)
    if (bonusId === EARLY_UPGRADE_BONUS.id) {
      // Vérifier que user est dans les 7 premiers jours
      if (!isInTrialPeriod(profile.created_at || new Date().toISOString(), 7)) {
        return NextResponse.json(
          { error: "Bonus upgrade valable uniquement pendant l'essai" },
          { status: 403 }
        )
      }
      bonus = EARLY_UPGRADE_BONUS
    }

    if (!bonus) {
      return NextResponse.json(
        { error: "Bonus inconnu" },
        { status: 404 }
      )
    }

    // Vérifier la condition du bonus
    if (bonus.id === "follow_creators") {
      const { count } = await serviceSupabase.from("watchlists").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      if ((count ?? 0) < 3) return NextResponse.json({ error: "Il faut suivre au moins 3 créateurs" }, { status: 403 })
    } else if (bonus.id === "scrape_videos") {
      const { count } = await serviceSupabase.from("videos").select("id", { count: "exact", head: true }).eq("creator_id", user.id).limit(5)
      // count videos across watched creators
      const { data: wl } = await serviceSupabase.from("watchlists").select("creator_id").eq("user_id", user.id)
      if (wl?.length) {
        const { count: vCount } = await serviceSupabase.from("videos").select("id", { count: "exact", head: true }).in("creator_id", wl.map(w => w.creator_id))
        if ((vCount ?? 0) < 5) return NextResponse.json({ error: "Il faut au moins 5 vidéos scrapées" }, { status: 403 })
      } else {
        return NextResponse.json({ error: "Il faut au moins 5 vidéos scrapées" }, { status: 403 })
      }
    } else if (bonus.id === "generate_script") {
      const { count } = await serviceSupabase.from("scripts").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      if ((count ?? 0) < 1) return NextResponse.json({ error: "Il faut générer au moins 1 script" }, { status: 403 })
    } else if (bonus.id === "add_to_board") {
      const { count } = await serviceSupabase.from("board_items").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      if ((count ?? 0) < 1) return NextResponse.json({ error: "Il faut ajouter au moins 1 élément au board" }, { status: 403 })
    }

    // Débloquer le bonus
    const newActivationBonuses = {
      ...activationBonuses,
      [bonusId]: true,
    }

    const newCredits = profile.credits + bonus.reward

    const { error: updateError } = await serviceSupabase
      .from("profiles")
      .update({
        credits: newCredits,
        activation_bonuses: newActivationBonuses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Activation Bonus] Update error:", updateError)
      return NextResponse.json(
        { error: "Erreur lors du déblocage" },
        { status: 500 }
      )
    }

    // Logger la transaction
    await serviceSupabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: bonus.reward,
      action: `activation_bonus_${bonusId}`,
      reference_id: bonusId,
    })

    return NextResponse.json({
      success: true,
      bonus: {
        id: bonus.id,
        name: bonus.name,
        reward: bonus.reward,
      },
      newCredits,
    })
  } catch (err) {
    console.error("[Activation Bonus] Unexpected error:", err)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// GET pour récupérer l'état des bonus
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const serviceSupabase = createServiceClient()

    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("activation_bonuses, created_at")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      )
    }

    const activationBonuses = profile.activation_bonuses || {}
    const inTrial = isInTrialPeriod(profile.created_at || new Date().toISOString(), 7)

    // Ajouter le bonus early_upgrade si en période d'essai
    const allBonuses = inTrial
      ? [...ACTIVATION_BONUSES, EARLY_UPGRADE_BONUS]
      : ACTIVATION_BONUSES

    const bonusesWithStatus = await Promise.all(
      allBonuses.map(async (bonus) => {
        const unlocked = isBonusUnlocked(activationBonuses, bonus.id)
        const conditionMet =
          bonus.id !== "early_upgrade"
            ? await checkBonusCondition(serviceSupabase, user.id, bonus.id)
            : false
        const claimable = !unlocked && conditionMet
        return {
          ...bonus,
          unlocked,
          claimable,
        }
      })
    )

    const totalEarned = bonusesWithStatus
      .filter(b => b.unlocked)
      .reduce((sum, b) => sum + b.reward, 0)

    const totalPossible = bonusesWithStatus.reduce((sum, b) => sum + b.reward, 0)

    return NextResponse.json({
      bonuses: bonusesWithStatus,
      totalEarned,
      totalPossible,
      inTrial,
    })
  } catch (err) {
    console.error("[Activation Bonus GET] Unexpected error:", err)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
