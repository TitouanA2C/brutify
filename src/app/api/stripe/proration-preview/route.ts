import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe, PLANS, type PlanKey } from "@/lib/stripe/config"

// GET — calcule le montant exact à payer pour un upgrade (proration Stripe)
// Retourne { amountDue, nextAmount, currency }

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
    .select("stripe_subscription_id, stripe_customer_id")
    .eq("id", user.id)
    .single()

  if (!profile?.stripe_subscription_id || !profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 })
  }

  // 🧪 DEV MODE : Si l'ID de subscription est un ID de test, retourner des valeurs fictives
  const isTestSubscription = profile.stripe_subscription_id.startsWith("sub_test_")

  if (isTestSubscription && process.env.NODE_ENV === "development") {
    console.log("[Proration Preview] DEV MODE: Returning fake proration data")
    
    // Retourner des montants fictifs pour la preview
    const monthlyPrice = body.interval === "year" 
      ? planConfig.yearlyPriceId 
      : planConfig.monthlyPriceId
    
    // Simuler un montant de proration (50% du prix mensuel en centimes)
    const fakeAmountDue = Math.round((body.interval === "year" ? 14 : 19) * 100 * 0.5)

    return NextResponse.json({
      amountDue: fakeAmountDue,
      nextAmount: (body.interval === "year" ? 14 : 19) * 100,
      currency: "eur",
      periodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // +30 jours
      devMode: true,
    })
  }

  const newPriceId =
    body.interval === "year"
      ? planConfig.yearlyPriceId
      : planConfig.monthlyPriceId

  const subscription = await stripe.subscriptions.retrieve(
    profile.stripe_subscription_id
  )
  const currentItemId = subscription.items.data[0]?.id

  if (!currentItemId) {
    return NextResponse.json({ error: "Item introuvable" }, { status: 400 })
  }

  // Calcule la facture proratisée sans l'appliquer
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: profile.stripe_customer_id,
    subscription: profile.stripe_subscription_id,
    subscription_items: [{ id: currentItemId, price: newPriceId }],
    subscription_proration_behavior: "create_prorations",
  })

  return NextResponse.json({
    amountDue: upcomingInvoice.amount_due,        // centimes — charge immédiate (upgrade)
    nextAmount: upcomingInvoice.amount_remaining, // centimes — prochain cycle
    currency: upcomingInvoice.currency,
    periodEnd: upcomingInvoice.period_end,
  })
}
