import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe, CREDIT_PACKS } from "@/lib/stripe/config"

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: { amount: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const pack = CREDIT_PACKS.find((p) => p.amount === body.amount)
  if (!pack) {
    return NextResponse.json(
      { error: "Pack de crédits invalide", available: CREDIT_PACKS.map((p) => p.amount) },
      { status: 400 }
    )
  }

  // Utiliser actualBp si bonus présent, sinon amount
  const creditsToGrant = pack.actualBp ?? pack.amount

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  const userPlan = profile?.plan ?? "creator"

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

  // Calculer la réduction selon le plan de l'user
  let discountPercent = 0
  if (userPlan === "creator") discountPercent = 15
  else if (userPlan === "growth") discountPercent = 25
  else if (userPlan === "scale") discountPercent = 40

  // Reutiliser un coupon par plan (evite d'en creer des centaines dans Stripe)
  let couponId: string | undefined = undefined
  if (discountPercent > 0) {
    const stableCouponId = `bp_discount_${userPlan}_${discountPercent}`
    try {
      await stripe.coupons.retrieve(stableCouponId)
      couponId = stableCouponId
    } catch {
      const coupon = await stripe.coupons.create({
        id: stableCouponId,
        percent_off: discountPercent,
        duration: "once",
        name: `BP Pack -${discountPercent}% (${userPlan})`,
      })
      couponId = coupon.id
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [{ price: pack.priceId, quantity: 1 }],
    discounts: couponId ? [{ coupon: couponId }] : undefined,
    success_url: `${request.headers.get("origin")}/settings?credits=true&amount=${creditsToGrant}&dev_credit=true`,
    cancel_url: `${request.headers.get("origin")}/settings?canceled=true`,
    
    // 🎨 Personnalisation de la page Checkout
    custom_text: {
      submit: {
        message: "Vos BrutPoints seront crédités instantanément après paiement.",
      },
    },
    billing_address_collection: "auto",
    phone_number_collection: {
      enabled: false,
    },
    
    metadata: {
      supabase_user_id: user.id,
      type: "credits",
      credits_amount: String(creditsToGrant),
      discount_applied: String(discountPercent),
    },
  })

  return NextResponse.json({ url: session.url })
}
