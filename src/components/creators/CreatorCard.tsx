"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Eye, Users, Zap, Trash2, Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Creator } from "@/lib/types";

function proxyImg(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  if (url.includes("ui-avatars.com")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ── Platform brand config ────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, {
  gradient: string;
  glowColor: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  icon: (cls: string) => React.ReactNode;
}> = {
  instagram: {
    gradient: "linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)",
    glowColor: "#E1306C",
    accentColor: "#E1306C",
    borderColor: "rgba(225,48,108,0.35)",
    badgeBg: "rgba(225,48,108,0.12)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  tiktok: {
    gradient: "linear-gradient(135deg, #010101 0%, #EE1D52 50%, #69C9D0 100%)",
    glowColor: "#EE1D52",
    accentColor: "#EE1D52",
    borderColor: "rgba(238,29,82,0.35)",
    badgeBg: "rgba(238,29,82,0.12)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-5.58-2.2V2h3.45a4.83 4.83 0 002.13 4.69z" />
      </svg>
    ),
  },
  youtube: {
    gradient: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)",
    glowColor: "#FF0000",
    accentColor: "#FF0000",
    borderColor: "rgba(255,0,0,0.35)",
    badgeBg: "rgba(255,0,0,0.12)",
    icon: (cls) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
};

const FALLBACK_CONFIG = PLATFORM_CONFIG.instagram;

function getBruitScoreColor(score: number): string {
  if (score >= 8) return "#4ade80"   // emerald — explosive
  if (score >= 6) return "#FFAB00"   // gold — en croissance
  if (score >= 4) return "#fb923c"   // orange — en veille
  return "#f87171"                   // red — dormant
}

// ── Component ────────────────────────────────────────────────────────────────

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
  const p = PLATFORM_CONFIG[creator.platform] ?? FALLBACK_CONFIG;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => { if (!confirmDelete) onClick(creator); }}
      className="group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-2 hover:scale-[1.02]"
      style={{
        border: `2px solid ${p.borderColor}`,
        background: "#0d0d0f",
        boxShadow: `0 6px 30px rgba(0,0,0,0.4), 0 0 20px ${p.glowColor}30`,
        willChange: 'transform, box-shadow',
      }}
      role="article"
      aria-label={`Créateur ${creator.name}`}
    >
      {/* Confirm delete overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#0d0d0f]/95 backdrop-blur-sm"
            style={{ border: `1px solid rgba(239,68,68,0.25)` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <p className="text-sm font-body font-semibold text-brutify-text-primary">
              Retirer du radar ?
            </p>
            <p className="text-xs font-body text-brutify-text-muted text-center px-6">
              {creator.name} sera retiré de ta liste de suivi.
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

      {/* ── Header banner with platform gradient ── */}
      <div className="relative h-24 overflow-hidden">
        {/* Gradient fill */}
        <div
          className="absolute inset-0 opacity-60"
          style={{ background: p.gradient }}
        />
        {/* Dark overlay to keep it readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-[#0d0d0f]" />
        {/* Radial glow center */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full opacity-30 blur-[30px]"
          style={{ background: p.glowColor }}
        />

        {/* Top-right actions */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {creator.isInWatchlist && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              whileTap={{ scale: 0.9 }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.1] text-white/30 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-400 cursor-pointer"
              aria-label="Retirer du radar"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </motion.button>
          )}
          {/* Platform badge with real brand gradient */}
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-sm border"
            style={{
              background: p.badgeBg,
              borderColor: p.borderColor,
              color: p.accentColor,
            }}
          >
            {p.icon("h-3.5 w-3.5")}
          </div>
        </div>
      </div>

      {/* ── Avatar pulled up over the banner ── */}
      <div className="relative px-5 -mt-8 z-10">
        <div
          className="relative h-16 w-16 rounded-full overflow-hidden bg-[#0d0d0f] transition-shadow duration-300 shadow-[0_0_20px_rgba(255,171,0,0.2)] group-hover:shadow-[0_0_30px_rgba(255,171,0,0.4)]"
          style={{
            padding: "2px",
            background: p.gradient,
          }}
        >
          <div className="relative h-full w-full rounded-full overflow-hidden bg-[#0d0d0f]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proxyImg(creator.avatarUrl) ?? undefined}
              alt={creator.name}
              className="absolute inset-0 w-full h-full object-cover rounded-full"
              onError={(e) => {
                const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=FFAB00&color=000&bold=true&size=128`;
                if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Identity ── */}
      <div className="px-5 pt-2.5 pb-1">
        <h3 className="font-body text-sm font-bold text-brutify-text-primary leading-tight truncate">
          {creator.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[10px] font-body font-medium truncate"
            style={{ color: p.accentColor }}
          >
            {creator.handle}
          </span>
          {creator.niche && (
            <>
              <span className="text-brutify-text-muted/30 text-[10px]">·</span>
              <span className="text-[10px] font-body text-brutify-text-muted/60 truncate">
                {creator.niche}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Metrics grid ── */}
      <div className="px-5 pb-5 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <MetricCell
            icon={<Users className="h-3 w-3" />}
            label="Followers"
            value={creator.followers}
            accentColor={p.accentColor}
            delta={creator.followersDelta}
          />
          <MetricCell
            icon={<Eye className="h-3 w-3" />}
            label="Vues moy."
            value={creator.avgViews}
            accentColor={p.accentColor}
          />
          <MetricCell
            icon={<Zap className="h-3 w-3" />}
            label="Outliers"
            value={String(creator.outlierCount)}
            accentColor={p.accentColor}
            highlight={creator.outlierCount > 0}
          />
          <MetricCell
            icon={<Star className="h-3 w-3" />}
            label="Brut Score"
            value={`${creator.bruitScore}/10`}
            accentColor={p.accentColor}
            highlight={creator.bruitScore >= 7}
            customColor={getBruitScoreColor(creator.bruitScore)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function MetricCell({
  icon,
  label,
  value,
  accentColor,
  highlight = false,
  delta,
  customColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  highlight?: boolean;
  delta?: number;
  customColor?: string;
}) {
  const hasDelta = typeof delta === "number" && delta !== 0;
  const deltaPositive = (delta ?? 0) > 0;
  const displayColor = customColor ?? (highlight ? accentColor : undefined);

  return (
    <div
      className={cn(
        "rounded-xl px-2.5 py-2 transition-colors duration-200",
        highlight
          ? "border"
          : "bg-white/[0.03] border border-white/[0.05] group-hover:border-white/[0.08]"
      )}
      style={highlight ? {
        background: customColor ? `${customColor}12` : `${accentColor}10`,
        borderColor: customColor ? `${customColor}28` : `${accentColor}25`,
      } : undefined}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color: displayColor ?? undefined }}>
        <span className={highlight ? "" : "text-brutify-text-muted"}>{icon}</span>
        <span className={cn("text-[10px] font-body", highlight ? "font-medium" : "text-brutify-text-muted")}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p
          className={cn("font-display text-base tracking-wider leading-none", highlight ? "font-bold" : "text-brutify-text-primary")}
          style={displayColor ? { color: displayColor } : undefined}
        >
          {value}
        </p>
        {hasDelta && (
          <span
            className="text-[10px] font-body font-semibold leading-none"
            style={{ color: deltaPositive ? "#4ade80" : "#f87171" }}
          >
            {deltaPositive ? "+" : ""}{delta! >= 1000 ? `${(delta! / 1000).toFixed(1)}K` : delta! <= -1000 ? `${(delta! / 1000).toFixed(1)}K` : delta}
          </span>
        )}
      </div>
    </div>
  );
}
