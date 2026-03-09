import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** POST: marque l'onboarding comme terminé pour l'utilisateur connecté (côté serveur, fiable). */
export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq("id", user.id)

  if (error) {
    console.error("[onboarding/complete]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
