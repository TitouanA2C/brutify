"use client";

import { Suspense, useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { VideoOff, ChevronDown, Users, ArrowUpDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import dynamic from "next/dynamic";
import { VideoCard } from "@/components/videos/VideoCard";
const VideoDetailModal = dynamic(
  () => import("@/components/videos/VideoDetailModal").then(m => ({ default: m.VideoDetailModal })),
  { ssr: false }
);
import { useVideos } from "@/hooks/useVideos";
import { useCreateBoardItem } from "@/hooks/useBoard";
import type { Video, Platform } from "@/lib/types";
import type { VideoFeedItemDTO } from "@/lib/api/helpers";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";

export default function VideosPageWrapper() {
  return (
    <Suspense>
      <VideosPage />
    </Suspense>
  );
}

type PeriodFilter = "0" | "7" | "14" | "30" | "90";
type OutlierFilter = "all" | "2" | "5" | "10";
type PlatformFilter = "all" | Platform;
type SortKey = "outlier_score" | "views" | "likes" | "comments" | "posted_at";

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "0", label: "Tout" },
  { value: "7", label: "7j" },
  { value: "14", label: "14j" },
  { value: "30", label: "30j" },
  { value: "90", label: "90j" },
];

const outlierOptions: { value: OutlierFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "2", label: "2x+" },
  { value: "5", label: "5x+" },
  { value: "10", label: "10x+" },
];

const platformOptions: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "instagram", label: "IG" },
  { value: "tiktok", label: "TT" },
  { value: "youtube", label: "YT" },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "outlier_score", label: "Score viral" },
  { value: "views", label: "Vues" },
  { value: "likes", label: "Likes" },
  { value: "comments", label: "Commentaires" },
  { value: "posted_at", label: "Date" },
];

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function feedItemToVideo(item: VideoFeedItemDTO): Video {
  return {
    id: item.id,
    creatorId: item.creatorId,
    title: item.title,
    platform: item.platform,
    views: item.views,
    viewsNum: item.viewsNum,
    likes: item.likes,
    comments: item.comments,
    shares: item.shares,
    outlierScore: item.outlierScore,
    date: item.date,
    duration: item.duration,
    thumbnailColor: item.thumbnailColor,
    thumbnailUrl: item.thumbnailUrl ?? null,
    url: item.url ?? null,
    mediaUrl: item.mediaUrl ?? null,
    hook: "",
    hookType: "Contrarian",
    structure: "",
    hasTranscript: false,
  };
}

function feedItemToCreatorMini(item: VideoFeedItemDTO) {
  if (!item.creator) return undefined;
  return {
    id: item.creator.id,
    name: item.creator.name,
    handle: item.creator.handle,
    avatarUrl: item.creator.avatarUrl,
    platform: item.creator.platform as Platform,
    followers: "",
    followersNum: 0,
    avgViews: "",
    engagement: "",
    growth: "",
    niche: "",
    bio: "",
    postsCount: 0,
    outlierCount: 0,
    topOutlierRatio: "",
    isInWatchlist: true,
    color: item.thumbnailColor,
  };
}

