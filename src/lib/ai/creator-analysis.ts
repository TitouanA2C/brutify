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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatorAnalysisInput {
  creatorName: string
  creatorHandle: string
  creatorNiche: string
  creatorFollowers: number
  creatorPlatform: string
  userNiche: string
  videos: AnalysisVideoData[]
}

export interface AnalysisVideoData {
  title: string
  caption: string
  transcript: string | null
  views: number
  likes: number
  comments: number
  shares: number
  outlier_score: number
  duration: number
  posted_at: string
}

export interface CreatorAnalysisResult {
  positioning: {
    global_positioning: string
    differentiation_angle: string
    implicit_promise: string
    authority_building: string
    authority_vs_proximity_ratio: string
    tone: string
    signature_vocabulary: string[]
    icp: {
      level: string
      pain_points: string[]
      aspirations: string[]
      estimated_profile: string
    }
  }
  hooks: {
    catalog: Array<{
      video_title: string
      hook_text: string
      hook_type: string
      outlier_score: number
      why_it_works: string
    }>
    top_performing_types: string[]
    linguistic_patterns: string
    top_5: Array<{
      hook_text: string
      hook_type: string
      outlier_score: number
      analysis: string
    }>
    reusable_templates: Array<{
      template: string
      hook_type: string
      based_on: string
    }>
  }
  script_structures: {
    detected_structures: Array<{
      name: string
      skeleton: string
      frequency: number
      avg_outlier_score: number
      example_video: string
    }>
    best_performing_combos: string
    retention_techniques: string[]
    transition_patterns: string
  }
  value_delivery: {
    primary_methods: string[]
    depth_vs_surface: string
    actionability_ratio: string
    cta_patterns: {
      types: string[]
      frequency: string
      sales_aggressiveness: string
      integration_style: string
    }
  }
  funnel_strategy: {
    tofu: {
      percentage: number
      formats: string[]
      characteristics: string
      detected_objective: string
    }
    mofu: {
      percentage: number
      formats: string[]
      characteristics: string
      detected_objective: string
    }
    bofu: {
      percentage: number
      formats: string[]
      characteristics: string
      detected_objective: string
    }
    distribution_analysis: string
    recommended_distribution: string
  }
  topics: {
    content_pillars: Array<{
      name: string
      percentage: number
      avg_outlier_score: number
      example: string
    }>
    outlier_topics: Array<{
      topic: string
      subject: string
      vision: string
      why_it_works: string
      best_video_title?: string
    }>
    underperforming_topics: string[]
    missed_opportunities: string[]
  }
  metrics: {
    avg_views: number
    median_views: number
    avg_engagement_rate: number
    outlier_count: number
    mega_outlier_count: number
    posting_frequency: string
    temporal_patterns: string
    performance_trend: string
  }
  key_takeaways: string[]
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildCreatorAnalysisPrompt(input: CreatorAnalysisInput): string {
  const videosJson = JSON.stringify(
    input.videos.map((v) => ({
      title: v.title || "Sans titre",
      caption: v.caption || "",
      transcript: v.transcript || "Non disponible",
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares,
      outlier_score: v.outlier_score,
      duration: v.duration,
      posted_at: v.posted_at,
    })),
    null,
    2
  )

  return `Tu es un analyste expert en stratégie de contenu short-form et en personal branding. Tu as 15 ans d'expérience en déconstruction de stratégies de créateurs à succès.

Je vais te fournir les vidéos les plus performantes du compte ${input.creatorPlatform} de **${input.creatorName}** (${input.creatorHandle}), un créateur dans la niche **${input.creatorNiche}** avec **${input.creatorFollowers.toLocaleString("fr-FR")}** abonnés.

L'utilisateur Brutify qui demande cette analyse est dans la niche **${input.userNiche}**. Contextualise tes recommandations pour qu'elles soient actionnables dans cette niche.

Ta mission : déconstruire entièrement la stratégie de contenu de ce créateur pour en extraire des patterns actionnables.

---

DONNÉES DU CRÉATEUR (${input.videos.length} meilleures vidéos par outlier score) :
${videosJson}

---

## ANALYSE DEMANDÉE

Structure ta réponse exactement selon le format ci-dessous. Sois factuel — base chaque insight sur des données concrètes tirées des vidéos fournies. Cite des exemples précis (titres de vidéos, extraits de hooks, chiffres).


### 1. POSITIONNEMENT & PERSONAL BRANDING

**1.1 Positionnement global**
- Comment ce créateur se positionne-t-il dans sa niche ? (expert, mentor, pair, provocateur, vulgarisateur, insider, challenger...)
- Quelle est sa "promesse implicite" — qu'est-ce que le viewer obtient en le suivant ?
- Quel est son angle de différenciation par rapport au reste de la niche ?

**1.2 Construction d'autorité**
- Comment construit-il son autorité vidéo après vidéo ? (preuves sociales, résultats personnels, données/études, name dropping, expérience terrain, certifications...)
- Quel est son ratio autorité vs proximité vs provocation ?

**1.3 Relation avec l'audience**
- Ton général (formel/informel, tutoiement/vouvoiement, énergie haute/posée)
- Vocabulaire signature (expressions récurrentes, termes propres à lui)

**1.4 ICP ciblé**
- Qui est le viewer type ? (niveau débutant/intermédiaire/avancé, âge estimé, situation)
- Quels pain points sont ciblés en priorité ?
- Quelles aspirations/transformations sont promises ?


### 2. HOOKS

C'est la section la plus importante. Le hook = les 3 à 10 premières secondes. C'est ce qui arrête le scroll.

**2.1 Catalogue des hooks**
Pour CHAQUE vidéo analysée, extrais le hook exact (les premières phrases du transcript). Classe-les par type :
- **Contrarian** — attaque une croyance populaire ("Tout le monde te dit que X... c'est faux")
- **Secret/Révélation** — promet une info cachée ou méconnue ("Personne ne parle de X")
- **Douleur** — pointe un problème/erreur du viewer ("Si tu fais X, tu perds Y")
- **Expérience personnelle** — "j'ai testé/vécu X"
- **Chiffre choc** — statistique ou résultat surprenant
- **Question provocante** — question rhétorique qui crée la curiosité
- **Story** — début d'une histoire personnelle
- **Rupture** — "oublie X, voilà Y"
- **Autorité directe** — "en tant que X, voilà ce que je sais"
- **Autre** — nomme-le

**2.2 Patterns de hooks performants**
- Quels types de hooks ont les meilleurs outlier scores ?
- Quels patterns linguistiques reviennent dans les hooks qui surperforment ?
- Quelles émotions sont déclenchées (curiosité, peur, désaccord, identification) ?

**2.3 Top 5 hooks avec le meilleur outlier score**
Pour chacun : texte exact du hook, type, outlier score, et analyse détaillée (mécanisme psychologique, émotion déclenchée, promesse implicite, pourquoi ça arrête le scroll).

**2.4 Templates de hooks réutilisables**
Extrais 5 à 8 templates de hooks (avec des [variables]) inspirés des meilleurs hooks de ce créateur.
Chaque template doit être :
- Adaptable à N'IMPORTE QUEL sujet dans la niche de l'utilisateur
- Basé sur le mécanisme psychologique qui fait fonctionner le hook original
- Formulé comme une vraie phrase de hook prête à adapter (pas une description abstraite)
Exemple bon : "[Résultat impressionnant] — et pourtant [contradiction inattendue]"
Exemple mauvais : "Hook qui présente un résultat puis une contradiction"


### 3. STRUCTURES DE SCRIPT

**3.1 Structures détectées**
Analyse le déroulé complet de chaque vidéo et identifie les structures narratives. Pour chaque structure :
- Nom (Listicle, Problème/Solution, Storytelling, Tutorial, Avant/Après, Défi/Résultat, Mythe/Réalité, Démonstration, Escalade, ou autre — nomme précisément)
- Squelette DÉTAILLÉ : découpe en 3-6 étapes numérotées avec le rôle de chaque étape (ex: "1. Hook → 2. Problème identifié → 3. Fausse solution → 4. Vraie solution → 5. Preuve → 6. CTA"). Le squelette doit être assez précis pour qu'on puisse l'utiliser directement comme template de script.
- Fréquence d'utilisation
- Outlier score moyen

**3.2 Combinaisons performantes**
- Quelles combinaisons hook_type + structure surperforment ? Sois précis (ex: "Contrarian + Mythe/Réalité → outlier moyen 4.2x")

**3.3 Gestion de la rétention**
- Techniques de rétention : boucles de curiosité, open loops, pattern interrupts, questions rhétoriques, micro-cliffhangers
- Patterns de transition entre sections (comment le créateur passe d'une section à l'autre sans perdre l'attention)
- Comment le créateur gère le rythme (alternance phrases courtes/longues, silences, accélération)


### 4. DELIVERY DE VALEUR

**4.1 Méthodes de valeur** : Comment le créateur délivre de la valeur ? (preuve, exemple concret, analogie, framework propriétaire, storytelling, provocation, données, expérience terrain). Identifie la méthode DOMINANTE et les méthodes secondaires.
**4.2 Profondeur vs Surface** : ratio information actionnable vs motivation/inspiration. Le créateur donne-t-il des étapes concrètes ou reste-t-il au niveau conceptuel ?
**4.3 Actionabilité** : Après avoir regardé une vidéo, le viewer peut-il faire quelque chose immédiatement ? Score de 1 à 10.
**4.4 Patterns de CTA** : types (follow, commentaire, produit, lead magnet, prochain contenu), fréquence, agressivité commerciale, style d'intégration (hard sell, soft mention, naturel, call-to-engagement)


### 5. STRATÉGIE DE FUNNEL

Classe les vidéos en TOFU (acquisition), MOFU (nurturing), BOFU (conversion).
Pour chaque niveau : %, formats, caractéristiques, objectif détecté.
Analyse la répartition et recommande une distribution optimale.


### 6. SUJETS & THÉMATIQUES

**6.1 Piliers de contenu** : 3-5 grands piliers avec % et performance
**6.2 Sujets outliers** : sujets qui surperforment
**6.3 Angles orphelins** : opportunités thématiques manquées


### 7. MÉTRIQUES & PATTERNS

Performance globale, patterns temporels, tendance d'évolution.

---

## FORMAT DE RÉPONSE

Réponds en JSON structuré selon ce schéma exact :

{
  "positioning": {
    "global_positioning": "string",
    "differentiation_angle": "string",
    "implicit_promise": "string",
    "authority_building": "string",
    "authority_vs_proximity_ratio": "string",
    "tone": "string",
    "signature_vocabulary": ["string"],
    "icp": {
      "level": "string",
      "pain_points": ["string"],
      "aspirations": ["string"],
      "estimated_profile": "string"
    }
  },
  "hooks": {
    "catalog": [
      {
        "video_title": "string",
        "hook_text": "string",
        "hook_type": "string",
        "outlier_score": number,
        "why_it_works": "string"
      }
    ],
    "top_performing_types": ["string"],
    "linguistic_patterns": "string",
    "top_5": [
      {
        "hook_text": "string — texte EXACT du hook",
        "hook_type": "string",
        "outlier_score": number,
        "analysis": "string — pourquoi ça fonctionne",
        "emotion_triggered": "string — curiosité, peur, désaccord, identification, etc.",
        "implicit_promise": "string — ce que le viewer espère obtenir en restant"
      }
    ],
    "reusable_templates": [
      {
        "template": "string",
        "hook_type": "string",
        "based_on": "string"
      }
    ]
  },
  "script_structures": {
    "detected_structures": [
      {
        "name": "string",
        "skeleton": "string",
        "frequency": number,
        "avg_outlier_score": number,
        "example_video": "string"
      }
    ],
    "best_performing_combos": "string",
    "retention_techniques": ["string"],
    "transition_patterns": "string"
  },
  "value_delivery": {
    "primary_methods": ["string"],
    "depth_vs_surface": "string",
    "actionability_ratio": "string",
    "cta_patterns": {
      "types": ["string"],
      "frequency": "string",
      "sales_aggressiveness": "string",
      "integration_style": "string"
    }
  },
  "funnel_strategy": {
    "tofu": {
      "percentage": number,
      "formats": ["string"],
      "characteristics": "string",
      "detected_objective": "string"
    },
    "mofu": {
      "percentage": number,
      "formats": ["string"],
      "characteristics": "string",
      "detected_objective": "string"
    },
    "bofu": {
      "percentage": number,
      "formats": ["string"],
      "characteristics": "string",
      "detected_objective": "string"
    },
    "distribution_analysis": "string",
    "recommended_distribution": "string"
  },
  "topics": {
    "content_pillars": [
      {
        "name": "string",
        "percentage": number,
        "avg_outlier_score": number,
        "example": "string"
      }
    ],
    "outlier_topics": [
      {
        "topic": "string — le sujet qui surperforme (titre court)",
        "subject": "string — description détaillée du sujet : QUOI dire exactement, quel angle prendre, quel problème adresser, quelle thèse défendre (3-5 phrases, assez précis pour qu'un scriptwriter puisse écrire un script complet sans rien inventer)",
        "vision": "string — comment aborder ce sujet : ton à adopter, émotion à provoquer, structure narrative suggérée, ce qui fait que CE sujet capte l'attention de l'audience de ce créateur (2-3 phrases)",
        "why_it_works": "string — pourquoi ce sujet surperforme en termes de métriques (1-2 phrases)",
        "best_video_title": "string — titre de la meilleure vidéo sur ce sujet"
      }
    ],
    "underperforming_topics": ["string"],
    "missed_opportunities": ["string"]
  },
  "metrics": {
    "avg_views": number,
    "median_views": number,
    "avg_engagement_rate": number,
    "outlier_count": number,
    "mega_outlier_count": number,
    "posting_frequency": "string",
    "temporal_patterns": "string",
    "performance_trend": "string"
  },
  "key_takeaways": [
    "string — les 5-7 insights les plus importants et actionnables"
  ]
}

RÈGLES ABSOLUES :
- Sois factuel et data-driven. Chaque affirmation doit être basée sur les données fournies.
- Cite des exemples concrets (titres de vidéos, extraits de texte).
- Si tu n'as pas assez de données pour un champ, mets "insufficient_data" au lieu d'inventer.
- Le hook_text doit être le texte EXACT des premières secondes du transcript, pas une paraphrase.
- Les templates de hooks doivent utiliser des [variables] entre crochets pour être réutilisables. Ils doivent être des PHRASES PRÊTES À ADAPTER, pas des descriptions abstraites.
- Les squelettes de structure doivent être des étapes numérotées et actionnables, pas des descriptions vagues.
- Les outlier_scores doivent correspondre aux données fournies, pas être inventés.
- Analyse AU MOINS 20 vidéos dans le catalogue de hooks (pas seulement le top 5).
- Pour chaque hook, explique le MÉCANISME PSYCHOLOGIQUE (pas juste "c'est accrocheur").
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après. Pas de markdown, pas de backticks.
- Écris en français.`
}

// ─── API Call ─────────────────────────────────────────────────────────────────

function repairTruncatedJson(raw: string): string {
  let json = raw.trim()

  const jsonStart = json.indexOf("{")
  if (jsonStart > 0) json = json.slice(jsonStart)

  const lastBrace = json.lastIndexOf("}")
  if (lastBrace === -1) {
    json += '""}'
  } else {
    json = json.slice(0, lastBrace + 1)
  }

  let openBraces = 0, openBrackets = 0
  for (const ch of json) {
    if (ch === "{") openBraces++
    else if (ch === "}") openBraces--
    else if (ch === "[") openBrackets++
    else if (ch === "]") openBrackets--
  }

  while (openBrackets > 0) { json += "]"; openBrackets-- }
  while (openBraces > 0) { json += "}"; openBraces-- }

  return json
}

const MAX_RETRIES = 2

export async function analyzeCreator(
  input: CreatorAnalysisInput
): Promise<{ analysis: CreatorAnalysisResult; usage: { promptTokens: number; completionTokens: number } }> {
  const client = getClient()
  const prompt = buildCreatorAnalysisPrompt(input)

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[VEILLE:Claude] attempt ${attempt}/${MAX_RETRIES}`)

    let response
    try {
      response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 24000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      })
    } catch (apiError) {
      lastError = new Error(`Erreur API OpenRouter: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
      console.error(`[VEILLE:Claude] API error attempt ${attempt}:`, lastError.message)
      if (attempt < MAX_RETRIES) continue
      throw lastError
    }

