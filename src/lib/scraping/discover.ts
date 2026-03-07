import { ApifyClient } from "apify-client"

// ─── Apify actors ─────────────────────────────────────────────────────────────

// Instagram
const IG_PROFILE_ACTOR = "apify/instagram-profile-scraper"
const IG_HASHTAG_ACTOR = "apify/instagram-hashtag-scraper"

// TikTok
const TT_SEARCH_ACTOR  = "clockworks/free-tiktok-scraper"
const TT_HASHTAG_ACTOR = "clockworks/free-tiktok-scraper"
const TT_PROFILE_ACTOR = "apify/tiktok-profile-scraper"

const MAX_RETRIES    = 2
const RETRY_DELAY_MS = 20_000

function getClient(): ApifyClient {
  const token = process.env.APIFY_API_KEY
  if (!token) throw new Error("APIFY_API_KEY non configurée")
  return new ApifyClient({ token })
}

async function runWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const isRate =
        err instanceof Error &&
        (err.message.includes("rate") || err.message.includes("429"))
      if (isRate && attempt < retries) {
        console.warn(`[Discover] Rate limited, retry ${attempt + 1}/${retries}`)
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
        continue
      }
      throw err
    }
  }
  throw new Error("Max retries dépassé")
}

// ─── Seeds curatés par niche (marché FR) ──────────────────────────────────────
//
// Ce sont des handles connus de créateurs de qualité dans chaque niche.
// Le profile scraper les scrape directement → résultats garantis peu importe
// s'ils utilisent des hashtags ou non.
//
// Si un handle n'existe plus, le scraper retourne simplement rien pour lui.

const NICHE_SEEDS_FR: Record<string, string[]> = {
  business: [
    "yomidenzel",          // ~1.2M – business/liberté financière
    "anthonysirius",       // coaching business FR
    "gregoire.gambatto",   // marketing/business digital
    "sebastien.night",     // solopreneur/entrepreneur FR
    "oussama_ammar",       // startup/entrepreneur FR
    "pauledwardtoo",       // business/mindset
    "benjamin_moussa_officiel",
    "lauragillot.co",
  ],
  finance: [
    "yomidenzel",
    "charles.ellet",
    "romain.pirard",
    "gabrielattal",        // finance/économie
    "theoptimistinvestor",
  ],
  fitness: [
    "tibo_inshape",        // ~7M – fitness FR
    "julienquaglierini",
    "pierre_boisson",
    "sistersquad.off",
    "lucile.woodward",
    "chloe_ting",
  ],
  mindset: [
    "yomidenzel",
    "fabienriviere",
    "robin.sharma",
    "tony.robbins",
    "developpementpersonnel.fr",
  ],
  marketing: [
    "gregoire.gambatto",
    "pauledwardtoo",
    "neil.patel",
    "garyvee",
    "elonmusk",            // grand public
  ],
  nutrition: [
    "lucile.woodward",
    "tibo_inshape",
    "dr.frederique.nutrition",
    "lauragillot.co",
  ],
  lifestyle: [
    "squeezie",
    "tibo_inshape",
    "joueurdugrenier",
    "enjoy_phoenix",
  ],
  voyage: [
    "ludovicperon",
    "axelroux",
    "christophe_colombe_officiel",
    "notjustalabel",
  ],
  cuisine: [
    "cyril_lignac",
    "chef_simon",
    "bestrecipes",
    "thefoodgod",
  ],
  tech: [
    "hugo.decrypte",
    "underscore_",
    "lexfridman",
    "mkbhd",
  ],
}

function getSeedsForNiche(slug: string, lang: "fr" | "all"): string[] {
  const seeds = NICHE_SEEDS_FR[slug] ?? []
  // Pour "all" on garde les seeds FR car ils sont quand même pertinents
  return seeds.slice(0, 8)
}

// ─── Requêtes hashtag par niche ───────────────────────────────────────────────

