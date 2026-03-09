import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { stripe, getPlanByPriceId, TRIAL_CREDITS } from "@/lib/stripe/config"

/**
 * Synchro abonnement Stripe → profil (plan + credits).
 * Utile quand le webhook n'a pas encore été reçu (ex. dev sans Stripe CLI).
 * GET : appelé au retour de Stripe pour mettre à jour plan/credits si besoin.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const serviceSupabase = createServiceClient()

  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, plan, credits, created_at, activation_bonuses")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 })
  }

  let subscriptionId = profile.stripe_subscription_id

  if (!subscriptionId && profile.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    })
    subscriptionId = subscriptions.data[0]?.id ?? null
  }

  if (!subscriptionId) {
    return NextResponse.json({ synced: false, reason: "no_subscription" })
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanByPriceId(priceId) : null

  if (!plan) {
    return NextResponse.json({ synced: false, reason: "unknown_plan" })
  }

  const isTrialing = subscription.status === "trialing"

  const accountAge = profile.created_at
    ? Date.now() - new Date(profile.created_at).getTime()
    : 0
  const isEarlyUpgrade = accountAge <= 7 * 24 * 60 * 60 * 1000
  const earlyUpgradeBonus = isEarlyUpgrade && !isTrialing ? 300 : 0
  const activationBonuses = (profile.activation_bonuses as Record<string, boolean>) || {}
  const newActivationBonuses = isEarlyUpgrade
    ? { ...activationBonuses, early_upgrade: true }
    : activationBonuses

  const newCredits = isTrialing ? TRIAL_CREDITS : plan.config.credits + earlyUpgradeBonus

  const { error: updateError } = await serviceSupabase
    .from("profiles")
    .update({
      plan: plan.key,
      credits: newCredits,
      activation_bonuses: newActivationBonuses,
      stripe_subscription_id: subscriptionId,
      monthly_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("[Stripe Sync] update error:", updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    synced: true,
    plan: plan.key,
    credits: newCredits,
  })
}
