import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/config"

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: { offerType: "discount" | "pause" | "downgrade" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, plan")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil non trouvé" }, { status: 404 })
  }

  if (!profile.stripe_subscription_id) {
    return NextResponse.json(
      { error: "Aucun abonnement actif" },
      { status: 400 }
    )
  }

  try {
    if (body.offerType === "discount") {
      // ─── OFFRE -30% PENDANT 3 MOIS ───
      
      // Créer un coupon -30% sur Stripe (ou utiliser un existant)
      const coupon = await stripe.coupons.create({
        percent_off: 30,
        duration: "repeating",
        duration_in_months: 3,
        name: `Retention ${profile.plan} -30%`,
        metadata: { type: "retention", user_id: user.id },
      })

      // Appliquer le coupon à la subscription
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        coupon: coupon.id,
        metadata: {
          retention_offer: "discount_30_3m",
          original_plan: profile.plan,
        },
      })

      // Logger dans la DB
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: 0,
        action: "retention_discount",
        reference_id: coupon.id,
        metadata: { offer: "30% off for 3 months" },
      })

      return NextResponse.json({
        success: true,
        message: "Réduction -30% appliquée pour 3 mois",
      })
    } else if (body.offerType === "pause") {
      // ─── PAUSE DE 2 MOIS ───
      
      // Calculer la date de reprise (2 mois)
      const pauseEnd = new Date()
      pauseEnd.setMonth(pauseEnd.getMonth() + 2)

      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        pause_collection: {
          behavior: "keep_as_draft", // Garde la subscription sans facturer
          resumes_at: Math.floor(pauseEnd.getTime() / 1000),
        },
        metadata: {
          retention_offer: "pause_2m",
          paused_at: new Date().toISOString(),
        },
      })

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: 0,
        action: "retention_pause",
        reference_id: profile.stripe_subscription_id,
        metadata: { pause_until: pauseEnd.toISOString() },
      })

      return NextResponse.json({
        success: true,
        message: "Abonnement mis en pause pour 2 mois",
      })
    } else if (body.offerType === "downgrade") {
      // ─── DOWNGRADE VERS CREATOR ───
      
      // Si déjà Creator, ne rien faire
      if (profile.plan === "creator") {
        return NextResponse.json({
          error: "Déjà sur le plan Creator",
        }, { status: 400 })
      }

      // Annuler la subscription Stripe actuelle
      await stripe.subscriptions.cancel(profile.stripe_subscription_id)

      // Downgrade vers Creator avec 0 crédits (devra réactiver)
      await supabase
        .from("profiles")
        .update({
          plan: "creator",
          credits: 0,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: 0,
        action: "plan_downgrade",
        reference_id: profile.stripe_subscription_id,
        metadata: { from_plan: profile.plan, to_plan: "creator" },
      })

      return NextResponse.json({
        success: true,
        message: "Downgrade vers Creator effectué",
      })
    }

    return NextResponse.json({ error: "Type d'offre invalide" }, { status: 400 })
  } catch (error) {
    console.error("[Retention offer error]:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'application de l'offre" },
      { status: 500 }
    )
  }
}
