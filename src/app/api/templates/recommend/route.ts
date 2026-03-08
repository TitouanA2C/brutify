import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"

const MODEL = "anthropic/claude-sonnet-4.6:beta"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  let parsed: { subject: string; hooks: Array<{ id: string; name: string; template: string }>; structures: Array<{ id: string; name: string; skeleton: string }> }
  try { parsed = await request.json() } catch { return NextResponse.json({ hook_id: null, structure_id: null }) }
  const { subject, hooks, structures } = parsed as {
    subject: string
    hooks: Array<{ id: string; name: string; template: string }>
    structures: Array<{ id: string; name: string; skeleton: string }>
  }

  if (!subject || subject.length < 30 || !hooks?.length || !structures?.length) {
    return NextResponse.json({ hook_id: null, structure_id: null })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return NextResponse.json({ hook_id: null, structure_id: null })

  const client = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "https://brutify.app", "X-Title": "Brutify" },
  })

  const hookList = hooks.map(h => `[${h.id}] ${h.name}: "${h.template}"`).join("\n")
  const structList = structures.map(s => `[${s.id}] ${s.name}: ${s.skeleton}`).join("\n")

  const prompt = `Tu es un expert en stratégie de contenu short-form. Un créateur veut faire un script sur :

"${subject.slice(0, 500)}"

Hooks disponibles :
${hookList}

Structures disponibles :
${structList}

Choisis le hook ET la structure les plus adaptés. Réponds UNIQUEMENT en JSON strict :
{"hook_id":"...","structure_id":"...","reason":"1 phrase"}`

  try {
    const res = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    })

    const text = res.choices[0]?.message?.content?.trim() ?? ""
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim()
    const json = JSON.parse(cleaned)

    return NextResponse.json({
      hook_id: json.hook_id ?? null,
      structure_id: json.structure_id ?? null,
      reason: json.reason ?? null,
    })
  } catch {
    return NextResponse.json({ hook_id: null, structure_id: null })
  }
}
