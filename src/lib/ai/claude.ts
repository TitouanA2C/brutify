import OpenAI from "openai"

const MODEL = "anthropic/claude-sonnet-4.6"

function getClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY non configurée")

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://brutify.app",
      "X-Title": "Brutify",
    },
  })
}

// ─── Script Generation ───────────────────────────────────────────────────────

export interface ScriptParams {
  subject: string
  initial_draft?: string
  hook_type: string
  structure_type: string
  hookTemplate: string
  structureSkeleton: string
  positioning?: {
    tone: string
    global_positioning: string
    differentiation_angle: string
    signature_vocabulary: string[]
    icp: {
      level: string
      pain_points: string[]
      aspirations: string[]
      estimated_profile: string
    }
  } | null
}

export interface ScriptResult {
  hook: string
  body: string
  cta: string
  ai_notes: string
}

export function buildScriptPrompt(params: ScriptParams): string {
  const lines: string[] = [
    "Tu es un expert en création de contenu short-form (Reels, TikTok, Shorts).",
    "",
    `SUJET & VISION : ${params.subject}`,
  ]

  if (params.initial_draft) {
    lines.push(`BROUILLON INITIAL : ${params.initial_draft}`)
  }

  // Positionnement issu des veilles concurrentielles
  if (params.positioning) {
    lines.push(
      "",
      "=== POSITIONNEMENT STRATÉGIQUE (à respecter) ===",
      `Ton général : ${params.positioning.tone}`,
      `Positionnement : ${params.positioning.global_positioning}`,
      `Angle de différenciation : ${params.positioning.differentiation_angle}`,
      `ICP cible : ${params.positioning.icp.estimated_profile}`,
      `Pain points de l'audience : ${params.positioning.icp.pain_points.join(", ")}`,
      `Aspirations de l'audience : ${params.positioning.icp.aspirations.join(", ")}`,
      `Vocabulaire signature : ${params.positioning.signature_vocabulary.join(", ")}`
    )
  }

  lines.push(
    "",
    `TYPE DE HOOK : ${params.hook_type}`,
    `Template de référence (prouvé sur le terrain) : ${params.hookTemplate}`,
    "",
    `STRUCTURE DE SCRIPT : ${params.structure_type}`,
    `Squelette (performances validées) : ${params.structureSkeleton}`,
    "",
    "INSTRUCTIONS :",
    `1. Écris un hook percutant de type "${params.hook_type}" basé sur le template. Le hook doit donner envie de rester. Maximum 2 phrases.`,
    `2. Développe le script en suivant la structure "${params.structure_type}". Chaque section doit être claire et punchy. Le script doit durer entre 30 et 90 secondes à l'oral.`,
    "3. Termine par un CTA engageant (follow, partage, commentaire).",
    "4. Écris une note courte expliquant pourquoi cette combinaison hook + structure fonctionne pour ce sujet.",
    "",
    "FORMAT DE RÉPONSE (respecte exactement ce format) :",
    "[HOOK]",
    "(le hook ici)",
    "",
    "[BODY]",
    "(le développement ici)",
    "",
    "[CTA]",
    "(le CTA ici)",
    "",
    "[NOTES]",
    "(l'explication ici)",
    "",
    "RÈGLES :",
    "- Écris en français",
    "- Tutoie le lecteur",
    params.positioning
      ? `- Adopte le ton et le style identifiés : ${params.positioning.tone}`
      : "- Style : Direct et engageant",
    params.positioning
      ? `- Utilise le vocabulaire signature : ${params.positioning.signature_vocabulary.slice(0, 5).join(", ")}`
      : "",
    "- Pas de hashtags ni d'emojis dans le script",
    "- Sois direct, concret, zéro bullshit",
    "- Utilise des phrases courtes et rythmées",
    params.positioning
      ? `- Adresse directement les pain points : ${params.positioning.icp.pain_points.slice(0, 2).join(", ")}`
      : ""
  )

  return lines.filter(Boolean).join("\n")
}

