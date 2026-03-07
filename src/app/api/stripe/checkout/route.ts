import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { stripe, PLANS, type PlanKey, getPromoCoupon } from "@/lib/stripe/config"

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: { plan: PlanKey; interval: "month" | "year"; promoCode?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const planConfig = PLANS[body.plan]
  if (!planConfig) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 })
  }

  const priceId =
    body.interval === "year"
      ? planConfig.yearlyPriceId
      : planConfig.monthlyPriceId

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, plan")
    .eq("id", user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  const hasActiveSubscription = !!profile?.stripe_subscription_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  // Détecter si l'user vient de l'onboarding via query param
  const { searchParams } = new URL(request.url)
  const fromOnboarding = searchParams.get("from") === "onboarding"

  // Si l'utilisateur a déjà un abonnement et veut changer de plan,
  // on doit utiliser l'API de modification d'abonnement plutôt qu'un nouveau checkout
  if (hasActiveSubscription && profile?.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      
      // Mettre à jour l'abonnement existant
      const updatedSubscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{
          id: subscription.items.data[0].id,
          price: priceId,
        }],
        proration_behavior: 'create_prorations', // Facturer/créditer au prorata
        metadata: {
          supabase_user_id: user.id,
          plan: body.plan,
        },
      })

      // Mettre à jour le profil immédiatement
      await supabase
        .from("profiles")
        .update({
          plan: body.plan,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      console.log(`[Stripe] Subscription ${profile.stripe_subscription_id} updated to plan ${body.plan}`)

      // Rediriger vers les paramètres avec un message de succès
      return NextResponse.json({ 
        url: `${request.headers.get("origin")}/settings?plan_changed=true&new_plan=${body.plan}`,
        subscriptionUpdated: true,
      })
    } catch (err) {
      console.error("[Stripe] Error updating subscription:", err)
      return NextResponse.json(
        { error: "Erreur lors du changement de plan" },
        { status: 500 }
      )
    }
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: fromOnboarding
      ? `${request.headers.get("origin")}/dashboard?welcome=true`
      : `${request.headers.get("origin")}/settings?session_id={CHECKOUT_SESSION_ID}&success=true`,
    cancel_url: fromOnboarding
      ? `${request.headers.get("origin")}/onboarding`
      : `${request.headers.get("origin")}/settings?canceled=true`,
    
    // 🎨 Personnalisation de la page Checkout
    custom_text: {
      submit: {
        message: "Votre abonnement et vos BrutPoints seront activés instantanément.",
      },
    },
    billing_address_collection: "auto",
    phone_number_collection: {
      enabled: false,
    },
    
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
  }

  // N'appliquer le trial que si :
  // 1. Le plan est creator
  // 2. Le plan a des jours de trial configurés
  // 3. L'utilisateur n'a PAS déjà un abonnement actif (nouveau client uniquement)
  if (body.plan === "creator" && planConfig.trialDays && !hasActiveSubscription) {
    sessionParams.subscription_data!.trial_period_days = planConfig.trialDays
  }

  // Appliquer le code promo si fourni
  if (body.promoCode) {
    const couponId = getPromoCoupon(body.promoCode)
    if (couponId) {
      try {
        // Vérifier si le coupon existe dans Stripe
        await stripe.coupons.retrieve(couponId)
        
        // Appliquer le coupon via discounts
        sessionParams.discounts = [{ coupon: couponId }]
      } catch (err) {
        // Le coupon n'existe pas, on va le créer automatiquement
        console.error(`Coupon ${couponId} non trouvé, création automatique`)
        
        // Extraire le pourcentage de réduction du nom
        const discount = parseInt(body.promoCode.match(/\d+/)?.[0] ?? "0")
        
        if (discount > 0) {
          try {
            await stripe.coupons.create({
              id: couponId,
              percent_off: discount,
              duration: "once",
              name: `Promo ${body.promoCode}`,
            })
            sessionParams.discounts = [{ coupon: couponId }]
          } catch (createErr) {
            console.error("Erreur création coupon:", createErr)
          }
        }
      }
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return NextResponse.json({ url: session.url })
}
