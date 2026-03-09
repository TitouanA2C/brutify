import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Liste les créateurs par niche pour l’onboarding (côté serveur).
 * Évite le timeout côté client en faisant la requête Supabase depuis le serveur.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const niche = request.nextUrl.searchParams.get("niche")?.trim() ?? ""
  if (!niche) {
    return NextResponse.json({ error: "Paramètre niche requis" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("creators")
    .select("id, name, handle, platform, followers, avatar_url, niche")
    .ilike("niche", niche)
    .order("followers", { ascending: false })
    .limit(12)

  if (error) {
    console.warn("[API onboarding/creators]", error.message)
    return NextResponse.json({ error: error.message, creators: [] }, { status: 200 })
  }

  return NextResponse.json({ creators: data ?? [] })
}