function VideosPage() {
  const searchParams = useSearchParams();
  const creatorParam = searchParams.get("creator");
  const router = useRouter();

  const [period, setPeriod] = useState<PeriodFilter>(creatorParam ? "0" : "30");
  const [outlierMin, setOutlierMin] = useState<OutlierFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [creatorFilter, setCreatorFilter] = useState<string>(creatorParam || "all");
  const [sortBy, setSortBy] = useState<SortKey>("outlier_score");
  const [page, setPage] = useState(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<{ name: string; handle: string; avatarUrl: string } | null>(null);

  const handleForge = useCallback((video: Video) => {
    router.push(`/scripts?source_video_id=${video.id}`);
  }, [router]);

  const { create: createBoardItem } = useCreateBoardItem();
  const toast = useToast();
  const handleAddToInspiration = useCallback(async (video: Video) => {
    const result = await createBoardItem({ title: video.title || "Vidéo inspiration", status: "inspiration", source_video_id: video.id });
    if (result?.bonusClaimable) {
      toast.success(`Bonus débloqué ! Récupère tes ${result.bonusClaimable.reward} BP sur le dashboard.`);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  }, [createBoardItem, toast, router]);

  const { creators: watchlistCreatorsDTO } = useWatchlist();
  const watchlistedCreators = watchlistCreatorsDTO.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
  }));

  const apiParams = useMemo(() => ({
    creator_id: creatorFilter !== "all" ? creatorFilter : undefined,
    period: parseInt(period, 10),
    min_outlier: outlierMin !== "all" ? parseFloat(outlierMin) : undefined,
    platform: platformFilter !== "all" ? platformFilter : undefined,
    sort: sortBy,
    page,
    limit: creatorFilter !== "all" ? 50 : 20,
  }), [creatorFilter, period, outlierMin, platformFilter, sortBy, page]);

  const { videos: apiVideos, isLoading: apiLoading, total, totalPages } = useVideos(apiParams);

  const displayVideos = useMemo(() => {
    return apiVideos.map((item) => ({
      video: feedItemToVideo(item),
      creatorMini: feedItemToCreatorMini(item),
    }));
  }, [apiVideos]);

  const loading = apiLoading;
  const displayTotal = total;
  const displayTotalPages = totalPages;

  useEffect(() => {
    setPage(1);
  }, [period, outlierMin, platformFilter, creatorFilter, sortBy]);

  const sortLabel = sortOptions.find((o) => o.value === sortBy)?.label ?? "Score viral";

  return (
    <div className="max-w-[1400px] mx-auto">
      <PageHeader
        title="Vidéos"
        subtitle={`${displayTotal} vidéos analysées · triées par ${sortLabel.toLowerCase()}`}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: EASE_EXPO }}
        className="mb-6 space-y-3"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <FilterGroup label="Période">
            {periodOptions.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={period === opt.value} onClick={() => setPeriod(opt.value)} />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup label="Score viral min">
            {outlierOptions.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={outlierMin === opt.value} onClick={() => setOutlierMin(opt.value)} />
            ))}
          </FilterGroup>

          <Separator />

          <FilterGroup label="Plateforme">
            {platformOptions.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={platformFilter === opt.value} onClick={() => setPlatformFilter(opt.value)} />
            ))}
          </FilterGroup>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CustomDropdown
            icon={<Users className="h-3.5 w-3.5" />}
            value={creatorFilter}
            onChange={setCreatorFilter}
            options={[
              { value: "all", label: "Tous les créateurs" },
              ...watchlistedCreators.map((c) => ({
                value: c.id,
                label: c.name,
                sub: c.handle,
              })),
            ]}
          />
          <div className="ml-auto w-full sm:w-auto">
            <CustomDropdown
              icon={<ArrowUpDown className="h-3.5 w-3.5" />}
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
              prefix="Trier par"
              options={sortOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>
        </div>
      </motion.div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : displayVideos.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: EASE_EXPO }}
          key={`${period}-${outlierMin}-${platformFilter}-${creatorFilter}-${sortBy}-${page}`}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {displayVideos.map(({ video, creatorMini }, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.2), duration: 0.2, ease: EASE_EXPO }}
              >
                <VideoCard
                  video={video}
                  creator={creatorMini}
                  onClick={(v) => {
                    setSelectedVideo(v);
                    setSelectedCreator(creatorMini ?? null);
                  }}
                  onForge={handleForge}
                  onAddToInspiration={handleAddToInspiration}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          {displayTotalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-3 pt-6 pb-2"
            >
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-body font-medium text-brutify-text-secondary transition-all duration-200 hover:border-white/[0.1] hover:shadow-[0_0_12px_rgba(255,171,0,0.06)] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </button>
              <span className="text-xs font-body text-brutify-text-muted">
                Page <span className="inline-block px-2 py-0.5 rounded-md bg-brutify-gold/10 border border-brutify-gold/30 text-brutify-gold font-bold shadow-[0_0_20px_rgba(255,171,0,0.25)]">{page}</span> sur {displayTotalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                disabled={page >= displayTotalPages}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs font-body font-medium text-brutify-text-secondary transition-all duration-200 hover:border-white/[0.1] hover:shadow-[0_0_12px_rgba(255,171,0,0.06)] disabled:opacity-30 disabled:pointer-events-none"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_EXPO }}
          className="flex flex-col items-center justify-center py-24"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111113]/60 mb-5">
            <VideoOff className="h-7 w-7 text-brutify-text-muted" />
          </div>
          <p className="font-display text-xl uppercase tracking-wider text-brutify-text-secondary mb-1">
            Aucune vidéo trouvée
          </p>
          <p className="text-sm font-body text-brutify-text-muted">
            Ajuste tes filtres pour voir plus de résultats.
          </p>
        </motion.div>
      )}

      <VideoDetailModal
        video={selectedVideo}
        creator={selectedCreator}
        onClose={() => { setSelectedVideo(null); setSelectedCreator(null); }}
      />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-body font-medium uppercase tracking-wider text-brutify-text-muted mr-1">{label}</span>
      {children}
    </div>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-body font-medium transition-all duration-150 border cursor-pointer hover:scale-105 active:scale-95",
        active
          ? "bg-brutify-gold/[0.12] border-brutify-gold/30 text-brutify-gold shadow-[0_0_25px_rgba(255,171,0,0.25)]"
          : "border-white/[0.06] text-brutify-text-muted hover:border-brutify-gold/15 hover:text-brutify-text-primary hover:shadow-[0_0_16px_rgba(255,171,0,0.1)]"
      )}
      style={{ willChange: 'transform' }}
    >
      {label}
    </button>
  );
}

