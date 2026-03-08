import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { startInstagramPostsScrape } from "@/lib/scraping/instagram"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authClient = createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const supabase = createServiceClient()

  const { data: creator, error: creatorErr } = await supabase
    .from("creators")
    .select("*")
    .eq("id", params.id)
    .single()

  if (creatorErr || !creator) {
    return NextResponse.json({ error: "Créateur non trouvé" }, { status: 404 })
  }

  if (creator.platform !== "instagram") {
    return NextResponse.json({ error: "Scraping vidéo disponible uniquement pour Instagram" }, { status: 400 })
  }

  // ── Rate limit : 1 scrape par créateur toutes les 6h ─────────────────────
  const COOLDOWN_MS = 6 * 60 * 60 * 1000 // 6 heures
  if (creator.last_scraped_at) {
    const lastScraped = new Date(creator.last_scraped_at).getTime()
    const elapsed = Date.now() - lastScraped
    if (elapsed < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - elapsed
      const remainingH = Math.floor(remainingMs / 3_600_000)
      const remainingM = Math.floor((remainingMs % 3_600_000) / 60_000)
      const remaining = remainingH > 0
        ? `${remainingH}h${remainingM > 0 ? remainingM + "min" : ""}`
        : `${remainingM}min`
      return NextResponse.json(
        { error: `Scraping déjà effectué récemment. Réessaie dans ${remaining}.`, cooldown: true, remainingMs },
        { status: 429 }
      )
    }
  }

  let requestedLimit = 50
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = parseInt(body?.limit, 10)
    if (!isNaN(parsed) && parsed > 0 && parsed <= 500) requestedLimit = parsed
  } catch {}

  // Lance le run Apify sans attendre la fin (~1 sec au lieu de 2 min)
  let runId: string
  try {
    runId = await startInstagramPostsScrape(creator.handle, requestedLimit)
  } catch (err) {
    console.error("[Scrape Videos] start error", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur Apify" },
      { status: 502 }
    )
  }

  return NextResponse.json({ status: "running", runId, creatorId: creator.id })
}
