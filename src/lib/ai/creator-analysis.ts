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
    outlier_topics: string[]
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

C'est la section la plus importante. Le hook = les 3 à 10 premières secondes.

**2.1 Catalogue des hooks**
Pour chaque vidéo analysée, extrais le hook exact (les premières phrases du transcript). Classe-les par type :
- **Contrarian** — attaque une croyance populaire
- **Secret/Révélation** — promet une info cachée ou méconnue
- **Douleur** — pointe un problème/erreur du viewer
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

**2.3 Top 5 hooks avec le meilleur outlier score**
Pour chacun : texte exact du hook, type, outlier score, pourquoi il fonctionne.

**2.4 Templates de hooks réutilisables**
Extrais 5 templates de hooks (avec des [variables]) inspirés des meilleurs hooks de ce créateur.


### 3. STRUCTURES DE SCRIPT

**3.1 Structures détectées**
Analyse le déroulé complet de chaque vidéo et identifie les structures narratives. Pour chaque structure :
- Nom (Listicle, Problème/Solution, Storytelling, Tutorial, Avant/Après, Défi/Résultat, Mythe/Réalité, Démonstration, ou autre)
- Squelette détaillé
- Fréquence d'utilisation
- Outlier score moyen

**3.2 Combinaisons performantes**
- Quelles combinaisons hook + structure surperforment ?

**3.3 Gestion de la rétention**
- Techniques de rétention (boucles de curiosité, open loops, pattern interrupts...)
- Patterns de transition


### 4. DELIVERY DE VALEUR

**4.1 Méthodes de valeur** : preuve, exemple concret, analogie, framework, storytelling, provocation
**4.2 Profondeur vs Surface** : ratio information actionnable vs motivation
**4.3 Patterns de CTA** : types, fréquence, intégration de la vente


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
        "hook_text": "string",
        "hook_type": "string",
        "outlier_score": number,
        "analysis": "string"
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
    "outlier_topics": ["string"],
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

RÈGLES :
- Sois factuel et data-driven. Chaque affirmation doit être basée sur les données fournies.
- Cite des exemples concrets (titres de vidéos, extraits de texte).
- Si tu n'as pas assez de données pour un champ, mets "insufficient_data" au lieu d'inventer.
- Le hook_text doit être le texte EXACT des premières secondes du transcript, pas une paraphrase.
- Les templates de hooks doivent utiliser des [variables] pour être réutilisables.
- Les outlier_scores doivent correspondre aux données fournies, pas être inventés.
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après. Pas de markdown, pas de backticks.
- Écris en français.`
}

// ─── API Call ─────────────────────────────────────────────────────────────────

export async function analyzeCreator(
  input: CreatorAnalysisInput
): Promise<{ analysis: CreatorAnalysisResult; usage: { promptTokens: number; completionTokens: number } }> {
  console.log("[analyzeCreator] 🎬 Début de l'analyse pour:", input.creatorHandle)
  console.log("[analyzeCreator] 📊 Nombre de vidéos:", input.videos.length)
  console.log("[analyzeCreator] 📝 Vidéos avec transcription:", input.videos.filter(v => v.transcript).length)
  
  console.log("[analyzeCreator] 🔑 Vérification OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "✅ Présente" : "❌ MANQUANTE")
  
  const client = getClient()
  const prompt = buildCreatorAnalysisPrompt(input)
  console.log("[analyzeCreator] 📏 Taille du prompt:", prompt.length, "caractères")

  console.log("[analyzeCreator] 🤖 Modèle utilisé:", MODEL)
  console.log("[analyzeCreator] 🤖 Appel API OpenRouter...")
  let response
  try {
    response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 12000,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    })
    console.log("[analyzeCreator] ✅ Réponse API reçue")
    console.log("[analyzeCreator] 🔢 Tokens utilisés:", response.usage?.total_tokens ?? 0)
  } catch (apiError) {
    console.error("[analyzeCreator] ❌ ERREUR APPEL API")
    console.error("[analyzeCreator] Error:", apiError)
    throw new Error(`Erreur API OpenRouter: ${apiError instanceof Error ? apiError.message : String(apiError)}`)
  }

  const raw = response.choices[0]?.message?.content ?? ""
  console.log("[analyzeCreator] 📄 Longueur de la réponse:", raw.length, "caractères")
  console.log("[analyzeCreator] 📄 Début de la réponse:", raw.slice(0, 200))

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error("[analyzeCreator] ❌ JSON non trouvé dans la réponse")
    console.error("[analyzeCreator] Réponse complète:", raw.slice(0, 500))
    throw new Error("Format de réponse IA invalide — JSON non trouvé")
  }
  console.log("[analyzeCreator] ✅ JSON trouvé, taille:", jsonMatch[0].length, "caractères")

  let analysis: CreatorAnalysisResult
  try {
    console.log("[analyzeCreator] 🔄 Parsing du JSON...")
    analysis = JSON.parse(jsonMatch[0])
    console.log("[analyzeCreator] ✅ JSON parsé avec succès")
    console.log("[analyzeCreator] 📊 Hooks trouvés:", analysis.hooks?.catalog?.length ?? 0)
    console.log("[analyzeCreator] 📊 Structures trouvées:", analysis.script_structures?.detected_structures?.length ?? 0)
  } catch (parseError) {
    console.error("[analyzeCreator] ❌ ERREUR PARSING JSON")
    console.error("[analyzeCreator] Parse error:", parseError)
    console.error("[analyzeCreator] JSON qui pose problème (100 premiers caractères):", jsonMatch[0].slice(0, 100))
    throw new Error("Impossible de parser le JSON de l'analyse IA")
  }

  console.log("[analyzeCreator] 🎉 Analyse terminée avec succès")
  return {
    analysis,
    usage: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    },
  }
}
