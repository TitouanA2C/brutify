import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { toCreatorDTO } from "@/lib/api/helpers"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const q = searchParams.get("q")?.trim() ?? ""
  const platform = searchParams.get("platform")
  const niche = searchParams.get("niche")

  if (!q && !platform && !niche) {
    return NextResponse.json({ error: "Paramètre q, platform ou niche requis" }, { status: 400 })
  }

  let query = supabase.from("creators").select("*")

  if (q) {
    query = query.or(`handle.ilike.%${q}%,name.ilike.%${q}%`)
  }
  if (platform && ["instagram", "tiktok", "youtube"].includes(platform)) {
    query = query.eq("platform", platform)
  }
  if (niche) {
    query = query.ilike("niche", niche)
  }

  const { data: creators, error } = await query
    .order("followers", { ascending: false })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!creators || creators.length === 0) {
    // Un handle = commence par @ OU est purement alphanum/underscore/point (sans espace)
    const looksLikeHandle =
      q.startsWith("@") || /^[a-zA-Z0-9._]+$/.test(q)
    // Recherche par mot-clé = contient un espace (ex: "Gael create", "Alex Hormozi")
    const canSearch = q.includes(" ") && q.length >= 2

    return NextResponse.json({
      creators: [],
      canScrape: looksLikeHandle && !q.includes(" ") && q.length > 2,
      canSearch,
      query: q,
    })
  }

  const { data: watchlistRows } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  const watchlistSet = new Set(watchlistRows?.map((w) => w.creator_id) ?? [])

  const creatorsWithOutliers = await Promise.all(
    creators.map(async (c) => {
      const { data: topVideo } = await supabase
        .from("videos")
        .select("outlier_score")
        .eq("creator_id", c.id)
        .order("outlier_score", { ascending: false })
        .limit(1)
        .single()

      const { count } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", c.id)
        .gte("outlier_score", 5)

      return toCreatorDTO(c, {
        isInWatchlist: watchlistSet.has(c.id),
        outlierCount: count ?? 0,
        topOutlierRatio: topVideo?.outlier_score
          ? Number(topVideo.outlier_score)
          : 0,
      })
    })
  )

  return NextResponse.json({
    creators: creatorsWithOutliers,
    canScrape: false,
    canSearch: false,
    query: q,
  })
}