const NICHE_HASHTAGS: Record<string, { broad: string[]; fr: string[] }> = {
  business: {
    broad: ["entrepreneur", "businesscoach", "solopreneur"],
    fr:    ["entrepreneurfr", "businessfrance", "entrepreneuriat"],
  },
  finance: {
    broad: ["investissement", "finance", "trading"],
    fr:    ["investissementfr", "libertefin", "financepersonnelle"],
  },
  fitness: {
    broad: ["fitness", "fitnesscoach", "musculation"],
    fr:    ["coachfitness", "fitnessfrance", "sportmotivation"],
  },
  mindset: {
    broad: ["developpementpersonnel", "mindset", "motivation"],
    fr:    ["coachvie", "croissance", "mentalite"],
  },
  nutrition: {
    broad: ["nutrition", "nutritioncoach", "alimentation"],
    fr:    ["nutritioniste", "nutritionfrance", "bienmanger"],
  },
  marketing: {
    broad: ["marketing", "digitalmarketing", "contentcreator"],
    fr:    ["marketingfr", "marketingdigital", "reseauxsociaux"],
  },
  tech: {
    broad: ["tech", "coding", "developpeur"],
    fr:    ["techfr", "developpementfr", "informatique"],
  },
  voyage: {
    broad: ["voyage", "travel", "digitalnomad"],
    fr:    ["voyagefrance", "nomade", "blogueurvoyage"],
  },
  cuisine: {
    broad: ["cuisine", "recette", "chef"],
    fr:    ["cuisinefrancaise", "recettefr", "gastronomie"],
  },
  lifestyle: {
    broad: ["lifestyle", "contentcreator", "influencer"],
    fr:    ["lifestylefr", "influenceurfr", "createur"],
  },
}

function resolveHashtagsFromMap(slug: string, label: string, lang: "fr" | "all", config: NicheConfig): string[] {
  const mapping = NICHE_HASHTAGS[slug]
  const dbHashtags = [
    ...config.hashtags_broad.slice(0, 1),
    ...config.hashtags_niche.slice(0, 1),
    ...(lang === "fr" ? config.hashtags_fr.slice(0, 1) : []),
  ]

  if (mapping) {
    const list = [
      ...mapping.broad.slice(0, 2),
      ...(lang === "fr" ? mapping.fr.slice(0, 1) : []),
      ...dbHashtags,
    ]
    return [...new Set(list)].filter(Boolean).slice(0, 4)
  }

  return [...new Set(dbHashtags)].filter(Boolean).slice(0, 4)
}

// ─── Language Detection ───────────────────────────────────────────────────────

const FR_CHARS_RE = /[àâçéèêëîïôùûü]/g
const FR_WORDS = [
  "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
  "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
  "pour", "avec", "dans", "sur", "mais", "les", "des", "une",
  "coaching", "créateur", "créatrice", "entrepreneur", "entrepreneuriat",
  "gratuit", "formation", "rejoins", "découvre", "voici", "bonjour",
  "bienvenue", "fondateur", "fondatrice", "freelance",
]
const EN_WORDS = [
  "the", "and", "your", "this", "that", "with", "for", "from",
  "have", "will", "free", "join", "follow", "link", "bio",
  "coach", "creator", "founder", "mindset", "business",
  "entrepreneur", "growth", "scale", "money", "wealth",
]

function scoreFrench(texts: string[]): number {
  const text = texts.filter(Boolean).join(" ").toLowerCase().replace(/\s+/g, " ")
  if (!text.trim()) return 0
  let score = 0
  const frChars = (text.match(FR_CHARS_RE) || []).length
  score += Math.min(frChars * 2, 20)
  for (const w of FR_WORDS) {
    score += (text.match(new RegExp(`\\b${w}\\b`, "g")) || []).length * 2
  }
  for (const w of EN_WORDS) {
    score -= (text.match(new RegExp(`\\b${w}\\b`, "g")) || []).length * 2
  }
  return score
}

// ─── Types internes ───────────────────────────────────────────────────────────

interface Candidate {
  username: string
  source: "seed" | "hashtag"
  captions: string[]
  bestLikes: number
  hashtagCount: number
}

interface ScoredProfile {
  username: string
  fullName: string | null
  bio: string | null
  followersCount: number
  postsCount: number
  profilePicUrl: string | null
  verified: boolean
  engagementRate: number
  langScore: number
  finalScore: number
}

export interface DiscoveredCreator {
  username: string
  fullName: string | null
  bio: string | null
  followersCount: number
  postsCount: number
  profilePicUrl: string | null
  verified: boolean
  engagementRate: number
}

// ─── Instagram : Phase 1a — Seeds curatés ────────────────────────────────────
//
// On passe les handles connus directement au profile scraper.
// Pas d'actor de "search" — ceux-ci cherchent des lieux/restaurants, pas des profils.
// Les seeds garantissent de trouver Yomi Denzel, Tibo InShape etc.

