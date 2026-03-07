import { ApifyClient } from "apify-client"

// Actor: clockworks/tiktok-scraper (paid) — change to clockworks/free-tiktok-scraper for free tier
const PROFILE_ACTOR = "clockworks/tiktok-scraper"

function getClient(): ApifyClient {
  const token = process.env.APIFY_API_KEY
  if (!token) throw new Error("APIFY_API_KEY non configurée")
  return new ApifyClient({ token })
}

export interface TiktokProfile {
  platform_id: string
  handle: string
  name: string
  bio: string | null
  followers: number
  following: number
  likes_count: number
  posts_count: number
  avatar_url: string | null
}

export async function scrapeTiktokProfile(handle: string): Promise<TiktokProfile> {
  const client = getClient()
  const cleanHandle = handle.replace(/^@/, "")

  const run = await client.actor(PROFILE_ACTOR).call({
    profiles: [`@${cleanHandle}`],
    resultsType: "users",
    maxProfilesPerQuery: 1,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  if (!items || items.length === 0) {
    throw new Error(`Profil TikTok introuvable : @${cleanHandle}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = items[0] as any

  // Handle both flat and nested structures depending on actor version
  const user = raw.user ?? raw.authorMeta ?? raw

  return {
    platform_id: String(user.id ?? user.userId ?? cleanHandle),
    handle: cleanHandle,
    name: user.nickname ?? user.name ?? user.uniqueId ?? cleanHandle,
    bio: user.signature ?? user.bio ?? null,
    followers: Number(user.followerCount ?? user.fans ?? 0),
    following: Number(user.followingCount ?? user.following ?? 0),
    likes_count: Number(user.heartCount ?? user.heart ?? user.likes ?? 0),
    posts_count: Number(user.videoCount ?? user.videos ?? 0),
    avatar_url: user.avatarMedium ?? user.avatarLarger ?? user.avatar ?? null,
  }
}
