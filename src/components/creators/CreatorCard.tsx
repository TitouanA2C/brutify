"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, Users, Zap, Trash2, Star, Telescope } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/types";

function proxyImg(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.includes("ui-avatars.com")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

const PLATFORM_ICON: Record<string, (cls: string) => React.ReactNode> = {
  instagram: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  tiktok: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-5.58-2.2V2h3.45a4.83 4.83 0 002.13 4.69z" />
    </svg>
  ),
  youtube: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
};

function getBruitScoreColor(score: number): string {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#FFAB00";
  if (score >= 4) return "#fb923c";
  return "#f87171";
}

interface CreatorCardProps {
  creator: Creator;
  onToggleWatchlist: (id: string) => void;
  onRemove?: (id: string) => void;
  onClick: (creator: Creator) => void;
}

export function CreatorCard({
  creator,
  onToggleWatchlist,
  onRemove,
  onClick,
}: CreatorCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);
  const platformIcon = PLATFORM_ICON[creator.platform];
  const scoreColor = getBruitScoreColor(creator.bruitScore);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => { if (!confirmDelete) onClick(creator); }}
      className="group relative flex gap-4 rounded-2xl border border-brutify-gold/15 bg-[#111113]/60 backdrop-blur-xl p-4 cursor-pointer shadow-[0_6px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(255,171,0,0.15)] transition-all duration-200 hover:border-brutify-gold/25 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(255,171,0,0.3)] hover:-translate-y-1.5 hover:scale-[1.01]"
      style={{ willChange: "transform, box-shadow" }}
      role="article"
      aria-label={`Créateur ${creator.name}`}
    >
      {/* Gold glow */}
      <div
        className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.12] blur-[80px] transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none"
        style={{ background: "#FFAB00" }}
      />

      {/* Confirm delete overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#111113]/95 backdrop-blur-sm border border-red-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm font-body font-semibold text-brutify-text-primary">
              Retirer du radar ?
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-body font-medium text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.15] transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  onRemove ? onRemove(creator.id) : onToggleWatchlist(creator.id);
                }}
                className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-xs font-body font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all cursor-pointer"
              >
                Retirer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <div className="relative shrink-0 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] rounded-2xl overflow-hidden ring-1 ring-white/[0.04] group-hover:ring-white/[0.08] transition-all bg-[#0a0a0c]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={(!imgError && proxyImg(creator.avatarUrl)) || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=FFAB00&color=000&bold=true&size=128`}
          alt={creator.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
        {/* Platform badge */}
        {platformIcon && (
          <div className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/70 backdrop-blur-md border border-white/[0.1] text-white/80">
            {platformIcon("h-3 w-3")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Name + Brut Score */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-body text-[15px] font-semibold text-brutify-text-primary leading-snug truncate">
            {creator.name}
          </h3>
          <span
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-display font-bold tracking-wider"
            style={{
              color: scoreColor,
              borderColor: `${scoreColor}30`,
              background: `${scoreColor}12`,
            }}
          >
            <Star className="h-3 w-3" />
            {creator.bruitScore.toFixed(1)}
          </span>
        </div>

        {/* Handle + niche */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-[11px] font-body text-brutify-gold/70 truncate">
            @{creator.handle.replace(/^@/, "")}
          </span>
          {creator.niche && (
            <>
              <span className="text-brutify-text-muted/30 text-[10px]">·</span>
              <span className="text-[11px] font-body text-brutify-text-muted/60 truncate">
                {creator.niche}
              </span>
            </>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <MetricPill icon={<Users className="h-3 w-3" />} label={creator.followers} delta={creator.followersDelta} />
          <MetricPill icon={<Eye className="h-3 w-3" />} label={creator.avgViews} />
          <MetricPill icon={<Zap className="h-3 w-3" />} label={`${creator.outlierCount}`} highlight={creator.outlierCount > 0} />
        </div>

        {/* Action buttons (same as VideoCard) */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onClick(creator); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brutify-gold/15 bg-brutify-gold/[0.06] px-3 py-2 text-[11px] font-body font-semibold text-brutify-gold/80 transition-all duration-150 hover:border-brutify-gold/25 hover:bg-brutify-gold/[0.1] hover:text-brutify-gold hover:shadow-[0_0_12px_rgba(255,171,0,0.08)] hover:scale-102 active:scale-98 cursor-pointer"
            style={{ willChange: "transform" }}
          >
            <Telescope className="h-3 w-3" />
            Veille
          </button>
          {creator.isInWatchlist && (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-body font-medium text-brutify-text-secondary transition-all duration-150 hover:border-red-500/30 hover:bg-red-500/[0.06] hover:text-red-400 hover:scale-102 active:scale-98 cursor-pointer"
              style={{ willChange: "transform" }}
            >
              <Trash2 className="h-3 w-3" />
              Retirer
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricPill({
  icon,
  label,
  highlight = false,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  delta?: number;
}) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-body",
      highlight
        ? "bg-brutify-gold/[0.08] border-brutify-gold/20 text-brutify-gold"
        : "bg-white/[0.04] border-white/[0.06] text-brutify-text-muted"
    )}>
      {icon}
      {label}
      {hasDelta && (
        <span
          className="text-[10px] font-semibold ml-0.5"
          style={{ color: deltaPositive ? "#4ade80" : "#f87171" }}
        >
          {deltaPositive ? "+" : ""}
          {Math.abs(delta!) >= 1000 ? `${(delta! / 1000).toFixed(1)}K` : delta}
        </span>
      )}
    </span>
  );
}
