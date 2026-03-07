import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const type = request.nextUrl.searchParams.get("type")

  let query = supabase
    .from("vault_items")
    .select("*")
    .eq("user_id", user.id)

  if (type && type !== "all" && ["video", "script", "manual", "ai"].includes(type)) {
    query = query.eq("type", type)
  }

  const { data: items, error } = await query.order("created_at", {
    ascending: false,
  })

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
    type: "video" | "script" | "manual"
    content: string
    source_handle?: string
    source_video_id?: string
    source_script_id?: string
    tags?: string[]
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 })
  }

  if (!["video", "script", "manual", "ai"].includes(body.type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("vault_items")
    .insert({
      user_id: user.id,
      type: body.type,
      content: body.content.trim(),
      source_handle: body.source_handle || null,
      source_video_id: body.source_video_id || null,
      source_script_id: body.source_script_id || null,
      tags: body.tags ?? [],
    })
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item }, { status: 201 })
}
