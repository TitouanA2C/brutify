import type { Tables } from "@/lib/supabase/types"

type DbCreator = Tables<"creators">
type DbVideo = Tables<"videos">

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E4405F",
  tiktok: "#00F2EA",
  youtube: "#FF0000",
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "0%"
  return `${n > 0 ? "+" : ""}${n}%`
}

export function formatRate(n: number | null | undefined): string {
  if (n == null) return "0%"
  return `${n}%`
}

/**
 * Brut Score — composite growth signal out of 10.
 *
 * Weights:
 *   40% Outlier performance  (density × peak ratio)
 *   35% Engagement quality
 *   15% Audience scale       (logarithmic — small accounts not penalised)
 *   10% Growth velocity
 */
export function computeBruitScore(params: {
  outlierCount: number
  postsCount: number
  topOutlierRatioNum: number
  engagementRate: number | null
  followersNum: number
  growthRate: number | null
}): number {
  const { outlierCount, postsCount, topOutlierRatioNum, engagementRate, followersNum, growthRate } = params

  // Outlier performance (0–10): ratio × quality peak
  const outlierRatio = postsCount > 0 ? outlierCount / postsCount : 0
  const peakBonus = Math.log10(Math.max(1, topOutlierRatioNum)) * 2.5
  const outlierScore = Math.min(10, outlierRatio * 20 + peakBonus)

  // Engagement quality (0–10)
  const engScore = Math.min(10, (engagementRate ?? 0) * 1.5)

  // Audience scale — log10 so a 1 K account isn't crushed (0–10)
  const follScore = (Math.log10(Math.max(10, followersNum)) / Math.log10(10_000_000)) * 10

  // Growth velocity (0–10): −100 % → 0, 0 % → 5, +100 % → 10
  const growthScore = Math.min(10, Math.max(0, ((growthRate ?? 0) + 100) / 20))

  const raw = outlierScore * 0.40 + engScore * 0.35 + follScore * 0.15 + growthScore * 0.10
  return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10
}

export interface CreatorDTO {
  id: string
  name: string
  handle: string
  avatarUrl: string
  platform: "instagram" | "tiktok" | "youtube"
  followers: string
  followersNum: number
  avgViews: string
  engagement: string
  growth: string
  niche: string
  bio: string
  postsCount: number
  outlierCount: number
  topOutlierRatio: string
  isInWatchlist: boolean
  color: string
  // Follower growth delta
  followersDelta: number        // absolute (+/- N followers)
  followersDeltaPct: number     // percentage (e.g. 2.5 = +2.5%)
  followersDeltaDays: number    // period the delta covers
  followersHistory: { followers: number; scraped_at: string }[]
  // Composite growth signal
  bruitScore: number            // 0–10 (outliers × engagement × scale × velocity)
}

export function toCreatorDTO(
  row: DbCreator,
  opts: {
    isInWatchlist?: boolean
    outlierCount?: number
    topOutlierRatio?: number
    followersDelta?: number
    followersDeltaPct?: number
    followersDeltaDays?: number
    followersHistory?: { followers: number; scraped_at: string }[]
  } = {}
): CreatorDTO {
  return {
    id: row.id,
    name: row.name ?? row.handle,
    handle: row.handle.startsWith("@") ? row.handle : `@${row.handle}`,
    avatarUrl:
      row.avatar_url ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name ?? row.handle)}&background=FFAB00&color=000&bold=true&size=128`,
    platform: row.platform as "instagram" | "tiktok" | "youtube",
    followers: formatNumber(row.followers),
    followersNum: row.followers ?? 0,
    avgViews: formatNumber(row.avg_views),
    engagement: formatRate(row.engagement_rate),
    growth: formatPercent(row.growth_rate),
    niche: row.niche ?? "Autre",
    bio: row.bio ?? "",
    postsCount: row.posts_count ?? 0,
    outlierCount: opts.outlierCount ?? 0,
    topOutlierRatio: opts.topOutlierRatio ? `${opts.topOutlierRatio}x` : "0x",
    isInWatchlist: opts.isInWatchlist ?? false,
    color: PLATFORM_COLORS[row.platform] ?? "#FFAB00",
    followersDelta: opts.followersDelta ?? 0,
    followersDeltaPct: opts.followersDeltaPct ?? 0,
    followersDeltaDays: opts.followersDeltaDays ?? 0,
    followersHistory: opts.followersHistory ?? [],
    bruitScore: computeBruitScore({
      outlierCount: opts.outlierCount ?? 0,
      postsCount: row.posts_count ?? 0,
      topOutlierRatioNum: opts.topOutlierRatio ?? 0,
      engagementRate: row.engagement_rate,
      followersNum: row.followers ?? 0,
      growthRate: row.growth_rate,
    }),
  }
}

export interface VideoDTO {
  id: string
  creatorId: string
  title: string
  platform: "instagram" | "tiktok" | "youtube"
  views: string
  viewsNum: number
  likes: string
  comments: string
  shares: string
  outlierScore: number
  date: string
  duration: string
  thumbnailColor: string
  thumbnailUrl: string | null
  url: string | null
  mediaUrl: string | null
}

export function toVideoDTO(row: DbVideo): VideoDTO {
  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title ?? "Sans titre",
    platform: row.platform as "instagram" | "tiktok" | "youtube",
    views: formatNumber(row.views),
    viewsNum: row.views ?? 0,
    likes: formatNumber(row.likes),
    comments: formatNumber(row.comments),
    shares: formatNumber(row.shares),
    outlierScore: Number(row.outlier_score) || 0,
    date: row.posted_at
      ? formatRelativeDate(row.posted_at)
      : "Date inconnue",
    duration: row.duration ? formatDuration(row.duration) : "0:00",
    thumbnailColor: PLATFORM_COLORS[row.platform] ?? "#FFAB00",
    thumbnailUrl: row.thumbnail_url ?? null,
    url: row.url ?? null,
    mediaUrl: (row as Record<string, unknown>).media_url as string | null ?? null,
  }
}

export interface VideoFeedItemDTO extends VideoDTO {
  creator: {
    id: string
    name: string
    handle: string
    avatarUrl: string
    platform: string
  } | null
}

export interface VideoDetailResponseDTO {
  video: VideoDTO
  creator: CreatorDTO | null
  transcription: {
    id: string
    content: string
    language: string
    created_at: string
  } | null
  analysis: {
    id: string
    hook_type: string | null
    hook_analysis: string | null
    structure_type: string | null
    structure_analysis: string | null
    style_analysis: string | null
    created_at: string
  } | null
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return "Aujourd'hui"
  if (days === 1) return "Hier"
  if (days < 30) return `Il y a ${days}j`
  if (days < 365) return `Il y a ${Math.floor(days / 30)} mois`
  return `Il y a ${Math.floor(days / 365)} an(s)`
}
