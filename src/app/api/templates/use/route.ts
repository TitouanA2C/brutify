import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Body invalide" }, { status: 400 }) }
  const { template_id } = body as { template_id?: string }
  if (!template_id) return NextResponse.json({ error: "template_id requis" }, { status: 400 })

  // Skip non-persisted IDs (source-hook-xxx, source-struct-xxx)
  if (typeof template_id === "string" && template_id.startsWith("source-")) {
    return NextResponse.json({ ok: true })
  }

  await supabase.rpc("increment_template_use", { tid: template_id, uid: user.id })

  return NextResponse.json({ ok: true })
}
