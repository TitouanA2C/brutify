"use client";

import { useState, useCallback, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { HookTemplate, ScriptStructure } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCredits } from "@/lib/credits-context";
import { CreditConfirmModal } from "@/components/ui/CreditConfirmModal";
import { useGenerateScript } from "@/hooks/useScripts";
import { useCreateVaultItem } from "@/hooks/useVault";
import { useCreateBoardItem } from "@/hooks/useBoard";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CreditToast } from "@/components/ui/CreditToast";
import { useUpsell } from "@/hooks/useUpsellTrigger";
import { useUser } from "@/hooks/useUser";

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

// ─── Animations ──────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  const sourceVideoId = searchParams.get("source_video_id");
  
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

  const [subject, setSubject] = useState("");
  const [selectedHook, setSelectedHook] = useState<HookTemplate | null>(null);
  const [selectedStructure, setSelectedStructure] =
    useState<ScriptStructure | null>(null);

  // Pré-remplir depuis une vidéo source
  useEffect(() => {
    if (!sourceVideoId || !hookTemplates.length || !scriptStructures.length) return;
    
    fetch(`/api/videos/${sourceVideoId}`)
      .then(res => res.json())
      .then(data => {
        if (data.video) {
          setSubject(data.video.title || "");
        }
        
        // Si l'analyse existe, pré-sélectionner hook et structure
        if (data.analysis) {
          const hookType = data.analysis.hook_type;
          const structureType = data.analysis.structure_type;
          
          if (hookType) {
            const matchingHook = hookTemplates.find(h => h.type === hookType);
            if (matchingHook) setSelectedHook(matchingHook);
          }
          
          if (structureType) {
            const matchingStructure = scriptStructures.find(s => s.name === structureType);
            if (matchingStructure) setSelectedStructure(matchingStructure);
          }
        }
      })
      .catch(() => {
        // Silent fail
      });
  }, [sourceVideoId, hookTemplates, scriptStructures]);
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
  const { create: createVaultItem, isCreating: savingVault } = useCreateVaultItem();
  const { create: createBoardItem, isCreating: savingBoard } = useCreateBoardItem();
  const [savedVault, setSavedVault] = useState(false);
  const [savedBoard, setSavedBoard] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ feature: string; requiredPlan: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; cost: number; remaining: number } | null>(null);

  // Boucle de rétroaction — liaison script ↔ vidéo publiée
  const [publishedVideoId, setPublishedVideoId] = useState<string | null>(null);
  const [publishedVideoTitle, setPublishedVideoTitle] = useState<string | null>(null);
  const [showPublishPicker, setShowPublishPicker] = useState(false);

  const [liveSection, setLiveSection] = useState("hook");
  const streamTextRef = useRef("");

  const { generate, abort } = useGenerateScript();

  const canForge =
    subject.trim().length > 0 && selectedHook && selectedStructure;

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
              const recentScripts = scriptsData.scripts.filter((s: any) => 
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
      await createBoardItem({
        title: subject || "Script forgé",
        status: "draft",
        script_id: savedScriptId ?? undefined,
      });
      setSavedBoard(true);
    } catch {
      /* silently fail */
    }
  }, [savingBoard, savedBoard, subject, savedScriptId, createBoardItem]);

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
                className="mb-4 flex items-center gap-2 rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-3"
              >
                <Video className="h-4 w-4 text-brutify-gold shrink-0" />
                <p className="text-xs font-body text-brutify-gold">
                  Hook et structure automatiquement extraits de la vidéo analysée
                </p>
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
              {/* Banque guidée — Sujets qui performent */}
              {insights?.topics && insights.topics.length > 0 && (
                <ConfigSection index={0} number={1} title="BANQUE GUIDÉE — SUJETS QUI PERFORMENT">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {insights.topics.map((topic, i) => (
                      <motion.button
                        key={i}
                        onClick={() => setSubject(topic.name)}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer",
                          subject === topic.name
                            ? "border-brutify-gold/30 bg-brutify-gold/[0.1] shadow-[0_0_30px_rgba(255,171,0,0.2)]"
                            : topic.category === "outlier"
                              ? "border-orange-500/20 bg-orange-500/[0.05] hover:border-orange-500/30"
                              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                        )}
                      >
                        <p className="text-xs font-body font-semibold text-brutify-text-primary line-clamp-2 min-h-[32px]">
                          {topic.name}
                        </p>
                        {topic.category === "outlier" && (
                          <Badge variant="gold" className="mt-1.5 text-[9px]">Outlier</Badge>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-[10px] font-body text-brutify-text-muted mt-2">
                    Ces sujets sont extraits de tes veilles concurrentielles et ont performé chez d'autres créateurs.
                  </p>
                </ConfigSection>
              )}

              {/* Step 1: Sujet */}
              <ConfigSection 
                index={insights?.topics && insights.topics.length > 0 ? 1 : 0} 
                number={insights?.topics && insights.topics.length > 0 ? 2 : 1} 
                title="TON SUJET & VISION"
              >
                <textarea
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Décris ton sujet, ce que tu veux dire, et comment tu veux être perçu...&#10;&#10;Ex: Je veux parler des mythes de la nutrition, en montrant que beaucoup de conseils populaires sont faux. Je veux paraître crédible mais accessible, pas donneur de leçons."
                  rows={4}
                  className="w-full rounded-xl border border-brutify-gold/15 backdrop-blur-xl bg-white/[0.02] px-4 py-3 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-200 shadow-[0_0_15px_rgba(255,171,0,0.1)] focus:border-brutify-gold/35 focus:ring-2 focus:ring-brutify-gold/25 focus:shadow-[0_0_30px_rgba(255,171,0,0.25)] resize-none"
                />
                <p className="text-[10px] font-body text-brutify-text-muted mt-1.5">
                  Plus tu donnes de contexte sur ta vision et ton positionnement, meilleur sera le script.
                </p>
              </ConfigSection>

              {/* Step 2 (ou 3): Hook */}
              <ConfigSection 
                index={insights?.topics && insights.topics.length > 0 ? 2 : 1} 
                number={insights?.topics && insights.topics.length > 0 ? 3 : 2} 
                title="CHOISIS TON HOOK"
              >
                {hookTemplates.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-xs font-body text-brutify-text-muted">
                      Aucun hook disponible. Lance une veille concurrentielle pour débloquer des hooks qui performent.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hookTemplates.map((ht) => (
                    <motion.button
                      key={ht.id}
                      onClick={() =>
                        setSelectedHook(
                          selectedHook?.id === ht.id ? null : ht
                        )
                      }
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer",
                        selectedHook?.id === ht.id
                          ? "border-brutify-gold/30 bg-brutify-gold/[0.1] shadow-[0_0_30px_rgba(255,171,0,0.2)]"
                          : "border-white/[0.06] bg-white/[0.02] text-brutify-text-secondary hover:border-brutify-gold/20 hover:shadow-[0_0_20px_rgba(255,171,0,0.12)]"
                      )}
                    >
                      <p className="text-xs font-body font-semibold text-brutify-text-primary mb-0.5">
                        {ht.name}
                      </p>
                      <p className="text-[10px] font-body italic text-brutify-text-muted leading-snug mb-2 line-clamp-2">
                        {ht.template}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-gradient"
                            style={{ width: `${ht.performanceScore}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-body font-bold text-brutify-gold">
                          {ht.performanceScore}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ConfigSection>

              {/* Step 3 (ou 4): Structure */}
              <ConfigSection 
                index={insights?.topics && insights.topics.length > 0 ? 3 : 2} 
                number={insights?.topics && insights.topics.length > 0 ? 4 : 3} 
                title="CHOISIS TA STRUCTURE"
              >
                {scriptStructures.length === 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                    <p className="text-xs font-body text-brutify-text-muted">
                      Aucune structure disponible. Lance une veille concurrentielle pour découvrir des structures qui marchent.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {scriptStructures.map((ss) => (
                    <motion.button
                      key={ss.id}
                      onClick={() =>
                        setSelectedStructure(
                          selectedStructure?.id === ss.id ? null : ss
                        )
                      }
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer",
                        selectedStructure?.id === ss.id
                          ? "border-brutify-gold/30 bg-brutify-gold/[0.1] shadow-[0_0_30px_rgba(255,171,0,0.2)]"
                          : "border-white/[0.06] bg-white/[0.02] text-brutify-text-secondary hover:border-brutify-gold/20 hover:shadow-[0_0_20px_rgba(255,171,0,0.12)]"
                      )}
                    >
                      <p className="text-xs font-body font-semibold text-brutify-text-primary mb-1">
                        {ss.name}
                      </p>
                      <p className="text-[10px] font-mono text-brutify-text-muted leading-snug mb-1.5 line-clamp-2">
                        {ss.skeleton}
                      </p>
                      <p className="text-[9px] font-body text-brutify-text-muted/60 leading-snug line-clamp-1">
                        {ss.description}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </ConfigSection>

              {/* Forge button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{
                  delay: 0.1 + (insights?.topics && insights.topics.length > 0 ? 4 : 3) * 0.08,
                  duration: 0.4,
                  ease: EASE,
                }}
                className="pb-8"
              >
                <motion.button
                  onClick={handleForgeClick}
                  disabled={!canForge}
                  whileHover={canForge ? { scale: 1.02, y: -2 } : {}}
                  whileTap={canForge ? { scale: 0.98 } : {}}
                  className={cn(
                    "relative w-full rounded-2xl py-4 font-display text-xl tracking-wider uppercase transition-all duration-300 overflow-hidden cursor-pointer",
                    canForge
                      ? "bg-gold-gradient text-brutify-bg shadow-[0_0_60px_rgba(255,171,0,0.4)] hover:shadow-[0_0_80px_rgba(255,171,0,0.6)]"
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
                </motion.button>

                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <CreditCard className="h-3 w-3 text-brutify-text-muted" />
                  <span className="text-[11px] font-body text-brutify-text-muted">
                    1 BP par génération
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
                  <h1 className="font-display text-2xl uppercase tracking-wider text-brutify-text-primary">
                    {forgeState === "streaming" ? "Génération en cours..." : "Script forgé"}
                  </h1>
                  <p className="text-xs font-body text-brutify-text-muted mt-0.5">
                    {subject.slice(0, 60)}
                    {subject.length > 60 ? "..." : ""} ·{" "}
                    {selectedHook?.name} · {selectedStructure?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  rows={3}
                  isStreaming={forgeState === "streaming" && liveSection === "hook"}
                  readOnly={forgeState === "streaming"}
                />
                <StreamableScriptBlock
                  label="DÉVELOPPEMENT"
                  labelColor="#FFD700"
                  value={editBody}
                  onChange={setEditBody}
                  placeholder="Le développement va apparaître ici..."
                  rows={12}
                  isStreaming={forgeState === "streaming" && liveSection === "body"}
                  readOnly={forgeState === "streaming"}
                />
                <StreamableScriptBlock
                  label="CTA"
                  labelColor="#CC8800"
                  value={editCta}
                  onChange={setEditCta}
                  placeholder="Le call-to-action va apparaître ici..."
                  rows={3}
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
                      value={`~${Math.max(
                        1,
                        Math.round(
                          countWords(editHook + " " + editBody + " " + editCta) / 150
                        )
                      )} min`}
                    />
                    <StatBox label="Sections" value={3} />
                  </div>
                </motion.div>

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
        cost={1}
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

const SECTION_ORDER = ["hook", "body", "cta", "notes"] as const;
const SECTION_LABELS: Record<string, string> = {
  hook: "Hook",
  body: "Développement",
  cta: "CTA",
  notes: "Analyse",
};

function StreamingIndicator({ activeSection }: { activeSection: string }) {
  const activeIdx = SECTION_ORDER.indexOf(
    activeSection as (typeof SECTION_ORDER)[number]
  );

  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      {SECTION_ORDER.map((section, i) => {
        const isDone = i < activeIdx;
        const isActive = i === activeIdx;
        return (
          <motion.div
            key={section}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: isActive ? 1 : isDone ? 0.8 : 0.3,
            }}
            className="flex items-center gap-1.5"
          >
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-300",
                isDone
                  ? "bg-green-400"
                  : isActive
                    ? "bg-brutify-gold animate-pulse"
                    : "bg-white/20"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-body transition-colors duration-300",
                isDone
                  ? "text-green-400"
                  : isActive
                    ? "text-brutify-gold"
                    : "text-brutify-text-muted/50"
              )}
            >
              {SECTION_LABELS[section]}
            </span>
          </motion.div>
        );
      })}
    </div>
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

// ─── Streamable Script Block ─────────────────────────────────────────────────

function StreamableScriptBlock({
  label,
  labelColor,
  value,
  onChange,
  placeholder,
  rows,
  isStreaming,
  readOnly,
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows: number;
  isStreaming?: boolean;
  readOnly?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isStreaming && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [value, isStreaming]);

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
        rows={rows}
        readOnly={readOnly}
        className={cn(
          "w-full bg-transparent px-5 pb-4 text-sm font-body text-brutify-text-secondary leading-relaxed outline-none resize-none placeholder:text-brutify-text-muted/40",
          readOnly && "cursor-default"
        )}
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
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-body font-medium transition-all duration-200 cursor-pointer",
        disabled && "opacity-40 cursor-not-allowed",
        active
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
          className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl overflow-hidden"
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
                <div className="h-5 w-5 rounded-full border-2 border-brutify-gold/30 border-t-brutify-gold animate-spin" />
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

export default function ScriptsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brutify-gold border-t-transparent" />
      </div>
    }>
      <ScriptsPageContent />
    </Suspense>
  );
}
