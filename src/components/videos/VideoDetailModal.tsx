"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Flame,
  Zap,
  ScrollText,
  LayoutDashboard,
  Brain,
  CreditCard,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  ChevronDown,
  Target,
  Lightbulb,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Video } from "@/lib/types";
import { parseStoredAnalysis, type FullVideoAnalysis } from "@/lib/ai/claude";
import { useCredits } from "@/lib/credits-context";
import { CreditConfirmModal } from "@/components/ui/CreditConfirmModal";
import { useCreateBoardItem } from "@/hooks/useBoard";
import { useToast } from "@/lib/toast-context";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CreditToast } from "@/components/ui/CreditToast";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/utils";
import { useUpsell } from "@/hooks/useUpsellTrigger";

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function proxyVideo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-video?url=${encodeURIComponent(url)}`;
}

interface TranscriptionData {
  id: string;
  content: string;
  language: string;
  created_at: string;
}

interface AnalysisData {
  id: string;
  hook_type: string | null;
  hook_analysis: string | null;
  structure_type: string | null;
  structure_analysis: string | null;
  style_analysis: string | null;
  created_at: string;
}

interface CreatorMini {
  name: string;
  handle: string;
  avatarUrl: string;
}

interface VideoDetailModalProps {
  video: Video | null;
  creator?: CreatorMini | null;
  onClose: () => void;
}

const ANALYSIS_STEPS = [
  { label: "Récupération du transcript", icon: "📝" },
  { label: "Transcription audio (Whisper)", icon: "🎙️" },
  { label: "Découpage structurel du script", icon: "✂️" },
  { label: "Analyse du hook", icon: "🎯" },
  { label: "Analyse de la structure", icon: "🧱" },
  { label: "Analyse de la valeur", icon: "💎" },
  { label: "Analyse du positionnement", icon: "📍" },
  { label: "Finalisation", icon: "✨" },
]

export function VideoDetailModal({ video, creator: creatorProp, onClose }: VideoDetailModalProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastErrorAction, setLastErrorAction] = useState<"transcript" | "analysis" | null>(null);
  const [pendingAction, setPendingAction] = useState<"analysis" | null>(null);
  const { credits, addUsage } = useCredits();
  const { triggerUpsell } = useUpsell();
  const { create: createBoardItem, isCreating: savingBoard } = useCreateBoardItem();
  const [savedInspiration, setSavedInspiration] = useState(false);
  const [savedBoard, setSavedBoard] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ feature: string; requiredPlan: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; cost: number; remaining: number } | null>(null);

  const creator = creatorProp ?? null;

  useEffect(() => {
    if (!video) return;
    setTranscription(null);
    setAnalysis(null);
    setApiError(null);
    setTranscribing(false);
    setAnalyzing(false);
    setPendingAction(null);
    setSavedBoard(false);
    setSavedInspiration(false);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [video, onClose]);

  const handleAnalyze = useCallback(async () => {
    if (!video) return;
    setPendingAction(null);
    setAnalyzing(true);
    setAnalysisStep(0);
    setApiError(null);
    setLastErrorAction(null);
    try {
      const res = await fetch(`/api/videos/${video.id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.status === 403 && data.feature) {
        setUpgradeModal({ feature: data.feature, requiredPlan: data.required_plan });
        setAnalyzing(false);
        return;
      }
      if (!res.ok) {
        setLastErrorAction("analysis");
        setApiError(data.error ?? "Erreur lors de l'analyse");
        setAnalyzing(false);
        return;
      }
      setAnalysisStep(ANALYSIS_STEPS.length - 1);
      setAnalysis(data.analysis);
      if (data.transcription) setTranscription(data.transcription);
      if (!data.cached) {
        addUsage(`Analyse IA — ${video.title.slice(0, 30)}`, data.credits_consumed);
        setToast({ message: "Analyse IA terminée", cost: data.credits_consumed, remaining: credits - data.credits_consumed });
      }
    } catch {
      setLastErrorAction("analysis");
      setApiError("Erreur réseau lors de l'analyse");
    }
    setAnalyzing(false);
  }, [video, addUsage, credits]);

  const router = useRouter();
  const toastCtx = useToast();

  const handleAddToInspiration = useCallback(async () => {
    if (!video || savingBoard || savedInspiration) return;
    try {
      const result = await createBoardItem({ title: video.title || "Vidéo inspiration", status: "inspiration", source_video_id: video.id });
      setSavedInspiration(true);
      if (result?.bonusClaimable) {
        toastCtx.success(`Bonus débloqué ! Récupère tes ${result.bonusClaimable.reward} BP sur le dashboard.`);
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch { /* silent */ }
  }, [video, savingBoard, savedInspiration, createBoardItem, toastCtx, router]);

  const handleAddToBoard = useCallback(async () => {
    if (!video || savingBoard || savedBoard) return;
    try {
      const result = await createBoardItem({ title: video.title || "Contenu depuis vidéo", status: "idea", source_video_id: video.id });
      setSavedBoard(true);
      if (result?.bonusClaimable) {
        toastCtx.success(`Bonus débloqué ! Récupère tes ${result.bonusClaimable.reward} BP sur le dashboard.`);
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch { /* silent */ }
  }, [video, savingBoard, savedBoard, createBoardItem, toastCtx, router]);
  const [forgingScript, setForgingScript] = useState(false);

  const handleForgeScript = useCallback(async () => {
    if (!video || transcribing || analyzing || forgingScript) return;
    setForgingScript(true);
    setApiError(null);

    try {
      // Étape 1: Vérifier/Obtenir la transcription
      if (!transcription) {
        setPendingAction(null);
        setTranscribing(true);
        const transRes = await fetch(`/api/videos/${video.id}/transcribe`, { method: "POST" });
        const transData = await transRes.json();
        
        if (transRes.status === 403 && transData.feature) {
          setUpgradeModal({ feature: transData.feature, requiredPlan: transData.required_plan });
          triggerUpsell("transcription_limit");
          setTranscribing(false);
          setForgingScript(false);
          return;
        }
        
        if (!transRes.ok) {
          setApiError(transData.error ?? "Erreur lors de la transcription");
          setTranscribing(false);
          setForgingScript(false);
          return;
        }
        
        setTranscription(transData.transcription);
        if (!transData.cached) {
          addUsage(`Transcription — ${video.title.slice(0, 30)}`, transData.credits_consumed);
          setToast({ message: "Transcription générée", cost: transData.credits_consumed, remaining: credits - transData.credits_consumed });
        }
        setTranscribing(false);
      }

      // Étape 2: Vérifier/Obtenir l'analyse
      if (!analysis) {
        setAnalyzing(true);
        const analyzeRes = await fetch(`/api/videos/${video.id}/analyze`, { method: "POST" });
        const analyzeData = await analyzeRes.json();
        
        if (analyzeRes.status === 403 && analyzeData.feature) {
          setUpgradeModal({ feature: analyzeData.feature, requiredPlan: analyzeData.required_plan });
          setAnalyzing(false);
          setForgingScript(false);
          return;
        }
        
        if (!analyzeRes.ok) {
          setApiError(analyzeData.error ?? "Erreur lors de l'analyse");
          setAnalyzing(false);
          setForgingScript(false);
          return;
        }
        
        setAnalysis(analyzeData.analysis);
        if (!analyzeData.cached) {
          addUsage(`Analyse IA — ${video.title.slice(0, 30)}`, analyzeData.credits_consumed);
          setToast({ message: "Analyse IA terminée", cost: analyzeData.credits_consumed, remaining: credits - analyzeData.credits_consumed });
        }
        setAnalyzing(false);
      }

      // Étape 3: Rediriger vers /scripts avec source_video_id
      router.push(`/scripts?source_video_id=${video.id}`);
    } catch (err) {
      setApiError("Erreur lors de la préparation du script");
      setForgingScript(false);
    }
  }, [video, transcription, analysis, transcribing, analyzing, forgingScript, addUsage, credits, router]);

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-10"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Détails — ${video.title}`}
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: EASE_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-screen md:max-h-[92vh] rounded-none md:rounded-2xl border-0 md:border md:border-white/[0.06] bg-[#111113] shadow-[0_32px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
          >
            {/* ── Close button (always visible) ── */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] backdrop-blur-md text-white/40 hover:text-white hover:bg-white/[0.1] transition-all duration-200 cursor-pointer"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ── Scrollable body — everything scrolls ── */}
            <div className="overflow-y-auto flex-1 min-h-0">

              {/* ── Compact header: thumbnail + info side by side ── */}
              <div className="p-5 md:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                  {/* Video preview */}
                  <VideoPreview video={video} />

                  {/* Info */}
                  <div className="flex-1 min-w-0 py-0.5">
                    {/* Creator */}
                    {creator && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0 ring-1 ring-white/[0.08]">
                          <Image src={creator.avatarUrl} alt={creator.name} fill className="object-cover" sizes="24px" />
                        </div>
                        <span className="text-xs font-body font-medium text-brutify-text-muted truncate">{creator.name}</span>
                        <span className="text-[10px] font-body text-brutify-gold/50 truncate">@{creator.handle.replace("@","")}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="font-body text-base md:text-lg font-bold text-white leading-snug mb-3 line-clamp-2">
                      {video.title}
                    </h2>

                    {/* Inline stats */}
                    <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs font-body">
                      <span className="flex items-center gap-1.5 text-brutify-gold">
                        <Eye className="h-3 w-3" />
                        <span className="font-display font-bold tracking-wide">{video.views}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-brutify-text-muted/60">
                        <Heart className="h-3 w-3" />
                        {video.likes}
                      </span>
                      <span className="flex items-center gap-1.5 text-brutify-text-muted/60">
                        <MessageCircle className="h-3 w-3" />
                        {video.comments}
                      </span>
                      {video.shares !== "0" && (
                        <span className="flex items-center gap-1.5 text-brutify-text-muted/60">
                          <Share2 className="h-3 w-3" />
                          {video.shares}
                        </span>
                      )}
                    </div>

                    {/* Outlier + engagement inline */}
                    <div className="flex items-center gap-2.5 mt-2.5">
                      <OutlierPill score={video.outlierScore} />
                      <EngagementPill video={video} />
                      {video.date && (
                        <span className="text-[10px] font-body text-brutify-text-muted/30">{video.date}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="mx-5 md:mx-6 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

              {/* Error banner */}
              {apiError && (
                <div className="mx-5 md:mx-6 mt-4 flex items-center gap-2.5 rounded-xl bg-red-500/8 border border-red-500/15 px-4 py-2.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-xs font-body text-red-400/80 flex-1">{apiError}</p>
                  <button onClick={() => { setApiError(null); setLastErrorAction(null); }} className="text-red-400/40 hover:text-red-400 cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* ── AI content ── */}
              <div className="p-5 md:p-6 space-y-5">
                <AIPanel
                  title="Analyse IA"
                  icon={<Brain className="h-4 w-4" />}
                  loading={analyzing}
                  loadingLabel="Analyse IA en cours…"
                  progressSteps={ANALYSIS_STEPS}
                  progressIndex={analysisStep}
                  cost={transcription ? "5 BP" : "8 BP"}
                  costNote={!transcription ? "5 BP analyse + 3 BP transcription" : undefined}
                  ctaLabel="Analyser avec l'IA"
                  onTrigger={() => setPendingAction("analysis")}
                  done={!!analysis}
                  error={lastErrorAction === "analysis" ? apiError : null}
                  onDismissError={() => { setApiError(null); setLastErrorAction(null); }}
                >
                  {analysis && (
                    analysis.style_analysis === "v2_structural"
                      ? <StructuralAnalysisDisplay analysis={analysis} />
                      : (
                        <div className="space-y-3">
                          {analysis.hook_analysis && (
                            <AnalysisCard title="Hook" type={analysis.hook_type} content={analysis.hook_analysis} />
                          )}
                          {analysis.structure_analysis && (
                            <AnalysisCard title="Structure" type={analysis.structure_type} content={analysis.structure_analysis} />
                          )}
                          {analysis.style_analysis && (
                            <AnalysisCard title="Style" content={analysis.style_analysis} />
                          )}
                        </div>
                      )
                  )}
                </AIPanel>
              </div>
            </div>

            {/* ── Sticky action bar ── */}
            <div className="shrink-0 border-t border-white/[0.06] bg-[#111113]/95 backdrop-blur-md px-5 md:px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <Button 
                  variant="primary" 
                  size="md" 
                  className="flex-1 h-10 text-sm" 
                  onClick={handleForgeScript}
                  disabled={forgingScript || transcribing || analyzing}
                >
                  {forgingScript || transcribing || analyzing ? (
                    <>
                      <Loading variant="icon" size="sm" className="h-4 w-4" />
                      {transcribing ? "Transcription..." : analyzing ? "Analyse..." : "Préparation..."}
                    </>
                  ) : (
                    <>
                      <ScrollText className="h-4 w-4" />
                      Forger un script
                    </>
                  )}
                </Button>
                <Button variant="secondary" size="md" className="h-10" onClick={handleAddToInspiration} disabled={savingBoard || savedInspiration}>
                  {savedInspiration ? <Sparkles className="h-4 w-4 text-brutify-gold" /> : savingBoard ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                  {savedInspiration ? "Ajouté" : "Inspiration"}
                </Button>
                <Button variant="ghost" size="md" className="h-10" onClick={handleAddToBoard} disabled={savingBoard || savedBoard}>
                  {savedBoard ? <Sparkles className="h-4 w-4 text-brutify-gold" /> : savingBoard ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                  {savedBoard ? "Ajouté" : "BrutBoard"}
                </Button>
              </div>
            </div>
          </motion.div>

          <CreditConfirmModal
            open={pendingAction !== null}
            cost={transcription ? 5 : 8}
            actionLabel={transcription ? "Analyser cette vidéo" : "Transcrire + Analyser cette vidéo"}
            onConfirm={() => handleAnalyze()}
            onCancel={() => setPendingAction(null)}
          />

          {upgradeModal && (
            <UpgradeModal open feature={upgradeModal.feature} requiredPlan={upgradeModal.requiredPlan} onClose={() => setUpgradeModal(null)} />
          )}

          <CreditToast
            open={toast !== null}
            message={toast?.message ?? ""}
            cost={toast?.cost ?? 0}
            remaining={toast?.remaining ?? 0}
            onClose={() => setToast(null)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Video preview (inline player or thumbnail) ───────────────────────────────

function VideoPreview({ video }: { video: Video }) {
  const [playError, setPlayError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imgError, setImgError] = useState(false);
  const proxied = proxyImg(video.thumbnailUrl);
  const showThumb = !!proxied && !imgError;

  const videoSrc = proxyVideo(video.mediaUrl);
  const canPlay = !!videoSrc && !playError;

  const handlePlay = useCallback(() => {
    if (canPlay && videoRef.current) {
      videoRef.current.play().catch(() => setPlayError(true));
      setPlaying(true);
    }
  }, [canPlay]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  }, []);

  return (
    <div className="relative w-32 md:w-40 shrink-0 rounded-xl overflow-hidden aspect-[9/16] bg-[#0a0a0c]">
      {/* Video element (hidden until playing) */}
      {canPlay && (
        <video
          ref={videoRef}
          src={videoSrc!}
          poster={proxied ?? undefined}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            playing ? "opacity-100" : "opacity-0"
          )}
          playsInline
          muted
          loop
          onError={() => setPlayError(true)}
          onClick={(e) => { e.stopPropagation(); playing ? handlePause() : handlePlay(); }}
        />
      )}

      {/* Thumbnail fallback */}
      {(!playing || !canPlay) && (
        <>
          {showThumb ? (
            <Image src={proxied!} alt="" fill className="object-cover" sizes="160px" unoptimized onError={() => setImgError(true)} />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${video.thumbnailColor}25 0%, transparent 100%)` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      )}

      {/* Play/Pause overlay */}
      {!playing ? (
        <button
          onClick={(e) => { e.stopPropagation(); canPlay ? handlePlay() : undefined; }}
          className="absolute inset-0 flex items-center justify-center group cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/[0.15] transition-all duration-200 group-hover:scale-110 group-hover:bg-black/60">
            <Play className="h-4 w-4 ml-0.5 text-white" />
          </div>
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); handlePause(); }}
          className="absolute inset-0 cursor-pointer"
        />
      )}

      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 pointer-events-none">
        <span className="text-[10px] font-body font-bold text-white/90">{video.duration}</span>
      </div>

      {/* Playing indicator */}
      {playing && (
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 pointer-events-none">
          <div className="flex items-end gap-[2px] h-2.5">
            <motion.div animate={{ height: ["40%", "100%", "40%"] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0 }} className="w-[2px] bg-brutify-gold rounded-full" />
            <motion.div animate={{ height: ["100%", "40%", "100%"] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} className="w-[2px] bg-brutify-gold rounded-full" />
            <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} className="w-[2px] bg-brutify-gold rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Outlier pill ──────────────────────────────────────────────────────────────

function OutlierPill({ score }: { score: number }) {
  if (score >= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/10 border border-brutify-gold/20 px-2 py-0.5 text-[10px] font-display font-bold text-brutify-gold shadow-[0_0_8px_rgba(255,171,0,0.1)]">
        <Flame className="h-2.5 w-2.5" />{score}x
      </span>
    );
  }
  if (score >= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/8 border border-brutify-gold/15 px-2 py-0.5 text-[10px] font-display font-bold text-brutify-gold/80">
        <Zap className="h-2.5 w-2.5" />{score}x
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] font-display font-bold text-brutify-text-muted/60">
      {score}x
    </span>
  );
}

// ── Engagement pill ───────────────────────────────────────────────────────────

function EngagementPill({ video }: { video: Video }) {
  const parseValue = (val: string): number => {
    if (val.endsWith("M")) return parseFloat(val) * 1_000_000;
    if (val.endsWith("K")) return parseFloat(val) * 1_000;
    return parseFloat(val.replace(/[^0-9.]/g, "")) || 0;
  };

  const views = parseValue(video.views);
  const likes = parseValue(video.likes);
  const comments = parseValue(video.comments);
  const shares = parseValue(video.shares);
  if (views === 0) return null;

  const rate = ((likes + comments + shares) / views) * 100;
  const label = rate >= 8 ? "Exceptionnel" : rate >= 5 ? "Très bon" : rate >= 3 ? "Solide" : rate >= 1.5 ? "Moyen" : "Faible";

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/8 border border-brutify-gold/12 px-2 py-0.5 text-[10px] font-body font-medium text-brutify-gold/70">
      {rate.toFixed(1)}% · {label}
    </span>
  );
}

// ── AI Panel ──────────────────────────────────────────────────────────────────

function AnalysisProgress({ steps, currentIndex }: { steps: typeof ANALYSIS_STEPS; currentIndex: number }) {
  const [internalStep, setInternalStep] = useState(currentIndex)

  useEffect(() => {
    if (currentIndex >= steps.length - 1) {
      setInternalStep(steps.length - 1)
      return
    }

    setInternalStep(0)
    const timers: ReturnType<typeof setTimeout>[] = []
    const delays = [0, 2500, 6000, 12000, 17000, 22000, 27000, 32000]

    for (let i = 1; i < steps.length; i++) {
      timers.push(setTimeout(() => setInternalStep(i), delays[i] ?? delays[delays.length - 1] + i * 4000))
    }
    return () => timers.forEach(clearTimeout)
  }, [currentIndex, steps.length])

  const progress = Math.min(((internalStep + 1) / steps.length) * 100, 100)

  return (
    <div className="py-3 space-y-4">
      {/* Progress bar */}
      <div className="px-1">
        <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brutify-gold/80 to-orange-500/80"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1">
        {steps.map((step, i) => {
          const isDone = i < internalStep
          const isCurrent = i === internalStep
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= internalStep ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.3, delay: i <= internalStep ? 0.05 : 0 }}
              className="flex items-center gap-2.5 px-1 py-1"
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
          )
        })}
      </div>
    </div>
  )
}

function AIPanel({
  title,
  icon,
  loading,
  loadingLabel,
  cost,
  costNote,
  ctaLabel,
  onTrigger,
  done,
  children,
  error,
  onDismissError,
  progressSteps,
  progressIndex,
}: {
  title: string;
  icon: React.ReactNode;
  loading: boolean;
  loadingLabel: string;
  cost: string;
  costNote?: string;
  ctaLabel: string;
  onTrigger: () => void;
  done: boolean;
  children?: React.ReactNode;
  error?: string | null;
  onDismissError?: () => void;
  progressSteps?: typeof ANALYSIS_STEPS;
  progressIndex?: number;
}) {
  const isTranscription = title === "Transcription";
  
  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${done ? "border-brutify-gold/25 bg-brutify-gold/[0.03] shadow-[0_0_16px_rgba(255,171,0,0.06)]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3.5 border-b ${done ? "border-brutify-gold/15" : "border-white/[0.05]"}`}>
        <div className="flex items-center gap-2.5">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg border ${done ? "border-brutify-gold/25 bg-brutify-gold/[0.12] text-brutify-gold" : "border-white/[0.08] bg-white/[0.04] text-brutify-text-muted"}`}>
            {done ? <Sparkles className="h-3.5 w-3.5" /> : icon}
          </div>
          <span className={`text-xs font-body font-semibold uppercase tracking-widest ${done ? "text-brutify-gold/80" : "text-brutify-text-muted/70"}`}>
            {title}
          </span>
          {done && (
            <span className="inline-flex items-center rounded-md border border-brutify-gold/20 bg-brutify-gold/[0.08] px-1.5 py-0.5 text-[9px] font-body font-semibold text-brutify-gold uppercase tracking-wide shadow-[0_0_8px_rgba(255,171,0,0.15)]">
              Prêt
            </span>
          )}
        </div>
        {!done && !loading && (
          <div className="flex items-center gap-1.5">
            {costNote && (
              <span className="text-[10px] font-body text-brutify-text-muted/40">{costNote}</span>
            )}
            <span className="flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] font-body font-semibold text-brutify-text-muted">
              <CreditCard className="h-2.5 w-2.5" />{cost}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          progressSteps ? (
            <AnalysisProgress steps={progressSteps} currentIndex={progressIndex ?? 0} />
          ) : (
            <div className="flex items-center justify-center gap-3 py-6">
              <Loading variant="icon" size="sm" className="h-5 w-5 text-brutify-gold" />
              <span className="text-sm font-body text-brutify-gold/80">{loadingLabel}</span>
            </div>
          )
        ) : done ? (
          children
        ) : (
          <button
            onClick={onTrigger}
            className={cn(
              "group w-full flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 cursor-pointer relative overflow-hidden",
              isTranscription
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:border-blue-400/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "bg-gradient-to-r from-brutify-gold/15 to-orange-500/15 border border-brutify-gold/30 hover:border-brutify-gold/50 hover:shadow-[0_0_20px_rgba(255,171,0,0.2)]"
            )}
          >
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              isTranscription
                ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                : "bg-gradient-to-r from-brutify-gold/10 to-orange-500/10"
            )} />
            
            <div className="relative flex items-center gap-2.5">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isTranscription
                  ? "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30"
                  : "bg-brutify-gold/20 text-brutify-gold group-hover:bg-brutify-gold/30"
              )}>
                {icon}
              </div>
              <div className="text-left">
                <span className={cn(
                  "text-sm font-body font-semibold block leading-tight",
                  isTranscription ? "text-blue-300 group-hover:text-blue-200" : "text-brutify-gold group-hover:text-brutify-gold-light"
                )}>
                  {ctaLabel}
                </span>
                {costNote && (
                  <span className="text-[10px] font-body text-white/30 block mt-0.5">
                    {costNote}
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative flex items-center gap-2">
              <span className={cn(
                "text-xs font-display font-bold",
                isTranscription ? "text-blue-300" : "text-brutify-gold"
              )}>
                {cost}
              </span>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform group-hover:translate-x-1",
                isTranscription ? "text-blue-400" : "text-brutify-gold"
              )} />
            </div>
          </button>
        )}
        {!done && !loading && error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <p className="text-xs font-body text-red-400 flex-1">{error}</p>
            {onDismissError && (
              <button type="button" onClick={onDismissError} className="text-red-400/60 hover:text-red-400 cursor-pointer p-0.5" aria-label="Fermer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Structural analysis (v2) ──────────────────────────────────────────────────

const SECTION_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  hook:   { bg: "bg-brutify-gold/10", border: "border-brutify-gold/20", text: "text-brutify-gold",    dot: "bg-brutify-gold" },
  setup:  { bg: "bg-white/[0.04]",   border: "border-white/[0.08]",   text: "text-white/50",        dot: "bg-white/40" },
  value:  { bg: "bg-amber-500/8",    border: "border-amber-500/15",   text: "text-amber-400/80",    dot: "bg-amber-400" },
  bridge: { bg: "bg-white/[0.04]",   border: "border-white/[0.08]",   text: "text-white/50",        dot: "bg-white/40" },
  proof:  { bg: "bg-brutify-gold/8",  border: "border-brutify-gold/15", text: "text-brutify-gold/80", dot: "bg-brutify-gold/80" },
  twist:  { bg: "bg-amber-500/8",    border: "border-amber-500/15",   text: "text-amber-400/80",    dot: "bg-amber-400" },
  cta:    { bg: "bg-brutify-gold/10", border: "border-brutify-gold/20", text: "text-brutify-gold",    dot: "bg-brutify-gold" },
  loop:   { bg: "bg-white/[0.04]",   border: "border-white/[0.08]",   text: "text-white/50",        dot: "bg-white/40" },
}

const FALLBACK_COLOR = { bg: "bg-white/5", border: "border-white/10", text: "text-white/60", dot: "bg-white/40" }

function StructuralAnalysisDisplay({ analysis }: { analysis: AnalysisData }) {
  const full: FullVideoAnalysis | null = analysis.hook_analysis
    ? parseStoredAnalysis(analysis.hook_analysis)
    : null

  const sections = full?.sections ?? []
  const hook = full?.hook_explanation
  const structure = full?.structure_explanation
  const value = full?.value_analysis
  const positioning = full?.positioning
  const [scriptExpanded, setScriptExpanded] = useState(false)

  const hasHookExplanation = hook && (hook.why_it_works || hook.emotion_triggered || hook.implicit_promise)
  const hasStructureExplanation = structure && (structure.why_effective || structure.retention_techniques?.length || structure.rhythm_and_transitions)
  const hasValueAnalysis = value && (value.delivery_method || value.depth_level || value.actionability)
  const hasPositioning = positioning && (positioning.creator_stance || positioning.target_audience || positioning.authority_style || positioning.content_angle)

  const visibleSections = scriptExpanded ? sections : sections.slice(0, 2)

  return (
    <div className="space-y-5">

      {/* ── Header badges ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {analysis.hook_type && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/15 px-2.5 py-1 text-[10px] font-body font-semibold text-brutify-gold/80">
            <Target className="h-2.5 w-2.5" />
            {analysis.hook_type}
          </span>
        )}
        {analysis.structure_type && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/15 px-2.5 py-1 text-[10px] font-body font-semibold text-brutify-gold/80">
            <Zap className="h-2.5 w-2.5" />
            {analysis.structure_type}
          </span>
        )}
        {full?.style_notes && (
          <span className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 text-[10px] font-body text-brutify-text-muted/50 max-w-[200px] truncate">
            {full.style_notes}
          </span>
        )}
      </div>

      {/* ── Script — timeline compacte ── */}
      <div>
        <button
          onClick={() => setScriptExpanded(!scriptExpanded)}
          className="flex items-center gap-2 mb-3 group cursor-pointer"
        >
          <ScrollText className="h-3.5 w-3.5 text-brutify-text-muted/50" />
          <span className="text-[10px] font-body font-bold uppercase tracking-widest text-brutify-text-muted/50 group-hover:text-brutify-text-muted/80 transition-colors">
            Script décomposé
          </span>
          <span className="text-[10px] font-body text-brutify-text-muted/30">
            {sections.length} sections
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 text-brutify-text-muted/30 transition-transform duration-200",
            scriptExpanded && "rotate-180"
          )} />
        </button>

        {sections.length > 0 && (
          <div className="relative pl-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-transparent" />

            <div className="space-y-0.5">
              <AnimatePresence initial={false}>
                {visibleSections.map((section, i) => {
                  const colors = SECTION_COLORS[section.type] ?? FALLBACK_COLOR
                  return (
                    <motion.div
                      key={`${section.type}-${i}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative flex gap-3 py-2"
                    >
                      {/* Timeline dot */}
                      <span className={cn("absolute -left-4 top-3.5 h-[9px] w-[9px] rounded-full shrink-0 ring-2 ring-[#111113]", colors.dot)} />

                      <div className="min-w-0 flex-1 ml-2">
                        <span className={cn("text-[9px] font-body font-bold uppercase tracking-widest", colors.text)}>
                          {section.label}
                        </span>
                        <p className="text-[13px] font-body text-brutify-text-secondary/90 leading-relaxed mt-0.5">
                          {section.content}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {sections.length > 2 && !scriptExpanded && (
              <button
                onClick={() => setScriptExpanded(true)}
                className="mt-1 ml-2 text-[11px] font-body font-semibold text-brutify-gold/50 hover:text-brutify-gold transition-colors cursor-pointer"
              >
                + {sections.length - 2} sections…
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Insight grid — 2x2 compact ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">

        {hasHookExplanation && (
          <InsightTile icon={<Flame className="h-3.5 w-3.5" />} title="Hook" items={[
            hook.why_it_works && { label: "Mécanisme", text: hook.why_it_works },
            hook.emotion_triggered && { label: "Émotion", text: hook.emotion_triggered },
            hook.implicit_promise && { label: "Promesse", text: hook.implicit_promise },
          ].filter(Boolean) as { label: string; text: string }[]} />
        )}

        {hasStructureExplanation && (
          <InsightTile icon={<Zap className="h-3.5 w-3.5" />} title="Structure" items={[
            structure.why_effective && { label: "Efficacité", text: structure.why_effective },
            structure.rhythm_and_transitions && { label: "Rythme", text: structure.rhythm_and_transitions },
          ].filter(Boolean) as { label: string; text: string }[]} tags={structure.retention_techniques} />
        )}

        {hasValueAnalysis && (
          <InsightTile icon={<Lightbulb className="h-3.5 w-3.5" />} title="Valeur" items={[
            value.delivery_method && { label: "Delivery", text: value.delivery_method },
            value.depth_level && { label: "Profondeur", text: value.depth_level },
            value.actionability && { label: "Action", text: value.actionability },
          ].filter(Boolean) as { label: string; text: string }[]} />
        )}

        {hasPositioning && (
          <InsightTile icon={<Users className="h-3.5 w-3.5" />} title="Positionnement" items={[
            positioning.creator_stance && { label: "Posture", text: positioning.creator_stance },
            positioning.target_audience && { label: "Audience", text: positioning.target_audience },
            positioning.authority_style && { label: "Autorité", text: positioning.authority_style },
            positioning.content_angle && { label: "Angle", text: positioning.content_angle },
          ].filter(Boolean) as { label: string; text: string }[]} />
        )}
      </div>
    </div>
  )
}

// ── Insight tile (compact, no collapse) ───────────────────────────────────────

function InsightTile({
  icon,
  title,
  items,
  tags,
}: {
  icon: React.ReactNode
  title: string
  items: { label: string; text: string }[]
  tags?: string[]
}) {
  return (
    <div className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-200 hover:border-brutify-gold/10 hover:bg-white/[0.03]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brutify-gold/[0.1] text-brutify-gold">
          {icon}
        </span>
        <span className="text-[11px] font-body font-bold uppercase tracking-wider text-brutify-gold/70">
          {title}
        </span>
      </div>

      {/* Items — label: value inline */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0 text-[10px] font-body font-semibold text-brutify-text-muted/30 uppercase tracking-wider mt-px w-16">{item.label}</span>
            <p className="text-[12px] font-body text-brutify-text-secondary/80 leading-snug flex-1">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {tags.map((t, i) => (
            <span key={i} className="rounded-full bg-brutify-gold/[0.06] border border-brutify-gold/10 px-2 py-0.5 text-[9px] font-body font-medium text-brutify-gold/50">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Analysis card (v1 legacy) ─────────────────────────────────────────────────

function AnalysisCard({ title, type, content }: { title: string; type?: string | null; content: string }) {
  const lines = content.split("\n").filter(Boolean);
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-body font-semibold uppercase tracking-wider text-brutify-gold/70">{title}</span>
        {type && <Badge variant="gold">{type}</Badge>}
      </div>
      <ul className="space-y-1.5">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-xs font-body text-brutify-text-secondary leading-relaxed">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-brutify-gold/40 shrink-0" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
