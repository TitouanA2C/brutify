import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import {
  scrapeInstagramProfile,
} from "@/lib/scraping/instagram"
import { toCreatorDTO } from "@/lib/api/helpers"
import { recordFollowersSnapshot } from "@/lib/followers"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { logApiUsage } from "@/lib/api-usage"

const STALE_HOURS = 24

export async function POST(request: Request) {
  const authClient = createClient()

  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const supabase = createServiceClient()

  let body: { handle: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  const handle = body.handle?.replace(/^@/, "").trim().toLowerCase()
  if (!handle) {
    return NextResponse.json({ error: "Handle requis" }, { status: 400 })
  }

  const { data: userProfile } = await supabase
    .from("profiles")
    .select("niche")
    .eq("id", user.id)
    .single()
  const userNiche = userProfile?.niche?.trim() || null

  // Check if creator already exists and is fresh (cache → pas de coût BP)
  const { data: existing } = await supabase
    .from("creators")
    .select("*")
    .eq("platform", "instagram")
    .eq("handle", handle)
    .maybeSingle()

  if (existing?.last_scraped_at) {
    const lastScraped = new Date(existing.last_scraped_at).getTime()
    const hoursSince = (Date.now() - lastScraped) / 3_600_000

    if (hoursSince < STALE_HOURS) {
      const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .eq("creator_id", existing.id)
        .order("outlier_score", { ascending: false })
        .limit(30)

      const { data: watchlistRows } = await supabase
        .from("watchlists")
        .select("creator_id")
        .eq("user_id", user.id)
        .eq("creator_id", existing.id)

      return NextResponse.json({
        creator: toCreatorDTO(existing, {
          isInWatchlist: (watchlistRows?.length ?? 0) > 0,
        }),
        videos: videos ?? [],
        cached: true,
        message: `Données à jour (scrapé il y a ${Math.round(hoursSince)}h)`,
      })
    }
  }

  // Vérifier les crédits avant d'appeler Apify
  const cost = COSTS.scraping
  const { ok, current } = await checkCredits(user.id, cost)
  if (!ok) {
    return NextResponse.json(
      { error: "Crédits insuffisants", credits_required: cost, credits_current: current },
      { status: 402 }
    )
  }

  // ── Scrape profile ─────────────────────────────────────────────────────────

  let profile
  try {
    profile = await scrapeInstagramProfile(handle)
  } catch (err) {
    if (existing) {
      const { data: cachedVideos } = await supabase
        .from("videos")
        .select("*")
        .eq("creator_id", existing.id)
        .order("outlier_score", { ascending: false })
        .limit(30)

      return NextResponse.json({
        creator: toCreatorDTO(existing),
        videos: cachedVideos ?? [],
        cached: true,
        message: "Apify indisponible, données en cache retournées",
      })
    }

    const message =
      err instanceof Error ? err.message : "Erreur lors du scraping du profil"
    console.error("[Scraping Instagram]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  // ── Consommer les BP + logger usage Apify ─────────────────────────────────

  const consumed = await consumeCredits(user.id, cost, "scraping", null)
  if (!consumed) {
    return NextResponse.json({ error: "Échec de la consommation de crédits" }, { status: 500 })
  }

  logApiUsage({
    userId: user.id,
    service: "apify",
    action: "instagram_profile",
    units: 1,
  }).catch(() => {})

  // ── Upsert creator ────────────────────────────────────────────────────────

  const creatorPayload = {
    platform: "instagram" as const,
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
    const { data: updated, error: updateErr } = await supabase
      .from("creators")
      .update(creatorPayload)
      .eq("id", existing.id)
      .select("*")
      .single()

    if (updateErr || !updated) {
      return NextResponse.json(
        { error: updateErr?.message ?? "Erreur lors de la mise à jour" },
        { status: 500 }
      )
    }
    creatorId = updated.id
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("creators")
      .insert(creatorPayload)
      .select("*")
      .single()

    if (insertErr || !inserted) {
      return NextResponse.json(
        { error: insertErr?.message ?? "Erreur lors de l'insertion" },
        { status: 500 }
      )
    }
    creatorId = inserted.id
  }

  // ── Record follower snapshot ───────────────────────────────────────────────
  recordFollowersSnapshot(supabase, creatorId, profile.followers).catch(() => {})

  // ── Return fresh data ──────────────────────────────────────────────────────

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", creatorId)
    .single()

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", creatorId)
    .order("outlier_score", { ascending: false })
    .limit(30)

  const { data: watchlistRows } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)
    .eq("creator_id", creatorId)

  return NextResponse.json({
    creator: creator
      ? toCreatorDTO(creator, {
          isInWatchlist: (watchlistRows?.length ?? 0) > 0,
        })
      : null,
    videos: videos ?? [],
    cached: false,
    credits_consumed: cost,
    message: `@${handle} ajouté — scrape les vidéos depuis son profil pour les analyser`,
  })
}
