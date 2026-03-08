"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  LayoutDashboard,
  Bookmark,
  Sparkles,
  CreditCard,
  Check,
  ArrowLeft,
  Pencil,
  RotateCcw,
  AlertCircle,
  Video,
  CheckCircle2,
  X,
  Link2,
  Mic,
  Save,
  Calendar,
  Camera,
  Film,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

import { Badge } from "@/components/ui/Badge";
import type { HookTemplate, ScriptStructure } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCredits } from "@/lib/credits-context";
import { CreditConfirmModal } from "@/components/ui/CreditConfirmModal";
import { useGenerateScript } from "@/hooks/useScripts";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useCreateVaultItem } from "@/hooks/useVault";
import { useCreateBoardItem, useUpdateBoardItem } from "@/hooks/useBoard";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { Loading } from "@/components/ui/Loading";
import { CreditToast } from "@/components/ui/CreditToast";
import { useUpsell } from "@/hooks/useUpsellTrigger";
import { useUser } from "@/hooks/useUser";
import { DatePicker } from "@/components/ui/DatePicker";

// ─── Types ───────────────────────────────────────────────────────────────────

type ForgeState = "config" | "streaming" | "done";

// ─── Live section parser ─────────────────────────────────────────────────────

function parseLiveSections(raw: string) {
  const hook =
    raw.match(/\[HOOK\]\s*\n([\s\S]*?)(?=\[BODY\])/i)?.[1]?.trim() ?? "";
  const body =
    raw.match(/\[BODY\]\s*\n([\s\S]*?)(?=\[CTA\])/i)?.[1]?.trim() ?? "";
  const cta =
    raw.match(/\[CTA\]\s*\n([\s\S]*?)(?=\[NOTES\])/i)?.[1]?.trim() ?? "";
  const notes = raw.match(/\[NOTES\]\s*\n([\s\S]*?)$/i)?.[1]?.trim() ?? "";
  return { hook, body, cta, notes };
}

function detectActiveSection(raw: string): string {
  if (raw.includes("[NOTES]")) return "notes";
  if (raw.includes("[CTA]")) return "cta";
  if (raw.includes("[BODY]")) return "body";
  if (raw.includes("[HOOK]")) return "hook";
  return "hook";
}

interface BodySubSection {
  title: string;
  content: string;
}

function parseBodySubSections(body: string): BodySubSection[] {
  const parts = body.split(/^###\s+(.+)$/gm);
  // parts: [preamble, title1, content1, title2, content2, ...]
  const sections: BodySubSection[] = [];

  if (parts.length <= 1) {
    // No ### markers found — return the whole body as a single section
    if (body.trim()) sections.push({ title: "Développement", content: body.trim() });
    return sections;
  }

  // If there's content before the first ###, include it
  if (parts[0].trim()) {
    sections.push({ title: "Introduction", content: parts[0].trim() });
  }

  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim();
    const content = parts[i + 1]?.trim();
    if (title && content) {
      sections.push({ title, content });
    } else if (title) {
      sections.push({ title, content: "" });
    }
  }

  return sections;
}

// ─── Animations ──────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Source video preparation steps ─────────────────────────────────────────