function seedsToCandidate(usernames: string[]): Map<string, Candidate> {
  const map = new Map<string, Candidate>()
  for (const u of usernames) {
    map.set(u.toLowerCase(), {
      username:    u.toLowerCase(),
      source:      "seed",
      captions:    [],
      bestLikes:   999_999,
      hashtagCount: 0,
    })
  }
  return map
}

// ─── Instagram : Phase 1b — Top posts hashtag ────────────────────────────────
//
// "scrapeType: top" = posts avec le plus d'engagement pour ce hashtag.
// Ces posts viennent de comptes populaires (≠ "posts" = posts récents de n'importe qui).

async function igScrapeTopHashtags(
  client: ApifyClient,
  hashtags: string[]
): Promise<{ username: string; caption: string; likes: number; hashtag: string }[]> {
  if (hashtags.length === 0) return []
  const limited = hashtags.slice(0, 4)
  console.log(`[Discover] IG Phase 1b — top posts hashtags: [${limited.join(", ")}]`)

  try {
    const posts = await runWithRetry(async () => {
      const run = await client.actor(IG_HASHTAG_ACTOR).call({
        hashtags:     limited,
        resultsLimit: 15,
        scrapeType:   "top",  // TOP posts = comptes populaires (pas les récents)
      })
      const { items } = await client.dataset(run.defaultDatasetId).listItems()
      return items as Record<string, unknown>[]
    })

    console.log(`[Discover] IG Phase 1b — ${posts.length} top posts récupérés`)

    return posts
      .map((p) => ({
        username: String(p.ownerUsername ?? p.owner_username ?? "").toLowerCase().trim(),
        caption:  String(p.caption ?? p.edge_media_to_caption ?? ""),
        // Plusieurs noms de champ possibles selon la version de l'actor
        likes:    Number(
          p.likesCount ?? p.likes_count ?? p.like_count ??
          (p.edge_liked_by as Record<string, unknown>)?.count ?? 0
        ),
        hashtag:  String(p.hashtag ?? limited[0] ?? ""),
      }))
      .filter((p) => p.username.length >= 2)
  } catch (err) {
    console.error("[Discover] IG Phase 1b erreur:", err)
    return []
  }
}

// ─── Instagram : Phase 3 — Scraping profils ──────────────────────────────────

async function igScrapeProfiles(
  client: ApifyClient,
  usernames: string[]
): Promise<Record<string, unknown>[]> {
  if (usernames.length === 0) return []
  console.log(`[Discover] IG Phase 3 — scraping ${usernames.length} profils…`)
  return runWithRetry(async () => {
    const run = await client.actor(IG_PROFILE_ACTOR).call({ usernames })
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    return items as Record<string, unknown>[]
  })
}

// ─── TikTok : Phase 1a — Recherche par mot-clé ───────────────────────────────

const NICHE_TIKTOK_QUERIES: Record<string, { fr: string[]; all: string[] }> = {
  business: {
    fr:  ["entrepreneur france", "business coach france"],
    all: ["entrepreneur", "business coach"],
  },
  finance: {
    fr:  ["liberté financière france", "investissement france"],
    all: ["personal finance", "investing"],
  },
  fitness: {
    fr:  ["coach fitness france", "sport motivation france"],
    all: ["fitness coach", "workout"],
  },
  mindset: {
    fr:  ["développement personnel france", "mindset coach france"],
    all: ["personal development", "mindset"],
  },
  marketing: {
    fr:  ["marketing digital france", "réseaux sociaux france"],
    all: ["digital marketing", "social media"],
  },
  nutrition: {
    fr:  ["nutritionniste france", "alimentation saine france"],
    all: ["nutrition", "healthy eating"],
  },
  lifestyle: {
    fr:  ["lifestyle france", "créateur contenu france"],
    all: ["lifestyle", "content creator"],
  },
  voyage: {
    fr:  ["voyage france", "nomade digital france"],
    all: ["travel", "digital nomad"],
  },
  cuisine: {
    fr:  ["recettes françaises", "chef france"],
    all: ["cooking", "chef"],
  },
  tech: {
    fr:  ["tech france", "développeur france"],
    all: ["tech", "coding"],
  },
}

function getTikTokQueries(slug: string, label: string, lang: "fr" | "all"): string[] {
  const mapping = NICHE_TIKTOK_QUERIES[slug]
  if (mapping) {
    if (lang === "fr") return [...mapping.fr.slice(0, 2), mapping.all[0]].filter(Boolean)
    return mapping.all.slice(0, 3)
  }
  const l = label.toLowerCase()
  if (lang === "fr") return [`${l} france`, l]
  return [l, `${l} creator`]
}

