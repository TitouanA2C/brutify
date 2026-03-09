import { NextResponse, type NextRequest } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { generateIdeas, type IdeaVideoContext } from "@/lib/ai/claude"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { logApiUsage } from "@/lib/api-usage"
import { checkAndUnlockBonus, getClaimableBonusAfterAction } from "@/lib/activation-triggers"

const DEFAULT_COUNT = 6

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const count = Math.min(Math.max(Number(body.count) || DEFAULT_COUNT, 3), 10)

  // Vérifier les crédits avant de lancer l'IA
  const cost = COSTS.inspire_vault
  const { ok, current } = await checkCredits(user.id, cost)
  if (!ok) {
    return NextResponse.json(
      { error: "Crédits insuffisants", credits_required: cost, credits_current: current },
      { status: 402 }
    )
  }

  // 1. Créateurs dans le radar de l'utilisateur
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("creator_id")
    .eq("user_id", user.id)

  if (!watchlist?.length) {
    return NextResponse.json(
      { error: "Ton radar est vide. Ajoute des créateurs d'abord." },
      { status: 400 }
    )
  }

  const creatorIds = watchlist.map((w) => w.creator_id)

  // 2. Top vidéos outliers (score >= 2, max 20)
  const { data: videos, error: videosError } = await supabase
    .from("videos")
    .select(`id, title, views, outlier_score, creators!inner ( handle )`)
    .in("creator_id", creatorIds)
    .gte("outlier_score", 2)
    .not("title", "is", null)
    .order("outlier_score", { ascending: false })
    .limit(20)

  if (videosError) {
    return NextResponse.json({ error: "Erreur lors de la récupération des vidéos" }, { status: 500 })
  }
  if (!videos?.length) {
    return NextResponse.json(
      { error: "Aucune vidéo disponible. Lance un scraping depuis ton radar." },
      { status: 400 }
    )
  }

  const videoIds = videos.map((v) => v.id)

  // 3. Transcriptions et analyses spécifiques à l'utilisateur
  const [{ data: transcriptions }, { data: analyses }] = await Promise.all([
    supabase
      .from("transcriptions")
      .select("video_id, content")
      .in("video_id", videoIds)
      .eq("user_id", user.id),
    supabase
      .from("video_analyses")
      .select("video_id, hook_type, structure_type")
      .in("video_id", videoIds)
      .eq("user_id", user.id),
  ])

  const transcriptMap = new Map((transcriptions ?? []).map((t) => [t.video_id, t.content]))
  const analysisMap = new Map((analyses ?? []).map((a) => [a.video_id, a]))

  // 4. Construire le contexte IA
  const contexts: IdeaVideoContext[] = videos.map((v) => {
    const analysis = analysisMap.get(v.id)
    const transcript = transcriptMap.get(v.id)
    return {
      handle: (v.creators as { handle: string }).handle,
      title: v.title,
      outlierScore: Number(v.outlier_score),
      views: v.views ?? 0,
      hookType: analysis?.hook_type ?? null,
      structureType: analysis?.structure_type ?? null,
      transcriptPreview: transcript ? transcript.slice(0, 200) : null,
    }
  })

  // 5. Génération IA
  let ideas
  let aiUsage
  try {
    const result = await generateIdeas(contexts, count)
    ideas = result.ideas
    aiUsage = result.usage
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la génération des idées"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 6. Consommer les BP (après succès IA)
  const consumed = await consumeCredits(user.id, cost, "inspire_vault", null)
  if (!consumed) {
    return NextResponse.json({ error: "Échec de la consommation de crédits" }, { status: 500 })
  }

  // 7. Logger l'usage API (fire-and-forget)
  logApiUsage({
    userId: user.id,
    service: "openrouter",
    action: "idea_generation",
    model: aiUsage.model,
    tokensIn: aiUsage.promptTokens,
    tokensOut: aiUsage.completionTokens,
    units: count,
  }).catch(() => {})

  // 8. Sauvegarder les idées dans le BrutBoard (status: idea) — plus de vault
  const rows = ideas.map((idea) => {
    const noteParts = [idea.why]
    if (idea.hook_type) noteParts.push(`Hook: ${idea.hook_type}`)
    if (idea.structure) noteParts.push(`Structure: ${idea.structure}`)
    if (idea.tags?.length) noteParts.push(`Tags: ${idea.tags.join(", ")}`)
    return {
      user_id: user.id,
      title: idea.title.trim(),
      status: "idea" as const,
      notes: noteParts.filter(Boolean).join("\n\n") || null,
      scheduled_date: null,
      platform: null,
      script_id: null,
      source_video_id: null,
    }
  })

  const { data: created, error: insertError } = await supabase
    .from("board_items")
    .insert(rows)
    .select()

  if (insertError) {
    return NextResponse.json(
      { error: `Erreur lors de l'ajout au BrutBoard: ${insertError.message}` },
      { status: 500 }
    )
  }

  checkAndUnlockBonus(user.id, "add_to_board").catch(() => {})
  const serviceSupabase = createServiceClient()
  const bonusClaimable = await getClaimableBonusAfterAction(serviceSupabase, user.id, "add_to_board")

  return NextResponse.json(
    bonusClaimable
      ? { items: created, count: created?.length ?? 0, credits_consumed: cost, bonusClaimable }
      : { items: created, count: created?.length ?? 0, credits_consumed: cost },
    { status: 201 }
  )
}
