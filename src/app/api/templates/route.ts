import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: templates } = await supabase
    .from("user_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("performance_score", { ascending: false })
    .order("use_count", { ascending: false })

  const hooks = (templates ?? []).filter(t => t.kind === "hook")
  const structures = (templates ?? []).filter(t => t.kind === "structure")

  return NextResponse.json({ hooks, structures })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  let body: {
    items: Array<{
      kind: "hook" | "structure"
      name: string
      template: string
      hook_type?: string
      skeleton?: string
      description?: string
      source: "video" | "veille" | "manual"
      source_id?: string
      performance_score?: number
    }>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 })
  }

  if (!body.items?.length) {
    return NextResponse.json({ error: "Aucun template" }, { status: 400 })
  }

  const rows = body.items.map(item => ({
    user_id: user.id,
    kind: item.kind,
    name: item.name,
    template: item.template,
    hook_type: item.hook_type ?? null,
    skeleton: item.skeleton ?? null,
    description: item.description ?? null,
    source: item.source,
    source_id: item.source_id ?? null,
    performance_score: item.performance_score ?? 0,
  }))

  const { data: inserted, error } = await supabase
    .from("user_templates")
    .upsert(rows, { onConflict: "id" })
    .select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: inserted ?? [] }, { status: 201 })
}
