import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { discoverCreators } from "@/lib/scraping/discover"

export async function GET(request: NextRequest) {
  const authClient = createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const nicheSlug    = sp.get("niche")?.toLowerCase().trim() ?? ""
  const platform     = sp.get("platform") === "tiktok" ? "tiktok" : "instagram"
  const lang         = sp.get("lang") === "all" ? "all" : "fr"
  const minFollowers = Math.max(0, parseInt(sp.get("minFollowers") ?? "5000", 10))
  const minLikes     = Math.max(0, parseInt(sp.get("minLikes") ?? "30", 10))
  const maxResults   = Math.min(20, Math.max(1, parseInt(sp.get("maxResults") ?? "12", 10)))

  if (!nicheSlug) {
    return NextResponse.json({ error: "Paramètre niche requis" }, { status: 400 })
  }

  // Récupère la config de la niche depuis la DB (built-in ou custom)
  const supabase = createClient()
  const { data: nicheRow, error: nicheErr } = await supabase
    .from("niches")
    .select("slug, label, hashtags_broad, hashtags_niche, hashtags_fr")
    .eq("slug", nicheSlug)
    .single()

  if (nicheErr || !nicheRow) {
    return NextResponse.json(
      { error: `Niche "${nicheSlug}" introuvable` },
      { status: 404 }
    )
  }

  try {
    const creators = await discoverCreators({
      nicheConfig: nicheRow,
      platform,
      lang,
      minFollowers,
      minLikes,
      maxResults,
    })
    return NextResponse.json({ creators, niche: nicheSlug, lang, count: creators.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la découverte"
    console.error("[Discover API]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
