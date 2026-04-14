"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, UserX, X, Instagram, Youtube, AtSign, ArrowUpDown, Users, Zap, Trophy, BadgeCheck, AlertTriangle, Hash, Star } from "lucide-react";
import Image from "next/image";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Loading } from "@/components/ui/Loading";
import dynamic from "next/dynamic";
import { CreatorCard } from "@/components/creators/CreatorCard";
const CreatorDetailModal = dynamic(
  () => import("@/components/creators/CreatorDetailModal").then(m => ({ default: m.CreatorDetailModal })),
  { ssr: false }
);
import { useRouter } from "next/navigation";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { InstagramSearchProfile } from "@/hooks/useCreators";
import { useToast } from "@/lib/toast-context";
import type { Creator, Platform } from "@/lib/types";
import type { CreatorDTO } from "@/lib/api/helpers";
import { cn } from "@/lib/utils";
import { useUpsell } from "@/hooks/useUpsellTrigger";
import { useUser } from "@/hooks/useUser";
import { PLAN_FEATURES } from "@/lib/plans";

type FilterPlatform = "all" | Platform;

const platformFilters: { value: FilterPlatform; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
];

const niches = [
  "Fitness",
  "Business",
  "Finance",
  "Mindset",
  "Nutrition",
  "Marketing",
  "Tech",
  "Voyage",
  "Cuisine",
  "Lifestyle",
];

type SortKey = "none" | "bruitScore" | "followers" | "engagement" | "outlier";

const sortOptions: { value: SortKey; label: string; icon: React.ReactNode }[] = [
  { value: "none",       label: "Par défaut",   icon: <ArrowUpDown className="h-3.5 w-3.5" /> },
  { value: "bruitScore", label: "Brut Score",  icon: <Star className="h-3.5 w-3.5" /> },
  { value: "followers",  label: "Followers",    icon: <Users className="h-3.5 w-3.5" /> },
  { value: "engagement", label: "Engagement",   icon: <Zap className="h-3.5 w-3.5" /> },
  { value: "outlier",    label: "Ratio viral", icon: <Trophy className="h-3.5 w-3.5" /> },
];

function parsePercent(s: string): number {
  return parseFloat(s.replace(/[^0-9.\-]/g, "")) || 0;
}

