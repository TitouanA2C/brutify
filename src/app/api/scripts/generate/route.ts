import { createClient, createServiceClient } from "@/lib/supabase/server"
import {
  parseScriptResponse,
  streamScript,
  type ScriptParams,
} from "@/lib/ai/claude"
import { checkCredits, consumeCredits, COSTS } from "@/lib/credits"
import { canUseFeature, getMinPlanForFeature } from "@/lib/plans"
import { logApiUsage, estimateTokens } from "@/lib/api-usage"
import { checkAndUnlockBonus, getClaimableBonusAfterAction } from "@/lib/activation-triggers"

interface GenerateBody {
  subject: string
  initial_draft?: string
  hook_type: string
  structure_type: string
  source_video_id?: string
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: GenerateBody
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "Body invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!body.subject?.trim() || !body.hook_type || !body.structure_type) {
    return new Response(
      JSON.stringify({ error: "subject, hook_type et structure_type sont requis" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  const plan = profile?.plan ?? "creator"

  if (!canUseFeature(plan, "canGenerateScript")) {
    return new Response(
      JSON.stringify({
        error: "Feature non disponible",
        required_plan: getMinPlanForFeature("canGenerateScript"),
        feature: "canGenerateScript",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }

  const cost = COSTS.script_generation
  const { ok, current } = await checkCredits(user.id, cost)
  if (!ok) {
    return new Response(
      JSON.stringify({
        error: "Crédits insuffisants",
        credits_required: cost,
        credits_current: current,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    )
  }

  // Récupérer les insights des analyses concurrentielles
  const { data: analyses } = await supabase
    .from("creator_analyses")
    .select("analysis")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  let positioning: ScriptParams["positioning"] = null
  let hookTemplate = body.hook_type
  let structureSkeleton = body.structure_type

  if (analyses?.analysis) {
    const analysisData = analyses.analysis as unknown as {
      positioning?: ScriptParams["positioning"]
      hooks?: { reusable_templates?: Array<{ hook_type: string; template: string }> }
      script_structures?: { detected_structures?: Array<{ name: string; skeleton: string }> }
    }
    positioning = analysisData.positioning || null

    if (analysisData.hooks?.reusable_templates) {
      const matchingHook = analysisData.hooks.reusable_templates.find(
        (h) => h.hook_type === body.hook_type
      )
      if (matchingHook) {
        hookTemplate = matchingHook.template
      }
    }

    if (analysisData.script_structures?.detected_structures) {
      const matchingStruct = analysisData.script_structures.detected_structures.find(
        (s) => s.name === body.structure_type
      )
      if (matchingStruct) {
        structureSkeleton = matchingStruct.skeleton
      }
    }
  }

  // Fetch video-specific insights when source_video_id is provided
  let videoInsights: ScriptParams["videoInsights"] = null
  if (body.source_video_id) {
    const { data: videoAnalysis } = await supabase
      .from("video_analyses")
      .select("hook_analysis, style_analysis")
      .eq("video_id", body.source_video_id)
      .maybeSingle()

    if (videoAnalysis?.style_analysis === "v2_structural" && videoAnalysis.hook_analysis) {
      try {
        const full = typeof videoAnalysis.hook_analysis === "string"
          ? JSON.parse(videoAnalysis.hook_analysis)
          : videoAnalysis.hook_analysis
        videoInsights = {
          value_analysis: full.value_analysis ?? undefined,
          positioning: full.positioning ?? undefined,
          style_notes: full.style_notes ?? undefined,
          hook_explanation: full.hook_explanation ?? undefined,
        }
      } catch { /* parse error – continue without video insights */ }
    }
  }

  const scriptParams: ScriptParams = {
    subject: body.subject,
    initial_draft: body.initial_draft,
    hook_type: body.hook_type,
    structure_type: body.structure_type,
    hookTemplate,
    structureSkeleton,
    positioning,
    videoInsights,
  }

  const encoder = new TextEncoder()
  let fullText = ""

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = streamScript(scriptParams)

        for await (const text of stream) {
          fullText += text
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "delta", text })}\n\n`)
          )
        }

        const sections = parseScriptResponse(fullText)

        // Logger l'usage tokens (estimation via longueur texte pour le streaming)
        const promptText = scriptParams.subject + scriptParams.hookTemplate + scriptParams.structureSkeleton
        logApiUsage({
          userId: user.id,
          service: "openrouter",
          action: "script_generation",
          model: "anthropic/claude-sonnet-4.6:beta",
          tokensIn: estimateTokens(promptText),
          tokensOut: estimateTokens(fullText),
        }).catch(() => {})

        const consumed = await consumeCredits(
          user.id,
          cost,
          "script_generation",
          null
        )

        if (!consumed) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: "Échec de la consommation de crédits" })}\n\n`
            )
          )
          controller.close()
          return
        }

        checkAndUnlockBonus(user.id, "generate_script").catch(() => {})
        const serviceSupabase = createServiceClient()
        const bonusClaimable = await getClaimableBonusAfterAction(serviceSupabase, user.id, "generate_script")

        const title = body.subject.slice(0, 100)

        const { data: script, error: insertError } = await supabase
          .from("scripts")
          .insert({
            user_id: user.id,
            title,
            subject: body.subject,
            initial_draft: body.initial_draft || null,
            hook_type: body.hook_type,
            hook_text: sections.hook,
            structure_type: body.structure_type,
            body: sections.body,
            cta: sections.cta,
            ai_notes: sections.ai_notes,
            source_video_id: body.source_video_id || null,
            status: "draft",
          })
          .select("*")
          .single()

        if (insertError) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: insertError.message })}\n\n`
            )
          )
        } else {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                script,
                sections,
                credits_consumed: cost,
                ...(bonusClaimable && { bonusClaimable }),
              })}\n\n`
            )
          )
        }

        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur de génération"
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: message })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
