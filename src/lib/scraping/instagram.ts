import { ApifyClient } from "apify-client"

const PROFILE_ACTOR = "apify/instagram-profile-scraper"
const POST_ACTOR    = "apify/instagram-scraper"
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 30_000

function getClient(): ApifyClient {
  const token = process.env.APIFY_API_KEY
  if (!token) throw new Error("APIFY_API_KEY non configurée")
  return new ApifyClient({ token })
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.includes("rate") || err.message.includes("429"))

      if (isRateLimit && attempt < retries) {
        console.warn(
          `[Apify] Rate limited, retry ${attempt + 1}/${retries} dans ${RETRY_DELAY_MS / 1000}s`
        )
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw new Error("Unreachable")
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScrapedProfile {
  handle: string
  name: string | null
  bio: string | null
  followers: number
  following: number
  posts_count: number
  avatar_url: string | null
  platform_id: string
}

export interface ScrapedVideo {
  platform_video_id: string
  caption: string | null
  url: string
  media_url: string | null
  thumbnail_url: string | null
  views: number
  likes: number
  comments: number
  shares: number
  duration: number | null
  posted_at: string | null
}

export interface ScoredVideo extends ScrapedVideo {
  outlier_score: number
}

// ─── Scrape Profile ──────────────────────────────────────────────────────────

export async function scrapeInstagramProfile(
  handle: string
): Promise<ScrapedProfile> {
  const cleanHandle = handle.replace(/^@/, "").trim().toLowerCase()
  if (!cleanHandle) throw new Error("Handle invalide")

  const client = getClient()

  const result = await runWithRetry(async () => {
    const run = await client.actor(PROFILE_ACTOR).call({
      usernames: [cleanHandle],
    })
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    return items
  })

  if (!result || result.length === 0) {
    throw new Error(`Profil Instagram @${cleanHandle} introuvable`)
  }

  const p = result[0] as Record<string, unknown>

  return {
    handle: cleanHandle,
    name: (p.fullName as string) || null,
    bio: (p.biography as string) || null,
    followers: Number(p.followersCount) || 0,
    following: Number(p.followsCount) || 0,
    posts_count: Number(p.postsCount) || 0,
    avatar_url: (p.profilePicUrl as string) || (p.profilePicUrlHD as string) || null,
    platform_id: String(p.id || p.pk || cleanHandle),
  }
}

// ─── Start async scrape (fire & poll) ────────────────────────────────────────

export async function startInstagramPostsScrape(
  handle: string,
  limit: number = 50
): Promise<string> {
  const cleanHandle = handle.replace(/^@/, "").trim().toLowerCase()
  if (!cleanHandle) throw new Error("Handle invalide")
  const client = getClient()
  const run = await client.actor(POST_ACTOR).start({
    directUrls: [`https://www.instagram.com/${cleanHandle}/`],
    resultsType: "posts",
    resultsLimit: limit,
  })
  return run.id
}

export async function getInstagramScrapeStatus(runId: string): Promise<{
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED-OUT" | "ABORTED"
  requestsFinished: number
  requestsTotal: number
  datasetId: string | null
}> {
  const client = getClient()
  const run = await client.run(runId).get()
  if (!run) throw new Error("Run introuvable")
  return {
    status: run.status as "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED-OUT" | "ABORTED",
    requestsFinished: (run.stats as { requestsFinished?: number })?.requestsFinished ?? 0,
    requestsTotal: (run.stats as { requestsTotal?: number })?.requestsTotal ?? 0,
    datasetId: run.defaultDatasetId ?? null,
  }
}

export async function fetchScrapeResults(datasetId: string): Promise<ScrapedVideo[]> {
  const client = getClient()
  const { items } = await client.dataset(datasetId).listItems({ limit: 500 })
  return parseScrapedPosts(items)
}

// ─── Parse raw Apify items → ScrapedVideo[] ──────────────────────────────────

export function parseScrapedPosts(items: unknown[]): ScrapedVideo[] {
  const videos: ScrapedVideo[] = []
  for (const raw of items) {
    const post = raw as Record<string, unknown>
    const pid = String(post.id || post.pk || post.shortCode || post.shortcode || "")
    if (!pid) continue
    const shortCode = String(post.shortCode || post.shortcode || "")
    const videoViews = Number(post.videoViewCount || post.videoPlayCount || post.playCount || post.viewsCount || 0)
    const likes = Number(post.likesCount || post.likes || 0)
    const views = videoViews > 0 ? videoViews : likes * 30
    const videoUrl = (post.videoUrl as string) || (post.video_url as string) || null
    videos.push({
      platform_video_id: pid,
      caption: (post.caption as string) || (post.text as string) || null,
      url: (post.url as string) || (shortCode ? `https://www.instagram.com/p/${shortCode}/` : ""),
      media_url: videoUrl,
      thumbnail_url:
        (post.displayUrl as string) ||
        (post.thumbnailUrl as string) ||
        (post.previewUrl as string) ||
        (post.imageUrl as string) ||
        null,
      views,
      likes,
      comments: Number(post.commentsCount || post.comments || 0),
      shares: 0,
      duration: Math.round(Number(post.videoDuration || post.duration || 0)) || null,
      posted_at: (post.timestamp as string) || (post.taken_at_timestamp as string) || null,
    })
  }
  return videos
}

// ─── Scrape Posts (bloquant — pour usage interne hors modal) ─────────────────

export async function scrapeInstagramPosts(
  handle: string,
  limit: number = 200
): Promise<ScrapedVideo[]> {
  const cleanHandle = handle.replace(/^@/, "").trim().toLowerCase()
  if (!cleanHandle) throw new Error("Handle invalide")
  const client = getClient()
  const result = await runWithRetry(async () => {
    const run = await client.actor(POST_ACTOR).call({
      directUrls: [`https://www.instagram.com/${cleanHandle}/`],
      resultsType: "posts",
      resultsLimit: limit,
    })
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 500 })
    return items
  })
  if (!result) return []
  return parseScrapedPosts(result)
}

