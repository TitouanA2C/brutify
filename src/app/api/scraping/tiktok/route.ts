import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { scrapeTiktokProfile } from "@/lib/scraping/tiktok"
import { toCreatorDTO } from "@/lib/api/helpers"
import { recordFollowersSnapshot } from "@/lib/followers"

const STALE_HOURS = 24

export async function POST(request: Request) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const supabase = createServiceClient()

  let body: { handle: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const handle = body.handle?.replace(/^@/, "").trim().toLowerCase()
  if (!handle) return NextResponse.json({ error: "Handle requis" }, { status: 400 })

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("niche")
    .eq("id", user.id)
    .single()
  const userNiche = userProfile?.niche?.trim() || null

  // Check cache
  const { data: existing } = await supabase
    .from("creators")
    .select("*")
    .eq("platform", "tiktok")
    .eq("handle", handle)
    .maybeSingle()

  if (existing?.last_scraped_at) {
    const hoursSince = (Date.now() - new Date(existing.last_scraped_at).getTime()) / 3_600_000
    if (hoursSince < STALE_HOURS) {
      const { data: watchlistRows } = await supabase
        .from("watchlists").select("creator_id").eq("user_id", user.id).eq("creator_id", existing.id)
      return NextResponse.json({
        creator: toCreatorDTO(existing, { isInWatchlist: (watchlistRows?.length ?? 0) > 0 }),
        cached: true,
        message: `Données à jour (scrapé il y a ${Math.round(hoursSince)}h)`,
      })
    }
  }

  // Scrape
  let profile
  try {
    profile = await scrapeTiktokProfile(handle)
  } catch (err) {
    if (existing) {
      const { data: watchlistRows } = await supabase
        .from("watchlists").select("creator_id").eq("user_id", user.id).eq("creator_id", existing.id)
      return NextResponse.json({
        creator: toCreatorDTO(existing, { isInWatchlist: (watchlistRows?.length ?? 0) > 0 }),
        cached: true,
        message: "Apify indisponible, données en cache retournées",
      })
    }
    const message = err instanceof Error ? err.message : "Erreur lors du scraping TikTok"
    console.error("[Scraping TikTok]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const creatorPayload = {
    platform: "tiktok" as const,
    platform_id: profile.platform_id,
    handle: profile.handle,
    name: profile.name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    followers: profile.followers,
    posts_count: profile.posts_count,
    ...(userNiche && { niche: userNiche }),
    updated_at: new Date().toISOString(),
  }

  let creatorId: string

  if (existing) {
    const { data: updated, error } = await supabase
      .from("creators").update(creatorPayload).eq("id", existing.id).select("*").single()
    if (error || !updated) return NextResponse.json({ error: error?.message ?? "Erreur update" }, { status: 500 })
    creatorId = updated.id
  } else {
    const { data: inserted, error } = await supabase
      .from("creators").insert(creatorPayload).select("*").single()
    if (error || !inserted) return NextResponse.json({ error: error?.message ?? "Erreur insert" }, { status: 500 })
    creatorId = inserted.id
  }

  recordFollowersSnapshot(supabase, creatorId, profile.followers).catch(() => {})

  const { data: creator } = await supabase.from("creators").select("*").eq("id", creatorId).single()
  const { data: watchlistRows } = await supabase
    .from("watchlists").select("creator_id").eq("user_id", user.id).eq("creator_id", creatorId)

  return NextResponse.json({
    creator: creator ? toCreatorDTO(creator, { isInWatchlist: (watchlistRows?.length ?? 0) > 0 }) : null,
    cached: false,
    message: `@${handle} (TikTok) ajouté`,
  })
}
