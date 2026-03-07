"use client";

import { useEffect, useState, useCallback } from "react";
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
  Bookmark,
  FileText,
  LayoutDashboard,
  Brain,
  CreditCard,
  Sparkles,
  ChevronRight,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Video } from "@/lib/types";
import { useCredits } from "@/lib/credits-context";
import { CreditConfirmModal } from "@/components/ui/CreditConfirmModal";
import { useCreateVaultItem } from "@/hooks/useVault";
import { useCreateBoardItem } from "@/hooks/useBoard";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { CreditToast } from "@/components/ui/CreditToast";

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
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

export function VideoDetailModal({ video, creator: creatorProp, onClose }: VideoDetailModalProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"transcript" | "analysis" | null>(null);
  const { credits, addUsage } = useCredits();
  const { create: createVaultItem, isCreating: savingVault } = useCreateVaultItem();
  const { create: createBoardItem, isCreating: savingBoard } = useCreateBoardItem();
  const [savedVault, setSavedVault] = useState(false);
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
    setSavedVault(false);
    setSavedBoard(false);
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

  const handleTranscribe = useCallback(async () => {
    if (!video) return;
    setPendingAction(null);
    setTranscribing(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/videos/${video.id}/transcribe`, { method: "POST" });
      const data = await res.json();
      if (res.status === 403 && data.feature) {
        setUpgradeModal({ feature: data.feature, requiredPlan: data.required_plan });
        setTranscribing(false);
        return;
      }
      if (!res.ok) {
        setApiError(data.error ?? "Erreur lors de la transcription");
        setTranscribing(false);
        return;
      }
      setTranscription(data.transcription);
      if (!data.cached) {
        addUsage(`Transcription — ${video.title.slice(0, 30)}`, data.credits_consumed);
        setToast({ message: "Transcription générée", cost: data.credits_consumed, remaining: credits - data.credits_consumed });
      }
    } catch {
      setApiError("Erreur réseau lors de la transcription");
    }
    setTranscribing(false);
  }, [video, addUsage, credits]);

  const handleAnalyze = useCallback(async () => {
    if (!video) return;
    setPendingAction(null);
    setAnalyzing(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/videos/${video.id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.status === 403 && data.feature) {
        setUpgradeModal({ feature: data.feature, requiredPlan: data.required_plan });
        setAnalyzing(false);
        return;
      }
      if (!res.ok) {
        setApiError(data.error ?? "Erreur lors de l'analyse");
        setAnalyzing(false);
        return;
      }
      setAnalysis(data.analysis);
      if (data.transcription) setTranscription(data.transcription);
      if (!data.cached) {
        addUsage(`Analyse IA — ${video.title.slice(0, 30)}`, data.credits_consumed);
        setToast({ message: "Analyse IA terminée", cost: data.credits_consumed, remaining: credits - data.credits_consumed });
      }
    } catch {
      setApiError("Erreur réseau lors de l'analyse");
    }
    setAnalyzing(false);
  }, [video, addUsage, credits]);

  const handleSaveToVault = useCallback(async () => {
    if (!video || savingVault || savedVault) return;
    try {
      await createVaultItem({ type: "video", content: video.title || "Vidéo sauvegardée", source_handle: creator?.handle ?? undefined, source_video_id: video.id });
      setSavedVault(true);
    } catch { /* silent */ }
  }, [video, creator, savingVault, savedVault, createVaultItem]);

  const handleAddToBoard = useCallback(async () => {
    if (!video || savingBoard || savedBoard) return;
    try {
      await createBoardItem({ title: video.title || "Contenu depuis vidéo", status: "idea", source_video_id: video.id });
      setSavedBoard(true);
    } catch { /* silent */ }
  }, [video, savingBoard, savedBoard, createBoardItem]);

  const router = useRouter();
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
          className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Détails — ${video.title}`}
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-2xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-screen md:max-h-[90vh] rounded-none md:rounded-2xl border-0 md:border md:border-brutify-gold/20 bg-[#0d0d0f] shadow-[0_0_50px_rgba(255,171,0,0.2),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* ── Cinematic banner ── */}
            <HeroBanner video={video} onClose={onClose} />

            {/* ── Scrollable body ── */}
            <div className="overflow-y-auto flex-1 min-h-0">

              {/* Identity + title + stats */}
              <div className="px-6 pt-5 pb-5 border-b border-white/[0.05]">

                {/* Creator row */}
                {creator && (
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/[0.07]">
                      <Image src={creator.avatarUrl} alt={creator.name} fill className="object-cover" sizes="36px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-body font-semibold text-brutify-text-primary leading-tight truncate">{creator.name}</p>
                      <p className="text-[11px] font-body truncate" style={{ color: video.thumbnailColor }}>{creator.handle}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-body text-brutify-text-muted/50 bg-white/[0.03] border border-white/[0.05] rounded-lg px-2.5 py-1">
                      {video.date}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h2 className="font-body text-[17px] font-bold text-white leading-snug mb-4">
                  {video.title}
                </h2>

                {/* Stats + Engagement */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatChip icon={<Eye className="h-3.5 w-3.5" />} value={video.views} label="vues" accent color={video.thumbnailColor} />
                    <StatChip icon={<Heart className="h-3.5 w-3.5" />} value={video.likes} label="likes" />
                    <StatChip icon={<MessageCircle className="h-3.5 w-3.5" />} value={video.comments} label="comm." />
                    {video.shares !== "0" && (
                      <StatChip icon={<Share2 className="h-3.5 w-3.5" />} value={video.shares} label="partages" />
                    )}
                  </div>
                  <EngagementIndicator video={video} />
                </div>
              </div>

              {/* Error banner */}
              {apiError && (
                <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs font-body text-red-400 flex-1">{apiError}</p>
                  <button onClick={() => setApiError(null)} className="text-red-400/60 hover:text-red-400 cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* ── AI panels ── */}
              <div className="p-6 space-y-4">

                {/* Hook block (if available) */}
                {video.hook && (
                  <div className="rounded-2xl border border-brutify-gold/15 bg-brutify-gold/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-brutify-gold/60" />
                      <span className="text-[10px] font-body font-semibold uppercase tracking-widest text-brutify-gold/70">Hook · {video.hookType}</span>
                    </div>
                    <p className="text-sm font-body italic text-brutify-text-secondary leading-relaxed">&ldquo;{video.hook}&rdquo;</p>
                  </div>
                )}

                {/* Structure (if available) */}
                {video.structure && (
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-[10px] font-body font-semibold uppercase tracking-widest text-brutify-text-muted/60 mb-2.5">Structure</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {video.structure.split(" → ").map((step, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight className="h-3 w-3 text-brutify-gold/30 shrink-0" />}
                          <span className="rounded-lg bg-brutify-gold/[0.06] border border-brutify-gold/10 px-2.5 py-1 text-xs font-body font-medium text-brutify-text-secondary">{step}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcription */}
                <AIPanel
                  title="Transcription"
                  icon={<FileText className="h-4 w-4" />}
                  loading={transcribing}
                  loadingLabel="Transcription en cours…"
                  cost="2 BP"
                  ctaLabel="Transcrire cette vidéo"
                  onTrigger={() => setPendingAction("transcript")}
                  done={!!transcription}
                >
                  {transcription && (
                    <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                      {transcription.content.split("\n").map((line, i) => (
                        <p key={i} className="text-sm font-body text-brutify-text-secondary leading-relaxed">
                          {line || <br />}
                        </p>
                      ))}
                    </div>
                  )}
                </AIPanel>

                {/* Analyse IA */}
                <AIPanel
                  title="Analyse IA"
                  icon={<Brain className="h-4 w-4" />}
                  loading={analyzing}
                  loadingLabel="Analyse IA en cours…"
                  cost={transcription ? "3 BP" : "5 BP"}
                  costNote={!transcription ? "inclut la transcription" : undefined}
                  ctaLabel="Analyser avec l'IA"
                  onTrigger={() => setPendingAction("analysis")}
                  done={!!analysis}
                >
                  {analysis && (
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
                  )}
                </AIPanel>

              </div>
            </div>

            {/* ── Sticky action bar ── */}
            <div className="shrink-0 border-t border-white/[0.06] bg-[#0d0d0f]/95 backdrop-blur-sm px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Button 
                  variant="primary" 
                  size="md" 
                  className="flex-1" 
                  onClick={handleForgeScript}
                  disabled={forgingScript || transcribing || analyzing}
                >
                  {forgingScript || transcribing || analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {transcribing ? "Transcription..." : analyzing ? "Analyse..." : "Préparation..."}
                    </>
                  ) : (
                    <>
                      <ScrollText className="h-4 w-4" />
                      Forger un script
                    </>
                  )}
                </Button>
                <Button variant="secondary" size="md" onClick={handleSaveToVault} disabled={savingVault || savedVault}>
                  {savedVault ? <Sparkles className="h-4 w-4 text-green-400" /> : savingVault ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                  {savedVault ? "Sauvé" : "Vault"}
                </Button>
                <Button variant="ghost" size="md" onClick={handleAddToBoard} disabled={savingBoard || savedBoard}>
                  {savedBoard ? <Sparkles className="h-4 w-4 text-green-400" /> : savingBoard ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
                  {savedBoard ? "Ajouté" : "BrutBoard"}
                </Button>
              </div>
            </div>
          </motion.div>

          <CreditConfirmModal
            open={pendingAction !== null}
            cost={pendingAction === "transcript" ? 2 : transcription ? 3 : 5}
            actionLabel={pendingAction === "transcript" ? "Transcrire cette vidéo" : transcription ? "Analyser cette vidéo avec l'IA" : "Transcrire + Analyser cette vidéo"}
            onConfirm={() => { if (pendingAction === "transcript") handleTranscribe(); else handleAnalyze(); }}
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

// ── Hero Banner ───────────────────────────────────────────────────────────────

function HeroBanner({ video, onClose }: { video: Video; onClose: () => void }) {
  const [imgError, setImgError] = useState(false);
  const proxied = proxyImg(video.thumbnailUrl);
  const showThumb = !!proxied && !imgError;

  return (
    <div
      className="relative h-56 shrink-0 overflow-hidden"
      style={{ backgroundColor: video.thumbnailColor + "18" }}
    >
      {/* Thumbnail fill */}
      {showThumb && (
        <Image
          src={proxied!}
          alt=""
          fill
          className="object-cover"
          sizes="672px"
          unoptimized
          onError={() => setImgError(true)}
        />
      )}

      {/* Fallback gradient */}
      {!showThumb && (
        <>
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${video.thumbnailColor}35 0%, ${video.thumbnailColor}12 50%, transparent 100%)` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 80% 80% at 30% 40%, ${video.thumbnailColor}20 0%, transparent 60%)` }}
          />
        </>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0f]/30 to-transparent" />

      {/* Color glow (bottom) */}
      <div
        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-80 h-40 rounded-full blur-[60px] opacity-25 pointer-events-none"
        style={{ background: video.thumbnailColor }}
      />

      {/* ── Top controls ── */}
      <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between z-10">
        {/* Outlier badge top-left */}
        <OutlierBadgeLarge score={video.outlierScore} />

        {/* Right: "Voir" + Close */}
        <div className="flex items-center gap-2">
          {video.url && (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.12] px-3 py-1.5 text-[11px] font-body font-semibold text-white/80 hover:text-white hover:bg-black/70 transition-all duration-200"
            >
              <ExternalLink className="h-3 w-3" />
              Voir la vidéo
            </a>
          )}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.1] text-white/60 hover:text-white hover:bg-black/70 shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border-brutify-gold/30 transition-all duration-200 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Centre play button ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        {video.url ? (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group cursor-pointer"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55 backdrop-blur-md border border-white/[0.15] shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.08)] active:scale-95"
              style={{ willChange: 'transform' }}
            >
              <Play className="h-6 w-6 ml-0.5 text-white" />
            </div>
          </a>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/[0.1]">
            <Play className="h-6 w-6 ml-0.5 text-white/50" />
          </div>
        )}
      </div>

      {/* Duration — bottom right */}
      <div className="absolute bottom-4 right-4 rounded-lg bg-black/65 backdrop-blur-sm px-2.5 py-1 border border-white/[0.08]">
        <span className="text-xs font-body font-semibold text-white/90">{video.duration}</span>
      </div>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ icon, value, label, accent, color }: { icon: React.ReactNode; value: string; label?: string; accent?: boolean; color?: string }) {
  const accentColor = color ?? "#FFAB00";
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-colors"
      style={accent ? { background: `${accentColor}12`, borderColor: `${accentColor}28` } : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <span style={accent ? { color: accentColor } : { color: "rgba(255,255,255,0.35)" }}>{icon}</span>
      <span className="font-display text-sm tracking-wider leading-none" style={accent ? { color: accentColor } : { color: "#E4E4E8" }}>
        {value}
      </span>
      {label && (
        <span className="text-[10px] font-body leading-none" style={{ color: accent ? `${accentColor}70` : "rgba(255,255,255,0.25)" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ── Engagement indicator ──────────────────────────────────────────────────────

function EngagementIndicator({ video }: { video: Video }) {
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

  // Calcul du taux d'engagement : (likes + comments + shares) / views
  const engagementRate = ((likes + comments + shares) / views) * 100;

  let label = "";
  let color = "";
  let icon = null;
  let percentage = 0;

  if (engagementRate >= 8) {
    label = "Engagement exceptionnel";
    color = "#4ade80"; // emerald
    icon = <Flame className="h-3.5 w-3.5" />;
    percentage = 100;
  } else if (engagementRate >= 5) {
    label = "Très bon engagement";
    color = "#FFAB00"; // gold
    icon = <Zap className="h-3.5 w-3.5" />;
    percentage = 80;
  } else if (engagementRate >= 3) {
    label = "Engagement solide";
    color = "#60a5fa"; // blue
    icon = <TrendingUp className="h-3.5 w-3.5" />;
    percentage = 60;
  } else if (engagementRate >= 1.5) {
    label = "Engagement moyen";
    color = "#fb923c"; // orange
    percentage = 40;
  } else {
    label = "Faible engagement";
    color = "#94a3b8"; // slate
    percentage = 20;
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="text-[11px] font-body font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        <span className="text-[11px] font-display font-bold" style={{ color }}>
          {engagementRate.toFixed(2)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-[10px] font-body text-white/40 mt-1.5">
        {likes.toLocaleString("fr-FR")} likes · {comments.toLocaleString("fr-FR")} comm. · {shares.toLocaleString("fr-FR")} partages
      </p>
    </div>
  );
}

// ── AI Panel ──────────────────────────────────────────────────────────────────

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
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-brutify-gold" />
            <span className="text-sm font-body text-brutify-gold/80">{loadingLabel}</span>
          </div>
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
      </div>
    </div>
  );
}

// ── Outlier badge ─────────────────────────────────────────────────────────────

function OutlierBadgeLarge({ score }: { score: number }) {
  if (score >= 10) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brutify-gold-dark/30 via-brutify-gold/30 to-brutify-gold-light/20 border border-brutify-gold/35 px-3 py-1.5 text-sm font-body font-bold shadow-[0_0_20px_rgba(255,171,0,0.15)] backdrop-blur-sm">
        <Flame className="h-4 w-4 text-brutify-gold-light" />
        <span className="text-gold-gradient">{score}x</span>
      </span>
    );
  }
  if (score >= 5) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-brutify-gold/[0.12] border border-brutify-gold/25 px-3 py-1.5 text-sm font-body font-bold backdrop-blur-sm">
        <Zap className="h-4 w-4 text-brutify-gold" />
        <span className="text-brutify-gold">{score}x</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-xl bg-black/50 border border-white/[0.12] px-3 py-1.5 text-sm font-body font-bold text-brutify-text-secondary backdrop-blur-sm">
      <Zap className="h-3.5 w-3.5" />{score}x
    </span>
  );
}

// ── Analysis card ─────────────────────────────────────────────────────────────

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