function Separator() {
  return <div className="h-5 w-px bg-white/[0.06]" />;
}

interface DropdownOption { value: string; label: string; sub?: string }

function CustomDropdown({
  icon, value, onChange, options, prefix,
}: {
  icon: React.ReactNode; value: string; onChange: (value: string) => void; options: DropdownOption[]; prefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
          open
            ? "border-brutify-gold/20 bg-brutify-gold/[0.04] text-brutify-text-primary"
            : value !== "all" && value !== options[0]?.value
              ? "border-brutify-gold/15 bg-brutify-gold/[0.03] text-brutify-gold"
              : "border-white/[0.06] bg-[#111113]/60 text-brutify-text-secondary hover:border-white/[0.1] hover:text-brutify-text-primary"
        )}
      >
        <span className="text-brutify-text-muted">{icon}</span>
        <span className="max-w-[100px] sm:max-w-[160px] truncate">{prefix ? `${prefix} : ${selected?.label}` : selected?.label}</span>
        <ChevronDown className={cn("h-3 w-3 text-brutify-text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_EXPO }}
            className="absolute left-0 top-full mt-1.5 z-50 min-w-[220px] max-w-[calc(100vw-2rem)] max-h-[280px] overflow-y-auto rounded-xl border border-white/[0.06] bg-[#111113]/95 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(255,171,0,0.04)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-brutify-gold/25 to-transparent" />
            <div className="py-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 text-left text-xs font-body transition-all duration-150 cursor-pointer",
                      isSelected ? "bg-brutify-gold/[0.06] text-brutify-gold" : "text-brutify-text-secondary hover:bg-white/[0.03] hover:text-brutify-text-primary"
                    )}
                  >
                    <div className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all", isSelected ? "border-brutify-gold/30 bg-brutify-gold/[0.1]" : "border-white/[0.08] bg-transparent")}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-brutify-gold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{opt.label}</span>
                      {opt.sub && <span className="block text-[10px] text-brutify-text-muted truncate">{opt.sub}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

