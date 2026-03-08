import OpenAI from "openai"

const MODEL = "anthropic/claude-sonnet-4.6:beta"

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
  /** Insights from source video analysis (value + positioning + style) */
  videoInsights?: {
    value_analysis?: { delivery_method?: string; depth_level?: string; actionability?: string }
    positioning?: { creator_stance?: string; target_audience?: string; authority_style?: string; content_angle?: string }
    style_notes?: string
    hook_explanation?: { why_it_works?: string; emotion_triggered?: string; implicit_promise?: string }
  } | null
}

export interface ScriptResult {
  hook: string
  body: string
  cta: string
  ai_notes: string
}

function buildContextBlock(p: ScriptParams): string {
  const blocks: string[] = []

  if (p.positioning) {
    blocks.push([
      `Ton : ${p.positioning.tone}`,
      `Positionnement : ${p.positioning.global_positioning}`,
      `Angle : ${p.positioning.differentiation_angle}`,
      `Cible : ${p.positioning.icp.estimated_profile}`,
      `Douleurs : ${p.positioning.icp.pain_points.join(", ")}`,
      `Aspirations : ${p.positioning.icp.aspirations.join(", ")}`,
      `Mots-clés : ${p.positioning.signature_vocabulary.slice(0, 6).join(", ")}`,
    ].join("\n"))
  }

  if (p.videoInsights) {
    const vi = p.videoInsights
    const viParts: string[] = [
      "⚠️ CE QUI SUIT DÉCRIT LA VIDÉO SOURCE (à s'inspirer en TECHNIQUE uniquement).",
      "Le SUJET du script vient EXCLUSIVEMENT du \"SUJET DU CRÉATEUR\" ci-dessus.",
      "Ne reprends AUCUN élément thématique ou factuel de la vidéo source."
    ]
    if (vi.value_analysis?.delivery_method) viParts.push(`Technique de délivrance de valeur à reproduire : ${vi.value_analysis.delivery_method}`)
    if (vi.value_analysis?.actionability) viParts.push(`Niveau d'actionnabilité à viser : ${vi.value_analysis.actionability}`)
    if (vi.positioning?.creator_stance) viParts.push(`Posture à adopter (pas le sujet) : ${vi.positioning.creator_stance}`)
    if (vi.positioning?.authority_style) viParts.push(`Style d'autorité à reproduire : ${vi.positioning.authority_style}`)
    if (vi.hook_explanation?.why_it_works) viParts.push(`Mécanisme psychologique du hook : ${vi.hook_explanation.why_it_works}`)
    if (vi.style_notes) viParts.push(`Ton/style à imiter : ${vi.style_notes}`)
    blocks.push(viParts.join("\n"))
  }

  return blocks.length > 0 ? `═══ CONTEXTE & POSITIONNEMENT ═══\n${blocks.join("\n\n")}` : ""
}

function buildStyleBlock(p: ScriptParams): string {
  const tone = p.positioning?.tone ?? (p.videoInsights?.style_notes ?? "Direct, cash, conversationnel")
  const lines = [
    `═══ TON & STYLE ═══`,
    tone,
    "- Français naturel, oral, fluide — comme si le créateur parlait face caméra",
    "- Phrases courtes. Rythme cassé. Silences implicites entre les idées.",
    '- Des formulations qu\'on utilise VRAIMENT à l\'oral en français ("genre", "en fait", "le truc c\'est que", "et là…") — sans en abuser',
    "- Zéro bullshit corporate. Zéro phrase d'IA détectable.",
    "- De la conviction. De la tension. Des punchlines.",
  ]
  if (p.positioning) {
    lines.push(`- Vocabulaire : ${p.positioning.signature_vocabulary.slice(0, 6).join(", ")}`)
    lines.push(`- Douleurs à viser : ${p.positioning.icp.pain_points.slice(0, 3).join(", ")}`)
  }
  return lines.join("\n")
}