export function parseScriptResponse(raw: string): ScriptResult {
  const hookMatch = raw.match(/\[HOOK\]\s*\n([\s\S]*?)(?=\[BODY\])/i)
  const bodyMatch = raw.match(/\[BODY\]\s*\n([\s\S]*?)(?=\[CTA\])/i)
  const ctaMatch = raw.match(/\[CTA\]\s*\n([\s\S]*?)(?=\[NOTES\])/i)
  const notesMatch = raw.match(/\[NOTES\]\s*\n([\s\S]*?)$/i)

  if (hookMatch && bodyMatch && ctaMatch && notesMatch) {
    return {
      hook: hookMatch[1].trim(),
      body: bodyMatch[1].trim(),
      cta: ctaMatch[1].trim(),
      ai_notes: notesMatch[1].trim(),
    }
  }

  const parts = raw.split(/\n{2,}/)
  return {
    hook: parts[0]?.trim() ?? "",
    body: parts.slice(1, -2).join("\n\n").trim(),
    cta: parts[parts.length - 2]?.trim() ?? "",
    ai_notes: parts[parts.length - 1]?.trim() ?? "",
  }
}

export async function generateScript(params: ScriptParams): Promise<ScriptResult> {
  const client = getClient()
  const prompt = buildScriptPrompt(params)

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.choices[0]?.message?.content ?? ""
  return parseScriptResponse(text)
}

export async function* streamScript(
  params: ScriptParams
): AsyncGenerator<string, void, unknown> {
  const client = getClient()
  const prompt = buildScriptPrompt(params)

  const stream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) yield text
  }
}

// ─── Idea Generation ─────────────────────────────────────────────────────────

export interface IdeaVideoContext {
  handle: string
  title: string
  outlierScore: number
  views: number
  hookType?: string | null
  structureType?: string | null
  transcriptPreview?: string | null
}

export interface GeneratedIdea {
  title: string
  hook_type: string
  structure: string
  tags: string[]
  why: string
}

function buildIdeasPrompt(videos: IdeaVideoContext[], count: number): string {
  const videoList = videos
    .map((v, i) => {
      const lines = [
        `${i + 1}. @${v.handle} — "${v.title}" [${v.outlierScore}x viral · ${v.views.toLocaleString("fr-FR")} vues]`,
      ]
      if (v.hookType) lines.push(`   Hook : ${v.hookType}`)
      if (v.structureType) lines.push(`   Structure : ${v.structureType}`)
      if (v.transcriptPreview) lines.push(`   Extrait : "${v.transcriptPreview.slice(0, 180)}…"`)
      return lines.join("\n")
    })
    .join("\n\n")

  return `Tu es un stratège de contenu expert en short-form viral (Reels, TikTok, Shorts).

Voici les ${videos.length} vidéos les plus virales des créateurs suivis par cet utilisateur :

${videoList}

En analysant les MÉCANIQUES et FORMATS qui ont surperformé, génère exactement ${count} idées de contenu ORIGINALES.

RÈGLES :
- Idées originales inspirées des formats/mécaniques, PAS des copies de sujets
- Diversifie les hooks et structures — pas deux fois le même hook
- Français uniquement, tutoie, direct et percutant
- Titre accrocheur et spécifique (jamais générique)
- Le champ "why" : 1 phrase max expliquant pourquoi ce format va performer

FORMAT JSON STRICT (tableau JSON uniquement, aucun texte avant ou après) :
[
  {
    "title": "Titre percutant de l'idée",
    "hook_type": "Contrarian|Secret|Douleur|Story|Expérience|Rupture|Chiffre choc|Question",
    "structure": "Problème/Solution|Listicle|Storytelling|Avant/Après|Tutorial|Contrarian|Mythe/Réalité|Défi/Résultat",
    "tags": ["tag1", "tag2", "tag3"],
    "why": "1 phrase : pourquoi ce format va performer"
  }
]`
}