async function ttSearchByKeyword(client: ApifyClient, queries: string[]): Promise<string[]> {
  if (queries.length === 0) return []
  console.log(`[Discover] TT Phase 1a — keyword: [${queries.join(" | ")}]`)
  try {
    const items = await runWithRetry(async () => {
      const run = await client.actor(TT_SEARCH_ACTOR).call({
        searchQueries:  queries,
        searchSection:  "user",
        resultsPerPage: 15,
      })
      const { items } = await client.dataset(run.defaultDatasetId).listItems()
      return items as Record<string, unknown>[]
    })
    const usernames = items
      .map((item) => {
        const u = item.user as Record<string, unknown> | undefined
        return String(item.uniqueId ?? u?.uniqueId ?? item.username ?? "").toLowerCase().trim()
      })
      .filter(Boolean)
    console.log(`[Discover] TT Phase 1a — ${usernames.length} handles`)
    return [...new Set(usernames)]
  } catch (err) {
    console.error("[Discover] TT Phase 1a erreur:", err)
    return []
  }
}

async function ttScrapeHashtags(
  client: ApifyClient,
  hashtags: string[]
): Promise<{ username: string; caption: string; likes: number; hashtag: string }[]> {
  if (hashtags.length === 0) return []
  const limited = hashtags.slice(0, 3)
  console.log(`[Discover] TT Phase 1b — hashtags: [${limited.join(", ")}]`)
  try {
    const posts = await runWithRetry(async () => {
      const run = await client.actor(TT_HASHTAG_ACTOR).call({
        hashtags:       limited,
        resultsPerPage: 20,
      })
      const { items } = await client.dataset(run.defaultDatasetId).listItems()
      return items as Record<string, unknown>[]
    })
    console.log(`[Discover] TT Phase 1b — ${posts.length} posts`)
    return posts
      .map((p) => ({
        username: String(
          (p.authorMeta as Record<string, unknown>)?.uniqueId ??
          (p.author as Record<string, unknown>)?.uniqueId ??
          p.uniqueId ?? ""
        ).toLowerCase().trim(),
        caption: String(p.text ?? p.desc ?? ""),
        likes:   Number(p.diggCount ?? (p.stats as Record<string, unknown>)?.diggCount ?? 0),
        hashtag: String(limited[0] ?? ""),
      }))
      .filter((p) => p.username.length >= 2)
  } catch (err) {
    console.error("[Discover] TT Phase 1b erreur:", err)
    return []
  }
}

async function ttScrapeProfiles(
  client: ApifyClient,
  usernames: string[]
): Promise<Record<string, unknown>[]> {
  if (usernames.length === 0) return []
  console.log(`[Discover] TT Phase 3 — ${usernames.length} profils…`)
  try {
    return await runWithRetry(async () => {
      const run = await client.actor(TT_PROFILE_ACTOR).call({
        profiles:       usernames,
        resultsPerPage: 1,
      })
      const { items } = await client.dataset(run.defaultDatasetId).listItems()
      return items as Record<string, unknown>[]
    })
  } catch (err) {
    console.error("[Discover] TT Phase 3 erreur:", err)
    return []
  }
}

function normalizeTikTokProfile(raw: Record<string, unknown>): Record<string, unknown> {
  const user   = (raw.user   as Record<string, unknown>) ?? raw
  const stats  = (raw.stats  as Record<string, unknown>) ?? raw

  const username     = String(user.uniqueId ?? user.username ?? raw.uniqueId ?? "").toLowerCase()
  const followers    = Number(stats.followerCount ?? stats.followers ?? raw.followersCount ?? 0)
  const bio          = String(user.signature ?? user.bio ?? raw.signature ?? "")
  const profilePic   = String(user.avatarLarger ?? user.avatarMedium ?? raw.avatarUrl ?? "")
  const fullName     = String(user.nickname ?? user.name ?? raw.nickname ?? "")
  const videoCount   = Number(stats.videoCount ?? raw.videoCount ?? 0)
  const totalLikes   = Number(stats.heartCount ?? stats.likes ?? raw.heartCount ?? 0)
  const avgLikes     = videoCount > 0 ? Math.round(totalLikes / videoCount) : 0

  return {
    username,
    fullName:       fullName || null,
    biography:      bio || null,
    followersCount: followers,
    postsCount:     videoCount,
    profilePicUrl:  profilePic || null,
    verified:       Boolean(user.verified ?? raw.verified),
    avgLikes,
  }
}

// ─── Phase 2 : Construction des candidats ────────────────────────────────────