const SCRIPT_INTERDICTIONS = `═══ INTERDICTIONS ABSOLUES ═══
- Pas de hashtags, pas d'emojis
- Pas de "Salut à tous", "Bienvenue", "Aujourd'hui on va parler de"
- Pas de transitions molles ("Passons maintenant à", "Voyons ensemble")
- Pas de formulations IA ("Il est important de noter que", "Dans un monde où")
- Pas de vouvoiement — TUTOIEMENT exclusif
- Pas de phrases qui ne servent à rien — chaque mot doit justifier sa place
- JAMAIS reprendre d'éléments factuels, exemples, ou thématiques de la vidéo source — le contenu vient UNIQUEMENT du sujet du créateur`

export function buildHookPrompt(params: ScriptParams): string {
  const p = params
  return `Tu es un expert en hooks viraux pour le short-form francophone. Ta SEULE mission : écrire LE hook qui fait arrêter le scroll. Rien d'autre.

═══ SUJET DU CRÉATEUR ═══
${p.subject}

${buildContextBlock(p)}

═══ CONTRAINTE HOOK ═══
Type de hook : "${p.hook_type}"
Template éprouvé (à adapter, PAS à copier mot pour mot) : ${p.hookTemplate}
${p.videoInsights?.hook_explanation?.why_it_works ? `Mécanisme psychologique : ${p.videoInsights.hook_explanation.why_it_works}` : ""}
${p.videoInsights?.hook_explanation?.emotion_triggered ? `Émotion à déclencher : ${p.videoInsights.hook_explanation.emotion_triggered}` : ""}
${p.videoInsights?.hook_explanation?.implicit_promise ? `Promesse implicite : ${p.videoInsights.hook_explanation.implicit_promise}` : ""}

${buildStyleBlock(p)}

═══ MISSION ═══
Écris UN hook de 1-2 phrases max. Il doit :
- Créer un micro-choc immédiat (curiosité, désaccord, identification)
- Être adapté au template mais PAS une copie — reformule pour le sujet du créateur
- Sonner comme du français parlé, pas écrit
- Faire que le viewer se dise "attends quoi ??" ou "c'est exactement moi"

Réponds UNIQUEMENT avec le texte du hook. Pas de [HOOK], pas de titre, pas d'explication. Juste le hook brut.

${SCRIPT_INTERDICTIONS}`
}

