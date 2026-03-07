import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()

  const [hookRes, structRes] = await Promise.all([
    supabase
      .from("hook_templates")
      .select("id, name, type, template, performance_score")
      .order("performance_score", { ascending: false }),
    supabase
      .from("script_structures")
      .select("id, name, description, skeleton")
      .order("name", { ascending: true }),
  ])

  return NextResponse.json({
    hookTemplates: hookRes.data ?? [],
    scriptStructures: structRes.data ?? [],
  })
}
