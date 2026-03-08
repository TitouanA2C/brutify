import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CreatorAnalysisResult } from "@/lib/ai/creator-analysis"

/**
 * API pour extraire les insights des veilles concurrentielles
 * et les rendre disponibles pour la génération de scripts
 */
export async function GET() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Récupérer toutes les analyses complètes de l'utilisateur
  const { data: analyses } = await supabase
    .from("creator_analyses")
    .select("analysis, creator_id, updated_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })

  if (!analyses || analyses.length === 0) {
    return NextResponse.json({
      hasAnalyses: false,
      hooks: [],
      structures: [],
      topics: [],
      positioning: null,
    })
  }

  // Agréger les hooks de toutes les analyses
  const allHooks: Array<{
    id: string
    name: string
    type: string
    template: string
    outlier_score: number
    based_on: string
  }> = []

  // Agréger les structures
  const allStructures: Array<{
    id: string
    name: string
    skeleton: string
    frequency: number
    avg_outlier_score: number
    example: string
  }> = []

  // Agréger les sujets
  const allTopics: Array<{
    name: string
    category: string
    percentage: number
    avg_outlier_score: number
    example: string
  }> = []

  // Extraire le positionnement moyen (prendre le plus récent)
  let positioning: CreatorAnalysisResult["positioning"] | null = null

  for (const analysis of analyses) {
    const data = analysis.analysis as unknown as CreatorAnalysisResult

    // Build a map of hook_type → best outlier_score from the catalog
    const hookScoreMap = new Map<string, number>()
    if (data.hooks?.catalog) {
      for (const h of data.hooks.catalog) {
        const existing = hookScoreMap.get(h.hook_type) ?? 0
        if (h.outlier_score > existing) hookScoreMap.set(h.hook_type, h.outlier_score)
      }
    }
    if (data.hooks?.top_5) {
      for (const h of data.hooks.top_5) {
        const existing = hookScoreMap.get(h.hook_type) ?? 0
        if (h.outlier_score > existing) hookScoreMap.set(h.hook_type, h.outlier_score)
      }
    }

    // Hooks — use real scores from catalog
    if (data.hooks?.reusable_templates) {
      data.hooks.reusable_templates.forEach((template, i) => {
        allHooks.push({
          id: `${analysis.creator_id}-hook-${i}`,
          name: template.hook_type,
          type: template.hook_type,
          template: template.template,
          outlier_score: hookScoreMap.get(template.hook_type) ?? (data.hooks?.top_5?.[0]?.outlier_score ?? 1),
          based_on: template.based_on,
        })
      })
    }

    // Structures
    if (data.script_structures?.detected_structures) {
      data.script_structures.detected_structures.forEach((struct, i) => {
        allStructures.push({
          id: `${analysis.creator_id}-struct-${i}`,
          name: struct.name,
          skeleton: struct.skeleton,
          frequency: struct.frequency,
          avg_outlier_score: struct.avg_outlier_score,
          example: struct.example_video,
        })
      })
    }

    // Topics
    if (data.topics?.content_pillars) {
      data.topics.content_pillars.forEach((pillar) => {
        allTopics.push({
          name: pillar.name,
          category: "pillar",
          percentage: pillar.percentage,
          avg_outlier_score: pillar.avg_outlier_score,
          example: pillar.example,
        })
      })
    }

    if (data.topics?.outlier_topics) {
      // Use the best outlier score from the analysis as baseline
      const bestScore = data.hooks?.top_5?.[0]?.outlier_score
        ?? data.script_structures?.detected_structures?.[0]?.avg_outlier_score
        ?? 1
      data.topics.outlier_topics.forEach((topic) => {
        const topicName = typeof topic === "string" ? topic : topic.topic
        const bestTitle = typeof topic === "string" ? "" : (topic.best_video_title ?? "")
        allTopics.push({
          name: topicName,
          category: "outlier",
          percentage: 0,
          avg_outlier_score: bestScore,
          example: bestTitle,
        })
      })
    }

    // Positionnement (prendre le premier/plus récent)
    if (!positioning && data.positioning) {
      positioning = data.positioning
    }
  }

  // Fetch persisted user templates
  const { data: userTemplates } = await supabase
    .from("user_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("performance_score", { ascending: false })
    .order("use_count", { ascending: false })

  // Merge persisted hooks with veille hooks
  const persistedHooks = (userTemplates ?? [])
    .filter(t => t.kind === "hook")
    .map(t => ({
      id: t.id,
      name: t.name,
      type: t.hook_type ?? t.name,
      template: t.template,
      outlier_score: t.performance_score ?? 0,
      based_on: t.source,
      use_count: t.use_count ?? 0,
    }))

  const persistedStructures = (userTemplates ?? [])
    .filter(t => t.kind === "structure")
    .map(t => ({
      id: t.id,
      name: t.name,
      skeleton: t.skeleton ?? t.template,
      frequency: t.use_count ?? 0,
      avg_outlier_score: t.performance_score ?? 0,
      example: t.description ?? "",
    }))

  // Merge: persisted first, then veille (deduped by template text)
  const seenHookTemplates = new Set(persistedHooks.map(h => h.template))
  for (const h of allHooks) {
    if (!seenHookTemplates.has(h.template)) {
      seenHookTemplates.add(h.template)
      persistedHooks.push({ ...h, use_count: 0 })
    }
  }

  const seenStructNames = new Set(persistedStructures.map(s => s.name))
  for (const s of allStructures) {
    if (!seenStructNames.has(s.name)) {
      seenStructNames.add(s.name)
      persistedStructures.push(s)
    }
  }

  // Sort: by use_count DESC then performance_score DESC
  const sortedHooks = persistedHooks
    .sort((a, b) => {
      const useA = (a as { use_count?: number }).use_count ?? 0
      const useB = (b as { use_count?: number }).use_count ?? 0
      if (useB !== useA) return useB - useA
      return b.outlier_score - a.outlier_score
    })

  const sortedStructures = persistedStructures
    .sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency
      return b.avg_outlier_score - a.avg_outlier_score
    })

  const topTopics = allTopics
    .sort((a, b) => {
      if (a.category === "outlier" && b.category !== "outlier") return -1
      if (a.category !== "outlier" && b.category === "outlier") return 1
      return b.avg_outlier_score - a.avg_outlier_score
    })
    .slice(0, 15)

  return NextResponse.json({
    hasAnalyses: true,
    hooks: sortedHooks,
    structures: sortedStructures,
    topics: topTopics,
    positioning,
  })
}