export function buildBodyPrompt(params: ScriptParams, generatedHook: string): string {
  const p = params
  return `Tu es un ghostwriter d'élite spécialisé en scripts short-form francophones viraux. Tu viens de recevoir un hook déjà écrit et validé. Ta mission : écrire un BODY qui maintient la tension du hook, délivre de la vraie valeur, et garde le viewer scotché jusqu'au CTA.

═══ SUJET DU CRÉATEUR ═══
${p.subject}

═══ HOOK DÉJÀ ÉCRIT (ne PAS modifier, ne PAS répéter) ═══
${generatedHook}

${buildContextBlock(p)}

═══ STRUCTURE IMPOSÉE ═══
Structure : "${p.structure_type}"
Squelette : ${p.structureSkeleton}
${p.videoInsights?.value_analysis?.delivery_method ? `Technique de délivrance de valeur (de la vidéo source — à adapter au SUJET du créateur) : ${p.videoInsights.value_analysis.delivery_method}` : ""}
${p.videoInsights?.positioning?.content_angle ? `Angle rhétorique à reproduire (PAS le sujet — juste l'approche) : ${p.videoInsights.positioning.content_angle}` : ""}

${buildStyleBlock(p)}

═══ TECHNIQUES DE RÉTENTION OBLIGATOIRES ═══
Tu DOIS utiliser ces techniques dans le body :

1. OPEN LOOPS : À la fin d'au moins 2 sections, ouvre une boucle qui donne envie de lire la suite.
   Exemples : "Mais c'est pas le pire.", "Et c'est là que ça devient intéressant.", "Sauf que…", "Le problème, c'est ce qui vient après."

2. TRANSITIONS DYNAMIQUES : Chaque section doit s'enchaîner avec une transition qui crée du mouvement.
   Exemples : "Résultat ?", "Et là, tu te dis…", "Sauf que personne te dit ça.", "La vraie question c'est…", "Maintenant imagine…"

3. VARIATION SYNTAXIQUE : Alterne entre :
   - Phrases déclaratives ("C'est le modèle qui scale.")
   - Questions rhétoriques ("Et tu sais ce qui se passe ?")
   - Fragments / phrases nominales ("Zéro dépendance. Zéro plafond.")
   - Scénarios à la 2e personne ("Tu te lèves, tu checkes tes stats, rien n'a bougé.")
   - Affirmations tranchées ("Point.")
   ⚠️ NE JAMAIS enchaîner plus de 2 phrases qui commencent par "Tu". Varie les débuts de phrases.

4. RYTHME : Alterne phrases longues (qui développent) et phrases ultra-courtes (qui claquent). Le rythme doit RESPIRER.

═══ BODY — INSTRUCTIONS ═══
- 3 à 5 sous-sections avec ### Titre
- Chaque sous-section = 2 à 5 phrases. Assez pour développer l'idée, pas assez pour ennuyer.
- Le body doit PROLONGER le hook et CONSTRUIRE vers le CTA — chaque section fait monter la tension d'un cran
- La structure "${p.structure_type}" guide le flow, mais le contenu doit sonner naturel et vivant, pas comme un template rempli
- Le script doit donner l'impression que le créateur PENSE en live, pas qu'il lit un prompteur
${p.videoInsights ? "- Reproduis les TECHNIQUES (rythme, posture, méthode de valeur) de la vidéo source — mais le contenu, les exemples et les arguments doivent venir UNIQUEMENT du sujet du créateur. Zéro contenu thématique de la vidéo source." : ""}

═══ CTA — INSTRUCTIONS ═══
- 1 à 2 phrases, naturel, qui découle de la dernière section
- Doit donner une raison SPÉCIFIQUE de s'engager (pas juste "abonne-toi")
- Peut être un mini open loop vers un futur contenu

═══ NOTES — INSTRUCTIONS ═══
- 2-3 phrases : pourquoi cette combinaison hook + structure fonctionne pour CE sujet

═══ DURÉE CIBLE ═══
Body + CTA à l'oral : 40-60 secondes (150-250 mots). C'est un short-form, pas un tweet thread.

═══ FORMAT EXACT ═══
[BODY]
### Titre section 1
(texte avec transitions et open loops)

### Titre section 2
(texte)

### Titre section 3
(texte)

(3 à 5 sections selon la structure)

[CTA]
(cta naturel et spécifique)

[NOTES]
(analyse courte)

═══ INTERDICTIONS ═══
${SCRIPT_INTERDICTIONS}
- JAMAIS plus de 2 phrases consécutives commençant par "Tu"
- JAMAIS de sections qui se répètent dans leur structure (si une section fait "affirmation + explication", la suivante doit avoir un pattern différent)
- Le body ne doit PAS reformuler le hook
- Pas de conclusions intermédiaires ("En résumé", "Donc en gros") — garde la tension jusqu'au CTA
- Pas de listes à puces dans le script — c'est un texte oral, pas un article`
}

/** @deprecated Use buildHookPrompt + buildBodyPrompt */
export function buildScriptPrompt(params: ScriptParams): string {
  return buildHookPrompt(params)
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

  // Step 1: Generate hook
  const hookRes = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: buildHookPrompt(params) }],
  })
  const hook = hookRes.choices[0]?.message?.content?.trim() ?? ""

  // Step 2: Generate body + CTA + notes with the hook
  const bodyRes = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [{ role: "user", content: buildBodyPrompt(params, hook) }],
  })
  const bodyRaw = bodyRes.choices[0]?.message?.content ?? ""
  const parsed = parseScriptResponse(`[HOOK]\n${hook}\n\n${bodyRaw}`)

  return { ...parsed, hook }
}

