"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Eye,
  Zap,
  Play,
  BarChart3,
  ArrowRight,
  Instagram,
  Youtube,
  AtSign,
  BadgeCheck,
  Flame,
  RefreshCw,
  Loader2,
  Star,
  Telescope,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Creator, Video } from "@/lib/types";
import { useCreatorDetail } from "@/hooks/useCreators";
import { CreatorAnalysisView } from "./CreatorAnalysisView";
import type { CreatorAnalysisResult } from "@/lib/ai/creator-analysis";
import { useCredits } from "@/lib/credits-context";
import { useUpsell } from "@/hooks/useUpsellTrigger";
import { useUser } from "@/hooks/useUser";

function proxyImg(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

const platformConfig: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  glow: string;
}> = {
  instagram: {
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
        <defs>
          <linearGradient id="ig-detail" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FCAF45"/>
            <stop offset="40%" stopColor="#E1306C"/>
            <stop offset="100%" stopColor="#833AB4"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-detail)" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="12" r="4.5" stroke="url(#ig-detail)" strokeWidth="1.8" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-detail)"/>
      </svg>
    ),
    color: "#E1306C",
    gradient: "from-[#FCAF45]/20 via-[#E1306C]/20 to-[#833AB4]/20",
    glow: "rgba(225,48,108,0.4)",
  },
  tiktok: {
    label: "TikTok",
    icon: <AtSign className="h-3.5 w-3.5" />,
    color: "#69C9D0",
    gradient: "from-[#69C9D0]/20 via-[#010101]/10 to-[#EE1D52]/20",
    glow: "rgba(105,201,208,0.4)",
  },
  youtube: {
    label: "YouTube",
    icon: <Youtube className="h-3.5 w-3.5" />,
    color: "#FF0000",
    gradient: "from-[#FF0000]/20 to-[#CC0000]/10",
    glow: "rgba(255,0,0,0.4)",
  },
};

const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

function getBruitScoreConfig(score: number): { color: string; label: string } {
  if (score >= 8) return { color: "#4ade80", label: "Explosif" }
  if (score >= 6) return { color: "#FFAB00", label: "En croissance" }
  if (score >= 4) return { color: "#fb923c", label: "En veille" }
  return { color: "#f87171", label: "Dormant" }
}

