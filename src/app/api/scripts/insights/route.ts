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
    const data = analysis.analysis as CreatorAnalysisResult

    // Hooks
    if (data.hooks?.reusable_templates) {
      data.hooks.reusable_templates.forEach((template, i) => {
        allHooks.push({
          id: `${analysis.creator_id}-hook-${i}`,
          name: template.hook_type,
          type: template.hook_type,
          template: template.template,
          outlier_score: 85, // Score par défaut si non disponible
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
      data.topics.outlier_topics.forEach((topic) => {
        allTopics.push({
          name: topic,
          category: "outlier",
          percentage: 0,
          avg_outlier_score: 90,
          example: "",
        })
      })
    }

    // Positionnement (prendre le premier/plus récent)
    if (!positioning && data.positioning) {
      positioning = data.positioning
    }
  }

  // Dédupliquer et trier les hooks par score
  const uniqueHooks = Array.from(
    new Map(allHooks.map((h) => [h.template, h])).values()
  )
    .sort((a, b) => b.outlier_score - a.outlier_score)
    .slice(0, 12) // Top 12 hooks

  // Dédupliquer et trier les structures
  const uniqueStructures = Array.from(
    new Map(allStructures.map((s) => [s.name, s])).values()
  )
    .sort((a, b) => b.avg_outlier_score - a.avg_outlier_score)
    .slice(0, 8) // Top 8 structures

  // Trier les sujets par performance
  const topTopics = allTopics
    .sort((a, b) => {
      if (a.category === "outlier" && b.category !== "outlier") return -1
      if (a.category !== "outlier" && b.category === "outlier") return 1
      return b.avg_outlier_score - a.avg_outlier_score
    })
    .slice(0, 15) // Top 15 sujets

  return NextResponse.json({
    hasAnalyses: true,
    hooks: uniqueHooks,
    structures: uniqueStructures,
    topics: topTopics,
    positioning,
  })
}
