"use client";

import Link from "next/link";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useEffect } from "react";
import {
  Users,
  Play,
  PenTool,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Zap,
  LayoutDashboard,
  Calendar,
  Circle,
  Eye,
  Heart,
  Activity,
  Clock,
  Sparkles,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { ActivationBonusTracker } from "@/components/activation/ActivationBonusTracker";

function proxyImg(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}
import { EarlyUpgradeBanner } from "@/components/onboarding/EarlyUpgradeBanner";
import type {
  DashboardStats,
  TopOutlier,
  TrendingCreator,
  NetworkStat,
  NetworkOutlierPreview,
  UpcomingBoardItem,
  RecentActivity,
} from "@/app/api/dashboard/route";
import { useUpsell } from "@/hooks/useUpsellTrigger";
import { useUser } from "@/hooks/useUser";

type BoardStatus = "inspiration" | "idea" | "draft" | "in_progress" | "scheduled" | "published";

const boardStatusConfig: Record<BoardStatus, { label: string; color: string }> = {
  inspiration: { label: "Inspiration", color: "#A855F7" },
  idea: { label: "Idée", color: "rgba(255,255,255,0.3)" },
  draft: { label: "Brouillon", color: "#FFD700" },
  in_progress: { label: "En cours", color: "#FFAB00" },
  scheduled: { label: "Planifié", color: "#00E5A0" },
  published: { label: "Publié", color: "#00E5A0" },
};

// Icônes réseaux en monochrome Brutify (or) — pas de couleurs de marque
const platformIcons: Record<string, React.ReactNode> = {
  instagram: (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  youtube: (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  ),
  tiktok: (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
};

const activityIcons: Record<string, React.ReactNode> = {
  creator_added: <Users className="h-3.5 w-3.5" />,
  outlier_found: <Zap className="h-3.5 w-3.5" />,
  script_created: <PenTool className="h-3.5 w-3.5" />,
  board_added: <LayoutDashboard className="h-3.5 w-3.5" />,
};

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return String(num);
}

function formatRelTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export default function Dashboard() {
  const { data, isLoading } = useSWR<{
    stats: DashboardStats;
    topOutliers: TopOutlier[];
    trendingCreators: TrendingCreator[];
    networks: NetworkStat[];
    upcomingBoard: UpcomingBoardItem[];
    recentActivity: RecentActivity[];
  }>("/api/dashboard");
  
  const { triggerUpsell } = useUpsell();
  const { profile } = useUser();

  // Vérifier si le trial expire bientôt
  useEffect(() => {
    if (!profile) return;
    
    const planName = profile.plan;
    const trialEndsAt = profile.trial_ends_at;
    
    if (planName === "creator" && trialEndsAt) {
      const trialEnd = new Date(trialEndsAt).getTime();
      const now = Date.now();
      const hoursLeft = (trialEnd - now) / (1000 * 60 * 60);
      
      // Si moins de 24h restantes
      if (hoursLeft > 0 && hoursLeft < 24) {
        // Vérifier si l'utilisateur est un power user (beaucoup d'actions)
        if (data?.recentActivity && data.recentActivity.length >= 10) {
          triggerUpsell("trial_power_user");
        } else {
          triggerUpsell("trial_ending_soon");
        }
      }
    }
  }, [profile, data, triggerUpsell]);

  const stats = data?.stats;
  const topOutliers = data?.topOutliers ?? [];
  const trendingCreators = data?.trendingCreators ?? [];
  const networks = data?.networks ?? [];
  const upcomingBoard = data?.upcomingBoard ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const statCards = [
    {
      label: "Créateurs suivis",
      value: String(stats?.totalCreators ?? 0),
      icon: Users,
      color: "#FFAB00",
    },
    {
      label: "Outliers détectés",
      value: (stats?.totalOutliers ?? 0).toLocaleString("fr-FR"),
      icon: TrendingUp,
      color: "#FFD700",
    },
    {
      label: "Scripts forgés",
      value: String(stats?.totalScripts ?? 0),
      icon: PenTool,
      color: "#CC8800",
    },
    {
      label: "Top ratio",
      value: stats?.topRatio ?? "—",
      sub: stats?.topHandle ? `@${stats.topHandle}` : undefined,
      icon: Zap,
      color: "#FFAB00",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: EASE_EXPO }}
      className="max-w-[1600px] mx-auto"
    >
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_EXPO }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-brutify-gold to-brutify-gold-dark shadow-[0_0_25px_rgba(255,171,0,0.3)]">
            <LayoutDashboard className="h-5 w-5 text-black" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl tracking-wider text-gold-gradient leading-none">
            DASHBOARD
          </h1>
        </div>
        <p className="mt-2 font-body font-light text-brutify-text-secondary text-base">
          {isLoading ? (
            <Loading variant="inline" label="Chargement..." />
          ) : (
            <>
              Vue d'ensemble de votre empire créatif.{" "}
              <span className="text-brutify-text-primary font-medium">
                {(stats?.totalOutliers ?? 0).toLocaleString("fr-FR")}
              </span>{" "}
              signaux détectés.
            </>
          )}
        </p>
      </motion.div>

      {/* Early upgrade banner (visible uniquement pendant l'essai) */}
      <EarlyUpgradeBanner />

      {/* Activation bonus tracker (visible uniquement pendant l'essai) */}
      <ActivationBonusTracker />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{
                delay: 0.1 + i * 0.08,
                duration: 0.4,
                ease: EASE_EXPO,
              }}
            >
              <div
                className="rounded-2xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-xl p-5 shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(255,171,0,0.12)] transition-all duration-200 hover:border-brutify-gold/15 hover:shadow-[0_8px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(255,171,0,0.25)] card-hover-lift"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.06] icon-hover-rotate"
                  >
                    <Icon className="h-4 w-4 text-brutify-gold" />
                  </div>
                </div>
                <p className="font-display text-2xl sm:text-3xl tracking-wider text-brutify-text-primary leading-none">
                  {isLoading ? "—" : stat.value}
                </p>
                <p className="mt-1 text-xs font-body text-brutify-text-secondary">
                  {stat.label}
                </p>
                {stat.sub && (
                  <p className="mt-0.5 text-[10px] font-body text-brutify-gold/70">
                    {stat.sub}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vos réseaux sociaux - Style Jarvis */}
      {networks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: EASE_EXPO }}
          className="mb-8"
        >
          <Card
            hoverable={false}
            className="p-6 border-brutify-gold/20 bg-gradient-to-br from-[#111113]/80 to-[#111113]/40 shadow-[0_0_30px_rgba(255,171,0,0.15)]"
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] icon-hover-rotate"
              >
                <Activity className="h-[18px] w-[18px] text-brutify-gold" />
              </div>
              <div>
                <h2 className="font-display text-2xl tracking-wider text-brutify-text-primary">
                  VOS RÉSEAUX
                </h2>
                <p className="text-[11px] font-body text-brutify-text-muted">
                  Performances de vos comptes connectés
                </p>
              </div>
            </div>

            {isLoading ? (
              <Loading variant="block" size="md" className="py-8" />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {networks.map((network, i) => (
                  <motion.div
                    key={network.platform}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3, ease: EASE_EXPO }}
                    className="rounded-xl border border-brutify-gold/15 bg-gradient-to-br from-[#0c0c14] to-[#0a0a10] p-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:border-brutify-gold/25 hover:shadow-[0_0_24px_rgba(255,171,0,0.08)] transition-all duration-300 flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-brutify-gold/10">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] text-brutify-gold">
                        {platformIcons[network.platform] ?? <Activity className="h-4 w-4" />}
                      </div>
                      <span className="text-sm font-body font-semibold text-brutify-text-primary truncate">
                        @{network.handle}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider">
                          Abonnés
                        </span>
                        <span className="font-display text-lg tracking-wider text-brutify-text-primary">
                          {formatNumber(network.followers)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider">
                          Vues moy.
                        </span>
                        <span className="font-display text-base tracking-wider text-brutify-gold">
                          {formatNumber(network.avg_views)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider">
                          Impressions
                        </span>
                        <span className="font-display text-base tracking-wider text-brutify-text-primary">
                          {formatNumber(network.total_impressions ?? network.total_views)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider">
                          Vidéos
                        </span>
                        <span className="font-body text-sm font-medium text-brutify-text-primary">
                          {network.scraped_videos}
                        </span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider">
                          Engagement
                        </span>
                        <span className="font-body text-sm font-semibold text-brutify-success">
                          {network.engagement_rate.toFixed(1)}%
                        </span>
                      </div>
                      {network.growth_rate > 0 && (
                        <div className="flex items-center gap-1.5 col-span-2 pt-1 border-t border-white/[0.04]">
                          <TrendingUp className="h-3 w-3 text-brutify-success shrink-0" />
                          <span className="text-[11px] font-body text-brutify-success">
                            +{network.growth_rate.toFixed(1)}% croissance
                          </span>
                        </div>
                      )}
                    </div>

                    {network.last_outliers?.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-white/[0.06]">
                        <p className="text-[10px] font-body text-brutify-text-muted uppercase tracking-wider mb-2">
                          Derniers outliers
                        </p>
                        <ul className="space-y-1.5">
                          {network.last_outliers.slice(0, 3).map((o: NetworkOutlierPreview) => (
                              <li key={o.id} className="flex items-center gap-2 text-[11px]">
                                {o.thumbnail_url ? (
                                  <img
                                    src={proxyImg(o.thumbnail_url) ?? ""}
                                    alt=""
                                    className="h-8 w-14 rounded object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-14 rounded bg-white/5 shrink-0 flex items-center justify-center">
                                    <Play className="h-3 w-3 text-brutify-text-muted" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span className="font-body text-brutify-text-primary truncate block">
                                    {o.title || "Sans titre"}
                                  </span>
                                  <span className="text-brutify-text-muted">
                                    {formatNumber(o.views)} vues · {o.outlier_score.toFixed(1)}x
                                  </span>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {networks.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Activity className="h-8 w-8 text-brutify-text-muted/20" />
                <p className="text-sm font-body text-brutify-text-muted text-center">
                  Aucun réseau connecté.
                </p>
                <Link
                  href="/settings"
                  className="text-xs font-body font-medium text-brutify-gold hover:text-brutify-gold-light transition-colors"
                >
                  Connecter vos réseaux →
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* 2-column layout: Top Outliers + Créateurs en feu */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Top Outliers récents */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_EXPO }}
        >
          <Card hoverable={false} className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] icon-hover-rotate"
                >
                  <Zap className="h-[18px] w-[18px] text-brutify-gold" />
                </div>
                <div>
                  <h2 className="font-display text-xl tracking-wider text-brutify-text-primary">
                    TOP OUTLIERS
                  </h2>
                  <p className="text-[10px] font-body text-brutify-text-muted">
                    Vidéos qui explosent
                  </p>
                </div>
              </div>
              <Link
                href="/videos"
                className="flex items-center gap-1.5 text-xs font-body font-medium text-brutify-text-secondary hover:text-brutify-gold transition-colors duration-200"
              >
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading variant="block" size="md" className="py-8" />
              </div>
            ) : topOutliers.length > 0 ? (
              <div className="space-y-2.5">
                {topOutliers.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.6 + index * 0.08,
                      duration: 0.3,
                      ease: EASE_EXPO,
                    }}
                  >
                    <Link
                      href="/videos"
                      className="flex gap-3 rounded-lg border border-white/[0.06] bg-brutify-elevated/20 p-3 transition-all duration-200 hover:border-brutify-gold/20 hover:bg-brutify-elevated/40 group"
                    >
                      {video.thumbnail_url && (
                        <div className="relative shrink-0 w-20 h-14 rounded-md overflow-hidden bg-black/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={proxyImg(video.thumbnail_url)!}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 backdrop-blur-sm">
                            <Eye className="h-2.5 w-2.5 text-white/80" />
                            <span className="text-[9px] font-body font-semibold text-white/80">
                              {formatNumber(video.views)}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="gold"
                            className="shrink-0 px-2 py-0.5 text-[9px]"
                          >
                            {video.outlier_score.toFixed(1)}x
                          </Badge>
                          <p className="text-xs font-body font-medium text-brutify-text-primary line-clamp-2 flex-1">
                            {video.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] font-body text-brutify-text-muted">
                            {video.creator.name ?? video.creator.handle}
                          </span>
                          <span className="text-[10px] text-brutify-text-muted/40">•</span>
                          <span className="text-[10px] font-body text-brutify-text-muted/60">
                            {formatRelTime(video.posted_at)}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-brutify-text-muted/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-body text-brutify-text-muted text-center py-6">
                Aucun outlier détecté. Ajoute des créateurs à ta watchlist.
              </p>
            )}
          </Card>
        </motion.div>

        {/* Créateurs qui explosent */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: EASE_EXPO }}
        >
          <Card hoverable={false} className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] icon-hover-rotate"
                >
                  <TrendingUp className="h-[18px] w-[18px] text-brutify-gold" />
                </div>
                <div>
                  <h2 className="font-display text-xl tracking-wider text-brutify-text-primary">
                    CRÉATEURS EN FEU
                  </h2>
                  <p className="text-[10px] font-body text-brutify-text-muted">
                    Meilleure croissance
                  </p>
                </div>
              </div>
              <Link
                href="/creators"
                className="flex items-center gap-1.5 text-xs font-body font-medium text-brutify-text-secondary hover:text-brutify-gold transition-colors duration-200"
              >
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading variant="block" size="md" className="py-8" />
              </div>
            ) : trendingCreators.length > 0 ? (
              <div className="space-y-2.5">
                {trendingCreators.map((creator, index) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.6 + index * 0.08,
                      duration: 0.3,
                      ease: EASE_EXPO,
                    }}
                  >
                    <Link
                      href="/creators"
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-brutify-elevated/20 p-3 transition-all duration-200 hover:border-brutify-gold/20 hover:bg-brutify-elevated/40 group"
                    >
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-brutify-gold/10">
                          {creator.avatar_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={proxyImg(creator.avatar_url)!}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-brutify-gold">
                              {(creator.name ?? creator.handle)[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-body font-semibold text-brutify-text-primary truncate">
                          {creator.name ?? `@${creator.handle}`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Users className="h-2.5 w-2.5 text-brutify-text-muted/60" />
                            <span className="text-[10px] font-body text-brutify-text-muted">
                              {formatNumber(creator.followers)}
                            </span>
                          </div>
                          {creator.growth_rate > 0 && (
                            <>
                              <span className="text-[10px] text-brutify-text-muted/40">•</span>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-2.5 w-2.5 text-brutify-success" />
                                <span className="text-[10px] font-body font-semibold text-brutify-success">
                                  +{creator.growth_rate.toFixed(1)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {creator.recent_outliers > 0 && (
                        <Badge variant="gold" className="shrink-0 px-2 py-0.5 text-[9px]">
                          {creator.recent_outliers} 🔥
                        </Badge>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-body text-brutify-text-muted text-center py-6">
                Aucun créateur dans votre watchlist.
              </p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* 2-column layout: BrutBoard + Activité récente */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* BrutBoard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: EASE_EXPO }}
        >
          <Card hoverable={false} className="p-6 border-brutify-gold/15 shadow-[0_0_20px_rgba(255,171,0,0.1)] h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] icon-hover-rotate"
                >
                  <LayoutDashboard className="h-[18px] w-[18px] text-brutify-gold" />
                </div>
                <div>
                  <h2 className="font-display text-xl tracking-wider text-brutify-text-primary">
                    BRUTBOARD
                  </h2>
                  <p className="text-[10px] font-body text-brutify-text-muted">
                    Contenus planifiés
                  </p>
                </div>
              </div>
              <Link
                href="/board"
                className="flex items-center gap-1.5 text-xs font-body font-medium text-brutify-text-secondary hover:text-brutify-gold transition-colors duration-200"
              >
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading variant="block" size="md" className="py-8" />
              </div>
            ) : upcomingBoard.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingBoard.map((item, index) => {
                  const statusCfg =
                    boardStatusConfig[item.status as BoardStatus] ??
                    boardStatusConfig.idea;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.75 + index * 0.08,
                        duration: 0.2,
                        ease: EASE_EXPO,
                      }}
                      className="flex items-center justify-between flex-wrap gap-2 rounded-lg border border-white/[0.06] bg-brutify-elevated/20 px-4 py-3 transition-all duration-200 hover:border-white/[0.1] hover:bg-brutify-elevated/40"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Circle
                          className="h-2.5 w-2.5 shrink-0 fill-current"
                          style={{ color: statusCfg.color }}
                        />
                        <p className="truncate text-sm font-body font-medium text-brutify-text-primary">
                          {item.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className="text-[11px] font-body text-brutify-text-muted flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.date}
                        </span>
                        <span
                          className="text-[11px] font-body font-medium rounded-full px-2 py-0.5 border"
                          style={{
                            color: statusCfg.color,
                            borderColor: statusCfg.color + "30",
                            backgroundColor: statusCfg.color + "10",
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm font-body text-brutify-text-muted text-center py-6">
                Aucun contenu planifié. Ajoute du contenu dans ton BrutBoard.
              </p>
            )}
          </Card>
        </motion.div>

        {/* Activité récente */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4, ease: EASE_EXPO }}
        >
          <Card hoverable={false} className="p-6 h-full">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-brutify-border-gold bg-brutify-gold/[0.08] icon-hover-rotate"
              >
                <Clock className="h-[18px] w-[18px] text-brutify-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl tracking-wider text-brutify-text-primary">
                  ACTIVITÉ RÉCENTE
                </h2>
                <p className="text-[10px] font-body text-brutify-text-muted">
                  Vos dernières actions
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading variant="block" size="md" className="py-8" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.75 + index * 0.06,
                      duration: 0.2,
                      ease: EASE_EXPO,
                    }}
                    className="flex items-start gap-3 rounded-lg border border-white/[0.05] bg-brutify-elevated/15 px-3.5 py-2.5 transition-all duration-200 hover:border-white/[0.08] hover:bg-brutify-elevated/30"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brutify-gold/[0.08] text-brutify-gold mt-0.5">
                      {activityIcons[activity.type] ?? <Sparkles className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-medium text-brutify-text-primary">
                        {activity.title}
                      </p>
                      {activity.subtitle && (
                        <p className="text-[10px] font-body text-brutify-text-muted mt-0.5 truncate">
                          {activity.subtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-body text-brutify-text-muted/60 shrink-0 mt-1">
                      {formatRelTime(activity.timestamp)}
                    </span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-body text-brutify-text-muted text-center py-6">
                Aucune activité récente.
              </p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick actions footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.4, ease: EASE_EXPO }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link
          href="/creators"
          className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-brutify-elevated/30 p-4 transition-all duration-300 hover:border-brutify-gold/20 hover:bg-brutify-elevated/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brutify-gold/[0.1] text-brutify-gold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-brutify-text-primary">
                Explorer les créateurs
              </p>
              <p className="text-[10px] font-body text-brutify-text-muted">
                Découvre ta niche
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-brutify-text-muted group-hover:text-brutify-gold group-hover:translate-x-1 transition-all duration-200" />
        </Link>

        <Link
          href="/videos"
          className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-brutify-elevated/30 p-4 transition-all duration-300 hover:border-brutify-gold/20 hover:bg-brutify-elevated/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brutify-gold/[0.1] text-brutify-gold">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-brutify-text-primary">
                Analyser les vidéos
              </p>
              <p className="text-[10px] font-body text-brutify-text-muted">
                Trouve les hooks gagnants
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-brutify-text-muted group-hover:text-brutify-gold group-hover:translate-x-1 transition-all duration-200" />
        </Link>

        <Link
          href="/scripts"
          className="group flex items-center justify-between rounded-xl border border-white/[0.06] bg-brutify-elevated/30 p-4 transition-all duration-300 hover:border-brutify-gold/20 hover:bg-brutify-elevated/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brutify-gold/[0.1] text-brutify-gold">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-brutify-text-primary">
                Créer un script
              </p>
              <p className="text-[10px] font-body text-brutify-text-muted">
                Forge ton contenu
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-brutify-text-muted group-hover:text-brutify-gold group-hover:translate-x-1 transition-all duration-200" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