function parseMultiplier(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

function getAccountTier(count: number): { label: string; color: string } {
  if (count >= 1_000_000) return { label: "Méga", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" };
  if (count >= 500_000)   return { label: "Macro", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  if (count >= 100_000)   return { label: "Mid", color: "text-brutify-gold bg-brutify-gold/10 border-brutify-gold/20" };
  if (count >= 10_000)    return { label: "Micro", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
  return { label: "Nano", color: "text-brutify-text-muted bg-white/[0.04] border-white/[0.08]" };
}

function dtoToCreator(dto: CreatorDTO): Creator {
  return { ...dto };
}

export default function CreatorsPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>("all");
  const [nicheFilter, setNicheFilter] = useState<string[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("none");
  const { triggerUpsell } = useUpsell();
  const { profile } = useUser();

  const handleBonusClaimable = useCallback((bonus: { reward: number }) => {
    toast.success(`Bonus débloqué ! Récupère tes ${bonus.reward} BP sur le dashboard.`);
    setTimeout(() => router.push("/dashboard"), 1500);
  }, [toast, router]);

  const {
    creators: watchlistCreators,
    toggleWatchlist: apiToggleWatchlist,
    isLoading: watchlistLoading,
    mutate: mutateWatchlist,
  } = useWatchlist();

  // Filtrage + tri local sur la watchlist uniquement
  const sorted = useMemo(() => {
    let list = watchlistCreators.map((c) => dtoToCreator({ ...c, isInWatchlist: true }));

    if (search.trim()) {
      const q = search.toLowerCase().replace(/^@/, "").trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().replace(/^@/, "").includes(q)
      );
    }
    if (platformFilter !== "all") {
      list = list.filter((c) => c.platform === platformFilter);
    }
    if (nicheFilter.length > 0) {
      const lowerNiches = nicheFilter.map((n) => n.toLowerCase());
      list = list.filter(
        (c) => c.niche && lowerNiches.includes(c.niche.toLowerCase())
      );
    }

    if (sortBy === "none") return list;
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "bruitScore": return b.bruitScore - a.bruitScore;
        case "followers":  return b.followersNum - a.followersNum;
        case "engagement": return parsePercent(b.engagement) - parsePercent(a.engagement);
        case "outlier":    return parseMultiplier(b.topOutlierRatio) - parseMultiplier(a.topOutlierRatio);
        default: return 0;
      }
    });
  }, [watchlistCreators, search, platformFilter, nicheFilter, sortBy]);

  const handleToggleWatchlist = useCallback(
    async (id: string) => {
      // Vérifier si on essaie d'ajouter (pas de retirer)
      const isAdding = !watchlistCreators.some(c => c.id === id);
      
      // Si on ajoute et qu'on est sur Creator plan avec limite
      if (isAdding && profile?.plan === "creator") {
        const maxCreators = PLAN_FEATURES.creator.maxCreators;
        if (watchlistCreators.length >= maxCreators) {
          // Watchlist pleine, déclencher l'upsell
          triggerUpsell("creator_list_full");
          return; // Ne pas ajouter
        }
      }
      
      await apiToggleWatchlist(id);
      mutateWatchlist();
    },
    [apiToggleWatchlist, mutateWatchlist, watchlistCreators, profile, triggerUpsell]
  );

  const { removeFromWatchlist } = useWatchlist();
  const handleRemoveCreator = useCallback(
    async (id: string) => {
      await removeFromWatchlist(id);
      mutateWatchlist();
    },
    [removeFromWatchlist, mutateWatchlist]
  );

  // Le modal gère lui-même le scraping — on refresh juste la watchlist au succès
  const handleAddCreator = useCallback(() => {
    setAddModalOpen(false);
    mutateWatchlist();
  }, [mutateWatchlist]);

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Créateurs"
        subtitle={`${watchlistCreators.length} créateur${watchlistCreators.length !== 1 ? "s" : ""} dans ton radar`}
      >
        <Button variant="primary" size="md" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </PageHeader>

      {/* Search bar — filtre local uniquement */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: expoOut }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brutify-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer mes créateurs par nom ou @..."
            className="w-full rounded-xl border border-brutify-gold/15 bg-white/[0.02] backdrop-blur-xl py-3.5 pl-12 pr-10 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-300 shadow-[0_0_20px_rgba(255,171,0,0.1)] focus:border-brutify-gold/30 focus:shadow-[0_0_30px_rgba(255,171,0,0.3)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-brutify-text-muted hover:text-brutify-text-primary transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease: expoOut }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Plateformes */}
          {platformFilters.map((pf) => (
            <FilterPill
              key={pf.value}
              label={pf.label}
              active={platformFilter === pf.value}
              onClick={() => {
                if (pf.value === "all") {
                  // "Tous" remet a zero tous les filtres
                  setPlatformFilter("all");
                  setNicheFilter([]);
                } else {
                  setPlatformFilter(platformFilter === pf.value ? "all" : pf.value);
                }
              }}
            />
          ))}

          <div className="h-5 w-px bg-white/[0.08] mx-1" />

          {/* Niches */}
          {niches.map((niche) => (
            <FilterPill
              key={niche}
              label={niche}
              active={nicheFilter.includes(niche)}
              onClick={() => setNicheFilter(
                nicheFilter.includes(niche)
                  ? nicheFilter.filter((n) => n !== niche)
                  : [...nicheFilter, niche]
              )}
            />
          ))}

          {/* Reset visible quand des filtres sont actifs */}
          {(platformFilter !== "all" || nicheFilter.length > 0) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => { setPlatformFilter("all"); setNicheFilter([]); }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-body text-brutify-text-muted/70 border border-white/[0.06] hover:border-white/[0.1] hover:text-brutify-text-primary transition-all cursor-pointer"
            >
              <X className="h-3 w-3" />
              Réinitialiser
            </motion.button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-body text-brutify-text-muted mr-1 uppercase tracking-wider">Trier par</span>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(sortBy === opt.value ? "none" : opt.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95",
                sortBy === opt.value
                  ? "bg-brutify-gold/[0.12] border-brutify-gold/30 text-brutify-gold shadow-[0_0_25px_rgba(255,171,0,0.25)]"
                  : "bg-transparent border-white/[0.06] text-brutify-text-muted hover:border-brutify-gold/15 hover:text-brutify-text-primary hover:shadow-[0_0_16px_rgba(255,171,0,0.1)]"
              )}
              style={{ willChange: 'transform' }}
            >
              {opt.icon}
              {opt.label}
              {sortBy === opt.value && (
                <span className="text-[10px] text-brutify-gold/60">↓</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid or empty state */}
      {watchlistLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : sorted.length > 0 ? (
        <div
          key={`${platformFilter}-${nicheFilter}-${search}-${sortBy}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
                transition={{
                  duration: 0.2,
                  delay: Math.min(i * 0.03, 0.3),
                  ease: expoOut,
                }}
                className="relative"
              >
                {sortBy !== "none" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease: expoOut }}
                    className={cn(
                      "absolute -top-2 -left-2 z-10 flex items-center justify-center rounded-full text-xs font-body font-bold border",
                      i === 0
                        ? "h-8 w-8 bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-black border-brutify-gold/40 shadow-[0_0_16px_rgba(255,171,0,0.4)]"
                        : i === 1
                          ? "h-7 w-7 bg-white/[0.08] text-white/80 border-white/[0.15] shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                          : i === 2
                            ? "h-7 w-7 bg-[#CD7F32]/[0.15] text-[#CD7F32] border-[#CD7F32]/20"
                            : "h-6 w-6 bg-white/[0.04] text-brutify-text-muted border-white/[0.06] text-[10px]"
                    )}
                  >
                    {i + 1}
                  </motion.div>
                )}
                <CreatorCard
                  creator={creator}
                  onToggleWatchlist={handleToggleWatchlist}
                  onRemove={handleRemoveCreator}
                  onClick={(c) => setSelectedCreatorId(c.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: expoOut }}
          className="flex flex-col items-center justify-center py-24 rounded-2xl bg-gradient-to-b from-brutify-gold/[0.02] via-white/[0.02] to-transparent border border-brutify-gold/10 shadow-[0_0_30px_rgba(255,171,0,0.08)]"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brutify-gold/15 bg-[#111113]/60 mb-5 shadow-[0_0_20px_rgba(255,171,0,0.1)]">
            <UserX className="h-7 w-7 text-brutify-text-muted" />
          </div>
          <p className="font-display text-xl uppercase tracking-wider text-brutify-text-secondary mb-1">
            {search.trim() ? "Aucun résultat" : "Ton radar est vide"}
          </p>
          <p className="text-sm font-body text-brutify-text-muted mb-4">
            {search.trim()
              ? `Aucun créateur ne correspond à "${search}" — essaie un autre terme.`
              : "Ajoute des créateurs depuis le bouton ci-dessus ou utilise Découvrir."}
          </p>
        </motion.div>
      )}

      {/* Detail modal */}
      <CreatorDetailModalWrapper
        creatorId={selectedCreatorId}
        onClose={() => setSelectedCreatorId(null)}
        onToggleWatchlist={handleToggleWatchlist}
        localCreators={sorted}
      />

      {/* Add creator modal */}
      <AddCreatorModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddCreator}
        onBonusClaimable={handleBonusClaimable}
      />
    </div>
  );
}

function CreatorDetailModalWrapper({
  creatorId,
  onClose,
  onToggleWatchlist,
  localCreators,
}: {
  creatorId: string | null;
  onClose: () => void;
  onToggleWatchlist: (id: string) => void;
  localCreators: Creator[];
}) {
  const localCreator = creatorId
    ? localCreators.find((c) => c.id === creatorId) ?? null
    : null;

  return (
    <CreatorDetailModal
      creator={localCreator}
      onClose={onClose}
      onToggleWatchlist={onToggleWatchlist}
    />
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-xs font-body font-medium transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95",
        active
          ? "bg-brutify-gold/[0.12] border-brutify-gold/30 text-brutify-gold shadow-[0_0_25px_rgba(255,171,0,0.25)]"
          : "bg-transparent border-white/[0.06] text-brutify-text-muted hover:border-brutify-gold/15 hover:text-brutify-text-primary hover:shadow-[0_0_16px_rgba(255,171,0,0.1)]"
      )}
      style={{ willChange: 'transform' }}
    >
      {label}
    </button>
  );
}


const AVATAR_COLORS = [
  ["#FF6B6B", "#C0392B"], ["#F39C12", "#D68910"], ["#27AE60", "#1E8449"],
  ["#2980B9", "#1F618D"], ["#8E44AD", "#6C3483"], ["#E67E22", "#CA6F1E"],
  ["#16A085", "#0E6655"], ["#E91E8C", "#AD1457"],
]

function getAvatarColor(username: string): [string, string] {
  let hash = 0
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}


const platformOptions: { value: Platform; label: string; icon: React.ReactNode }[] = [
  { value: "instagram", label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
  { value: "tiktok", label: "TikTok", icon: <AtSign className="h-4 w-4" /> },
  { value: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" /> },
];

function IgAvatar({ profile, size = 44 }: { profile: InstagramSearchProfile; size?: number }) {
  const [error, setError] = useState(false);
  if (profile.profilePicUrl && !error) {
    return (
      <Image
        src={profile.profilePicUrl}
        alt={profile.username}
        fill
        className="object-cover"
        unoptimized
        onError={() => setError(true)}
      />
    );
  }
  const [from, to] = getAvatarColor(profile.username);
  const initials = (profile.fullName || profile.username)
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join("");
  return (
    <div
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${from}, ${to})`, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <span style={{ color: "#fff", fontWeight: 700, fontSize: size * 0.32 }}>
        {initials}
      </span>
    </div>
  );
}

// ── Scraping progress overlay ─────────────────────────────────────────────────

type StepState = "pending" | "active" | "done";

interface ScrapeStep {
  id: number;
  label: string;
  sublabel: string;
  advanceAfterMs: number;
}

const HANDLE_STEPS: ScrapeStep[] = [
  { id: 1, label: "Connexion à Instagram", sublabel: "Proxy sécurisé · accès API", advanceAfterMs: 1800 },
  { id: 2, label: "Recherche du profil", sublabel: "Résolution du handle via Apify", advanceAfterMs: 5000 },
  { id: 3, label: "Analyse des statistiques", sublabel: "Followers · bio · posts count", advanceAfterMs: 9000 },
  { id: 4, label: "Enregistrement dans Brutify", sublabel: "Profil sauvegardé · scrape vidéos en arrière-plan", advanceAfterMs: Infinity },
];

function ScrapingProgress({ handle, apiDone }: { handle: string; apiDone: boolean }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const step = HANDLE_STEPS[currentStep - 1];
    if (!step || step.advanceAfterMs === Infinity) return;
    const t = setTimeout(() => setCurrentStep((s) => Math.min(s + 1, HANDLE_STEPS.length)), step.advanceAfterMs);
    return () => clearTimeout(t);
  }, [currentStep]);

  // When API responds, force all steps done
  useEffect(() => {
    if (apiDone) setCurrentStep(HANDLE_STEPS.length + 1);
  }, [apiDone]);

  const getState = (stepId: number): StepState => {
    if (stepId < currentStep) return "done";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="py-2"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#E1306C]/20 to-[#833AB4]/20 border border-[#E1306C]/20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-0 rounded-xl"
            style={{
              background: "conic-gradient(from 0deg, transparent 60%, rgba(225,48,108,0.4) 100%)",
            }}
          />
          <svg viewBox="0 0 24 24" className="h-5 w-5 relative z-10" fill="none">
            <defs>
              <linearGradient id="ig-grad-prog" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCAF45"/>
                <stop offset="40%" stopColor="#E1306C"/>
                <stop offset="100%" stopColor="#833AB4"/>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad-prog)" strokeWidth="1.8" fill="none"/>
            <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad-prog)" strokeWidth="1.8" fill="none"/>
            <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-grad-prog)"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-body font-semibold text-brutify-text-primary">
            Analyse de <span className="text-[#E1306C]">@{handle}</span>
          </p>
          <p className="text-[11px] font-body text-brutify-text-muted">{elapsed}s écoulées</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1.5 mb-5">
        {HANDLE_STEPS.map((step) => {
          const state = getState(step.id);
          return (
            <motion.div
              key={step.id}
              layout
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                state === "active" && "bg-brutify-gold/[0.06] border border-brutify-gold/15",
                state === "done" && "bg-emerald-500/[0.04] border border-emerald-500/10",
                state === "pending" && "bg-white/[0.02] border border-transparent"
              )}
            >
              {/* Icon */}
              <div className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full">
                {state === "done" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                ) : state === "active" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="h-5 w-5"
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="rgba(255,171,0,0.15)" strokeWidth="2"/>
                      <path d="M10 2a8 8 0 0 1 8 8" stroke="#FFAB00" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                ) : (
                  <div className="h-5 w-5 rounded-full border border-white/[0.08] flex items-center justify-center">
                    <span className="text-[9px] font-body text-brutify-text-muted/40">{step.id}</span>
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-xs font-body font-semibold leading-none mb-0.5",
                  state === "active" && "text-brutify-gold",
                  state === "done" && "text-emerald-400",
                  state === "pending" && "text-brutify-text-muted/50"
                )}>
                  {step.label}
                </p>
                <p className={cn(
                  "text-[10px] font-body",
                  state === "active" && "text-brutify-gold/60",
                  state === "done" && "text-emerald-400/50",
                  state === "pending" && "text-brutify-text-muted/30"
                )}>
                  {step.sublabel}
                </p>
              </div>

              {/* Active pulsing bar */}
              {state === "active" && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  className="shrink-0 h-1.5 w-8 rounded-full bg-brutify-gold/50"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom note */}
      <p className="text-center text-[10px] font-body text-brutify-text-muted/40 tracking-wide">
        {apiDone
          ? "Vidéos en cours de récupération — ouvre la fiche pour les voir arriver"
          : "Les vidéos seront scrapées automatiquement en arrière-plan"
        }
      </p>
    </motion.div>
  );
}