const SOURCE_PREP_STEPS = [
  { label: "Chargement de la vidéo", icon: "📡" },
  { label: "Transcription audio (Whisper)", icon: "🎙️" },
  { label: "Analyse structurelle (Claude)", icon: "🧠" },
  { label: "Extraction des insights", icon: "💡" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

interface InsightsResponse {
  hasAnalyses: boolean;
  hooks: Array<{
    id: string;
    name: string;
    type: string;
    template: string;
    outlier_score: number;
    based_on: string;
  }>;
  structures: Array<{
    id: string;
    name: string;
    skeleton: string;
    frequency: number;
    avg_outlier_score: number;
    example: string;
  }>;
  topics: Array<{
    name: string;
    category: string;
    percentage: number;
    avg_outlier_score: number;
    example: string;
  }>;
  positioning: {
    tone: string;
    icp: {
      level: string;
      pain_points: string[];
      aspirations: string[];
      estimated_profile: string;
    };
  } | null;
}

function ScriptsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sourceVideoId = searchParams.get("source_video_id");
  const editScriptId = searchParams.get("edit");
  const prefillSubject = searchParams.get("prefill_subject");
  
  const { data: insights } = useSWR<InsightsResponse>("/api/scripts/insights");

  const hookTemplates: HookTemplate[] = useMemo(() => {
    if (!insights?.hooks) return [];
    return insights.hooks.map((h) => ({
      id: h.id,
      name: h.type,
      type: h.type as HookTemplate["type"],
      template: h.template,
      performanceScore: Math.round(h.outlier_score),
    }));
  }, [insights]);

  const scriptStructures: ScriptStructure[] = useMemo(() => {
    if (!insights?.structures) return [];
    return insights.structures.map((s) => ({
      id: s.id,
      name: s.name,
      description: `Apparaît ${s.frequency}× · Exemple: ${s.example.slice(0, 30)}...`,
      skeleton: s.skeleton,
    }));
  }, [insights]);

  const [subject, setSubject] = useState(prefillSubject ?? "");
  const [selectedHook, setSelectedHook] = useState<HookTemplate | null>(null);
  const [selectedStructure, setSelectedStructure] =
    useState<ScriptStructure | null>(null);

  // Store source-generated templates independently so they persist after deselection
  const [sourceHooks, setSourceHooks] = useState<HookTemplate[]>([]);
  const [sourceStructures, setSourceStructures] = useState<ScriptStructure[]>([]);

  const allHookTemplates = useMemo(() => {
    const list = [...hookTemplates];
    for (const sh of sourceHooks) {
      if (!list.find(h => h.id === sh.id)) list.unshift(sh);
    }
    return list;
  }, [hookTemplates, sourceHooks]);

  const allStructures = useMemo(() => {
    const list = [...scriptStructures];
    for (const ss of sourceStructures) {
      if (!list.find(s => s.id === ss.id)) list.unshift(ss);
    }
    return list;
  }, [scriptStructures, sourceStructures]);

  // Auto-recommend hook + structure when subject changes (debounced)
  const [recommendation, setRecommendation] = useState<{ hook_id: string | null; structure_id: string | null; reason: string | null } | null>(null);
  const recommendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (recommendTimerRef.current) clearTimeout(recommendTimerRef.current);

    // Only recommend if: no source video auto-selection, subject long enough, and templates available
    if (sourceVideoId || subject.length < 50 || !allHookTemplates.length || !allStructures.length) {
      return;
    }

    // Don't override if user already has selections
    if (selectedHook && selectedStructure) return;

    recommendTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/templates/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            hooks: allHookTemplates.map(h => ({ id: h.id, name: h.name, template: h.template })),
            structures: allStructures.map(s => ({ id: s.id, name: s.name, skeleton: s.skeleton })),
          }),
        });
        const data = await res.json();
        if (data.hook_id || data.structure_id) {
          setRecommendation(data);
          if (data.hook_id && !selectedHook) {
            const match = allHookTemplates.find(h => h.id === data.hook_id);
            if (match) setSelectedHook(match);
          }
          if (data.structure_id && !selectedStructure) {
            const match = allStructures.find(s => s.id === data.structure_id);
            if (match) setSelectedStructure(match);
          }
        }
      } catch { /* silent */ }
    }, 1500);

    return () => { if (recommendTimerRef.current) clearTimeout(recommendTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, allHookTemplates.length, allStructures.length, sourceVideoId]);

  const [sourceVideoTitle, setSourceVideoTitle] = useState<string | null>(null);
  const [sourceStep, setSourceStep] = useState(-1); // -1 = idle, 0+ = step index, SOURCE_PREP_STEPS.length = done
  const [sourceAnalysisReady, setSourceAnalysisReady] = useState(false);
  const [sourceAnalysisHints, setSourceAnalysisHints] = useState<{
    hookType?: string;
    structureType?: string;
    positioning?: string;
    audience?: string;
    valueMethod?: string;
    styleNotes?: string;
  } | null>(null);

  const sourceAnalysisLoading = sourceStep >= 0 && sourceStep < SOURCE_PREP_STEPS.length;

  // Store raw analysis data so template selection can react independently
  const [sourceAnalysisData, setSourceAnalysisData] = useState<Record<string, unknown> | null>(null);

  // Step 1: Fetch & analyse the source video (runs ONCE per sourceVideoId)
  useEffect(() => {
    if (!sourceVideoId) return;

    let cancelled = false;

    async function loadSourceVideo() {
      try {
        setSourceStep(0);
        const res = await fetch(`/api/videos/${sourceVideoId}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.video) {
          setSourceVideoTitle(data.video.title || null);
        }

        let analysis = data.analysis;

        if (!analysis) {
          setSourceStep(1);
          const transRes = await fetch(`/api/videos/${sourceVideoId}/transcribe`, { method: "POST" });
          if (!transRes.ok) { setSourceStep(-1); return; }
          if (cancelled) return;

          setSourceStep(2);
          const analyzeRes = await fetch(`/api/videos/${sourceVideoId}/analyze`, { method: "POST" });
          if (!analyzeRes.ok) { setSourceStep(-1); return; }
          const analyzeData = await analyzeRes.json();
          if (cancelled) return;
          analysis = analyzeData.analysis;
        }

        if (analysis) {
          setSourceStep(3);

          const hints: typeof sourceAnalysisHints = {
            hookType: analysis.hook_type ?? undefined,
            structureType: analysis.structure_type ?? undefined,
          };

          if (analysis.style_analysis === "v2_structural" && analysis.hook_analysis) {
            try {
              const full = JSON.parse(analysis.hook_analysis);
              if (full.positioning) {
                hints.positioning = full.positioning.creator_stance;
                hints.audience = full.positioning.target_audience;
              }
              if (full.value_analysis) {
                hints.valueMethod = full.value_analysis.delivery_method;
              }
              if (full.style_notes) {
                hints.styleNotes = full.style_notes;
              }
            } catch { /* parse error */ }
          }

          setSourceAnalysisHints(hints);
          setSourceAnalysisData(analysis);
          setSourceStep(SOURCE_PREP_STEPS.length);
          setSourceAnalysisReady(true);
        } else {
          setSourceStep(-1);
        }
      } catch {
        setSourceStep(-1);
      }
    }

    loadSourceVideo();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceVideoId]);

  // Step 2: Auto-select hook & structure once analysis data + templates are available
  useEffect(() => {
    if (!sourceAnalysisData || !sourceVideoId) return;

    const analysis = sourceAnalysisData as Record<string, unknown>;
    const hookType = analysis.hook_type as string | undefined;
    const structureType = analysis.structure_type as string | undefined;

    // Hook selection
    if (hookType) {
      const match = hookTemplates.find(h => h.type === hookType);
      if (match) {
        setSelectedHook(match);
      } else {
        let template = "";
        if (analysis.style_analysis === "v2_structural" && analysis.hook_analysis) {
          try {
            const full = typeof analysis.hook_analysis === "string" ? JSON.parse(analysis.hook_analysis as string) : analysis.hook_analysis;
            const hookText = full.sections?.find((s: { type: string; content: string }) => s.type === "hook")?.content ?? "";
            const promise = full.hook_explanation?.implicit_promise ?? "";
            const mechanism = full.hook_explanation?.why_it_works ?? "";

            if (hookText) {
              template = hookText
                .replace(/\d[\d\s]*€/g, "[montant]")
                .replace(/\d+\s*(mois|ans|jours|semaines|heures|min)/gi, "[durée]")
                .replace(/\d+/g, "[X]");
            }
            if (promise && !template) template = promise;
            if (mechanism && !template) template = mechanism;
          } catch { /* */ }
        }
        const sourceHook: HookTemplate = {
          id: `source-hook-${sourceVideoId}`,
          name: hookType,
          type: hookType as HookTemplate["type"],
          template: template || `[Affirmation provocante/contre-intuitive] — hook de type ${hookType}`,
          performanceScore: 80,
        };
        setSourceHooks(prev => prev.find(h => h.id === sourceHook.id) ? prev : [...prev, sourceHook]);
        setSelectedHook(sourceHook);

        // Persist to user_templates
        fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{
            kind: "hook",
            name: hookType,
            template: sourceHook.template,
            hook_type: hookType,
            source: "video",
            source_id: sourceVideoId,
            performance_score: 80,
          }] }),
        }).catch(() => {});
      }
    }

    // Structure selection
    if (structureType) {
      const match = scriptStructures.find(s => s.name === structureType);
      if (match) {
        setSelectedStructure(match);
      } else {
        let skeleton = "";
        if (analysis.style_analysis === "v2_structural" && analysis.hook_analysis) {
          try {
            const full = typeof analysis.hook_analysis === "string" ? JSON.parse(analysis.hook_analysis as string) : analysis.hook_analysis;
            if (full.sections) {
              skeleton = full.sections.map((s: { label: string }) => s.label).join(" → ");
            }
          } catch { /* */ }
        }
        const sourceStruct: ScriptStructure = {
          id: `source-struct-${sourceVideoId}`,
          name: structureType,
          description: `Extrait de la vidéo analysée`,
          skeleton: skeleton || `Structure ${structureType}`,
        };
        setSourceStructures(prev => prev.find(s => s.id === sourceStruct.id) ? prev : [...prev, sourceStruct]);
        setSelectedStructure(sourceStruct);

        // Persist to user_templates
        fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [{
            kind: "structure",
            name: structureType,
            template: sourceStruct.skeleton,
            skeleton: sourceStruct.skeleton,
            description: "Extrait de la vidéo analysée",
            source: "video",
            source_id: sourceVideoId,
            performance_score: 70,
          }] }),
        }).catch(() => {});
      }
    }
  }, [sourceAnalysisData, sourceVideoId, hookTemplates, scriptStructures]);
  const [forgeState, setForgeState] = useState<ForgeState>("config");
  const [copied, setCopied] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { credits, addUsage } = useCredits();
  const { triggerUpsell } = useUpsell();
  const { profile } = useUser();

  const [editHook, setEditHook] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCta, setEditCta] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [savedScriptId, setSavedScriptId] = useState<string | null>(null);

  // Load existing script when ?edit=<id> is present
  useEffect(() => {
    if (!editScriptId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scripts/${editScriptId}`);
        if (!res.ok) return;
        const { script } = await res.json();
        if (cancelled || !script) return;
        setEditHook(script.hook_text ?? "");
        setEditBody(script.body ?? "");
        setEditCta(script.cta ?? "");
        setAiNotes(script.ai_notes ?? "");
        setSubject(script.subject ?? "");
        setSavedScriptId(script.id);
        setSavedBoard(true);
        setForgeState("done");
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editScriptId]);

  // Auto-save edits to DB (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!savedScriptId || forgeState !== "done") return;
    if (!editHook && !editBody && !editCta) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/scripts/${savedScriptId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hook_text: editHook,
            body: editBody,
            cta: editCta,
            ai_notes: aiNotes,
          }),
        });
      } catch { /* silent */ }
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [editHook, editBody, editCta, aiNotes, savedScriptId, forgeState]);

  const { create: createVaultItem, isCreating: savingVault } = useCreateVaultItem();
  const { create: createBoardItem, isCreating: savingBoard } = useCreateBoardItem();
  const { update: updateBoardItem } = useUpdateBoardItem();
  const [savedVault, setSavedVault] = useState(false);
  const [savedBoard, setSavedBoard] = useState(false);
  const [boardItemId, setBoardItemId] = useState<string | null>(null);
  const [planShoot, setPlanShoot] = useState<string>("");
  const [planEdit, setPlanEdit] = useState<string>("");
  const [planPublish, setPlanPublish] = useState<string>("");
  const [planPlatform, setPlanPlatform] = useState<string>("");
  const [upgradeModal, setUpgradeModal] = useState<{ feature: string; requiredPlan: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; cost: number; remaining: number } | null>(null);

  // Fetch linked board item to populate planning dates
  useEffect(() => {
    if (!savedScriptId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/board");
        const json = await res.json();
        if (cancelled) return;
        const linked = (json.items ?? []).find(
          (it: { script_id?: string | null }) => it.script_id === savedScriptId
        );
        if (linked) {
          setBoardItemId(linked.id);
          setPlanShoot(linked.shoot_date ?? "");
          setPlanEdit(linked.edit_date ?? "");
          setPlanPublish(linked.publish_date ?? "");
          setPlanPlatform(linked.platform ?? "");
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [savedScriptId]);

  // Auto-save planning dates
  const planTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!boardItemId) return;
    if (planTimerRef.current) clearTimeout(planTimerRef.current);
    planTimerRef.current = setTimeout(async () => {
      try {
        await updateBoardItem(boardItemId, {
          shoot_date: planShoot || null,
          edit_date: planEdit || null,
          publish_date: planPublish || null,
          platform: planPlatform || null,
          scheduled_date: planPublish || planShoot || null,
          status: (planShoot || planEdit || planPublish) ? "scheduled" : undefined,
        });
      } catch { /* silent */ }
    }, 800);
    return () => { if (planTimerRef.current) clearTimeout(planTimerRef.current); };
  }, [planShoot, planEdit, planPublish, planPlatform, boardItemId, updateBoardItem]);

  // Boucle de rétroaction — liaison script ↔ vidéo publiée
  const [publishedVideoId, setPublishedVideoId] = useState<string | null>(null);
  const [publishedVideoTitle, setPublishedVideoTitle] = useState<string | null>(null);
  const [showPublishPicker, setShowPublishPicker] = useState(false);

  const [liveSection, setLiveSection] = useState("hook");
  const streamTextRef = useRef("");

  const { generate, abort } = useGenerateScript();

  const SUBJECT_PERFECT = 500;
  const subjectLen = subject.trim().length;
  const canForge =
    subjectLen >= 50 && selectedHook && selectedStructure;

  const speech = useSpeechToText({
    lang: "fr-FR",
    continuous: true,
    onFinal: useCallback((transcript: string) => {
      setSubject((prev) => {
        const sep = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
        return prev + sep + transcript;
      });
    }, []),
  });

  const handleForgeClick = useCallback(() => {
    if (!canForge) return;
    setShowCreditModal(true);
  }, [canForge]);

  const handleForgeConfirm = useCallback(() => {
    if (!selectedHook || !selectedStructure) return;
    setShowCreditModal(false);
    setApiError(null);
    setForgeState("streaming");
    setEditHook("");
    setEditBody("");
    setEditCta("");
    setAiNotes("");
    setSavedScriptId(null);
    streamTextRef.current = "";

    generate(
      {
        subject,
        hook_type: selectedHook.type,
        structure_type: selectedStructure.name,
        source_video_id: sourceVideoId ?? undefined,
      },
      (_delta, full) => {
        streamTextRef.current = full;
        const sections = parseLiveSections(full);
        setLiveSection(detectActiveSection(full));
        setEditHook(sections.hook);
        setEditBody(sections.body);
        setEditCta(sections.cta);
        setAiNotes(sections.notes);
      },
      async (result) => {
        setEditHook(result.sections.hook);
        setEditBody(result.sections.body);
        setEditCta(result.sections.cta);
        setAiNotes(result.sections.ai_notes);
        setSavedScriptId(result.script.id);
        setForgeState("done");
        if (result.credits_consumed > 0) {
          addUsage("Script forgé — " + subject.slice(0, 40), result.credits_consumed);
          setToast({
            message: "Script forgé",
            cost: result.credits_consumed,
            remaining: credits - result.credits_consumed,
          });
        }

        // Increment use_count for used templates
        if (selectedHook?.id) {
          fetch("/api/templates/use", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template_id: selectedHook.id }),
          }).catch(() => {});
        }
        if (selectedStructure?.id) {
          fetch("/api/templates/use", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ template_id: selectedStructure.id }),
          }).catch(() => {});
        }

        // Auto-save to BrutBoard
        try {
          const boardItem = await createBoardItem({
            title: editHook || subject || "Script forgé",
            status: "draft",
            script_id: result.script.id,
          });
          if (boardItem?.id) setBoardItemId(boardItem.id);
          setSavedBoard(true);
        } catch { /* silent */ }

        // Déclenchement des upsells selon le contexte
        if (profile?.plan === "creator") {
          // Vérifier si c'est le premier script (trial)
          try {
            const scriptsRes = await fetch("/api/scripts");
            const scriptsData = await scriptsRes.json();
            
            if (scriptsData.scripts?.length === 1) {
              // Premier script généré, trigger first_script_success
              triggerUpsell("first_script_success");
            } else if (scriptsData.scripts?.length >= 3) {
              // Vérifier si 3 scripts en 24h
              const now = Date.now();
              const oneDayAgo = now - 24 * 60 * 60 * 1000;
              const recentScripts = scriptsData.scripts.filter((s: { created_at: string }) => 
                new Date(s.created_at).getTime() > oneDayAgo
              );
              
              if (recentScripts.length >= 3) {
                triggerUpsell("script_streak");
              }
            }
          } catch (err) {
            // Silent fail, upsell n'est pas critique
          }
        }
      },
      (err, status, data) => {
        if (status === 403 && data?.feature) {
          setUpgradeModal({
            feature: data.feature as string,
            requiredPlan: data.required_plan as string,
          });
          setForgeState("config");
          return;
        }
        setApiError(err);
        setForgeState("config");
      }
    );
  }, [generate, subject, selectedHook, selectedStructure, addUsage, credits, sourceVideoId]);

  const handleCopy = useCallback(() => {
    const full = `${editHook}\n\n${editBody}\n\n${editCta}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [editHook, editBody, editCta]);

  const handleNewScript = useCallback(() => {
    abort();
    setForgeState("config");
    setSavedScriptId(null);
    setApiError(null);
    setSavedVault(false);
    setSavedBoard(false);
    setPublishedVideoId(null);
    setPublishedVideoTitle(null);
  }, [abort]);

  const handleLinkVideo = useCallback(
    async (videoId: string, videoTitle: string) => {
      if (!savedScriptId) return;
      try {
        const res = await fetch(`/api/scripts/${savedScriptId}/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ video_id: videoId }),
        });
        if (res.ok) {
          setPublishedVideoId(videoId);
          setPublishedVideoTitle(videoTitle);
          setShowPublishPicker(false);
        }
      } catch {
        /* silently fail */
      }
    },
    [savedScriptId]
  );

  const handleUnlinkVideo = useCallback(async () => {
    if (!savedScriptId) return;
    try {
      await fetch(`/api/scripts/${savedScriptId}/publish`, { method: "DELETE" });
      setPublishedVideoId(null);
      setPublishedVideoTitle(null);
    } catch {
      /* silently fail */
    }
  }, [savedScriptId]);

  const handleRegenerate = useCallback(() => {
    setShowCreditModal(true);
  }, []);

  const handleSaveToVault = useCallback(async () => {
    if (savingVault || savedVault) return;
    const scriptContent = [editHook, editBody, editCta].filter(Boolean).join("\n\n");
    if (!scriptContent) return;
    try {
      await createVaultItem({
        type: "script",
        content: scriptContent,
        source_script_id: savedScriptId ?? undefined,
      });
      setSavedVault(true);
    } catch {
      /* silently fail */
    }
  }, [savingVault, savedVault, editHook, editBody, editCta, savedScriptId, createVaultItem]);

  const handleAddToBoard = useCallback(async () => {
    if (savingBoard || savedBoard) return;
    try {
      const boardItem = await createBoardItem({
        title: editHook || subject || "Script forgé",
        status: "draft",
        script_id: savedScriptId ?? undefined,
      });
      if (boardItem?.id) setBoardItemId(boardItem.id);
      setSavedBoard(true);
    } catch {
      /* silently fail */
    }
  }, [savingBoard, savedBoard, subject, savedScriptId, createBoardItem]);

  const handleSaveAndGoBoard = useCallback(async () => {
    if (!savedBoard) {
      try {
        const boardItem = await createBoardItem({
          title: editHook || subject || "Script forgé",
          status: "draft",
          script_id: savedScriptId ?? undefined,
        });
        if (boardItem?.id) setBoardItemId(boardItem.id);
        setSavedBoard(true);
      } catch { /* silently fail */ }
    }
    router.push("/board");
  }, [savedBoard, subject, savedScriptId, createBoardItem, router]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="max-w-[1400px] mx-auto"
    >
      <AnimatePresence mode="wait">
        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — Configuration (centered)
            ═══════════════════════════════════════════════════════════════════ */}
        {forgeState === "config" && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="max-w-[1400px] mx-auto"
          >
            <PageHeader
              title="Scripts"
              subtitle={sourceVideoId ? "Forge un script basé sur cette vidéo" : "Forge des scripts percutants avec l'IA"}
            />

            {sourceVideoId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.04] p-4"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <Video className="h-4 w-4 text-brutify-gold shrink-0" />
                  <p className="text-xs font-body font-semibold text-brutify-gold">
                    {sourceAnalysisLoading ? "Préparation de la vidéo…" : sourceAnalysisReady ? "Vidéo analysée — hook & structure pré-remplis" : sourceStep === -1 && !sourceAnalysisReady ? "Chargement…" : "Prêt"}
                  </p>
                </div>
                {sourceVideoTitle && (
                  <p className="text-[11px] font-body text-brutify-text-muted mb-3 line-clamp-1">{sourceVideoTitle}</p>
                )}

                {/* Real-time steps (loading) */}
                {sourceAnalysisLoading && (
                  <SourceVideoProgress steps={SOURCE_PREP_STEPS} currentIndex={sourceStep} />
                )}

                {/* Hints pills (ready) */}
                {sourceAnalysisReady && sourceAnalysisHints && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {sourceAnalysisHints.hookType && (
                      <span className="rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/15 px-2 py-0.5 text-[10px] font-body font-medium text-brutify-gold/70">
                        Hook: {sourceAnalysisHints.hookType}
                      </span>
                    )}
                    {sourceAnalysisHints.structureType && (
                      <span className="rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/15 px-2 py-0.5 text-[10px] font-body font-medium text-brutify-gold/70">
                        Structure: {sourceAnalysisHints.structureType}
                      </span>
                    )}
                    {sourceAnalysisHints.positioning && (
                      <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] font-body text-brutify-text-muted/60">
                        {sourceAnalysisHints.positioning}
                      </span>
                    )}
                    {sourceAnalysisHints.styleNotes && (
                      <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] font-body text-brutify-text-muted/60">
                        {sourceAnalysisHints.styleNotes}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs font-body text-red-400">{apiError}</p>
              </motion.div>
            )}

            <div className="space-y-6">
              {/* Step 1: Sujet */}
              <ConfigSection 
                index={0} 
                number={1} 
                title="TON SUJET & VISION"
              >
                {sourceAnalysisReady && sourceAnalysisHints && (
                  <VideoContextTip
                    hints={sourceAnalysisHints}
                    hookType={sourceAnalysisHints.hookType}
                    structureType={sourceAnalysisHints.structureType}
                  />
                )}
                <SpeechTextarea
                  subject={subject}
                  setSubject={setSubject}
                  speech={speech}
                />
                <SubjectProgressBar length={subjectLen} perfect={SUBJECT_PERFECT} />
                {recommendation?.reason && !sourceVideoId && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border border-brutify-gold/15 bg-brutify-gold/[0.04]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brutify-gold shrink-0" />
                    <p className="text-[10px] font-body text-brutify-gold/80">
                      Recommandation IA : {recommendation.reason}
                    </p>
                  </motion.div>
                )}
              </ConfigSection>

              {/* Step 2: Hook */}
              <ConfigSection 
                index={1} 
                number={2} 
                title="CHOISIS TON HOOK"
              >
                {allHookTemplates.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-xs font-body text-brutify-text-muted">
                      Aucun hook disponible. Lance une veille concurrentielle pour débloquer des hooks qui performent.
                    </p>
                  </div>
                )}
                <TemplatePicker
                  items={allHookTemplates}
                  selectedId={selectedHook?.id ?? null}
                  onSelect={(id) => {
                    const found = allHookTemplates.find(h => h.id === id)
                    setSelectedHook(selectedHook?.id === id ? null : found ?? null)
                  }}
                  renderItem={(ht, isSelected) => (
                    <>
                      <p className={cn(
                        "text-[13px] font-body font-semibold text-brutify-text-primary leading-snug",
                        isSelected ? "" : "line-clamp-2 min-h-[36px]"
                      )}>
                        {ht.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {ht.id.startsWith("source-") && (
                          <Badge variant="gold" className="text-[8px] px-1.5 py-0">Vidéo</Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] font-body text-brutify-text-muted/50 mt-1.5 italic leading-relaxed",
                        isSelected ? "" : "line-clamp-2"
                      )}>
                        {ht.template}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-gradient"
                            style={{ width: `${ht.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-body font-bold text-brutify-gold">
                          {ht.performanceScore}
                        </span>
                      </div>
                    </>
                  )}
                />
              </ConfigSection>

              {/* Step 3: Structure */}
              <ConfigSection 
                index={2} 
                number={3} 
                title="CHOISIS TA STRUCTURE"
              >
                {allStructures.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-xs font-body text-brutify-text-muted">
                      Aucune structure disponible. Lance une veille concurrentielle pour découvrir des structures qui marchent.
                    </p>
                  </div>
                )}
                <TemplatePicker
                  items={allStructures}
                  selectedId={selectedStructure?.id ?? null}
                  onSelect={(id) => {
                    const found = allStructures.find(s => s.id === id)
                    setSelectedStructure(selectedStructure?.id === id ? null : found ?? null)
                  }}
                  renderItem={(ss, isSelected) => (
                    <>
                      <p className={cn(
                        "text-[13px] font-body font-semibold text-brutify-text-primary leading-snug",
                        isSelected ? "" : "line-clamp-2 min-h-[36px]"
                      )}>
                        {ss.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {ss.id.startsWith("source-") && (
                          <Badge variant="gold" className="text-[8px] px-1.5 py-0">Vidéo</Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] font-body text-brutify-text-muted/50 mt-1.5 leading-relaxed",
                        isSelected ? "" : "line-clamp-2"
                      )}>
                        {ss.skeleton}
                      </p>
                      <p className={cn(
                        "text-[9px] font-body text-brutify-text-muted/40 leading-snug mt-2",
                        isSelected ? "" : "line-clamp-1"
                      )}>
                        {ss.description}
                      </p>
                    </>
                  )}
                />
              </ConfigSection>

              {/* Forge button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  delay: 0.1 + 3 * 0.08,
                  duration: 0.4,
                  ease: EASE,
                }}
                className="pb-8"
              >
                <button
                  onClick={handleForgeClick}
                  disabled={!canForge}
                  className={cn(
                    "relative w-full rounded-2xl py-4 font-display text-xl tracking-wider uppercase transition-all duration-150 overflow-hidden cursor-pointer active:scale-[0.98]",
                    canForge
                      ? "bg-gold-gradient text-brutify-bg shadow-[0_0_60px_rgba(255,171,0,0.4)] hover:shadow-[0_0_80px_rgba(255,171,0,0.6)] hover:-translate-y-0.5"
                      : "bg-white/[0.06] text-brutify-text-muted cursor-not-allowed"
                  )}
                >
                  <span className="relative z-10">Forger le script</span>
                  {canForge && (
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    ></motion.div>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <CreditCard className="h-3 w-3 text-brutify-text-muted" />
                  <span className="text-[11px] font-body text-brutify-text-muted">
                    2 BP par génération
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — Streaming / Result (full-width, editable)
            ═══════════════════════════════════════════════════════════════════ */}
        {(forgeState === "streaming" || forgeState === "done") && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            {/* Header with back + actions */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleNewScript}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs font-body font-medium text-brutify-text-secondary hover:text-brutify-text-primary hover:border-white/[0.1] transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Nouveau script
                </button>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-brutify-text-primary">
                    {forgeState === "streaming" ? "Génération en cours..." : "Script forgé"}
                  </h1>
                  <p className="text-xs font-body text-brutify-text-muted mt-0.5">
                    {subject.slice(0, 60)}
                    {subject.length > 60 ? "..." : ""} ·{" "}
                    {selectedHook?.name} · {selectedStructure?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <ActionBtn
                  icon={
                    copied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                  label={copied ? "Copié !" : "Copier tout"}
                  onClick={handleCopy}
                  active={copied}
                  disabled={forgeState === "streaming"}
                />
                <ActionBtn
                  icon={
                    savedVault ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Bookmark className="h-3.5 w-3.5" />
                    )
                  }
                  label={savedVault ? "Sauvé" : "Vault"}
                  onClick={handleSaveToVault}
                  active={savedVault}
                  disabled={forgeState === "streaming" || savingVault || savedVault}
                />
                <ActionBtn
                  icon={
                    savedBoard ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <LayoutDashboard className="h-3.5 w-3.5" />
                    )
                  }
                  label={savedBoard ? "Ajouté" : "BrutBoard"}
                  onClick={handleAddToBoard}
                  active={savedBoard}
                  disabled={forgeState === "streaming" || savingBoard || savedBoard}
                />
                <ActionBtn
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  label="Régénérer"
                  onClick={handleRegenerate}
                  disabled={forgeState === "streaming"}
                />
                {forgeState === "done" && savedScriptId && (
                  <ActionBtn
                    icon={
                      publishedVideoId ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Video className="h-3.5 w-3.5" />
                      )
                    }
                    label={publishedVideoId ? "Publiée" : "Lier vidéo"}
                    onClick={() => setShowPublishPicker(true)}
                    active={!!publishedVideoId}
                  />
                )}
                {forgeState === "done" && (
                  <ActionBtn
                    icon={<Save className="h-3.5 w-3.5" />}
                    label="Enregistrer"
                    onClick={handleSaveAndGoBoard}
                    highlight
                  />
                )}
              </div>
            </div>

            {/* Streaming progress indicator */}
            {forgeState === "streaming" && (
              <StreamingIndicator activeSection={liveSection} />
            )}

            {/* Script content — two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main script — editable */}
              <div className="lg:col-span-2 space-y-4">
                <StreamableScriptBlock
                  label="HOOK"
                  labelColor="#FFAB00"
                  value={editHook}
                  onChange={setEditHook}
                  placeholder="Le hook va apparaître ici..."
                  minRows={2}
                  isStreaming={forgeState === "streaming" && liveSection === "hook"}
                  readOnly={forgeState === "streaming"}
                />
                <BodySections
                  body={editBody}
                  onChange={setEditBody}
                  isStreaming={forgeState === "streaming" && liveSection === "body"}
                  readOnly={forgeState === "streaming"}
                />
                <StreamableScriptBlock
                  label="CTA"
                  labelColor="#CC8800"
                  value={editCta}
                  onChange={setEditCta}
                  placeholder="Le call-to-action va apparaître ici..."
                  minRows={2}
                  isStreaming={forgeState === "streaming" && liveSection === "cta"}
                  readOnly={forgeState === "streaming"}
                />
              </div>

              {/* Sidebar — analysis */}
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.2, ease: EASE }}
                  className={cn(
                    "rounded-2xl bg-brutify-gold/[0.03] border border-brutify-gold/[0.08] p-5 hover:border-brutify-gold/[0.15] transition-colors duration-300",
                    forgeState === "streaming" && liveSection === "notes" && "border-brutify-gold/30"
                  )}
                >
                  <h4 className="font-display text-sm uppercase tracking-wider text-brutify-gold mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Pourquoi ça marche
                    {forgeState === "streaming" && liveSection === "notes" && (
                      <span className="inline-block h-2 w-2 rounded-full bg-brutify-gold animate-pulse" />
                    )}
                  </h4>
                  <p className="text-xs font-body text-brutify-text-muted leading-relaxed whitespace-pre-wrap">
                    {aiNotes || (forgeState === "streaming" ? "En attente..." : "—")}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.2, ease: EASE }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                  <h4 className="font-display text-sm uppercase tracking-wider text-brutify-text-secondary mb-3">
                    Paramètres utilisés
                  </h4>
                  <div className="space-y-2.5">
                    <ParamRow label="Hook" value={selectedHook?.name} />
                    <ParamRow
                      label="Structure"
                      value={selectedStructure?.name}
                    />
                    {insights?.positioning && (
                      <div className="pt-2 mt-2 border-t border-white/[0.06]">
                        <p className="text-[10px] font-body text-brutify-text-muted mb-1">
                          Positionnement automatique
                        </p>
                        <p className="text-[11px] font-body text-brutify-text-secondary">
                          {insights.positioning.tone}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.2, ease: EASE }}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                  <h4 className="font-display text-sm uppercase tracking-wider text-brutify-text-secondary mb-3">
                    Statistiques
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Mots"
                      value={countWords(editHook + " " + editBody + " " + editCta)}
                    />
                    <StatBox
                      label="Caractères"
                      value={(editHook + editBody + editCta).length}
                    />
                    <StatBox
                      label="Durée estimée"
                      value={(() => {
                        const words = countWords(editHook + " " + editBody + " " + editCta);
                        const secs = Math.round((words / 200) * 60);
                        if (secs < 60) return `~${Math.max(15, secs)}s`;
                        const m = Math.floor(secs / 60);
                        const s = Math.round((secs % 60) / 10) * 10;
                        return s > 0 ? `~${m}m${s}s` : `~${m}m`;
                      })()}
                    />
                    <StatBox label="Sections" value={3} />
                  </div>
                </motion.div>

                {/* Planning section */}
                {forgeState === "done" && boardItemId && (
                  <PlanningSection
                    shootDate={planShoot}
                    editDate={planEdit}
                    publishDate={planPublish}
                    platform={planPlatform}
                    onShootChange={setPlanShoot}
                    onEditChange={setPlanEdit}
                    onPublishChange={setPlanPublish}
                    onPlatformChange={setPlanPlatform}
                  />
                )}

                {savedScriptId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-green-500/10 bg-green-500/[0.03] p-4"
                  >
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-[11px] font-body text-green-400">
                        Script sauvegardé automatiquement
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Liaison vidéo publiée */}
                {savedScriptId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={cn(
                      "rounded-2xl border p-4 transition-colors duration-300",
                      publishedVideoId
                        ? "border-brutify-gold/20 bg-brutify-gold/[0.03]"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                    )}
                  >
                    {publishedVideoId ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brutify-gold flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-body font-medium text-brutify-gold block">
                              Vidéo publiée liée
                            </span>
                            <span className="text-[10px] font-body text-brutify-text-muted truncate block">
                              {publishedVideoTitle ?? "Vidéo Instagram"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={handleUnlinkVideo}
                          className="text-brutify-text-muted/40 hover:text-red-400 transition-colors p-1 flex-shrink-0 cursor-pointer"
                          title="Délier la vidéo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowPublishPicker(true)}
                        className="w-full flex items-center gap-2 text-brutify-text-muted hover:text-brutify-text-secondary transition-colors cursor-pointer"
                      >
                        <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-[11px] font-body">
                          Lier à une vidéo publiée
                        </span>
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPublishPicker && savedScriptId && (
        <PublishPicker
          onSelect={handleLinkVideo}
          onClose={() => setShowPublishPicker(false)}
          currentVideoId={publishedVideoId}
        />
      )}

      <CreditConfirmModal
        open={showCreditModal}
        cost={2}
        actionLabel="Forger un script avec l'IA"
        onConfirm={handleForgeConfirm}
        onCancel={() => setShowCreditModal(false)}
      />

      {upgradeModal && (
        <UpgradeModal
          open
          feature={upgradeModal.feature}
          requiredPlan={upgradeModal.requiredPlan}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      <CreditToast
        open={toast !== null}
        message={toast?.message ?? ""}
        cost={toast?.cost ?? 0}
        remaining={toast?.remaining ?? 0}
        onClose={() => setToast(null)}
      />
    </motion.div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ─── Streaming Indicator ─────────────────────────────────────────────────────

const FORGE_STEPS = [
  { key: "hook", label: "Analyse du hook", icon: "🎯" },
  { key: "hook-write", label: "Construction du hook", icon: "✍️" },
  { key: "body", label: "Structuration du développement", icon: "🧱" },
  { key: "body-write", label: "Rédaction du script", icon: "📝" },
  { key: "cta", label: "Création du call-to-action", icon: "🔥" },
  { key: "notes", label: "Analyse finale", icon: "💡" },
] as const;

function sectionToStepIdx(section: string): number {
  switch (section) {
    case "hook": return 1;
    case "body": return 3;
    case "cta": return 4;
    case "notes": return 5;
    default: return 0;
  }
}

function StreamingIndicator({ activeSection }: { activeSection: string }) {
  const activeIdx = sectionToStepIdx(activeSection);
  const pct = Math.min(100, ((activeIdx + 1) / FORGE_STEPS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-brutify-gold/15 bg-[#111113]/60 backdrop-blur-xl p-5 mb-6"
    >
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brutify-gold/80 to-orange-500/80"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {FORGE_STEPS.map((step, i) => {
          const isDone = i < activeIdx;
          const isActive = i === activeIdx;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: isDone || isActive ? 1 : 0.35, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-2 py-1"
            >
              <span className="text-xs leading-none">{isDone ? "✓" : step.icon}</span>
              <span className={cn(
                "text-[11px] font-body transition-colors duration-300",
                isDone ? "text-green-400/80 line-through" :
                isActive ? "text-brutify-gold font-medium" :
                "text-brutify-text-muted/40"
              )}>
                {step.label}
              </span>
              {isActive && (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-brutify-gold"
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Config section wrapper ──────────────────────────────────────────────────

function ConfigSection({
  number,
  title,
  children,
  index,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.1 + index * 0.08,
        duration: 0.25,
        ease: EASE,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brutify-gold/10 border border-brutify-gold/20 text-[10px] font-body font-bold text-brutify-gold">
          {number}
        </span>
        <h2 className="font-display text-lg tracking-wider text-brutify-text-primary">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Video Context Tip ────────────────────────────────────────────────────────

const HOOK_SUBJECT_GUIDE: Record<string, string> = {
  Contrarian: "Quel sujet populaire dans ton domaine veux-tu remettre en question ? Explique quelle croyance tu veux challenger et pourquoi tu penses différemment.",
  Secret: "Quel insight exclusif veux-tu partager ? Décris ce que ton audience ne sait pas encore et pourquoi c'est important pour elle.",
  Douleur: "Quel problème précis de ton audience veux-tu aborder ? Décris la situation frustrante qu'elle vit et ce que tu proposes.",
  Story: "Quelle expérience personnelle veux-tu raconter ? Explique le contexte, ce qui s'est passé, et ce que tu en as tiré.",
  Expérience: "Quel résultat concret veux-tu mettre en avant ? Décris le contexte et ce qui a changé (pour toi ou un client).",
  Rupture: "Quelle idée reçue veux-tu détruire ? Explique ce que tout le monde croit à tort et ta vision alternative.",
  "Chiffre choc": "Quelle donnée surprenante veux-tu utiliser ? Décris ce que ce chiffre révèle et pourquoi ton audience devrait s'en soucier.",
  Question: "Quelle question veux-tu poser à ton audience ? Décris pourquoi cette question est importante et où tu veux l'emmener.",
  Tutorial: "Quelle compétence ou méthode veux-tu enseigner ? Sois précis : un seul concept, applicable tout de suite.",
  Teasing: "Quel sujet intrigant veux-tu teaser ? Décris ce que tu vas révéler sans tout donner — crée l'envie d'en savoir plus.",
};

const STRUCTURE_SUBJECT_GUIDE: Record<string, string> = {
  Listicle: "Pense à un sujet qui se découpe en étapes ou points distincts.",
  "Problème/Solution": "Décris le problème que tu veux aborder ET la solution que tu proposes.",
  Storytelling: "Donne les éléments clés de l'histoire : le contexte, le déclencheur, la transformation.",
  Contrarian: "Précise quelle position tu défends et pourquoi c'est différent du consensus.",
  Tutorial: "Décris la compétence précise que tu veux enseigner et le résultat attendu.",
  "Avant/Après": "Décris l'état 'avant' de ton audience et l'état 'après' que tu veux montrer.",
  "Défi/Résultat": "Explique le défi que tu as relevé (ou que tu proposes) et le résultat obtenu.",
  "Mythe/Réalité": "Précise le mythe que tu veux déconstruire et la vérité que tu vas révéler.",
  Boucle: "Donne le sujet principal et l'élément de suspense que tu veux créer.",
  "Valeur pure": "Liste ce que tu veux partager — sois ultra-spécifique sur le contenu actionnable.",
};

function VideoContextTip({
  hints,
  hookType,
  structureType,
}: {
  hints: { positioning?: string; audience?: string; valueMethod?: string; styleNotes?: string } | null;
  hookType?: string;
  structureType?: string;
}) {
  const tip = useMemo(() => {
    if (!hookType && !structureType) return null;

    const lines: string[] = [];

    const hookGuide = hookType ? HOOK_SUBJECT_GUIDE[hookType] : null;
    if (hookGuide) lines.push(hookGuide);

    const structGuide = structureType ? STRUCTURE_SUBJECT_GUIDE[structureType] : null;
    if (structGuide && structGuide !== hookGuide) lines.push(structGuide);

    if (hints?.audience) {
      lines.push(`Pense à t'adresser à : ${hints.audience}.`);
    }

    return lines.length > 0 ? lines : null;
  }, [hookType, structureType, hints]);

  if (!tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl border border-brutify-gold/10 bg-brutify-gold/[0.03] px-4 py-3 mb-3"
    >
      <div className="flex gap-2.5">
        <Sparkles className="h-3.5 w-3.5 text-brutify-gold/60 mt-0.5 shrink-0" />
        <div className="space-y-1.5">
          {tip.map((line, i) => (
            <p key={i} className="text-[11px] font-body text-brutify-text-secondary/80 leading-relaxed">
              {i === 0 ? <span className="text-brutify-gold/70 font-medium">💡 </span> : null}
              {line}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Planning Section ─────────────────────────────────────────────────────────

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "multi", label: "Multi", icon: "📱" },
] as const;

function PlanningSection({
  shootDate,
  editDate,
  publishDate,
  platform,
  onShootChange,
  onEditChange,
  onPublishChange,
  onPlatformChange,
}: {
  shootDate: string;
  editDate: string;
  publishDate: string;
  platform: string;
  onShootChange: (v: string) => void;
  onEditChange: (v: string) => void;
  onPublishChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
}) {
  const hasAnyDate = !!(shootDate || editDate || publishDate);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-brutify-gold/[0.12] bg-brutify-gold/[0.02] p-5"
    >
      <h4 className="font-display text-sm uppercase tracking-wider text-brutify-gold mb-4 flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5" />
        Planification
      </h4>

      <div className="space-y-3">
        <PlanDateRow
          icon={<Camera className="h-3.5 w-3.5" />}
          label="Tournage"
          value={shootDate}
          onChange={onShootChange}
          accentClass="text-blue-400"
        />
        <PlanDateRow
          icon={<Film className="h-3.5 w-3.5" />}
          label="Montage"
          value={editDate}
          onChange={onEditChange}
          accentClass="text-purple-400"
        />
        <PlanDateRow
          icon={<Send className="h-3.5 w-3.5" />}
          label="Publication"
          value={publishDate}
          onChange={onPublishChange}
          accentClass="text-brutify-gold"
        />

        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-[10px] font-body text-brutify-text-muted mb-2">Plateforme</p>
          <div className="flex gap-1.5">
            {PLATFORMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onPlatformChange(platform === p.value ? "" : p.value)}
                className={cn(
                  "flex-1 rounded-lg border py-1.5 text-center text-[10px] font-body transition-all duration-200 cursor-pointer",
                  platform === p.value
                    ? "border-brutify-gold/30 bg-brutify-gold/10 text-brutify-gold"
                    : "border-white/[0.06] bg-white/[0.02] text-brutify-text-muted hover:border-white/[0.1] hover:text-brutify-text-secondary"
                )}
                title={p.label}
              >
                <span className="text-xs">{p.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {hasAnyDate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-white/[0.06]"
        >
          <div className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-400" />
            <span className="text-[10px] font-body text-green-400/80">
              Synchronisé avec le calendrier
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function PlanDateRow({
  icon,
  label,
  value,
  onChange,
  accentClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  accentClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex items-center gap-1.5 w-20 sm:w-24 shrink-0", accentClass)}>
        {icon}
        <span className="text-[11px] font-body font-medium">{label}</span>
      </div>
      <DatePicker value={value} onChange={onChange} className="flex-1" />
    </div>
  );
}

// ─── Speech Textarea ──────────────────────────────────────────────────────────

function SpeechTextarea({
  subject,
  setSubject,
  speech,
}: {
  subject: string;
  setSubject: (v: string | ((prev: string) => string)) => void;
  speech: ReturnType<typeof useSpeechToText>;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayValue = speech.isListening && speech.interimText
    ? subject + (subject.length > 0 && !subject.endsWith(" ") ? " " : "") + speech.interimText
    : subject;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(96, el.scrollHeight)}px`;
  }, [displayValue]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={(e) => {
          if (!speech.isListening) setSubject(e.target.value);
        }}
        readOnly={speech.isListening}
        placeholder="Décris ton sujet, ce que tu veux dire, et comment tu veux être perçu...&#10;&#10;Ex: Je veux parler des mythes de la nutrition, en montrant que beaucoup de conseils populaires sont faux. Je veux paraître crédible mais accessible, pas donneur de leçons."
        rows={4}
        className={cn(
          "w-full rounded-xl border backdrop-blur-xl bg-white/[0.02] px-4 py-3 pr-12 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-300 resize-none overflow-hidden",
          speech.isListening
            ? "border-brutify-gold/50 ring-2 ring-brutify-gold/20 shadow-[0_0_40px_rgba(255,171,0,0.15)]"
            : "border-brutify-gold/15 shadow-[0_0_15px_rgba(255,171,0,0.1)] focus:border-brutify-gold/35 focus:ring-2 focus:ring-brutify-gold/25 focus:shadow-[0_0_30px_rgba(255,171,0,0.25)]"
        )}
      />

      {speech.isSupported && (
        <button
          type="button"
          onClick={speech.toggle}
          className={cn(
            "absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 z-10",
            speech.isListening
              ? "bg-brutify-gold/15 text-brutify-gold hover:bg-brutify-gold/25"
              : "bg-white/[0.04] text-brutify-text-muted hover:text-brutify-gold hover:bg-brutify-gold/10"
          )}
          title={speech.isListening ? "Arrêter la dictée" : "Dicter votre sujet"}
        >
          {speech.isListening ? (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <Mic className="h-4 w-4" />
            </motion.div>
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </button>
      )}

      <AnimatePresence>
        {speech.isListening && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-2 flex items-center gap-2.5"
          >
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-brutify-gold"
                  animate={speech.interimText
                    ? { height: [4, 14, 4], opacity: [0.5, 1, 0.5] }
                    : { height: [3, 6, 3], opacity: [0.3, 0.6, 0.3] }
                  }
                  transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                />
              ))}
            </div>
            <span className="text-[11px] font-body text-brutify-gold/70">
              {speech.interimText ? "Transcription en cours…" : "Parlez, je vous écoute…"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subject Progress Bar ─────────────────────────────────────────────────────

const CONTEXT_STEPS = [
  { at: 0,   label: "Commence à décrire ton sujet…",             color: "text-brutify-text-muted" },
  { at: 50,  label: "Minimum atteint — mais tu peux mieux faire", color: "text-orange-500/70" },
  { at: 100, label: "Ajoute ton angle et ton positionnement",     color: "text-orange-400/80" },
  { at: 170, label: "Précise le problème que tu résous",           color: "text-amber-400/80" },
  { at: 250, label: "Décris ta cible et ce qu'elle ressent",      color: "text-amber-300/80" },
  { at: 330, label: "Ajoute ta vision et ton style",              color: "text-brutify-gold/70" },
  { at: 420, label: "Excellent — le script sera ultra-ciblé",     color: "text-brutify-gold/90" },
  { at: 500, label: "Contexte parfait",                           color: "text-brutify-gold" },
] as const;

/* ── Template Picker ─────────────────────────────────────────────── */

const PICKER_COLLAPSED_COUNT = 4;

function TemplatePicker<T extends { id: string }>({
  items,
  selectedId,
  onSelect,
  renderItem,
}: {
  items: T[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const showExpand = items.length > PICKER_COLLAPSED_COUNT;
  const displayed = expanded ? items : items.slice(0, PICKER_COLLAPSED_COUNT);

  return (
    <div className="space-y-2.5">
      <div className={cn(
        "gap-2.5 pb-1",
        expanded
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          : "flex flex-nowrap overflow-x-auto scrollbar-hide"
      )}>
        {displayed.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]",
                !expanded && !isSelected && "shrink-0 w-[160px] sm:w-[190px] md:w-[220px]",
                !expanded && isSelected && "shrink-0 w-[200px] sm:w-[260px] md:w-[300px]",
                isSelected
                  ? "border-brutify-gold/30 bg-brutify-gold/[0.08] shadow-[0_0_30px_rgba(255,171,0,0.15)]"
                  : "border-white/[0.06] bg-white/[0.02] text-brutify-text-secondary hover:border-brutify-gold/20 hover:bg-white/[0.04]"
              )}
            >
              {renderItem(item, isSelected)}
            </button>
          );
        })}
      </div>
      {showExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 mx-auto text-[11px] font-body text-brutify-gold/70 hover:text-brutify-gold transition-colors cursor-pointer"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Voir tout ({items.length})
            </>
          )}
        </button>
      )}
    </div>
  );
}

function SubjectProgressBar({
  length,
  perfect,
}: {
  length: number;
  perfect: number;
}) {
  const pct = Math.min(100, (length / perfect) * 100);

  const currentStep = [...CONTEXT_STEPS].reverse().find((s) => length >= s.at) ?? CONTEXT_STEPS[0];
  const currentIdx = CONTEXT_STEPS.indexOf(currentStep);
  const isPerfect = length >= perfect;

  const barColor =
    currentIdx >= 7 ? "from-brutify-gold to-yellow-300" :
    currentIdx >= 5 ? "from-brutify-gold/80 to-brutify-gold" :
    currentIdx >= 3 ? "from-amber-500/80 to-brutify-gold/60" :
    currentIdx >= 1 ? "from-orange-500/70 to-amber-500/60" :
    "from-orange-600/50 to-orange-400/50";

  return (
    <div className="mt-3 space-y-2">
      <div className="relative h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        {CONTEXT_STEPS.slice(1).map((step) => (
          <div
            key={step.at}
            className="absolute top-0 h-full w-px bg-white/[0.1] z-10"
            style={{ left: `${(step.at / perfect) * 100}%` }}
          />
        ))}

        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        />

        {isPerfect && (
          <motion.div
            className="absolute inset-0 rounded-full bg-brutify-gold/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className={cn("text-[10px] font-body transition-colors duration-200", currentStep.color)}>
          {isPerfect && <span className="mr-1">✦</span>}
          {currentStep.label}
        </p>
        <div className="flex items-center gap-1">
          {CONTEXT_STEPS.slice(1).map((step, i) => (
            <div
              key={step.at}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                length >= step.at
                  ? "bg-brutify-gold w-2.5"
                  : i === currentIdx ? "bg-white/[0.15] w-2" : "bg-white/[0.08] w-1.5"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Body Sub-Sections ───────────────────────────────────────────────────────

const BODY_SECTION_COLORS = [
  "#FFD700", "#E5A800", "#CCB040", "#D4A017", "#B8860B", "#DAA520",
];

function BodySections({
  body,
  onChange,
  isStreaming,
  readOnly,
}: {
  body: string;
  onChange: (v: string) => void;
  isStreaming?: boolean;
  readOnly?: boolean;
}) {
  const sections = useMemo(() => parseBodySubSections(body), [body]);

  const handleSubSectionChange = useCallback(
    (idx: number, newContent: string) => {
      const updated = sections.map((s, i) =>
        i === idx ? { ...s, content: newContent } : s
      );
      const rebuilt = updated
        .map((s) =>
          s.title === "Développement" || s.title === "Introduction"
            ? s.content
            : `### ${s.title}\n${s.content}`
        )
        .join("\n\n");
      onChange(rebuilt);
    },
    [sections, onChange]
  );

  if (sections.length === 0) {
    return (
      <StreamableScriptBlock
        label="DÉVELOPPEMENT"
        labelColor="#FFD700"
        value={body}
        onChange={onChange}
        placeholder="Le développement va apparaître ici..."
        minRows={4}
        isStreaming={isStreaming}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <StreamableScriptBlock
          key={`${section.title}-${idx}`}
          label={section.title.toUpperCase()}
          labelColor={BODY_SECTION_COLORS[idx % BODY_SECTION_COLORS.length]}
          value={section.content}
          onChange={(v) => handleSubSectionChange(idx, v)}
          placeholder=""
          minRows={2}
          isStreaming={isStreaming}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

// ─── Streamable Script Block ─────────────────────────────────────────────────

function StreamableScriptBlock({
  label,
  labelColor,
  value,
  onChange,
  placeholder,
  minRows = 2,
  isStreaming,
  readOnly,
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minRows?: number;
  isStreaming?: boolean;
  readOnly?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minRows * 24)}px`;
  }, [value, minRows]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        filter: "blur(0px)",
        boxShadow: isStreaming 
          ? ["0 0 20px rgba(255,171,0,0.15)", "0 0 35px rgba(255,171,0,0.3)", "0 0 20px rgba(255,171,0,0.15)"]
          : "0 0 15px rgba(255,171,0,0.1)"
      }}
      transition={{ 
        duration: 0.3, 
        ease: EASE,
        boxShadow: isStreaming ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}
      }}
      className={cn(
        "group rounded-2xl border bg-[#111113]/60 backdrop-blur-xl overflow-hidden transition-all duration-300",
        isStreaming
          ? "border-brutify-gold/30 shadow-[0_0_30px_rgba(255,171,0,0.2)]"
          : "border-brutify-gold/15 hover:border-brutify-gold/25 focus-within:border-brutify-gold/35 focus-within:shadow-[0_0_30px_rgba(255,171,0,0.25)]"
      )}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-body font-bold uppercase tracking-[0.15em]"
            style={{ color: labelColor }}
          >
            {label}
          </span>
          {isStreaming && (
            <span className="inline-block h-2 w-2 rounded-full bg-brutify-gold animate-pulse" />
          )}
        </div>
        {!readOnly && (
          <Pencil className="h-3 w-3 text-brutify-text-muted/30 group-focus-within:text-brutify-gold/40 transition-colors duration-200" />
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full bg-transparent px-5 pb-4 text-sm font-body text-brutify-text-secondary leading-relaxed outline-none resize-none placeholder:text-brutify-text-muted/40",
          readOnly && "cursor-default"
        )}
        style={{ overflow: "hidden" }}
      />
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  active,
  disabled,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-body font-medium transition-all duration-200 cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed",
        highlight
          ? "border-brutify-gold/40 bg-brutify-gold/10 text-brutify-gold hover:bg-brutify-gold/20 shadow-[0_0_12px_rgba(255,171,0,0.15)]"
          : active
            ? "border-brutify-gold/20 bg-brutify-gold/[0.06] text-brutify-gold"
            : "border-white/[0.06] bg-white/[0.02] text-brutify-text-secondary hover:border-white/[0.1] hover:text-brutify-text-primary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function ParamRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-body text-brutify-text-muted">
        {label}
      </span>
      <Badge variant="gold">{value}</Badge>
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_8px_rgba(0,0,0,0.2)]">
      <p className="font-display text-lg tracking-wider text-brutify-text-primary leading-none">
        {value}
      </p>
      <p className="text-[10px] font-body text-brutify-text-muted mt-1">
        {label}
      </p>
    </div>
  );
}

// ─── Publish Picker Modal ──────────────────────────────────────────────────────

interface OwnVideo {
  id: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  url: string | null;
  views: number | null;
  outlier_score: number | null;
  posted_at: string | null;
  hasTranscription: boolean;
  linkedScript: { id: string; title: string | null } | null;
}

function PublishPicker({
  onSelect,
  onClose,
  currentVideoId,
}: {
  onSelect: (videoId: string, videoTitle: string) => void;
  onClose: () => void;
  currentVideoId: string | null;
}) {
  const [videos, setVideos] = useState<OwnVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/own-videos")
      .then((r) => r.json())
      .then((d) => {
        if (d.videos) setVideos(d.videos);
        else setError("Impossible de charger tes vidéos");
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getOutlierColor = (score: number | null) => {
    if (!score) return "text-brutify-text-muted";
    if (score >= 5) return "text-brutify-gold";
    if (score >= 2) return "text-orange-400";
    return "text-brutify-text-muted";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div>
              <h3 className="font-display text-base uppercase tracking-wider text-brutify-text-primary">
                Lier une vidéo publiée
              </h3>
              <p className="text-[11px] font-body text-brutify-text-muted mt-0.5">
                Connecte ce script à la vidéo que tu as publiée
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-brutify-text-muted hover:text-brutify-text-primary transition-colors p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loading variant="block" size="sm" />
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-8">
                <p className="text-sm font-body text-red-400">{error}</p>
                <p className="text-[11px] font-body text-brutify-text-muted mt-1">
                  Assure-toi d&apos;avoir lié ton compte Instagram dans les paramètres
                </p>
              </div>
            )}

            {!loading && !error && videos.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Video className="h-8 w-8 text-brutify-text-muted/30 mx-auto" />
                <p className="text-sm font-body text-brutify-text-secondary">
                  Aucune vidéo détectée
                </p>
                <p className="text-[11px] font-body text-brutify-text-muted">
                  Lie ton compte Instagram dans les paramètres pour que Brutify
                  détecte automatiquement tes nouvelles vidéos.
                </p>
              </div>
            )}

            {!loading && !error && videos.length > 0 && (
              <div className="space-y-2">
                {videos.map((video) => {
                  const isSelected = video.id === currentVideoId;
                  const isLinked = video.linkedScript !== null && !isSelected;
                  const title =
                    video.title ||
                    video.description?.slice(0, 60) ||
                    "Vidéo sans titre";

                  return (
                    <button
                      key={video.id}
                      onClick={() => onSelect(video.id, title)}
                      disabled={isLinked}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "border-brutify-gold/30 bg-brutify-gold/[0.06]"
                          : isLinked
                            ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="h-12 w-20 rounded-lg bg-white/[0.04] border border-white/[0.06] flex-shrink-0 overflow-hidden">
                        {video.thumbnail_url ? (
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(video.thumbnail_url)}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Video className="h-4 w-4 text-brutify-text-muted/30" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-body font-medium text-brutify-text-primary truncate">
                          {title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-body text-brutify-text-muted">
                            {formatDate(video.posted_at)}
                          </span>
                          {video.views ? (
                            <span className="text-[10px] font-body text-brutify-text-muted">
                              · {(video.views / 1000).toFixed(0)}k vues
                            </span>
                          ) : null}
                          {video.outlier_score !== null && (
                            <span
                              className={cn(
                                "text-[10px] font-body",
                                getOutlierColor(video.outlier_score)
                              )}
                            >
                              · ×{video.outlier_score.toFixed(1)}
                            </span>
                          )}
                          {video.hasTranscription && (
                            <span className="text-[10px] font-body text-purple-400">
                              · transcript
                            </span>
                          )}
                        </div>
                        {isLinked && (
                          <p className="text-[10px] font-body text-brutify-text-muted/60 mt-0.5">
                            Lié à un autre script
                          </p>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-brutify-gold flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && !error && videos.length === 0 && (
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <a
                href="/settings?tab=profil"
                className="text-[11px] font-body text-brutify-gold hover:underline"
              >
                Configurer mon compte Instagram →
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Source video progress ───────────────────────────────────────────────────

function SourceVideoProgress({ steps, currentIndex }: { steps: typeof SOURCE_PREP_STEPS; currentIndex: number }) {
  const progress = Math.min(((currentIndex + 1) / steps.length) * 100, 100);

  return (
    <div className="space-y-3">
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brutify-gold/80 to-orange-500/80"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= currentIndex ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.3, delay: i <= currentIndex ? 0.05 : 0 }}
              className="flex items-center gap-2.5 py-0.5"
            >
              <span className="w-5 text-center text-sm leading-none">
                {isDone ? "✓" : isCurrent ? step.icon : "○"}
              </span>
              <span className={cn(
                "text-xs font-body transition-colors duration-300",
                isDone ? "text-brutify-gold/60" : isCurrent ? "text-brutify-gold font-semibold" : "text-brutify-text-muted/30"
              )}>
                {step.label}
              </span>
              {isCurrent && (
                <Loading variant="icon" size="sm" className="h-3 w-3 text-brutify-gold/60 ml-auto" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function ScriptsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loading variant="page" size="lg" />
      </div>
    }>
      <ScriptsPageContent />
    </Suspense>
  );
}
