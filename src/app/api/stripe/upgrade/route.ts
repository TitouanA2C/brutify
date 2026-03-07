import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe, PLANS, type PlanKey } from "@/lib/stripe/config"

// POST — upgrade ou downgrade de plan avec proration automatique Stripe
// Utilisé quand l'utilisateur a DÉJÀ un abonnement actif.
// Stripe calcule automatiquement le prorata et charge la différence immédiatement.

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: { plan: PlanKey; interval: "month" | "year" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const planConfig = PLANS[body.plan]
  if (!planConfig) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, stripe_customer_id, plan")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Aucun abonnement actif trouvé" },
      { status: 400 }
    )
  }

  const planOrder: Record<string, number> = { creator: 1, growth: 2, scale: 3 }
  const currentPlanOrder = planOrder[profile.plan ?? "creator"] ?? 0
  const newPlanOrder = planOrder[body.plan] ?? 0
  const isUpgrade = newPlanOrder > currentPlanOrder

  // 🧪 Abonnement test (sub_test_*) : en UPGRADE → rediriger vers Stripe Checkout pour voir la page de paiement et enregistrer une vraie transaction
  const isTestSubscription = profile.stripe_subscription_id.startsWith("sub_test_")

  if (isTestSubscription && process.env.NODE_ENV === "development") {
    if (isUpgrade) {
      // Redirection vers Stripe Checkout pour un vrai paiement (mode test)
      const priceId =
        body.interval === "year"
          ? planConfig.yearlyPriceId
          : planConfig.monthlyPriceId
      const origin = request.headers.get("origin") || "http://localhost:3000"

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${origin}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/settings?canceled=true`,
        customer_email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
          plan: body.plan,
          type: "subscription",
        },
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            plan: body.plan,
          },
        },
      })

      console.log("[Stripe Upgrade] DEV MODE: Redirecting to Checkout for upgrade (test sub)")

      return NextResponse.json({
        success: false,
        redirectUrl: session.url,
        message: "Redirection vers Stripe pour finaliser le paiement",
      })
    }

    // Downgrade avec abo test : pas de paiement, mise à jour DB uniquement
    console.log("[Stripe Upgrade] DEV MODE: Downgrade with test sub, updating DB only")

    await supabase
      .from("profiles")
      .update({
        plan: body.plan,
        credits: planConfig.credits,
        monthly_credits_reset_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: planConfig.credits,
      action: "plan_downgrade_dev",
      reference_id: profile.stripe_subscription_id,
    })

    return NextResponse.json({
      success: true,
      plan: body.plan,
      credits: planConfig.credits,
      isUpgrade: false,
      devMode: true,
    })
  }

  const newPriceId =
    body.interval === "year"
      ? planConfig.yearlyPriceId
      : planConfig.monthlyPriceId

  // Récupère l'abonnement actuel pour trouver l'item à remplacer
  const subscription = await stripe.subscriptions.retrieve(
    profile.stripe_subscription_id
  )

  const currentItemId = subscription.items.data[0]?.id
  if (!currentItemId) {
    return NextResponse.json(
      { error: "Item d'abonnement introuvable" },
      { status: 400 }
    )
  }

  // Met à jour l'abonnement Stripe avec proration
  // CHANGEMENT : On applique les prorations immédiatement pour TOUS les changements
  // (upgrades ET downgrades) pour que le changement soit instantané
  const updatedSubscription = await stripe.subscriptions.update(
    profile.stripe_subscription_id,
    {
      items: [{ id: currentItemId, price: newPriceId }],
      proration_behavior: "create_prorations", // Proration immédiate pour tous les changements
      billing_cycle_anchor: "now", // Réinitialiser le cycle de facturation maintenant
      trial_end: "now", // Terminer immédiatement tout trial en cours
      metadata: {
        supabase_user_id: user.id,
        plan: body.plan,
      },
    }
  )

  // Met à jour le profil en base (le webhook va aussi le faire,
  // mais on le fait ici pour une mise à jour immédiate côté UI)
  await supabase
    .from("profiles")
    .update({
      plan: body.plan,
      credits: planConfig.credits,
      stripe_subscription_id: updatedSubscription.id,
      monthly_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  await supabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: planConfig.credits,
    action: isUpgrade ? "plan_upgrade" : "plan_downgrade",
    reference_id: updatedSubscription.id,
  })

  return NextResponse.json({
    success: true,
    plan: body.plan,
    credits: planConfig.credits,
    isUpgrade,
  })
}
