import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/notifications — fetch last 30 notifications
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ notifications: data ?? [] })
}

// PATCH /api/notifications — mark ids as read (or all if ids=[])
export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] | undefined = body.ids

  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)

  if (ids && ids.length > 0) {
    query = query.in("id", ids)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
