import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { discoverCreators } from "@/lib/scraping/discover"
import type { DiscoveredCreator } from "@/lib/scraping/discover"

/**
 * Seed la table creators avec des créateurs découverts par niche.
 * Chaque créateur est upserté avec niche = label de la niche (ex. "Business").
 * Protégé par CRON_SECRET. Appel : GET /api/cron/seed-creators?niche=business
 * ou sans param pour traiter toutes les niches built-in.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const supabase = createServiceClient()
  const nicheSlug = request.nextUrl.searchParams.get("niche")?.toLowerCase().trim()

  const { data: niches, error: nichesErr } = await supabase
    .from("niches")
    .select("slug, label, hashtags_broad, hashtags_niche, hashtags_fr")
    .eq("is_builtin", true)
    .order("slug")

  if (nichesErr || !niches?.length) {
    return NextResponse.json(
      { error: nichesErr?.message ?? "Aucune niche built-in" },
      { status: 500 }
    )
  }

  const toProcess = nicheSlug
    ? niches.filter((n) => n.slug === nicheSlug)
    : niches

  if (toProcess.length === 0) {
    return NextResponse.json(
      { error: `Niche "${nicheSlug}" introuvable` },
      { status: 404 }
    )
  }

  const results: { niche: string; label: string; discovered: number; upserted: number; errors: string[] }[] = []

  for (const nicheRow of toProcess) {
    const errors: string[] = []
    let upserted = 0
    let creators: DiscoveredCreator[] = []

    try {
      creators = await discoverCreators({
        nicheConfig: nicheRow,
        platform: "instagram",
        lang: "fr",
        minFollowers: 5000,
        minLikes: 30,
        maxResults: 12,
      })
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Discover failed")
      results.push({
        niche: nicheRow.slug,
        label: nicheRow.label,
        discovered: 0,
        upserted: 0,
        errors,
      })
      continue
    }

    const nicheLabel = nicheRow.label

    for (const c of creators) {
      const handle = c.username?.toLowerCase().trim()
      if (!handle) continue

      const payload = {
        platform: "instagram" as const,
        platform_id: handle,
        handle,
        name: c.fullName ?? null,
        avatar_url: c.profilePicUrl ?? null,
        bio: c.bio ?? null,
        followers: c.followersCount ?? null,
        posts_count: c.postsCount ?? null,
        engagement_rate: c.engagementRate ?? null,
        niche: nicheLabel,
        updated_at: new Date().toISOString(),
      }

      const { data: existing } = await supabase
        .from("creators")
        .select("id")
        .eq("platform", "instagram")
        .eq("handle", handle)
        .maybeSingle()

      if (existing) {
        const { error: upErr } = await supabase
          .from("creators")
          .update({
            name: payload.name,
            avatar_url: payload.avatar_url,
            bio: payload.bio,
            followers: payload.followers,
            posts_count: payload.posts_count,
            engagement_rate: payload.engagement_rate,
            niche: payload.niche,
            updated_at: payload.updated_at,
          })
          .eq("id", existing.id)
        if (upErr) errors.push(`${handle}: ${upErr.message}`)
        else upserted++
      } else {
        const { error: inErr } = await supabase.from("creators").insert(payload)
        if (inErr) errors.push(`${handle}: ${inErr.message}`)
        else upserted++
      }
    }

    results.push({
      niche: nicheRow.slug,
      label: nicheLabel,
      discovered: creators.length,
      upserted,
      errors,
    })
  }

  return NextResponse.json({
    message: "Seed terminé",
    results,
  })
}
