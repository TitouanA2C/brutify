import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

/**
 * Attribue une niche aux créateurs qui n'en ont pas (niche IS NULL).
 * Pour chaque créateur sans niche : si au moins un utilisateur qui le suit (watchlist)
 * a une niche dans son profil, on met à jour le créateur avec cette niche.
 * Protégé par CRON_SECRET.
 * Appel : GET /api/cron/backfill-creators-niche
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Créateurs sans niche
  const { data: creatorsWithoutNiche, error: err1 } = await supabase
    .from("creators")
    .select("id, handle, platform")
    .is("niche", null)

  if (err1) {
    return NextResponse.json({ error: err1.message }, { status: 500 })
  }

  if (!creatorsWithoutNiche?.length) {
    return NextResponse.json({
      message: "Aucun créateur avec niche = null",
      updated: 0,
    })
  }

  let updated = 0
  const errors: string[] = []

  for (const creator of creatorsWithoutNiche) {
    // Utilisateurs qui ont ce créateur en watchlist ET qui ont une niche
    const { data: watchlistRows } = await supabase
      .from("watchlists")
      .select("user_id")
      .eq("creator_id", creator.id)

    if (!watchlistRows?.length) continue

    const userIds = [...new Set(watchlistRows.map((r) => r.user_id))]

    const { data: profiles } = await supabase
      .from("profiles")
      .select("niche")
      .in("id", userIds)
      .not("niche", "is", null)

    const nicheToSet = profiles?.find((p) => p.niche?.trim())?.niche?.trim()
    if (!nicheToSet) continue

    const { error: upErr } = await supabase
      .from("creators")
      .update({ niche: nicheToSet, updated_at: new Date().toISOString() })
      .eq("id", creator.id)

    if (upErr) {
      errors.push(`${creator.handle}: ${upErr.message}`)
    } else {
      updated++
    }
  }

  return NextResponse.json({
    message: "Backfill terminé",
    creators_without_niche: creatorsWithoutNiche.length,
    updated,
    errors: errors.length ? errors : undefined,
  })
}