export interface ApiTokenUsage {
  promptTokens: number
  completionTokens: number
  model: string
}

export async function generateIdeas(
  videos: IdeaVideoContext[],
  count = 6,
): Promise<{ ideas: GeneratedIdea[]; usage: ApiTokenUsage }> {
  if (videos.length === 0) throw new Error("Aucune vidéo disponible pour générer des idées")

  const client = getClient()
  const prompt = buildIdeasPrompt(videos, count)

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2500,
    temperature: 0.85,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = response.choices[0]?.message?.content ?? ""
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error("Format de réponse IA invalide")

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedIdea[]
  const usage: ApiTokenUsage = {
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    model: MODEL,
  }
  return { ideas: parsed.slice(0, count), usage }
}

// ─── Video Analysis ──────────────────────────────────────────────────────────

export interface VideoAnalysisResult {
  hook_type: string
  hook_analysis: string
  structure_type: string
  structure_analysis: string
  style_analysis: string
}

function buildAnalysisPrompt(transcript: string): string {
  return `Tu es un expert en analyse de contenu short-form viral.

Voici le transcript d'une vidéo qui a surperformé :

"""
${transcript}
"""

Analyse cette vidéo selon 3 axes :

[HOOK_TYPE]
Le type de hook utilisé parmi : Contrarian, Secret, Douleur, Story, Expérience, Rupture, Chiffre choc, Question

[HOOK_ANALYSIS]
Analyse détaillée du hook : pourquoi il fonctionne, quelle émotion il déclenche, quelle est la promesse implicite.

[STRUCTURE_TYPE]
La structure narrative utilisée parmi : Listicle, Problème/Solution, Storytelling, Contrarian, Tutorial, Avant/Après, Défi/Résultat, Mythe/Réalité

[STRUCTURE_ANALYSIS]
Analyse du déroulé : comment le script maintient l'attention, les transitions, le rythme.

[STYLE_ANALYSIS]
Ton (formel/informel/provocateur), voix (expertise/vulgarisation), vocabulaire (simple/technique), rythme (rapide/posé), niveau de langue.

RÈGLES :
- Réponds en français
- Sois précis et concret
- Chaque section doit contenir 3-5 phrases maximum
- Respecte exactement le format demandé avec les balises entre crochets`
}

function parseAnalysisResponse(raw: string): VideoAnalysisResult {
  const hookType =
    raw.match(/\[HOOK_TYPE\]\s*\n([\s\S]*?)(?=\[HOOK_ANALYSIS\])/i)?.[1]?.trim() ?? "Non identifié"
  const hookAnalysis =
    raw.match(/\[HOOK_ANALYSIS\]\s*\n([\s\S]*?)(?=\[STRUCTURE_TYPE\])/i)?.[1]?.trim() ?? ""
  const structureType =
    raw.match(/\[STRUCTURE_TYPE\]\s*\n([\s\S]*?)(?=\[STRUCTURE_ANALYSIS\])/i)?.[1]?.trim() ?? "Non identifié"
  const structureAnalysis =
    raw.match(/\[STRUCTURE_ANALYSIS\]\s*\n([\s\S]*?)(?=\[STYLE_ANALYSIS\])/i)?.[1]?.trim() ?? ""
  const styleAnalysis =
    raw.match(/\[STYLE_ANALYSIS\]\s*\n([\s\S]*?)$/i)?.[1]?.trim() ?? ""

  return {
    hook_type: hookType,
    hook_analysis: hookAnalysis,
    structure_type: structureType,
    structure_analysis: structureAnalysis,
    style_analysis: styleAnalysis,
  }
}

export async function analyzeVideo(
  transcript: string
): Promise<{ analysis: VideoAnalysisResult; usage: ApiTokenUsage }> {
  const client = getClient()
  const prompt = buildAnalysisPrompt(transcript)

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.choices[0]?.message?.content ?? ""
  const usage: ApiTokenUsage = {
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    model: MODEL,
  }
  return { analysis: parseAnalysisResponse(text), usage }
}