function buildCandidatesMap(
  seedCandidates: Map<string, Candidate>,
  hashtagPosts: { username: string; caption: string; likes: number; hashtag: string }[],
  lang: "fr" | "all",
  minLikes: number
): Map<string, Candidate> {
  const map = new Map<string, Candidate>(seedCandidates)

  for (const post of hashtagPosts) {
    const u = post.username
    const existing = map.get(u)
    if (existing) {
      existing.bestLikes = Math.max(existing.bestLikes, post.likes)
      if (post.caption) existing.captions.push(post.caption)
      if (existing.source === "hashtag") existing.hashtagCount++
    } else {
      map.set(u, {
        username:    u,
        source:      "hashtag",
        captions:    post.caption ? [post.caption] : [],
        bestLikes:   post.likes,
        hashtagCount: 1,
      })
    }
  }

  // Filtre les hashtag-only sans engagement minimal
  // Les seeds passent toujours (bestLikes = 999_999)
  for (const [key, c] of map.entries()) {
    if (c.source === "hashtag") {
      // On garde même avec 0 likes car on utilise "top" posts maintenant
      if (c.bestLikes < minLikes) {
        map.delete(key)
        continue
      }
      if (lang === "fr" && c.captions.length > 0) {
        if (scoreFrench(c.captions) < -8) {
          map.delete(key)
        }
      }
    }
  }

  return map
}

// ─── Phase 4 : Scoring ───────────────────────────────────────────────────────

function scoreProfile(
  raw: Record<string, unknown>,
  candidates: Map<string, Candidate>,
  lang: "fr" | "all",
  minFollowers: number
): ScoredProfile | null {
  const username = ((raw.username as string) || "").toLowerCase()
  if (!username) return null

  const followers = Number(raw.followersCount) || 0
  if (followers < minFollowers) return null
  if (followers > 20_000_000) return null

  const bio        = (raw.biography as string) || (raw.bio as string) || null
  const postsCount = Number(raw.postsCount) || 0
  const avgLikes   = Number(raw.avgLikes) || 0
  const profilePicUrl =
    (raw.profilePicUrl as string) || (raw.profilePicUrlHD as string) || null
  const verified = Boolean(raw.verified)

  const candidate = candidates.get(username)
  const captions  = candidate?.captions ?? []

  const engagementRate =
    followers > 0 ? Math.round((avgLikes / followers) * 1000) / 10 : 0

  const langScore = scoreFrench([bio ?? "", ...captions.slice(0, 5)])

  let score = 0
  score += Math.log10(Math.max(followers, 1)) * 10

  if (engagementRate > 5)        score += 25
  else if (engagementRate > 2)   score += 15
  else if (engagementRate > 0.5) score += 5

  // Bonus seeds : comptes curatés manuellement = pertinence garantie
  if (candidate?.source === "seed") score += 40
  score += (candidate?.hashtagCount ?? 0) * 8

  if (bio && bio.length > 30) score += 10
  if (verified) score += 5

  if (lang === "fr") {
    if (langScore > 5)       score += 30
    else if (langScore > 0)  score += 15
    else if (langScore < -8) score -= 40
  }

  return {
    username,
    fullName: (raw.fullName as string) || null,
    bio,
    followersCount: followers,
    postsCount,
    profilePicUrl,
    verified,
    engagementRate,
    langScore,
    finalScore: score,
  }
}

// ─── Types publics ────────────────────────────────────────────────────────────

export interface NicheConfig {
  slug: string
  label: string
  hashtags_broad: string[]
  hashtags_niche: string[]
  hashtags_fr: string[]
}

export interface DiscoverOptions {
  nicheConfig:  NicheConfig
  platform:     "instagram" | "tiktok"
  lang:         "fr" | "all"
  minFollowers: number
  minLikes:     number
  maxResults:   number
}