// ─── Search Profiles by Keyword ──────────────────────────────────────────────

export interface SearchedProfile {
  username: string
  fullName: string | null
  bio: string | null
  followersCount: number
  profilePicUrl: string | null
  verified: boolean
}

// ─── Handle Candidate Generation ─────────────────────────────────────────────

/**
 * Normalise une chaîne : supprime accents, met en minuscules,
 * ne garde que les caractères alphanumériques et les espaces.
 */
function normalizeQuery(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // accents → lettres de base (é→e, ç→c…)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")     // supprime tout sauf alnum + espace
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Vérifie qu'un handle respecte les règles Instagram :
 * - 2 à 30 caractères
 * - uniquement lettres, chiffres, points, underscores
 * - ne commence/finit pas par un point
 * - pas deux points consécutifs
 */
function isValidHandle(h: string): boolean {
  return (
    h.length >= 2 &&
    h.length <= 30 &&
    /^[a-z0-9][a-z0-9._]*[a-z0-9]$/.test(h) &&
    !/\.\./.test(h)
  )
}

/**
 * Génère deux passes de handles candidats, triés par probabilité décroissante.
 *
 * Passe 1 (~5 candidats) : variations directes — couvre ~90 % des créateurs.
 * Passe 2 (~7 candidats) : suffixes/préfixes courants — fallback si passe 1 vide.
 *
 * Chaque passe est plafonnée pour limiter le coût Apify.
 */
export function generateCandidateHandles(query: string): { pass1: string[]; pass2: string[] } {
  const normalized = normalizeQuery(query)
  const words = normalized.split(" ").filter(Boolean)
  if (words.length === 0) return { pass1: [], pass2: [] }

  const seen = new Set<string>()
  const pass1: string[] = []
  const pass2: string[] = []

  const addTo = (bucket: string[], h: string) => {
    if (!seen.has(h) && isValidHandle(h)) {
      seen.add(h)
      bucket.push(h)
    }
  }

  const compact     = words.join("")
  const dotted      = words.join(".")
  const underscored = words.join("_")
  const w0          = words[0]
  const wN          = words[words.length - 1]
  const revCompact  = [...words].reverse().join("")

  // ── Passe 1 : max 7 candidats, ordonnés par probabilité ───────────────────
  //
  // Pour les noms 3+ mots (ex: "Kika Don Zinga"), les combinaisons partielles
  // (prénom + reste-fusionné) sont prioritaires car très courantes sur Instagram :
  //   kika.donzinga, kika_donzinga > kika.don.zinga, kika_don_zinga
  //
  // Pour les noms 2 mots (ex: "Alex Hormozi"), le compact et dotted suffisent.

  if (words.length >= 3) {
    // Priorité 1 : compact total  "kikadonzinga"
    addTo(pass1, compact)
    // Priorité 2 : premier mot + reste fusionné (pattern prénom.nom)
    const rest = words.slice(1).join("")
    addTo(pass1, `${w0}.${rest}`)          // "kika.donzinga" ← pattern le plus courant
    addTo(pass1, `${w0}_${rest}`)          // "kika_donzinga"
    // Priorité 3 : deux premiers fusionnés + dernier
    const head = words.slice(0, -1).join("")
    addTo(pass1, `${head}.${wN}`)          // "kikadon.zinga"
    addTo(pass1, `${head}_${wN}`)          // "kikadon_zinga"
    // Priorité 4 : séparateurs sur tous les mots
    addTo(pass1, dotted)                   // "kika.don.zinga"
    addTo(pass1, underscored)              // "kika_don_zinga"
  } else {
    // Noms 2 mots : ordre classique
    addTo(pass1, compact)                  // "gaelcreate"
    addTo(pass1, dotted)                   // "gael.create"
    addTo(pass1, underscored)              // "gael_create"
    if (words.length > 1) addTo(pass1, `${compact}s`)   // "gaelcreates"
    if (words.length > 1) addTo(pass1, revCompact)       // "creategael"
  }

  // Mots individuels longs (ex: "hormozi" dans "Alex Hormozi")
  for (const word of words) {
    if (word.length >= 6) addTo(pass1, word)
  }

  // ── Passe 2 : fallback — suffixes & préfixes courants ──────────────────────
  const suffixes = ["official", "real", "fr", "tv", "yt", "off"]
  for (const sfx of suffixes) {
    addTo(pass2, `${compact}${sfx}`)
    addTo(pass2, `${compact}_${sfx}`)
    if (words.length > 1 && w0.length >= 3) addTo(pass2, `${w0}${sfx}`)
  }
  const prefixes = ["the", "its", "real", "by"]
  for (const pfx of prefixes) {
    addTo(pass2, `${pfx}${compact}`)
    if (words.length > 1 && w0.length >= 3) addTo(pass2, `${pfx}${w0}`)
  }
  if (words.length > 1 && wN !== w0) addTo(pass2, `${wN}${w0}`)
  if (words.length >= 3) {
    const lastName = words.slice(1).join("")
    addTo(pass2, lastName)               // "donzinga" seul
    addTo(pass2, `${compact}s`)
  }

  return { pass1: pass1.slice(0, 7), pass2: pass2.slice(0, 7) }
}

async function scrapeHandles(
  client: ReturnType<typeof getClient>,
  usernames: string[]
): Promise<SearchedProfile[]> {
  if (usernames.length === 0) return []

  const items = await runWithRetry(async () => {
    const run = await client.actor(PROFILE_ACTOR).call({ usernames })
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    return items
  })

  return (items ?? [])
    .map((raw) => {
      const p = raw as Record<string, unknown>
      const username = (p.username as string) || ""
      if (!username) return null
      return {
        username,
        fullName: (p.fullName as string) || null,
        bio: (p.biography as string) || null,
        followersCount: Number(p.followersCount) || 0,
        profilePicUrl:
          (p.profilePicUrl as string) || (p.profilePicUrlHD as string) || null,
        verified: Boolean(p.verified),
      } satisfies SearchedProfile
    })
    .filter((p): p is SearchedProfile => p !== null)
}

/**
 * Recherche des profils Instagram depuis un nom libre.
 * Stratégie 2 passes :
 *   1. Candidats directs (~6 handles) → bon marché, couvre 90 % des cas.
 *   2. Si vide → candidats avec suffixes/préfixes (~8 handles) → fallback.
 */
export async function searchInstagramProfiles(
  keyword: string,
): Promise<SearchedProfile[]> {
  const trimmed = keyword.trim()
  if (!trimmed) throw new Error("Mot-clé requis")

  const client = getClient()
  const { pass1, pass2 } = generateCandidateHandles(trimmed)

  let profiles = await scrapeHandles(client, pass1)

  if (profiles.length === 0 && pass2.length > 0) {
    profiles = await scrapeHandles(client, pass2)
  }

  return profiles.sort((a, b) => b.followersCount - a.followersCount)
}

// ─── Calculate Outlier Scores ────────────────────────────────────────────────
//
// Score = views / followers
// Interpretation:
//   0.5  → video reached 50% of follower base
//   1.0  → reached 100% of follower base (=1× followers)
//   5.0  → reached 5× followers → OUTLIER (viral beyond own audience)
//
// This is also a growth indicator: creators who regularly hit 5x+ are growing fast
// because the algorithm pushes their content to non-followers.

export const OUTLIER_THRESHOLD = 5 // 5× followers = outlier

export function calculateOutlierScores(
  videos: ScrapedVideo[],
  followers: number
): ScoredVideo[] {
  if (followers <= 0) {
    return videos.map((v) => ({ ...v, outlier_score: 1 }))
  }

  return videos.map((v) => ({
    ...v,
    outlier_score: Math.round((v.views / followers) * 100) / 100,
  }))
}

// ─── Compute average views ───────────────────────────────────────────────────

export function computeAvgViews(videos: ScrapedVideo[]): number {
  if (videos.length === 0) return 0
  const total = videos.reduce((sum, v) => sum + v.views, 0)
  return Math.round(total / videos.length)
}