export async function* streamScript(
  params: ScriptParams
): AsyncGenerator<string, void, unknown> {
  const client = getClient()

  // ── Phase 1: Stream the hook ──
  yield "[HOOK]\n"

  let generatedHook = ""
  const hookStream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: buildHookPrompt(params) }],
    stream: true,
  })

  for await (const chunk of hookStream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) {
      generatedHook += text
      yield text
    }
  }

  yield "\n\n"

  // ── Phase 2: Stream the body + CTA + notes ──
  const bodyStream = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [{ role: "user", content: buildBodyPrompt(params, generatedHook.trim()) }],
    stream: true,
  })

  for await (const chunk of bodyStream) {
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

// ─── Video Analysis (v2 — structural + deep analysis) ───────────────────────

export const SECTION_TYPES = [
  "hook", "setup", "value", "bridge", "proof", "twist", "cta", "loop",
] as const
export type SectionType = (typeof SECTION_TYPES)[number]

export interface StructuralSection {
  type: SectionType
  label: string
  content: string
}

export interface HookExplanation {
  why_it_works: string
  emotion_triggered: string
  implicit_promise: string
}

export interface StructureExplanation {
  why_effective: string
  retention_techniques: string[]
  rhythm_and_transitions: string
}

export interface ValueAnalysis {
  delivery_method: string
  depth_level: string
  actionability: string
}

export interface PositioningAnalysis {
  creator_stance: string
  target_audience: string
  authority_style: string
  content_angle: string
}

export interface FullVideoAnalysis {
  sections: StructuralSection[]
  hook_explanation: HookExplanation
  structure_explanation: StructureExplanation
  value_analysis: ValueAnalysis
  positioning: PositioningAnalysis
  style_notes: string
}

export interface VideoAnalysisResult {
  hook_type: string
  hook_analysis: string
  structure_type: string
  structure_analysis: string
  style_analysis: string
}

function buildStructuralPrompt(transcript: string): string {
  return `Expert en déconstruction de scripts short-form viral (Reels, TikTok, Shorts).

Transcript :
"""
${transcript}
"""

Analyse ce script. RÉPONDS UNIQUEMENT en JSON (rien avant, rien après).

{
  "hook_type": "Contrarian|Secret|Douleur|Story|Expérience|Rupture|Chiffre choc|Question|Tutorial|Teasing",
  "structure_type": "Listicle|Problème/Solution|Storytelling|Contrarian|Tutorial|Avant/Après|Défi/Résultat|Mythe/Réalité|Boucle|Valeur pure",
  "sections": [
    { "type": "hook|setup|value|bridge|proof|twist|cta|loop", "label": "Nom FR", "content": "texte VERBATIM" }
  ],
  "hook_explanation": {
    "why_it_works": "1 phrase : mécanisme psychologique activé",
    "emotion_triggered": "1 mot ou expression : émotion immédiate du viewer",
    "implicit_promise": "1 phrase : ce que le viewer espère obtenir"
  },
  "structure_explanation": {
    "why_effective": "1 phrase : pourquoi cette structure retient l'attention",
    "retention_techniques": ["technique 1", "technique 2", "technique 3"],
    "rhythm_and_transitions": "1 phrase : style de pacing"
  },
  "value_analysis": {
    "delivery_method": "1 phrase : comment la valeur est délivrée",
    "depth_level": "Ex: '70% actionnable / 30% mindset'",
    "actionability": "1 phrase : next step concret pour le viewer"
  },
  "positioning": {
    "creator_stance": "1-3 mots : posture (ex: 'Insider challenger')",
    "target_audience": "1 phrase : profil type du viewer",
    "authority_style": "1 phrase : comment la crédibilité est construite",
    "content_angle": "1 phrase : angle différenciant"
  },
  "style_notes": "Max 10 mots sur le ton et le style"
}

RÈGLES ABSOLUES :
- Sections : redistribue TOUT le texte VERBATIM, ordre chronologique
- Hook/Structure/Valeur/Positionnement : ULTRA-CONCIS. 1 phrase max par champ. Pas de pavés.
- retention_techniques : 2-4 mots par technique, max 4 techniques
- Spécifique à CE script, pas de généralités
- Français uniquement`
}

interface ParsedStructuralResponse {
  hook_type: string
  structure_type: string
  sections: StructuralSection[]
  hook_explanation: HookExplanation
  structure_explanation: StructureExplanation
  value_analysis: ValueAnalysis
  positioning: PositioningAnalysis
  style_notes: string
}

function parseStructuralResponse(raw: string): ParsedStructuralResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Réponse IA invalide — JSON non trouvé")
  }

  const parsed = JSON.parse(jsonMatch[0])

  const sections: StructuralSection[] = (parsed.sections ?? [])
    .filter((s: { type?: string; content?: string }) => s.type && s.content)
    .map((s: { type?: string; label?: string; content?: string }) => ({
      type: (SECTION_TYPES.includes(s.type as SectionType) ? s.type : "value") as SectionType,
      label: s.label || s.type || "Section",
      content: s.content || "",
    }))

  if (sections.length === 0) {
    throw new Error("Réponse IA invalide — aucune section détectée")
  }

  const fallbackHook: HookExplanation = { why_it_works: "", emotion_triggered: "", implicit_promise: "" }
  const fallbackStructure: StructureExplanation = { why_effective: "", retention_techniques: [], rhythm_and_transitions: "" }
  const fallbackValue: ValueAnalysis = { delivery_method: "", depth_level: "", actionability: "" }
  const fallbackPositioning: PositioningAnalysis = { creator_stance: "", target_audience: "", authority_style: "", content_angle: "" }

  return {
    hook_type: parsed.hook_type ?? "Non identifié",
    structure_type: parsed.structure_type ?? "Non identifié",
    sections,
    hook_explanation: parsed.hook_explanation
      ? { ...fallbackHook, ...parsed.hook_explanation }
      : fallbackHook,
    structure_explanation: parsed.structure_explanation
      ? { ...fallbackStructure, ...parsed.structure_explanation }
      : fallbackStructure,
    value_analysis: parsed.value_analysis
      ? { ...fallbackValue, ...parsed.value_analysis }
      : fallbackValue,
    positioning: parsed.positioning
      ? { ...fallbackPositioning, ...parsed.positioning }
      : fallbackPositioning,
    style_notes: parsed.style_notes ?? "",
  }
}

