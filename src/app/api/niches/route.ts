import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { data, error } = await supabase
    .from("niches")
    .select("id, slug, label, hashtags_broad, hashtags_niche, hashtags_fr, is_builtin, created_by")
    .order("is_builtin", { ascending: false })
    .order("label", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ niches: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await request.json()
  const { label, hashtags_broad, hashtags_niche, hashtags_fr } = body

  if (!label?.trim()) {
    return NextResponse.json({ error: "Le nom de la niche est requis" }, { status: 400 })
  }

  const allHashtags = [
    ...(hashtags_broad ?? []),
    ...(hashtags_niche ?? []),
    ...(hashtags_fr ?? []),
  ]
  if (allHashtags.length < 2) {
    return NextResponse.json({ error: "Au moins 2 hashtags requis" }, { status: 400 })
  }

  // Génère un slug unique depuis le label
  const slug = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Vérifie que le slug n'existe pas déjà
  const { data: existing } = await supabase
    .from("niches")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `Une niche "${label}" existe déjà` },
      { status: 409 }
    )
  }

  const cleanHashtags = (arr: string[]) =>
    (arr ?? [])
      .map((h: string) => h.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, ""))
      .filter(Boolean)
      .slice(0, 4)

  const { data, error } = await supabase
    .from("niches")
    .insert({
      slug,
      label: label.trim(),
      hashtags_broad:  cleanHashtags(hashtags_broad ?? []),
      hashtags_niche:  cleanHashtags(hashtags_niche ?? []),
      hashtags_fr:     cleanHashtags(hashtags_fr ?? []),
      is_builtin:      false,
      created_by:      user.id,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ niche: data }, { status: 201 })
}