function formatNum(n: string | number): string {
  const num = typeof n === "string" ? parseFloat(n.replace(/[^\d.]/g, "")) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

interface CreatorDetailModalProps {
  creator: Creator | null;
  onClose: () => void;
  onToggleWatchlist: (id: string) => void;
  localCreators?: Creator[];
}

type ModalTab = "overview" | "analysis";

interface AnalysisEstimate {
  videosToAnalyze: number;
  totalVideos: number;
  alreadyTranscribed: number;
  needsTranscription: number;
  baseCost: number;
  transcriptionCost: number;
  totalCost: number;
  freeAnalysesRemaining: number;
  canAfford: boolean;
  currentCredits: number;
}

interface AnalysisState {
  existingAnalysis: {
    analysis: CreatorAnalysisResult;
    videos_analyzed: number;
    created_at: string;
    updated_at: string;
  } | null;
  estimate: AnalysisEstimate | null;
  canAccess: boolean;
  plan: string;
  loading: boolean;
  running: boolean;
  error: string | null;
}

export function CreatorDetailModal({
  creator,
  onClose,
  onToggleWatchlist,
}: CreatorDetailModalProps) {
  const { triggerUpsell } = useUpsell();
  const { profile } = useUser();
  const { credits: liveCredits } = useCredits();
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isCooldown, setIsCooldown] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<{ finished: number; total: number } | null>(null);
  const [scrapedVideosRaw, setScrapedVideosRaw] = useState<import("@/lib/api/helpers").VideoDTO[] | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scrapeLimit, setScrapeLimit] = useState<30 | 50 | 100 | 200>(50);

  const [activeTab, setActiveTab] = useState<ModalTab>("overview");
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    existingAnalysis: null,
    estimate: null,
    canAccess: false,
    plan: "creator",
    loading: false,
    running: false,
    error: null,
  });

  const SCRAPE_LIMITS: { value: 30 | 50 | 100 | 200; label: string }[] = [
    { value: 30, label: "30" },
    { value: 50, label: "50" },
    { value: 100, label: "100" },
    { value: 200, label: "200" },
  ];

  const { videos: apiVideosFromSWR, creator: freshCreator, mutate } = useCreatorDetail(creator?.id ?? null);
  // Priorité : vidéos fraîchement scrapées > cache SWR
  const apiVideos = scrapedVideosRaw ?? apiVideosFromSWR;

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // Réinitialiser les vidéos locales à chaque changement de créateur
  useEffect(() => {
    stopPolling();
    setScrapedVideosRaw(null);
    setScrapeError(null);
    setIsCooldown(false);
    setScrapeProgress(null);
    setIsScraping(false);
    setActiveTab("overview");
    setAnalysisState({ existingAnalysis: null, estimate: null, canAccess: false, plan: "creator", loading: false, running: false, error: null });
  }, [creator?.id, stopPolling]);

  // Charger l'état de l'analyse quand on passe sur l'onglet
  const loadAnalysisState = useCallback(async () => {
    if (!creator) return;
    setAnalysisState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/creators/${creator.id}/full-analysis`);
      const data = await res.json();
      setAnalysisState((prev) => ({
        ...prev,
        existingAnalysis: data.existingAnalysis,
        estimate: data.estimate,
        canAccess: data.canAccess ?? false,
        plan: data.plan ?? "creator",
        loading: false,
      }));
    } catch {
      setAnalysisState((prev) => ({ ...prev, loading: false, error: "Erreur de chargement" }));
    }
  }, [creator]);

  useEffect(() => {
    if (activeTab === "analysis" && creator) {
      loadAnalysisState();
    }
  }, [activeTab, creator, loadAnalysisState]);

  const launchAnalysis = useCallback(async () => {
    if (!creator) return;
    setAnalysisState((prev) => ({ ...prev, running: true, error: null }));
    try {
      const res = await fetch(`/api/creators/${creator.id}/full-analysis`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
      setAnalysisState((prev) => ({
        ...prev,
        running: false,
        existingAnalysis: {
          analysis: data.analysis,
          videos_analyzed: data.videosAnalyzed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }));

      // Déclencher upsell first_analysis pour utilisateurs Creator
      if (profile?.plan === "creator") {
        // Vérifier si c'est la première analyse
        try {
          const analysesRes = await fetch("/api/creators/analyses");
          const analysesData = await analysesRes.json();
          if (analysesData.analyses?.length === 1) {
            triggerUpsell("first_analysis");
          }
        } catch {
          // Silent fail
        }
      }
    } catch (err) {
      setAnalysisState((prev) => ({
        ...prev,
        running: false,
        error: err instanceof Error ? err.message : "Erreur inconnue",
      }));
    }
  }, [creator, profile, triggerUpsell]);

  useEffect(() => {
    if (!creator) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [creator, onClose]);

  const startPolling = useCallback((runId: string, creatorId: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creators/${creatorId}/scrape-status?runId=${runId}`);
        const json = await res.json();

        if (json.status === "running") {
          if (json.requestsFinished !== undefined) {
            setScrapeProgress({ finished: json.requestsFinished, total: json.requestsTotal || json.requestsFinished });
          }
          // Show partial videos as they arrive
          if (json.videos && Array.isArray(json.videos) && json.videos.length > 0) {
            setScrapedVideosRaw(json.videos);
          }
          return; // continue polling
        }

        // done or error → stop
        stopPolling();
        setIsScraping(false);
        setScrapeProgress(null);

        if (json.status === "done") {
          if (json.videos && Array.isArray(json.videos)) setScrapedVideosRaw(json.videos);
          mutate();
        } else {
          setScrapeError(json.error ?? "Le scraping a échoué");
        }
      } catch {
        stopPolling();
        setIsScraping(false);
        setScrapeProgress(null);
        setScrapeError("Erreur réseau lors du suivi du scraping");
      }
    }, 5000);
  }, [stopPolling, mutate]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleScrapeVideos = useCallback(async () => {
    if (!creator) return;
    setIsScraping(true);
    setScrapeError(null);
    setScrapeProgress(null);
    setIsCooldown(false);
    try {
      const res = await fetch(`/api/creators/${creator.id}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: scrapeLimit }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.cooldown) setIsCooldown(true);
        throw new Error(json.error ?? "Erreur scraping");
      }
      // Run lancé — on commence le polling
      if (json.runId) startPolling(json.runId, creator.id);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Erreur inconnue");
      setIsScraping(false);
    }
  }, [creator, scrapeLimit, startPolling]);
  // Fusionne les stats fraîches de l'API avec le prop initial
  const liveCreator = useMemo(() => {
    if (!creator) return null;
    if (!freshCreator) return creator;
    return {
      ...creator,
      outlierCount: freshCreator.outlierCount,
      growth: freshCreator.growth,
      engagement: freshCreator.engagement,
      avgViews: freshCreator.avgViews,
      followers: freshCreator.followers,
      followersNum: freshCreator.followersNum,
      topOutlierRatio: freshCreator.topOutlierRatio,
      bruitScore: freshCreator.bruitScore,
    };
  }, [creator, freshCreator]);

  const videos: Video[] = useMemo(() => {
    return apiVideos.map((v) => ({
      id: v.id,
      creatorId: creator?.id ?? "",
      title: v.title,
      platform: ((v as unknown as { platform: string }).platform ?? creator?.platform ?? "instagram") as "instagram" | "tiktok" | "youtube",
      views: v.views,
      viewsNum: v.viewsNum,
      likes: v.likes,
      comments: v.comments,
      shares: v.shares ?? "0",
      outlierScore: v.outlierScore,
      date: v.date,
      duration: v.duration ?? "0:30",
      thumbnailColor: v.thumbnailColor ?? creator?.color ?? "#FFAB00",
      thumbnailUrl: v.thumbnailUrl ?? null,
      hook: "",
      hookType: "Contrarian" as const,
      structure: "",
      hasTranscript: false,
    })).sort((a, b) => b.outlierScore - a.outlierScore);
  }, [apiVideos, creator]);

  const platform = creator ? platformConfig[creator.platform] : null;
  const accentColor = creator?.color ?? "#FFAB00";

  return (
    <AnimatePresence>
      {creator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-0 md:pt-12 pb-0 md:pb-8 px-0 md:px-4 overflow-y-auto"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl" />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.85, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: expoOut }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full min-h-screen md:min-h-0 md:rounded-2xl border-0 md:border md:border-brutify-gold/20 bg-[#0d0d0f] shadow-[0_0_50px_rgba(255,171,0,0.2),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300",
              activeTab === "analysis" ? "max-w-3xl" : "max-w-xl"
            )}
          >
            {/* ── Bannière immersive ────────────────────────────────────────── */}
            <div className="relative h-36 overflow-hidden">
              {/* Avatar flouté en fond */}
              {proxyImg(creator.avatarUrl) && (
                <div className="absolute inset-0 scale-125">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proxyImg(creator.avatarUrl)!}
                    alt=""
                    className="h-full w-full object-cover opacity-20 blur-2xl pointer-events-none"
                    aria-hidden
                  />
                </div>
              )}
              {/* Gradient plateforme */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", platform?.gradient ?? "from-brutify-gold/10")} />
              {/* Vignette bas vers fond du modal */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/60 to-transparent" />
              {/* Orbes déco */}
              <div className="absolute -top-10 -left-10 h-48 w-48 rounded-full opacity-25 blur-[80px]"
                style={{ background: platform?.glow ?? accentColor }} />
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full opacity-20 blur-[60px]"
                style={{ background: platform?.color ?? accentColor }} />
              {/* Ligne dorée top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              {/* Bouton fermer */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.1] text-white/60 hover:text-white hover:bg-black/70 shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border-brutify-gold/30 transition-all duration-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Avatar + Identité ─────────────────────────────────────────── */}
            <div className="relative px-6 -mt-16 pb-5 border-b border-white/[0.05]">
              <div className="flex items-end gap-4 mb-4">
                {/* Avatar avec ring plateforme + glow */}
                <div className="relative shrink-0 z-10">
                  <div
                    className="relative h-[84px] w-[84px] rounded-2xl p-[2px]"
                    style={{
                      background: `linear-gradient(135deg, ${platform?.color ?? accentColor}, ${platform?.color ?? accentColor}40)`,
                      boxShadow: `0 0 24px ${platform?.glow ?? accentColor}50`,
                    }}
                  >
                    <div className="h-full w-full rounded-[14px] overflow-hidden border-[2.5px] border-[#0d0d0f] bg-[#0d0d0f]">
                      {proxyImg(creator.avatarUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proxyImg(creator.avatarUrl)!}
                          alt={creator.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-brutify-gold/20 to-brutify-gold-dark/20">
                          <span className="font-display text-2xl text-brutify-gold">
                            {creator.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Platform badge */}
                  {platform && (
                    <div
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#0d0d0f] shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${platform.color}, ${platform.color}cc)` }}
                    >
                      <div className="text-white [&_svg]:h-3 [&_svg]:w-3">{platform.icon}</div>
                    </div>
                  )}
                </div>

                {/* Nom + handle + badges */}
                <div className="pb-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h2 className="font-display text-xl uppercase tracking-wider text-white leading-tight">
                      {creator.name}
                    </h2>
                    {creator.verified && (
                      <BadgeCheck className="h-4 w-4 text-blue-400 shrink-0" />
                    )}
                  </div>
                  {/* Handle pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-body font-bold tracking-wide"
                      style={{
                        color: platform?.color ?? accentColor,
                        background: `${platform?.color ?? accentColor}14`,
                        border: `1px solid ${platform?.color ?? accentColor}25`,
                      }}
                    >
                      @{creator.handle.replace(/^@/, "")}
                    </span>
                    {creator.niche && (
                      <span className="inline-flex items-center rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] font-body text-brutify-text-muted">
                        {creator.niche}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {creator.bio && (
                <div
                  className="relative rounded-xl p-3.5 mb-1"
                  style={{
                    background: `${platform?.color ?? accentColor}08`,
                    border: `1px solid ${platform?.color ?? accentColor}15`,
                  }}
                >
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                    style={{ background: `linear-gradient(to bottom, ${platform?.color ?? accentColor}, ${platform?.color ?? accentColor}40)` }}
                  />
                  <p className="pl-3 text-[13px] font-body text-brutify-text-muted leading-relaxed">
                    {creator.bio}
                  </p>
                </div>
              )}
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────────── */}
            <div className="px-6 pt-3 pb-0 border-b border-white/[0.05]">
              <div className="flex items-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.06] p-0.5">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-body font-medium transition-all cursor-pointer",
                    activeTab === "overview"
                      ? "bg-white/[0.08] text-white shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  <BarChart3 className="h-3 w-3" />
                  Vue d&apos;ensemble
                </button>
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-body font-medium transition-all cursor-pointer",
                    activeTab === "analysis"
                      ? "bg-brutify-gold/[0.15] text-brutify-gold shadow-sm"
                      : "text-white/40 hover:text-white/60"
                  )}
                >
                  <Telescope className="h-3 w-3" />
                  Analyse concurrentielle
                  {analysisState.existingAnalysis && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brutify-gold" />
                  )}
                </button>
              </div>
            </div>

            {activeTab === "analysis" ? (
              /* ── Analyse concurrentielle ──────────────────────────────────── */
              <div className="px-6 py-5">
                {analysisState.loading ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <Loader2 className="h-6 w-6 text-brutify-gold animate-spin" />
                    <p className="text-[12px] font-body text-white/40">Chargement de l&apos;analyse...</p>
                  </div>
                ) : analysisState.running ? (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl bg-brutify-gold/[0.08] border border-brutify-gold/20 flex items-center justify-center">
                        <Telescope className="h-7 w-7 text-brutify-gold animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-brutify-gold/20 border border-brutify-gold/30 flex items-center justify-center">
                        <Loader2 className="h-2.5 w-2.5 text-brutify-gold animate-spin" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-display uppercase tracking-wider text-white">Analyse en cours</p>
                      <p className="text-[11px] font-body text-white/40 mt-1">
                        Transcription et analyse des {analysisState.estimate?.videosToAnalyze ?? 30} meilleures vidéos...
                      </p>
                      <p className="text-[10px] font-body text-white/25 mt-2">
                        Cela peut prendre 30 secondes à 2 minutes
                      </p>
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-brutify-gold/60"
                          initial={{ width: "5%" }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 60, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : analysisState.existingAnalysis ? (
                  <div>
                    <CreatorAnalysisView
                      analysis={analysisState.existingAnalysis.analysis}
                      creatorName={creator?.name ?? ""}
                      videosAnalyzed={analysisState.existingAnalysis.videos_analyzed}
                      analyzedAt={analysisState.existingAnalysis.updated_at}
                    />
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={launchAnalysis}
                        disabled={analysisState.running}
                        className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[11px] font-body text-white/40 hover:text-white/60 hover:border-white/[0.1] transition-all cursor-pointer disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Relancer l&apos;analyse
                        {analysisState.estimate && (
                          <span className="text-brutify-gold ml-1">({analysisState.estimate.totalCost} BP)</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : analysisState.estimate ? (
                  <div className="flex flex-col items-center gap-4 py-10">
                    <div className="h-14 w-14 rounded-2xl bg-brutify-gold/[0.08] border border-brutify-gold/20 flex items-center justify-center">
                      <Telescope className="h-6 w-6 text-brutify-gold" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-display uppercase tracking-wider text-white">
                        Lancer l&apos;analyse
                      </p>
                      <p className="text-[11px] font-body text-white/40 mt-1">
                        {analysisState.estimate.videosToAnalyze} vidéos analysées sur {analysisState.estimate.totalVideos} totales
                      </p>
                    </div>

                    {/* Cost breakdown */}
                    <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-body">
                        <span className="text-white/50">Analyse IA (Claude)</span>
                        <span className="text-white/70">
                          {analysisState.estimate.freeAnalysesRemaining > 0
                            ? <span className="text-emerald-400">Gratuit</span>
                            : `${analysisState.estimate.baseCost} BP`
                          }
                        </span>
                      </div>
                      {analysisState.estimate.needsTranscription > 0 && (
                        <div className="flex items-center justify-between text-[11px] font-body">
                          <span className="text-white/50">
                            {analysisState.estimate.needsTranscription} transcription{analysisState.estimate.needsTranscription > 1 ? "s" : ""}
                          </span>
                          <span className="text-white/70">{analysisState.estimate.transcriptionCost} BP</span>
                        </div>
                      )}
                      {analysisState.estimate.alreadyTranscribed > 0 && (
                        <div className="flex items-center justify-between text-[11px] font-body">
                          <span className="text-white/50">
                            {analysisState.estimate.alreadyTranscribed} déjà transcrite{analysisState.estimate.alreadyTranscribed > 1 ? "s" : ""}
                          </span>
                          <span className="text-emerald-400/70">0 BP</span>
                        </div>
                      )}
                      <div className="border-t border-white/[0.06] pt-2 flex items-center justify-between">
                        <span className="text-[12px] font-body font-medium text-white/70">Total</span>
                        <span className="text-[14px] font-display text-brutify-gold">
                          {analysisState.estimate.totalCost} BP
                        </span>
                      </div>
                      <p className="text-[10px] font-body text-white/25 text-center">
                        Solde actuel : {liveCredits} BP
                      </p>
                    </div>

                    {analysisState.error && (
                      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[11px] font-body text-red-400">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {analysisState.error}
                      </div>
                    )}

                    <button
                      onClick={launchAnalysis}
                      disabled={liveCredits < analysisState.estimate.totalCost || analysisState.running}
                      className={cn(
                        "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-body font-semibold transition-all cursor-pointer disabled:cursor-not-allowed",
                        liveCredits >= analysisState.estimate.totalCost
                          ? "bg-brutify-gold text-black hover:bg-brutify-gold/90 shadow-[0_0_20px_rgba(255,171,0,0.3)]"
                          : "bg-white/[0.05] text-white/30 border border-white/[0.06]"
                      )}
                    >
                      <Telescope className="h-4 w-4" />
                      {liveCredits >= analysisState.estimate.totalCost
                        ? "Lancer l'analyse"
                        : "Crédits insuffisants"
                      }
                    </button>
                  </div>
                ) : analysisState.error ? (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <AlertCircle className="h-6 w-6 text-red-400/60" />
                    <p className="text-[12px] font-body text-red-400/80">{analysisState.error}</p>
                    <button
                      onClick={loadAnalysisState}
                      className="text-[11px] font-body text-brutify-gold/60 hover:text-brutify-gold cursor-pointer"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-16">
                    <p className="text-[12px] font-body text-white/30">
                      Scrape d&apos;abord les vidéos du créateur
                    </p>
                  </div>
                )}
              </div>
            ) : (
            <>
            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="px-6 py-5 border-b border-white/[0.05]">
              <p className="text-[10px] font-body font-medium uppercase tracking-widest text-brutify-text-muted/50 mb-3">
                Métriques
              </p>
              {/* ── Brut Score — full-width highlight tile ── */}
              {(() => {
                const score = liveCreator?.bruitScore ?? 0;
                const cfg = getBruitScoreConfig(score);
                const barWidth = `${(score / 10) * 100}%`;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08, duration: 0.4, ease: expoOut }}
                    className="relative flex items-center gap-4 rounded-xl border p-3.5 mb-3 overflow-hidden"
                    style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}08` }}
                  >
                    {/* Glow orb */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: cfg.color }} />

                    {/* Icon */}
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: `${cfg.color}30`, background: `${cfg.color}12` }}>
                      <Star className="h-5 w-5" style={{ color: cfg.color }} />
                    </div>

                    {/* Score + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-body font-medium uppercase tracking-widest" style={{ color: `${cfg.color}80` }}>
                            Brut Score
                          </span>
                          <span
                            className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-body font-semibold uppercase tracking-wide"
                            style={{ color: cfg.color, borderColor: `${cfg.color}30`, background: `${cfg.color}12` }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <span className="font-display text-2xl tracking-wider leading-none" style={{ color: cfg.color }}>
                          {score.toFixed(1)}<span className="text-sm font-body font-normal opacity-50">/10</span>
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})` }}
                          initial={{ width: "0%" }}
                          animate={{ width: barWidth }}
                          transition={{ delay: 0.3, duration: 0.8, ease: expoOut }}
                        />
                      </div>
                      <p className="mt-1.5 text-[9px] font-body text-brutify-text-muted/40 leading-none">
                        Outliers · Engagement · Abonnés · Vélocité
                      </p>
                    </div>
                  </motion.div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <Users className="h-4 w-4" />,     label: "Followers",  value: liveCreator?.followers ?? "0",              accent: false, isFollowers: true },
                  { icon: <Eye className="h-4 w-4" />,       label: "Vues moy.",  value: liveCreator?.avgViews ?? "0",               accent: false, isFollowers: false },
                  { icon: <BarChart3 className="h-4 w-4" />, label: "Engagement", value: liveCreator?.engagement ?? "0%",            accent: false, isFollowers: false },
                  { icon: <Zap className="h-4 w-4" />,       label: "Outliers",   value: String(liveCreator?.outlierCount ?? 0),     accent: true,  isFollowers: false },
                ].map((stat, i) => {
                  const delta = stat.isFollowers ? (liveCreator?.followersDelta ?? 0) : 0;
                  const deltaDays = stat.isFollowers ? (liveCreator?.followersDeltaDays ?? 0) : 0;
                  const hasDelta = stat.isFollowers && delta !== 0;
                  const deltaPositive = delta > 0;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.04, duration: 0.4, ease: expoOut }}
                      className={cn(
                        "relative flex flex-col gap-1.5 rounded-xl border p-3 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.3)]",
                        stat.accent
                          ? "border-brutify-gold/20 bg-brutify-gold/[0.04]"
                          : "border-white/[0.06] bg-white/[0.02]"
                      )}
                    >
                      {stat.accent && (
                        <div className="absolute top-0 right-0 w-12 h-12 rounded-full bg-brutify-gold/10 blur-2xl" />
                      )}
                      <div className={cn(
                        "flex items-center gap-1.5",
                        stat.accent ? "text-brutify-gold/60" : "text-brutify-text-muted/60"
                      )}>
                        <div className="[&_svg]:h-3 [&_svg]:w-3">{stat.icon}</div>
                        <span className="text-[10px] font-body font-medium uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <p className={cn(
                          "font-display text-xl tracking-wider leading-none",
                          stat.accent ? "text-brutify-gold" : "text-brutify-text-primary"
                        )}>
                          {formatNum(stat.value)}
                        </p>
                        {hasDelta && (
                          <span
                            className="text-[11px] font-body font-bold leading-none"
                            style={{ color: deltaPositive ? "#4ade80" : "#f87171" }}
                          >
                            {deltaPositive ? "+" : ""}
                            {Math.abs(delta) >= 1000
                              ? `${(delta / 1000).toFixed(1)}K`
                              : delta}
                          </span>
                        )}
                      </div>
                      {hasDelta && deltaDays > 0 && (
                        <p className="text-[9px] font-body text-white/25 leading-none -mt-0.5">
                          sur {deltaDays}j
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Vidéos ────────────────────────────────────────────────────── */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-body font-medium uppercase tracking-widest text-brutify-text-muted/50">
                    Meilleures vidéos ({videos.length})
                  </p>
                  {videos.length > 0 && (
                    <span className="inline-flex items-center justify-center rounded-md bg-white/[0.05] border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-body font-medium text-brutify-text-muted">
                      {videos.length}
                    </span>
                  )}
                  {isScraping && videos.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-brutify-gold/20 bg-brutify-gold/[0.08] px-1.5 py-0.5 text-[10px] font-body font-medium text-brutify-gold">
                      <span className="h-1.5 w-1.5 rounded-full bg-brutify-gold animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
                {videos.length > 0 && (
                  <div className="flex items-center gap-2">
                    {creator.platform === "instagram" && (
                      <div className="flex items-center gap-1.5">
                        {/* Sélecteur de limite */}
                        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                          {SCRAPE_LIMITS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setScrapeLimit(opt.value)}
                              disabled={isScraping}
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[10px] font-body font-medium transition-all disabled:opacity-40",
                                scrapeLimit === opt.value
                                  ? "bg-brutify-gold/20 text-brutify-gold"
                                  : "text-brutify-text-muted/50 hover:text-brutify-text-muted"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {isCooldown ? (
                          <span className="text-[10px] font-body text-brutify-gold/60" title={scrapeError ?? ""}>
                            ⏳ Cooldown
                          </span>
                        ) : (
                          <button
                            onClick={handleScrapeVideos}
                            disabled={isScraping}
                            className="flex items-center gap-1 text-[11px] font-body text-brutify-text-muted/50 hover:text-brutify-text-muted transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            title="Mettre à jour les vidéos"
                          >
                            {isScraping
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RefreshCw className="h-3 w-3" />
                            }
                          </button>
                        )}
                      </div>
                    )}
                    <Link
                      href={`/videos?creator=${creator.id}`}
                      className="flex items-center gap-1 text-[11px] font-body font-medium text-brutify-gold/70 hover:text-brutify-gold transition-colors"
                    >
                      Tout voir
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>

              {videos.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 rounded-2xl border border-dashed border-white/[0.06]">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl border bg-white/[0.02] transition-colors",
                    isScraping ? "border-brutify-gold/30" : "border-white/[0.06]"
                  )}>
                    {isScraping
                      ? <Loader2 className="h-5 w-5 text-brutify-gold animate-spin" />
                      : <Play className="h-5 w-5 text-brutify-text-muted/40" />
                    }
                  </div>
                  <div className="text-center w-full px-4">
                    <p className="text-sm font-body font-medium text-brutify-text-muted">
                      {isScraping ? "Scraping en cours…" : "Aucune vidéo scrapée"}
                    </p>
                    <p className="text-[11px] font-body text-brutify-text-muted/50 mt-0.5">
                      {isScraping
                        ? scrapeProgress
                          ? `${scrapeProgress.finished} requêtes traitées…`
                          : "Connexion à Instagram en cours…"
                        : "Lance le scraping pour voir ses meilleures vidéos"
                      }
                    </p>
                    {isScraping && (
                      <div className="mt-3 w-full">
                        <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-brutify-gold/60"
                            initial={{ width: "5%" }}
                            animate={{
                              width: scrapeProgress && scrapeProgress.total > 0
                                ? `${Math.min(95, Math.round((scrapeProgress.finished / scrapeProgress.total) * 100))}%`
                                : "40%",
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-[10px] font-body text-brutify-text-muted/40 mt-1.5 text-center">
                          Tu peux fermer ce modal, ça continue en arrière-plan
                        </p>
                      </div>
                    )}
                  </div>
                  {scrapeError && (
                    <div className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-body text-center",
                      isCooldown
                        ? "border-brutify-gold/20 bg-brutify-gold/[0.06] text-brutify-gold/80"
                        : "border-red-500/20 bg-red-500/[0.06] text-red-400"
                    )}>
                      {isCooldown ? "⏳" : "⚠️"} {scrapeError}
                    </div>
                  )}
                  {!isScraping && creator.platform === "instagram" && !isCooldown && (
                    <div className="flex flex-col items-center gap-2">
                      {/* Sélecteur de limite */}
                      <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
                        {SCRAPE_LIMITS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setScrapeLimit(opt.value)}
                            className={cn(
                              "rounded-lg px-3 py-1 text-[11px] font-body font-medium transition-all",
                              scrapeLimit === opt.value
                                ? "bg-brutify-gold/20 text-brutify-gold"
                                : "text-brutify-text-muted/50 hover:text-brutify-text-muted"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleScrapeVideos}
                        className="flex items-center gap-1.5 rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-2 text-xs font-body font-semibold text-brutify-gold hover:bg-brutify-gold/[0.1] transition-all cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Scraper {scrapeLimit} vidéos
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {videos.slice(0, isScraping ? 8 : 5).map((video) => (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, ease: expoOut }}
                        layout
                      >
                        <VideoRow video={video} isNew={isScraping} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isScraping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-brutify-gold/10 bg-brutify-gold/[0.03]"
                    >
                      <Loader2 className="h-3 w-3 text-brutify-gold/50 animate-spin shrink-0" />
                      <p className="text-[11px] font-body text-brutify-text-muted/50">
                        {scrapeProgress
                          ? `${scrapeProgress.finished} requêtes · d'autres vidéos arrivent…`
                          : "Connexion à Instagram…"
                        }
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VideoRow({ video, isNew = false }: { video: Video; isNew?: boolean }) {
  const [imgError, setImgError] = useState(false);
  const isHot = video.outlierScore >= 3;
  const showThumbnail = !!video.thumbnailUrl && !imgError;
  return (
    <div className={cn(
      "group flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:shadow-[0_0_20px_rgba(255,171,0,0.05)]",
      isHot
        ? "border-brutify-gold/15 bg-brutify-gold/[0.03] hover:border-brutify-gold/25"
        : isNew
          ? "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
          : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]"
    )}>
      {/* Thumbnail */}
      <div
        className="relative shrink-0 h-10 w-10 rounded-lg overflow-hidden"
        style={{ backgroundColor: video.thumbnailColor + "18" }}
      >
        {showThumbnail ? (
          <Image
            src={video.thumbnailUrl!}
            alt=""
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-4 w-4" style={{ color: video.thumbnailColor }} />
          </div>
        )}
        {isHot && (
          <div className="absolute top-0.5 right-0.5">
            <Flame className="h-2.5 w-2.5 text-brutify-gold drop-shadow" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-body font-medium text-brutify-text-primary group-hover:text-white transition-colors">
          {video.title}
        </p>
        <p className="text-[10px] font-body text-brutify-text-muted/60 mt-0.5">
          {video.views} vues · {video.date}
        </p>
      </div>

      {/* Outlier badge */}
      <div className={cn(
        "shrink-0 flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-body font-bold",
        video.outlierScore >= 5
          ? "border-brutify-gold/30 bg-brutify-gold/[0.12] text-brutify-gold"
          : video.outlierScore >= 2
          ? "border-brutify-gold/15 bg-brutify-gold/[0.06] text-brutify-gold/80"
          : "border-white/[0.06] bg-white/[0.02] text-brutify-text-muted"
      )}>
        <Zap className="h-2.5 w-2.5" />
        {video.outlierScore}x
      </div>
    </div>
  );
}
