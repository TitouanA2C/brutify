import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { ACTIVATION_BONUSES, EARLY_UPGRADE_BONUS, isBonusUnlocked, isInTrialPeriod } from "@/lib/credits-rules"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { bonusId } = await request.json()

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
      bonus = EARLY_UPGRADE_BONUS as any
    }

    if (!bonus) {
      return NextResponse.json(
        { error: "Bonus inconnu" },
        { status: 404 }
      )
    }

    // TODO: Vérifier la condition du bonus (à implémenter selon le bonus)
    // Par exemple pour "follow_creators", vérifier qu'il y a bien 3+ créateurs dans watchlist

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

    console.log(
      `[Activation Bonus] User ${user.id} unlocked "${bonus.name}" (+${bonus.reward} BP)`
    )

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
      ? [...ACTIVATION_BONUSES, EARLY_UPGRADE_BONUS as any]
      : ACTIVATION_BONUSES

    const bonusesWithStatus = allBonuses.map(bonus => ({
      ...bonus,
      unlocked: isBonusUnlocked(activationBonuses, bonus.id),
    }))

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