// ── Add Creator Modal ─────────────────────────────────────────────────────────

function AddCreatorModal({
  open,
  onClose,
  onAdd,
  onBonusClaimable,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: () => void;
  onBonusClaimable?: (bonus: { reward: number }) => void;
}) {
  type Tab = "handle" | "name";
  const [tab, setTab] = useState<Tab>("handle");

  // Tab "handle"
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [scraping, setScraping] = useState(false);
  const [scrapeApiDone, setScrapeApiDone] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Tab "name"
  const [namePlatform, setNamePlatform] = useState<Platform>("instagram");
  const [nameQuery, setNameQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<InstagramSearchProfile[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<InstagramSearchProfile | null>(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTab("handle");
      setHandle(""); setPlatform("instagram");
      setScraping(false); setScrapeApiDone(false); setScrapeError(null);
      setNamePlatform("instagram");
      setNameQuery(""); setSearchLoading(false);
      setSearchResults([]); setSearchDone(false);
      setSelectedProfile(null); setAddingProfile(false); setAddError(null);
    }
  }, [open]);

  const handleClean = handle.trim().replace(/^@/, "").toLowerCase();
  const handleValid = handleClean.length > 0 && !handle.includes(" ");

  const submitHandle = async () => {
    if (!handleValid) return;
    setScraping(true);
    setScrapeError(null);
    let success = false;
    let creatorId: string | null = null;
    try {
      const res = await fetch("/api/scraping/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handleClean }),
      });
      const data = await res.json();
      if (!res.ok) { setScrapeError(data.error ?? "Erreur lors du scraping"); setScraping(false); return; }
      if (data.creator) {
        creatorId = data.creator.id;
        success = true;
      } else {
        setScrapeError("Profil introuvable sur Instagram");
        setScraping(false);
        return;
      }
    } catch {
      setScrapeError("Erreur réseau");
      setScraping(false);
      return;
    }
    // Mark API done → ScrapingProgress completes all steps visually
    if (success && creatorId) {
      setScrapeApiDone(true);
      await new Promise((r) => setTimeout(r, 900));
      const watchRes = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creator_id: creatorId }),
      });
      const watchData = await watchRes.json().catch(() => ({}));
      if (watchData.bonusClaimable && onBonusClaimable) onBonusClaimable(watchData.bonusClaimable);
      // Fire-and-forget: scrape the first 30 videos silently in background
      fetch(`/api/creators/${creatorId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 30 }),
      }).catch(() => {});
      setScraping(false);
      onAdd();
    }
  };

  const searchByName = async () => {
    if (!nameQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    setSearchDone(false);
    setAddError(null);
    try {
      const res = await fetch(`/api/scraping/instagram/search?q=${encodeURIComponent(nameQuery.trim())}`);
      const data = await res.json();
      const profiles: InstagramSearchProfile[] = (data.profiles ?? []).filter(
        (p: InstagramSearchProfile) => p.followersCount >= 500
      );
      setSearchResults(profiles);
    } catch {}
    setSearchLoading(false);
    setSearchDone(true);
  };

  const addFoundProfile = async (profile: InstagramSearchProfile) => {
    setSelectedProfile(profile);
    setAddingProfile(true);
    setAddError(null);
    try {
      const res = await fetch("/api/scraping/instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: profile.username }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Erreur lors de l'ajout"); setAddingProfile(false); return; }
      if (data.creator) {
        const watchRes = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creator_id: data.creator.id }),
        });
        const watchData = await watchRes.json().catch(() => ({}));
        if (watchData.bonusClaimable && onBonusClaimable) onBonusClaimable(watchData.bonusClaimable);
        // Fire-and-forget: scrape the first 30 videos silently in background
        fetch(`/api/creators/${data.creator.id}/videos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 30 }),
        }).catch(() => {});
        onAdd();
      } else {
        setAddError("Profil introuvable");
      }
    } catch {
      setAddError("Erreur réseau");
    } finally {
      setAddingProfile(false);
      setSelectedProfile(null);
    }
  };

  const inputBase = "w-full rounded-xl border bg-white/[0.02] py-3 px-4 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-300 border-white/[0.06] focus:border-brutify-gold/20 focus:shadow-[0_0_15px_rgba(255,171,0,0.05)]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: expoOut }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#111113] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-brutify-gold/40 to-transparent" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-xl uppercase tracking-wider text-brutify-text-primary">
                  Ajouter un créateur
                </h3>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.1] transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-5 p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                {([
                  { key: "handle" as Tab, icon: <Hash className="h-3.5 w-3.5" />, label: "J'ai le @ exact", sublabel: "Moins de BP" },
                  { key: "name" as Tab, icon: <Search className="h-3.5 w-3.5" />, label: "Je cherche par nom", sublabel: "Plus de BP" },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2.5 px-2 transition-all duration-200 cursor-pointer",
                      tab === t.key
                        ? "bg-brutify-gold/[0.08] border border-brutify-gold/20 shadow-[0_0_12px_rgba(255,171,0,0.06)]"
                        : "border border-transparent hover:bg-white/[0.03]"
                    )}
                  >
                    <div className={cn("flex items-center gap-1.5", tab === t.key ? "text-brutify-gold" : "text-brutify-text-muted")}>
                      {t.icon}
                      <span className="text-xs font-body font-semibold">{t.label}</span>
                    </div>
                    <span className={cn("text-[10px] font-body", tab === t.key ? "text-brutify-gold/70" : "text-brutify-text-muted/50")}>
                      {t.sublabel}
                    </span>
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {scraping ? (
                  <motion.div
                    key="scraping-progress"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ScrapingProgress handle={handleClean} apiDone={scrapeApiDone} />
                  </motion.div>
                ) : tab === "handle" ? (
                  <motion.div
                    key="tab-handle"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Tip */}
                    <div className="mb-4 rounded-xl border border-brutify-gold/10 bg-brutify-gold/[0.03] p-3.5">
                      <p className="text-xs font-body text-brutify-text-muted leading-relaxed">
                        Entre le <span className="text-brutify-gold font-semibold">@ exact</span> du créateur Instagram, TikTok ou YouTube.
                        Brutify va analyser son profil directement — <span className="text-brutify-gold font-medium">moins cher en BP</span> qu&apos;une recherche par nom.
                      </p>
                    </div>

                    {/* Platform */}
                    <div className="mb-4">
                      <label className="block text-xs font-body font-medium text-brutify-text-secondary mb-1.5">Plateforme</label>
                      <div className="flex gap-2">
                        {platformOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPlatform(opt.value)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
                              platform === opt.value
                                ? "bg-brutify-gold/[0.08] border-brutify-gold/20 text-brutify-gold"
                                : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:text-brutify-text-primary"
                            )}
                          >
                            {opt.icon}{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Handle */}
                    <div className="mb-5">
                      <label className="block text-xs font-body font-medium text-brutify-text-secondary mb-1.5">
                        @ exact <span className="text-brutify-text-muted font-normal">(ex : @gaelcreates)</span>
                      </label>
                      <input
                        type="text"
                        value={handle}
                        onChange={(e) => { setHandle(e.target.value); setScrapeError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && submitHandle()}
                        placeholder="@gaelcreates"
                        className={inputBase}
                        autoFocus
                      />
                      {scrapeError ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-red-400 shrink-0" />
                          <p className="text-[11px] font-body text-red-400">{scrapeError}</p>
                        </div>
                      ) : handle.includes(" ") ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                          <p className="text-[11px] font-body text-amber-400">
                            Un @ exact ne contient pas d&apos;espaces — utilise l&apos;onglet &ldquo;Nom&rdquo; pour une recherche par mot-clé
                          </p>
                        </div>
                      ) : handleValid ? (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <p className="text-[11px] font-body text-emerald-400">
                            @ détecté : <span className="font-medium">@{handleClean}</span> — analyse directe
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <button
                      onClick={submitHandle}
                      disabled={!handleValid}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-body font-semibold transition-all cursor-pointer",
                        handleValid
                          ? "bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-black hover:shadow-[0_0_20px_rgba(255,171,0,0.3)]"
                          : "bg-white/[0.04] border border-white/[0.06] text-brutify-text-muted cursor-not-allowed"
                      )}
                    >
                      Analyser @{handleClean || "..."}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tab-name"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Tip */}
                    <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                      <p className="text-xs font-body text-brutify-text-muted leading-relaxed">
                        Tu connais le nom du créateur mais <span className="text-brutify-text-primary font-medium">pas son @ exact</span> ?
                        Tape son nom — Brutify va chercher les profils Instagram correspondants.
                        <span className="text-white/40"> (Coûte plus de BP qu&apos;avec le @ direct)</span>
                      </p>
                    </div>

                    {/* Search input — Instagram only for now */}
                    {namePlatform === "instagram" && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={nameQuery}
                        onChange={(e) => { setNameQuery(e.target.value); setSearchDone(false); setSearchResults([]); }}
                        onKeyDown={(e) => e.key === "Enter" && searchByName()}
                        placeholder="Ex: Alex Hormozi, Inoxtag..."
                        className={cn(inputBase, "flex-1")}
                        autoFocus
                      />
                      <button
                        onClick={searchByName}
                        disabled={!nameQuery.trim() || searchLoading}
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 rounded-xl px-4 text-sm font-body font-medium transition-all cursor-pointer",
                          nameQuery.trim() && !searchLoading
                            ? "bg-brutify-gold/[0.1] border border-brutify-gold/20 text-brutify-gold hover:bg-brutify-gold/[0.15]"
                            : "bg-white/[0.03] border border-white/[0.06] text-brutify-text-muted cursor-not-allowed"
                        )}
                      >
                        {searchLoading ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>
                    )}

                    {/* Results — Instagram uniquement */}
                    <AnimatePresence>
                      {searchLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-3 py-10"
                        >
                          <div className="relative flex h-12 w-12 items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-brutify-gold/10" />
                            <span className="absolute inset-0 rounded-full border-2 border-brutify-gold/25 border-t-brutify-gold animate-brutify-spin" />
                            <Instagram className="h-5 w-5 text-brutify-gold/60" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-body font-medium text-brutify-text-secondary">Recherche en cours…</p>
                            <p className="text-[11px] font-body text-brutify-text-muted/60 mt-0.5">Analyse des profils Instagram (~15s)</p>
                          </div>
                        </motion.div>
                      )}
                      {!searchLoading && searchDone && searchResults.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center gap-2 py-8"
                        >
                          <Users className="h-7 w-7 text-brutify-text-muted/40" />
                          <p className="text-xs font-body text-brutify-text-muted">Aucun profil trouvé avec 500+ abonnés</p>
                          <p className="text-[11px] font-body text-brutify-text-muted/60">Essaie un autre nom ou utilise le @ exact dans l&apos;onglet précédent</p>
                        </motion.div>
                      )}
                      {!searchLoading && searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          {/* Header résultats */}
                          <div className="flex items-center justify-between mb-2.5">
                            <p className="text-[11px] font-body text-brutify-text-muted">
                              <span className="text-brutify-text-primary font-medium">{searchResults.length}</span> profil{searchResults.length > 1 ? "s" : ""} trouvé{searchResults.length > 1 ? "s" : ""}
                            </p>
                            <p className="text-[10px] font-body text-brutify-text-muted/50">Triés par popularité</p>
                          </div>

                          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-0.5 -mr-1">
                          {searchResults.slice(0, 6).map((profile, i) => {
                            const isAdding = addingProfile && selectedProfile?.username === profile.username;
                            const tier = getAccountTier(profile.followersCount);
                            return (
                              <motion.button
                                key={profile.username}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                onClick={() => addFoundProfile(profile)}
                                disabled={addingProfile}
                                className={cn(
                                  "group w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 cursor-pointer",
                                  isAdding
                                    ? "border-brutify-gold/30 bg-brutify-gold/[0.06] shadow-[0_0_16px_rgba(255,171,0,0.08)]"
                                    : "border-white/[0.06] bg-white/[0.01] hover:border-brutify-gold/20 hover:bg-brutify-gold/[0.03] hover:shadow-[0_0_12px_rgba(255,171,0,0.06)]"
                                )}
                              >
                                {/* Avatar circulaire */}
                                <div className="relative shrink-0">
                                  <div className="relative rounded-full overflow-hidden ring-2 ring-white/[0.06]" style={{ width: 44, height: 44 }}>
                                    <IgAvatar profile={profile} size={44} />
                                  </div>
                                  {/* Badge plateforme */}
                                  <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E1306C] border-2 border-[#0e0e10]">
                                    <Instagram className="h-2 w-2 text-white" />
                                  </div>
                                </div>

                                {/* Infos */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-sm font-body font-semibold text-brutify-text-primary truncate leading-tight">
                                      {profile.fullName || profile.username}
                                    </p>
                                    {profile.verified && (
                                      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                                    )}
                                  </div>
                                  <p className="text-[11px] font-body text-brutify-text-muted/70 truncate">
                                    @{profile.username}
                                  </p>
                                </div>

                                {/* Stats + action */}
                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                  {/* Followers */}
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-brutify-gold/50" />
                                    <span className="text-xs font-body font-bold text-brutify-text-primary">
                                      {formatFollowers(profile.followersCount)}
                                    </span>
                                  </div>
                                  {/* Tier badge */}
                                  <span className={cn(
                                    "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-body font-semibold",
                                    tier.color
                                  )}>
                                    {tier.label}
                                  </span>
                                </div>

                                {/* Bouton ajouter */}
                                <div className={cn(
                                  "shrink-0 ml-1 flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-body font-semibold transition-all",
                                  isAdding
                                    ? "border-brutify-gold/30 bg-brutify-gold/[0.1] text-brutify-gold"
                                    : "border-white/[0.08] text-brutify-text-muted group-hover:border-brutify-gold/20 group-hover:text-brutify-gold group-hover:bg-brutify-gold/[0.06]"
                                )}>
                                  {isAdding
                                    ? <><Loading variant="icon" size="sm" className="h-3 w-3 shrink-0" />Ajout</>
                                    : <><Plus className="h-3 w-3" />Ajouter</>
                                  }
                                </div>
                              </motion.button>
                            );
                          })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {addError && (
                      <p className="mt-2 text-xs text-red-400 font-body">{addError}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

