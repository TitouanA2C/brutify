import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PLAN_FEATURES } from "@/lib/plans"

const BORROW_RULES = {
  maxBorrowPercent: 0.2, // 20% du quota mensuel
  minCreditsAfterBorrow: 0, // Pas de minimum pendant l'emprunt
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: "Body invalide" }, { status: 400 }) }
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount)

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Montant invalide" },
        { status: 400 }
      )
    }

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
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

    // Vérifier que l'utilisateur a un abonnement actif
    if (!profile.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Emprunt disponible uniquement pour les abonnés actifs" },
        { status: 403 }
      )
    }

    // Calculer la limite d'emprunt basée sur le plan
    const planFeatures = PLAN_FEATURES[profile.plan] || PLAN_FEATURES.creator
    const maxBorrowable = Math.floor(planFeatures.maxCredits * BORROW_RULES.maxBorrowPercent)

    // Vérifier que l'utilisateur n'a pas déjà emprunté trop
    const currentBorrowed = profile.borrowed_credits || 0
    const availableToBorrow = maxBorrowable - currentBorrowed

    if (availableToBorrow <= 0) {
      return NextResponse.json(
        { 
          error: "Limite d'emprunt atteinte",
          maxBorrowable,
          currentBorrowed,
          availableToBorrow: 0
        },
        { status: 403 }
      )
    }

    if (amount > availableToBorrow) {
      return NextResponse.json(
        { 
          error: `Vous ne pouvez emprunter que ${availableToBorrow} BP maximum`,
          maxBorrowable,
          currentBorrowed,
          availableToBorrow
        },
        { status: 403 }
      )
    }

    // Effectuer l'emprunt
    const newCredits = profile.credits + amount
    const newBorrowed = currentBorrowed + amount

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        credits: newCredits,
        borrowed_credits: newBorrowed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[Borrow] Update error:", updateError)
      return NextResponse.json(
        { error: "Erreur lors de l'emprunt" },
        { status: 500 }
      )
    }

    // Logger la transaction
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount,
      action: "borrow",
      reference_id: `borrow_${Date.now()}`,
    })

    return NextResponse.json({
      success: true,
      borrowed: amount,
      newCredits,
      totalBorrowed: newBorrowed,
      maxBorrowable,
      remainingBorrowable: maxBorrowable - newBorrowed,
    })
  } catch (err) {
    console.error("[Borrow] Unexpected error:", err)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// GET pour récupérer l'état d'emprunt
export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, credits, borrowed_credits, stripe_subscription_id")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil non trouvé" },
        { status: 404 }
      )
    }

    const planFeatures = PLAN_FEATURES[profile.plan] || PLAN_FEATURES.creator
    const maxBorrowable = Math.floor(planFeatures.maxCredits * BORROW_RULES.maxBorrowPercent)
    const currentBorrowed = profile.borrowed_credits || 0
    const availableToBorrow = Math.max(0, maxBorrowable - currentBorrowed)

    return NextResponse.json({
      hasActiveSubscription: !!profile.stripe_subscription_id,
      currentCredits: profile.credits,
      currentBorrowed,
      maxBorrowable,
      availableToBorrow,
      borrowPercentage: BORROW_RULES.maxBorrowPercent * 100,
    })
  } catch (err) {
    console.error("[Borrow GET] Unexpected error:", err)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}
