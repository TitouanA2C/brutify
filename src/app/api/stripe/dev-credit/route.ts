import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

/**
 * ⚠️ DEV/TEST — Endpoint pour créditer manuellement des BP après un achat
 * En production avec webhooks configurés, cet endpoint sera inutilisé
 * Permet de tester les achats en local sans Stripe CLI
 */
export async function POST(request: Request) {
  // Sécurité : désactiver en production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Endpoint désactivé en production" }, { status: 403 })
  }

  const supabase = createClient()
  const adminSupabase = createServiceClient()

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

  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single()

  const newCredits = (profile?.credits ?? 0) + body.amount

  await adminSupabase
    .from("profiles")
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  await adminSupabase.from("credit_transactions").insert({
    user_id: user.id,
    amount: body.amount,
    action: "credit_purchase",
    reference_id: "dev_manual_credit",
  })

  console.log(
    `[DEV] Crédité ${body.amount} BP à ${user.id} (total: ${newCredits})`
  )

  return NextResponse.json({
    success: true,
    amount: body.amount,
    newTotal: newCredits,
  })
}
