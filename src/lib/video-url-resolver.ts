const APIFY_BASE = "https://api.apify.com/v2"

/**
 * Résout l'URL directe du fichier vidéo à partir d'une URL de post.
 * Pour Instagram : utilise l'API REST Apify pour scraper le post et extraire videoUrl.
 * Retourne null si impossible.
 */
export async function resolveVideoFileUrl(postUrl: string, platform: string): Promise<string | null> {
  if (!postUrl) return null

  // Déjà une URL directe CDN
  if (postUrl.includes(".cdninstagram.com") || postUrl.includes(".fbcdn.net") ||
      postUrl.match(/\.(mp4|webm|m4a|mp3)(\?|$)/i)) {
    return postUrl
  }

  if (platform === "instagram") {
    return resolveInstagramVideoUrl(postUrl)
  }

  return null
}

/**
 * Utilise l'API REST Apify (pas le SDK, pour éviter les soucis de bundling Next.js)
 * pour scraper un post Instagram et extraire l'URL vidéo CDN.
 */
async function resolveInstagramVideoUrl(postUrl: string): Promise<string | null> {
  const token = process.env.APIFY_API_KEY
  if (!token) {
    console.warn("[resolveVideoUrl] APIFY_API_KEY manquante")
    return null
  }

  try {
    console.log(`[resolveVideoUrl] Résolution via Apify REST pour ${postUrl}`)

    // 1. Lancer un run synchrone de l'actor Instagram Scraper
    const runRes = await fetch(
      `${APIFY_BASE}/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls: [postUrl],
          resultsType: "posts",
          resultsLimit: 1,
        }),
      }
    )

    if (!runRes.ok) {
      console.warn(`[resolveVideoUrl] Apify HTTP ${runRes.status}: ${await runRes.text().catch(() => "")}`)
      return null
    }

    const items = await runRes.json() as Record<string, unknown>[]

    if (Array.isArray(items) && items.length > 0) {
      const post = items[0]
      const videoUrl = (post.videoUrl as string) || (post.video_url as string) || null
      if (videoUrl) {
        console.log(`[resolveVideoUrl] Résolu: ${videoUrl.substring(0, 100)}...`)
        return videoUrl
      }
      console.warn("[resolveVideoUrl] Post trouvé mais pas de videoUrl — peut-être une photo ?")
    } else {
      console.warn("[resolveVideoUrl] Aucun résultat Apify pour", postUrl)
    }
  } catch (err) {
    console.error("[resolveVideoUrl] Apify failed:", err instanceof Error ? err.message : err)
  }

  return null
}

/**
 * Détecte les transcriptions placeholder/squelette générées avant le fix.
 */
export function isPlaceholderTranscript(content: string): boolean {
  if (!content || content.length < 10) return true

  const markers = [
    "— Hook",
    "— Accroche",
    "— Développement",
    "— Point clé",
    "— Conclusion + CTA",
    "— CTA",
    "partage-la et abonne-toi",
    "On se retrouve dans la prochaine",
    "Ce que personne ne te dit",
    "Les chiffres parlent d'eux-mêmes",
    "Les données montrent clairement",
    "[Transcription automatique de",
    "va changer ta vision",
    "première chose importante à comprendre",
  ]

  let matchCount = 0
  const lower = content.toLowerCase()
  for (const m of markers) {
    if (lower.includes(m.toLowerCase())) matchCount++
  }

  if (matchCount >= 2) return true
  if (matchCount >= 1 && content.length < 300) return true

  return false
}
