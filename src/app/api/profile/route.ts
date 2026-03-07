import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PROFILE_FIELDS = "id, email, full_name, avatar_url, plan, credits, niche, tone_of_voice, writing_style, instagram_handle, tiktok_handle, youtube_handle, created_at"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_FIELDS)
    .eq("id", user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Activity stats isolées à la watchlist de l'utilisateur
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  const watchedCreatorIds = (watchlist ?? []).map((w) => w.creator_id)

  const [{ count: creatorsCount }, videosCountRes, { count: scriptsCount }] = await Promise.all([
    supabase.from("watchlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    watchedCreatorIds.length > 0
      ? supabase.from("videos").select("id", { count: "exact", head: true }).in("creator_id", watchedCreatorIds)
      : { count: 0 },
    supabase.from("scripts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ])

  const videosCount = videosCountRes.count ?? 0

  // Fetch linked social creator stats — same data as CreatorDetailModal
  const handlesByPlatform: { platform: string; handle: string }[] = []
  if (profile?.instagram_handle) handlesByPlatform.push({ platform: "instagram", handle: profile.instagram_handle })
  if (profile?.tiktok_handle)    handlesByPlatform.push({ platform: "tiktok",    handle: profile.tiktok_handle })
  if (profile?.youtube_handle)   handlesByPlatform.push({ platform: "youtube",   handle: profile.youtube_handle })

  const networks: NetworkStats[] = []

  for (const { platform, handle } of handlesByPlatform) {
    const { data: creator } = await supabase
      .from("creators")
      .select("id, name, handle, avatar_url, followers, posts_count, avg_views, engagement_rate, growth_rate, bio")
      .eq("platform", platform)
      .eq("handle", handle.toLowerCase())
      .maybeSingle()

    if (!creator) continue

    // Use pre-computed stats from creators table (same as CreatorDetailModal)
    const avgViews = creator.avg_views ?? 0
    const postsCount = creator.posts_count ?? 0

    // Total views = avg_views × posts_count (same estimate as creator cards)
    const estimatedTotalViews = Math.round(avgViews * postsCount)

    // Get video-level aggregates only if videos have been scraped
    const { data: videoAgg } = await supabase
      .from("videos")
      .select("views, likes, comments")
      .eq("creator_id", creator.id)
      .limit(200)

    const hasVideos = (videoAgg?.length ?? 0) > 0
    const totalViews    = hasVideos ? videoAgg!.reduce((s, v) => s + (v.views    ?? 0), 0) : estimatedTotalViews
    const totalLikes    = hasVideos ? videoAgg!.reduce((s, v) => s + (v.likes    ?? 0), 0) : 0
    const totalComments = hasVideos ? videoAgg!.reduce((s, v) => s + (v.comments ?? 0), 0) : 0
    const videoCount    = videoAgg?.length ?? 0

    networks.push({
      platform,
      creator_id:      creator.id,
      handle:          creator.handle,
      name:            creator.name,
      avatar_url:      creator.avatar_url,
      bio:             creator.bio,
      followers:       creator.followers      ?? 0,
      posts_count:     postsCount,
      avg_views:       avgViews,
      engagement_rate: creator.engagement_rate ?? 0,
      growth_rate:     creator.growth_rate     ?? 0,
      total_views:     totalViews,
      total_likes:     totalLikes,
      total_comments:  totalComments,
      scraped_videos:  videoCount,
    })
  }

  return NextResponse.json({
    profile,
    stats: {
      creators: creatorsCount ?? 0,
      videos: videosCount ?? 0,
      scripts: scriptsCount ?? 0,
    },
    networks,
  })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const allowed = ["full_name", "niche", "tone_of_voice", "writing_style", "instagram_handle", "tiktok_handle", "youtube_handle"] as const
  const updates: Record<string, string> = {}

  for (const key of allowed) {
    if (typeof body[key] === "string") {
      const val = body[key].trim()
      // Empty handle = unlink (store NULL)
      updates[key] = key.endsWith("_handle")
        ? (val.replace(/^@/, "") || null)
        : val
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Aucune donnée à mettre à jour" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select(PROFILE_FIELDS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: data })
}

// ── Types (shared with client via inference) ────────────────────────────────

export interface NetworkStats {
  platform:        string
  creator_id:      string
  handle:          string
  name:            string | null
  avatar_url:      string | null
  bio:             string | null
  followers:       number
  posts_count:     number
  avg_views:       number
  engagement_rate: number
  growth_rate:     number
  total_views:     number
  total_likes:     number
  total_comments:  number
  scraped_videos:  number
}
