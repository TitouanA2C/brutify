import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface DashboardStats {
  totalCreators: number
  totalOutliers: number
  totalScripts: number
  totalVideos: number
  topRatio: string
  topHandle: string | null
}

export interface TopOutlier {
  id: string
  title: string
  thumbnail_url: string | null
  outlier_score: number
  views: number
  likes: number
  platform: string
  posted_at: string
  creator: {
    id: string
    name: string | null
    handle: string
    avatar_url: string | null
  }
}

export interface TrendingCreator {
  id: string
  name: string | null
  handle: string
  avatar_url: string | null
  platform: string
  followers: number
  growth_rate: number
  engagement_rate: number
  recent_outliers: number
}

export interface RecentActivity {
  id: string
  type: "creator_added" | "outlier_found" | "script_created" | "board_added"
  title: string
  subtitle?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface UpcomingBoardItem {
  id: string
  title: string
  status: string
  date: string
}

export interface NetworkStat {
  platform: string
  handle: string
  followers: number
  avg_views: number
  engagement_rate: number
  growth_rate: number
  total_views: number
  scraped_videos: number
}

export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Récupère les creator_ids de la watchlist
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  const watchedCreatorIds = (watchlist ?? []).map((w) => w.creator_id)

  // ── Stats principales ──
  const [watchlistRes, outlierRes, scriptsRes, videosRes, topOutlierRes, boardRes] =
    await Promise.all([
      supabase
        .from("watchlists")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      watchedCreatorIds.length > 0
        ? supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
            .gte("outlier_score", 5)
            .in("creator_id", watchedCreatorIds)
        : { count: 0 },
      supabase
        .from("scripts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      watchedCreatorIds.length > 0
        ? supabase
            .from("videos")
            .select("id", { count: "exact", head: true })
            .in("creator_id", watchedCreatorIds)
        : { count: 0 },
      watchedCreatorIds.length > 0
        ? supabase
            .from("videos")
            .select("outlier_score, title, views, likes, platform, posted_at, creators!inner(id, name, handle, avatar_url)")
            .in("creator_id", watchedCreatorIds)
            .order("outlier_score", { ascending: false })
            .limit(1)
            .maybeSingle()
        : { data: null },
      supabase
        .from("board_items")
        .select("id, title, status, scheduled_date")
        .eq("user_id", user.id)
        .neq("status", "published")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(4),
    ])

  const stats: DashboardStats = {
    totalCreators: watchlistRes.count ?? 0,
    totalOutliers: outlierRes.count ?? 0,
    totalScripts: scriptsRes.count ?? 0,
    totalVideos: videosRes.count ?? 0,
    topRatio: topOutlierRes.data?.outlier_score
      ? `${Number(topOutlierRes.data.outlier_score).toFixed(1)}x`
      : "—",
    topHandle: (topOutlierRes.data?.creators as unknown as { handle: string })?.handle ?? null,
  }

  // ── Top Outliers (6 derniers) ──
  const { data: topOutliersData } = watchedCreatorIds.length > 0
    ? await supabase
        .from("videos")
        .select("id, title, thumbnail_url, outlier_score, views, likes, platform, posted_at, creators!inner(id, name, handle, avatar_url)")
        .in("creator_id", watchedCreatorIds)
        .gte("outlier_score", 3)
        .order("posted_at", { ascending: false })
        .limit(6)
    : { data: [] }

  const topOutliers: TopOutlier[] = (topOutliersData ?? []).map((v) => {
    const creator = v.creators as unknown as { id: string; name: string | null; handle: string; avatar_url: string | null }
    return {
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      outlier_score: v.outlier_score ?? 0,
      views: v.views ?? 0,
      likes: v.likes ?? 0,
      platform: v.platform,
      posted_at: v.posted_at,
      creator: {
        id: creator.id,
        name: creator.name,
        handle: creator.handle,
        avatar_url: creator.avatar_url,
      },
    }
  })

  // ── Créateurs qui explosent (top growth) ──
  const { data: trendingCreatorsData } = watchedCreatorIds.length > 0
    ? await supabase
        .from("creators")
        .select("id, name, handle, avatar_url, platform, followers, growth_rate, engagement_rate")
        .in("id", watchedCreatorIds)
        .order("growth_rate", { ascending: false })
        .limit(5)
    : { data: [] }

  const trendingCreators: TrendingCreator[] = []
  for (const c of trendingCreatorsData ?? []) {
    const { count: outliersCount } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", c.id)
      .gte("outlier_score", 5)
      .gte("posted_at", new Date(Date.now() - 30 * 86_400_000).toISOString())

    trendingCreators.push({
      id: c.id,
      name: c.name,
      handle: c.handle,
      avatar_url: c.avatar_url,
      platform: c.platform,
      followers: c.followers ?? 0,
      growth_rate: c.growth_rate ?? 0,
      engagement_rate: c.engagement_rate ?? 0,
      recent_outliers: outliersCount ?? 0,
    })
  }

  // ── Vos propres réseaux ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("instagram_handle, tiktok_handle, youtube_handle")
    .eq("id", user.id)
    .single()

  const networks: NetworkStat[] = []
  const handlesByPlatform: { platform: string; handle: string }[] = []
  if (profile?.instagram_handle) handlesByPlatform.push({ platform: "instagram", handle: profile.instagram_handle })
  if (profile?.tiktok_handle) handlesByPlatform.push({ platform: "tiktok", handle: profile.tiktok_handle })
  if (profile?.youtube_handle) handlesByPlatform.push({ platform: "youtube", handle: profile.youtube_handle })

  for (const { platform, handle } of handlesByPlatform) {
    const { data: creator } = await supabase
      .from("creators")
      .select("id, followers, posts_count, avg_views, engagement_rate, growth_rate")
      .eq("platform", platform)
      .eq("handle", handle.toLowerCase())
      .maybeSingle()

    if (!creator) continue

    const { count: videosCount } = await supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", creator.id)

    const avgViews = creator.avg_views ?? 0
    const postsCount = creator.posts_count ?? 0
    const estimatedTotalViews = Math.round(avgViews * postsCount)

    networks.push({
      platform,
      handle,
      followers: creator.followers ?? 0,
      avg_views: avgViews,
      engagement_rate: creator.engagement_rate ?? 0,
      growth_rate: creator.growth_rate ?? 0,
      total_views: estimatedTotalViews,
      scraped_videos: videosCount ?? 0,
    })
  }

  // ── BrutBoard preview ──
  const upcomingBoard: UpcomingBoardItem[] = (boardRes.data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    date: item.scheduled_date
      ? new Date(item.scheduled_date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })
      : "Non planifié",
  }))

  // ── Activité récente ──
  const recentActivity: RecentActivity[] = []

  // Derniers créateurs ajoutés
  const { data: recentWatchlist } = await supabase
    .from("watchlists")
    .select("id, created_at, creators!inner(name, handle, platform)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  for (const w of recentWatchlist ?? []) {
    const creator = w.creators as unknown as { name: string | null; handle: string; platform: string }
    recentActivity.push({
      id: w.id,
      type: "creator_added",
      title: `Créateur ajouté`,
      subtitle: `@${creator.handle} · ${creator.platform}`,
      timestamp: w.created_at,
    })
  }

  // Derniers scripts créés
  const { data: recentScripts } = await supabase
    .from("scripts")
    .select("id, title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(2)

  for (const s of recentScripts ?? []) {
    recentActivity.push({
      id: s.id,
      type: "script_created",
      title: "Script créé",
      subtitle: s.title,
      timestamp: s.created_at,
    })
  }

  // Trier par date
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return NextResponse.json({
    stats,
    topOutliers,
    trendingCreators,
    networks,
    upcomingBoard,
    recentActivity: recentActivity.slice(0, 8),
  })
}