    const raw = response.choices[0]?.message?.content ?? ""
    const finishReason = response.choices[0]?.finish_reason ?? "unknown"
    const tokens = {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    }

    console.log(`[VEILLE:Claude] response received`, {
      rawLength: raw.length,
      finishReason,
      ...tokens,
    })

    if (!raw || raw.length < 100) {
      lastError = new Error(`Réponse IA vide ou trop courte (${raw.length} chars, finish_reason: ${finishReason})`)
      console.error(`[VEILLE:Claude] ${lastError.message}`)
      if (attempt < MAX_RETRIES) continue
      throw lastError
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error(`[VEILLE:Claude] no JSON found in response, first 500 chars:`, raw.slice(0, 500))
      lastError = new Error("Format de réponse IA invalide — JSON non trouvé")
      if (attempt < MAX_RETRIES) continue
      throw lastError
    }

    let analysis: CreatorAnalysisResult
    try {
      analysis = JSON.parse(jsonMatch[0])
    } catch {
      console.warn(`[VEILLE:Claude] JSON.parse failed, attempting repair (finish_reason: ${finishReason})`)
      try {
        const repaired = repairTruncatedJson(raw)
        analysis = JSON.parse(repaired)
        console.log(`[VEILLE:Claude] JSON repair succeeded`)
      } catch {
        console.error(`[VEILLE:Claude] JSON repair also failed, last 200 chars of raw:`, raw.slice(-200))
        lastError = new Error(`Impossible de parser le JSON (finish_reason: ${finishReason}, length: ${raw.length})`)
        if (attempt < MAX_RETRIES) continue
        throw lastError
      }
    }

    console.log(`[VEILLE:Claude] analysis parsed successfully on attempt ${attempt}`)
    return { analysis, usage: tokens }
  }

  throw lastError ?? new Error("Erreur inattendue dans analyzeCreator")
}
