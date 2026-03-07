import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAndUnlockBonus } from "@/lib/activation-triggers"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get("status")

  let query = supabase
    .from("board_items")
    .select("*, scripts(id, title, hook_text), videos:source_video_id(id, title, thumbnail_url)")
    .eq("user_id", user.id)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: items, error } = await query
    .order("position", { ascending: true, nullsFirst: false })
    .order("scheduled_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: items ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let body: {
    title: string
    status?: string
    scheduled_date?: string
    platform?: string
    script_id?: string
    source_video_id?: string
    notes?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("board_items")
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      status: (body.status as "idea" | "draft" | "in_progress" | "scheduled" | "published") ?? "idea",
      scheduled_date: body.scheduled_date || null,
      platform: (body.platform as "instagram" | "tiktok" | "youtube" | "multi") || null,
      script_id: body.script_id || null,
      source_video_id: body.source_video_id || null,
      notes: body.notes || null,
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Vérifier et débloquer bonus d'activation
  checkAndUnlockBonus(user.id, "add_to_board").catch(() => {})

  return NextResponse.json({ item }, { status: 201 })
}
