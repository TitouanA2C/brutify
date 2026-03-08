import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toCreatorDTO } from "@/lib/api/helpers"
import { checkAndUnlockBonus } from "@/lib/activation-triggers"

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Fetch user's own linked handles to exclude them from the radar
  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle, tiktok_handle, youtube_handle")
    .eq("id", user.id)
    .single()

  const ownHandles = new Set(
    [
      profile?.instagram_handle ? `instagram:${profile.instagram_handle.toLowerCase()}` : null,
      profile?.tiktok_handle    ? `tiktok:${profile.tiktok_handle.toLowerCase()}`       : null,
      profile?.youtube_handle   ? `youtube:${profile.youtube_handle.toLowerCase()}`     : null,
    ].filter(Boolean) as string[]
  )

  const { data: watchlistRows, error } = await supabase
    .from("watchlists")
    .select("creator_id, added_at, creators(*)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const creatorRows = (watchlistRows ?? [])
    .filter((row) => row.creators)
    .filter((row) => {
      const c = row.creators as { handle: string; platform: string }
      const key = `${c.platform}:${c.handle.replace(/^@/, "").toLowerCase()}`
      return !ownHandles.has(key)
    })
  const creatorIds = creatorRows.map((row) => (row.creators as { id: string }).id)

  // Récupère outlier_score de toutes les vidéos des créateurs en une requête
  const { data: videoRows } = creatorIds.length > 0
    ? await supabase
        .from("videos")
        .select("creator_id, outlier_score")
        .in("creator_id", creatorIds)
    : { data: [] }

  // Construit un index par creator_id
  const statsMap: Record<string, { count: number; topRatio: number }> = {}
  for (const v of videoRows ?? []) {
    const cid = v.creator_id
    if (!statsMap[cid]) statsMap[cid] = { count: 0, topRatio: 0 }
    const score = Number(v.outlier_score) || 0
    if (score >= 3) statsMap[cid].count++
    if (score > statsMap[cid].topRatio) statsMap[cid].topRatio = score
  }

  const creators = creatorRows.map((row) => {
    const c = row.creators as NonNullable<typeof row.creators>
    const stats = statsMap[c.id] ?? { count: 0, topRatio: 0 }
    return toCreatorDTO(c, {
      isInWatchlist: true,
      outlierCount: stats.count,
      topOutlierRatio: stats.topRatio,
    })
  })

  return NextResponse.json({ creators })
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Body invalide" }, { status: 400 }) }
  const creatorId = body?.creator_id

  if (!creatorId || typeof creatorId !== "string") {
    return NextResponse.json(
      { error: "creator_id requis" },
      { status: 400 }
    )
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("id", creatorId)
    .single()

  if (!creator) {
    return NextResponse.json(
      { error: "Créateur non trouvé" },
      { status: 404 }
    )
  }

  const { error } = await supabase.from("watchlists").upsert(
    { user_id: user.id, creator_id: creatorId },
    { onConflict: "user_id,creator_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Vérifier et débloquer bonus d'activation
  checkAndUnlockBonus(user.id, "follow_creator").catch(() => {})

  return NextResponse.json({ success: true })
}
