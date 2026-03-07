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

  const niche = request.nextUrl.searchParams.get("niche")
  if (!niche) {
    return NextResponse.json(
      { error: "Paramètre niche requis" },
      { status: 400 }
    )
  }

  const { data: creators, error } = await supabase
    .from("creators")
    .select("*")
    .ilike("niche", niche)
    .order("followers", { ascending: false })
    .limit(15)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: watchlistRows } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  const watchlistSet = new Set(watchlistRows?.map((w) => w.creator_id) ?? [])

  const result = (creators ?? []).map((c) =>
    toCreatorDTO(c, { isInWatchlist: watchlistSet.has(c.id) })
  )

  return NextResponse.json({ creators: result })
}
