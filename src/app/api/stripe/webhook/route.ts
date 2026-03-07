import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe, getPlanByPriceId } from "@/lib/stripe/config"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.text()
  const sig = headers().get("stripe-signature")

  let event: Stripe.Event

  // ⚠️ EN DEV : Skip la vérification de signature pour tester localement
  // En prod, Vercel recevra les vrais webhooks signés de Stripe
  if (process.env.NODE_ENV === "development" && !sig) {
    console.log("[Stripe Webhook] Dev mode: skipping signature verification")
    event = JSON.parse(body) as Stripe.Event
  } else {
    if (!sig) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 })
    }

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signature invalide"
      console.error("[Stripe Webhook] Verification failed:", message)
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const type = session.metadata?.type

        if (!userId) {
          console.error("[Stripe Webhook] Missing supabase_user_id in metadata")
          break
        }

        if (type === "credits") {
          const creditsAmount = Number(session.metadata?.credits_amount || 0)
          if (creditsAmount > 0) {
            await handleCreditPurchase(supabase, userId, creditsAmount, session)
          }
        } else if (type === "subscription") {
          await handleSubscriptionCreated(supabase, userId, session)
        }

        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceSub = (invoice as unknown as { subscription: string | null }).subscription
        if (invoice.billing_reason === "subscription_cycle" && invoiceSub) {
          await handleMonthlyReset(supabase, invoice)
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: "Webhook handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─── Handlers ────────────────────────────────────────────────────────────────

type SupabaseAdmin = ReturnType<typeof createServiceClient>

async function handleSubscriptionCreated(
  supabase: SupabaseAdmin,
  userId: string,
  session: Stripe.Checkout.Session
) {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanByPriceId(priceId) : null

  if (!plan) {
    console.error("[Stripe Webhook] Unknown price ID:", priceId)
    return
  }

  // Vérifier si user est en période d'essai (7 premiers jours)
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, activation_bonuses")
    .eq("id", userId)
    .single()

  const accountAge = profile?.created_at 
    ? Date.now() - new Date(profile.created_at).getTime()
    : 0
  const isEarlyUpgrade = accountAge <= 7 * 24 * 60 * 60 * 1000
  const earlyUpgradeBonus = isEarlyUpgrade ? 300 : 0
  const activationBonuses = profile?.activation_bonuses || {}

  // Marquer le bonus early_upgrade comme débloqué
  const newActivationBonuses = isEarlyUpgrade
    ? { ...activationBonuses, early_upgrade: true }
    : activationBonuses

  await supabase
    .from("profiles")
    .update({
      plan: plan.key,
      credits: plan.config.credits + earlyUpgradeBonus,
      activation_bonuses: newActivationBonuses,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
      stripe_subscription_id: subscriptionId,
      monthly_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: plan.config.credits,
    action: "plan_upgrade",
    reference_id: subscriptionId,
  })

  if (earlyUpgradeBonus > 0) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: earlyUpgradeBonus,
      action: "activation_bonus_early_upgrade",
      reference_id: subscriptionId,
    })
  }

  console.log(
    `[Stripe Webhook] User ${userId} subscribed to ${plan.key} (${plan.config.credits} credits${earlyUpgradeBonus > 0 ? ` + ${earlyUpgradeBonus} early upgrade bonus` : ""})`
  )
}

async function handleMonthlyReset(
  supabase: SupabaseAdmin,
  invoice: Stripe.Invoice
) {
  const rawSub = (invoice as unknown as { subscription: string | { id: string } | null }).subscription
  const subscriptionId =
    typeof rawSub === "string" ? rawSub : rawSub?.id

  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    console.error("[Stripe Webhook] Missing user ID in subscription metadata")
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanByPriceId(priceId) : null

  if (!plan) return

  // Récupérer le profil pour rollover + emprunt
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, borrowed_credits")
    .eq("id", userId)
    .single()

  const currentCredits = profile?.credits || 0
  const borrowedCredits = profile?.borrowed_credits || 0

  // Calculer le rollover (max 50% du quota)
  const maxRollover = Math.floor(plan.config.credits * 0.5)
  const rolloverAmount = Math.min(currentCredits, maxRollover)

  // Nouveaux BP = quota + rollover - emprunt (min 100)
  const newCredits = Math.max(
    100,
    plan.config.credits + rolloverAmount - borrowedCredits
  )

  await supabase
    .from("profiles")
    .update({
      credits: newCredits,
      rollover_credits: rolloverAmount,
      borrowed_credits: 0,
      free_transcripts_used: 0, // Reset transcriptions gratuites
      free_transcripts_reset_at: new Date().toISOString(),
      monthly_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: plan.config.credits,
    action: "monthly_reset",
    reference_id: subscriptionId,
  })

  if (rolloverAmount > 0) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: rolloverAmount,
      action: "rollover",
      reference_id: subscriptionId,
    })
  }

  if (borrowedCredits > 0) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: -borrowedCredits,
      action: "borrow_repayment",
      reference_id: subscriptionId,
    })
  }

  console.log(
    `[Stripe Webhook] Monthly reset for ${userId}: ${plan.config.credits} credits + ${rolloverAmount} rollover - ${borrowedCredits} borrowed = ${newCredits} final`
  )
}

async function handleSubscriptionUpdated(
  supabase: SupabaseAdmin,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  const priceId = subscription.items.data[0]?.price.id
  const plan = priceId ? getPlanByPriceId(priceId) : null

  if (!plan) return

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single()

  if (profile?.plan === plan.key) return

  await supabase
    .from("profiles")
    .update({
      plan: plan.key,
      credits: plan.config.credits,
      stripe_subscription_id: subscription.id,
      monthly_credits_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: plan.config.credits,
    action: "plan_upgrade",
    reference_id: subscription.id,
  })

  console.log(
    `[Stripe Webhook] Plan updated for ${userId}: ${profile?.plan} → ${plan.key}`
  )
}

async function handleSubscriptionDeleted(
  supabase: SupabaseAdmin,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  await supabase
    .from("profiles")
    .update({
      plan: "creator",
      credits: 0,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  console.log(
    `[Stripe Webhook] Subscription canceled for ${userId}: downgraded to creator with 0 credits`
  )
}

async function handleCreditPurchase(
  supabase: SupabaseAdmin,
  userId: string,
  amount: number,
  session: Stripe.Checkout.Session
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single()

  const newCredits = (profile?.credits ?? 0) + amount

  await supabase
    .from("profiles")
    .update({
      credits: newCredits,
      stripe_customer_id:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    action: "credit_purchase",
    reference_id: session.id,
  })

  console.log(
    `[Stripe Webhook] ${userId} purchased ${amount} credits (total: ${newCredits})`
  )
}
