import { ApifyClient } from "apify-client"

// Actor: streamers/youtube-scraper
const CHANNEL_ACTOR = "streamers/youtube-scraper"

function getClient(): ApifyClient {
  const token = process.env.APIFY_API_KEY
  if (!token) throw new Error("APIFY_API_KEY non configurée")
  return new ApifyClient({ token })
}

export interface YoutubeProfile {
  platform_id: string
  handle: string
  name: string
  bio: string | null
  followers: number   // subscribers
  posts_count: number // video count
  avatar_url: string | null
  banner_url: string | null
}

export async function scrapeYoutubeProfile(handle: string): Promise<YoutubeProfile> {
  const client = getClient()
  const cleanHandle = handle.replace(/^@/, "")
  const channelUrl = `https://www.youtube.com/@${cleanHandle}`

  const run = await client.actor(CHANNEL_ACTOR).call({
    startUrls: [{ url: channelUrl, label: "CHANNEL" }],
    maxResults: 0,        // channel info only, no videos
    maxResultsShorts: 0,
    maxResultsStreams: 0,
  })

  const { items } = await client.dataset(run.defaultDatasetId).listItems()

  if (!items || items.length === 0) {
    throw new Error(`Chaîne YouTube introuvable : @${cleanHandle}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = items[0] as any

  // Channel info can be nested under `channelInfo` or flat
  const ch = raw.channelInfo ?? raw.channel ?? raw

  const subscribers = Number(
    ch.subscriberCount ?? ch.numberOfSubscribers ?? ch.subscribers ?? 0
  )
  const videos = Number(
    ch.videoCount ?? ch.numberOfVideos ?? ch.videos ?? 0
  )

  return {
    platform_id: String(ch.channelId ?? ch.id ?? cleanHandle),
    handle: cleanHandle,
    name: ch.channelName ?? ch.title ?? ch.name ?? cleanHandle,
    bio: ch.channelDescription ?? ch.description ?? ch.about ?? null,
    followers: subscribers,
    posts_count: videos,
    avatar_url: ch.channelThumbnail ?? ch.avatarUrl ?? ch.thumbnail ?? null,
    banner_url: ch.channelBanner ?? ch.bannerUrl ?? null,
  }
}