export async function analyzeVideo(
  transcript: string
): Promise<{ analysis: VideoAnalysisResult; usage: ApiTokenUsage }> {
  const client = getClient()
  const prompt = buildStructuralPrompt(transcript)

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  })

  const text = response.choices[0]?.message?.content ?? ""
  const usage: ApiTokenUsage = {
    promptTokens: response.usage?.prompt_tokens ?? 0,
    completionTokens: response.usage?.completion_tokens ?? 0,
    model: MODEL,
  }

  const structural = parseStructuralResponse(text)

  const fullAnalysis: FullVideoAnalysis = {
    sections: structural.sections,
    hook_explanation: structural.hook_explanation,
    structure_explanation: structural.structure_explanation,
    value_analysis: structural.value_analysis,
    positioning: structural.positioning,
    style_notes: structural.style_notes,
  }

  const result: VideoAnalysisResult = {
    hook_type: structural.hook_type,
    structure_type: structural.structure_type,
    hook_analysis: JSON.stringify(fullAnalysis),
    structure_analysis: structural.style_notes,
    style_analysis: "v2_structural",
  }

  return { analysis: result, usage }
}

/** Parse stored v2 data from the hook_analysis column */
export function parseStoredAnalysis(hookAnalysis: string): FullVideoAnalysis | null {
  try {
    const parsed = JSON.parse(hookAnalysis)
    if (Array.isArray(parsed)) {
      return {
        sections: parsed.filter((s: StructuralSection) => s.type && s.content),
        hook_explanation: { why_it_works: "", emotion_triggered: "", implicit_promise: "" },
        structure_explanation: { why_effective: "", retention_techniques: [], rhythm_and_transitions: "" },
        value_analysis: { delivery_method: "", depth_level: "", actionability: "" },
        positioning: { creator_stance: "", target_audience: "", authority_style: "", content_angle: "" },
        style_notes: "",
      }
    }
    if (parsed.sections && Array.isArray(parsed.sections)) {
      return parsed as FullVideoAnalysis
    }
    return null
  } catch {
    return null
  }
}