export function resolveHashtags(config: NicheConfig, lang: "fr" | "all"): string[] {
  const list = [
    ...config.hashtags_broad.slice(0, 2),
    ...config.hashtags_niche.slice(0, 1),
  ]
  if (lang === "fr") list.push(...config.hashtags_fr.slice(0, 1))
  return [...new Set(list)].filter(Boolean)
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

export async function discoverCreators(
  opts: DiscoverOptions
): Promise<DiscoveredCreator[]> {
  const { nicheConfig, platform, lang, minFollowers, minLikes, maxResults } = opts
  const client = getClient()
  const isIG = platform === "instagram"

  console.log(
    `[Discover] Niche="${nicheConfig.slug}" platform=${platform} lang=${lang} minFollowers=${minFollowers}`
  )

  if (isIG) {
    // ── Instagram pipeline ──────────────────────────────────────────────────

    // Phase 1a : seeds curatés (handles connus → profile scraper direct)
    const seedHandles = getSeedsForNiche(nicheConfig.slug, lang)
    console.log(`[Discover] IG Phase 1a — ${seedHandles.length} seeds: [${seedHandles.join(", ")}]`)
    const seedCandidates = seedsToCandidate(seedHandles)

    // Phase 1b : top posts hashtag (comptes avec le plus d'engagement)
    const hashtags = resolveHashtagsFromMap(nicheConfig.slug, nicheConfig.label, lang, nicheConfig)
    const hashtagPosts = await igScrapeTopHashtags(client, hashtags)

    console.log(
      `[Discover] Phase 1 — ${seedHandles.length} seeds, ${hashtagPosts.length} top posts hashtag`
    )

    // Phase 2 : fusion
    const candidatesMap = buildCandidatesMap(seedCandidates, hashtagPosts, lang, minLikes)
    console.log(`[Discover] Phase 2 — ${candidatesMap.size} candidats uniques`)

    if (candidatesMap.size === 0) return []

    const topCandidates = Array.from(candidatesMap.values())
      .sort((a, b) => {
        if (a.source === "seed" && b.source !== "seed") return -1
        if (b.source === "seed" && a.source !== "seed") return 1
        return b.bestLikes - a.bestLikes
      })
      .slice(0, 50)

    // Phase 3 : scraping profils
    const usernamesToScrape = topCandidates.map((c) => c.username)
    const rawProfiles = await igScrapeProfiles(client, usernamesToScrape)
    console.log(`[Discover] Phase 3 — ${rawProfiles.length} profils récupérés`)

    // Phase 4 : scoring
    const scored = rawProfiles
      .map((raw) => scoreProfile(raw, candidatesMap, lang, minFollowers))
      .filter((p): p is ScoredProfile => p !== null)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxResults)

    console.log(`[Discover] Phase 4 — ${scored.length} créateurs retenus`)
    console.log(
      "[Discover] Top résultats:",
      scored.map((s) => `@${s.username} (${s.followersCount.toLocaleString()}, score=${Math.round(s.finalScore)})`)
    )

    return scored.map(({ finalScore: _f, langScore: _l, ...rest }) => rest)

  } else {
    // ── TikTok pipeline ─────────────────────────────────────────────────────

    const queries   = getTikTokQueries(nicheConfig.slug, nicheConfig.label, lang)
    const hashtags  = resolveHashtags(nicheConfig, lang)

    const [searchUsernames, hashtagPosts] = await Promise.all([
      ttSearchByKeyword(client, queries),
      ttScrapeHashtags(client, hashtags),
    ])

    console.log(
      `[Discover] TT Phase 1 — ${searchUsernames.length} via recherche, ${hashtagPosts.length} posts hashtag`
    )

    const searchCandidates = seedsToCandidate(searchUsernames)
    const candidatesMap = buildCandidatesMap(searchCandidates, hashtagPosts, lang, minLikes)
    console.log(`[Discover] Phase 2 — ${candidatesMap.size} candidats`)

    if (candidatesMap.size === 0) return []

    const topCandidates = Array.from(candidatesMap.values())
      .sort((a, b) => {
        if (a.source === "seed" && b.source !== "seed") return -1
        if (b.source === "seed" && a.source !== "seed") return 1
        return b.bestLikes - a.bestLikes
      })
      .slice(0, 50)

    const usernamesToScrape = topCandidates.map((c) => c.username)
    const ttRaw = await ttScrapeProfiles(client, usernamesToScrape)
    const rawProfiles = ttRaw.map(normalizeTikTokProfile)
    console.log(`[Discover] Phase 3 — ${rawProfiles.length} profils récupérés`)

    const scored = rawProfiles
      .map((raw) => scoreProfile(raw, candidatesMap, lang, minFollowers))
      .filter((p): p is ScoredProfile => p !== null)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, maxResults)

    console.log(`[Discover] Phase 4 — ${scored.length} créateurs retenus`)
    console.log(
      "[Discover] Top résultats:",
      scored.map((s) => `@${s.username} (${s.followersCount.toLocaleString()}, score=${Math.round(s.finalScore)})`)
    )

    return scored.map(({ finalScore: _f, langScore: _l, ...rest }) => rest)
  }
}
