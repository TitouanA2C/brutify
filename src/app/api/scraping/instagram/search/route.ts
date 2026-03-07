import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchInstagramProfiles } from "@/lib/scraping/instagram"

export async function GET(request: NextRequest) {
  const authClient = createClient()

  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: "Paramètre q requis (min 2 caractères)" },
      { status: 400 }
    )
  }

  try {
    const profiles = await searchInstagramProfiles(q)
    return NextResponse.json({ profiles, query: q })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la recherche"
    console.error("[Instagram Search]", message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
