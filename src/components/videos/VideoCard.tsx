"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import {
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
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Video, Creator } from "@/lib/types";

function proxyImg(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

interface VideoCardProps {
  video: Video;
  creator: Creator | undefined;
  onClick: (video: Video) => void;
}

function OutlierBadge({ score }: { score: number }) {
  if (score >= 10) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brutify-gold-dark/20 via-brutify-gold/20 to-brutify-gold-light/10 border border-brutify-gold/30 px-2.5 py-1 text-xs font-body font-bold shadow-[0_0_20px_rgba(255,171,0,0.06)]">
        <Flame className="h-3.5 w-3.5 text-brutify-gold-light" />
        <span className="text-gold-gradient">{score}x</span>
      </span>
    );
  }
  if (score >= 5) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20 px-2.5 py-1 text-xs font-body font-bold">
        <Zap className="h-3.5 w-3.5 text-brutify-gold" />
        <span className="text-brutify-gold">{score}x</span>
      </span>
    );
  }
  return <Badge variant="neutral">{score}x</Badge>;
}

export function VideoCard({ video, creator, onClick }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const proxiedThumbnail = proxyImg(video.thumbnailUrl);
  const showThumbnail = !!proxiedThumbnail && !imgError;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onClick(video)}
      className="group relative flex gap-4 rounded-2xl border border-brutify-gold/15 bg-[#111113]/60 backdrop-blur-xl p-4 cursor-pointer shadow-[0_6px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(255,171,0,0.15)] transition-all duration-200 hover:border-brutify-gold/25 hover:shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_40px_rgba(255,171,0,0.3)] hover:-translate-y-1.5 hover:scale-[1.01]"
      style={{ willChange: 'transform, box-shadow' }}
    >
      {/* Gold glow permanent + stronger on hover */}
      <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.12] blur-[80px] transition-opacity duration-500 group-hover:opacity-[0.3] pointer-events-none" 
           style={{ background: '#FFAB00' }} />
      {/* Thumbnail */}
      <div
        className="relative shrink-0 w-[100px] h-[140px] rounded-2xl overflow-hidden ring-1 ring-white/[0.04] group-hover:ring-white/[0.08] transition-all"
        style={{ backgroundColor: video.thumbnailColor + "18" }}
      >
        {showThumbnail ? (
          <Image
            src={proxiedThumbnail!}
            alt=""
            fill
            className="object-cover"
            sizes="100px"
            unoptimized
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(180deg, transparent 40%, ${video.thumbnailColor}60 100%)`,
            }}
          />
        )}
        {/* Play button with enhanced hover */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/[0.08] group-hover:bg-black/60 group-hover:border-white/[0.15] group-hover:scale-110 transition-all duration-200"
            style={{ willChange: 'transform' }}
          >
            <Play
              className="h-4 w-4 ml-0.5"
              style={{ color: showThumbnail ? "#fff" : video.thumbnailColor }}
            />
          </div>
        </div>
        {/* Duration badge with glow */}
        <div className="absolute bottom-2 right-2 rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <span className="text-[10px] font-body font-semibold text-white">
            {video.duration}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Creator + date + outlier badge */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {creator && (
              <>
                <div className="relative h-5 w-5 rounded-full overflow-hidden shrink-0 border border-white/[0.06]">
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.name}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
                <span className="text-xs font-body text-brutify-text-muted truncate">
                  {creator.handle}
                </span>
              </>
            )}
            <span className="text-[10px] font-body text-brutify-text-muted shrink-0">
              {video.date}
            </span>
          </div>
          <OutlierBadge score={video.outlierScore} />
        </div>

        {/* Title */}
        <h3 className="font-body text-[15px] font-semibold text-brutify-text-primary leading-snug mb-2 line-clamp-2">
          {video.title}
        </h3>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <MetricPill icon={<Eye className="h-3 w-3" />} value={video.views} />
          <MetricPill
            icon={<Heart className="h-3 w-3" />}
            value={video.likes}
          />
          <MetricPill
            icon={<MessageCircle className="h-3 w-3" />}
            value={video.comments}
          />
          <MetricPill
            icon={<Share2 className="h-3 w-3" />}
            value={video.shares}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold-gradient px-3 py-2 text-[11px] font-body font-semibold text-brutify-bg transition-all duration-150 hover:shadow-[0_0_20px_rgba(255,171,0,0.15)] hover:scale-102 active:scale-98 cursor-pointer"
            style={{ willChange: 'transform' }}
          >
            <ScrollText className="h-3 w-3" />
            Forger un script
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-body font-medium text-brutify-text-secondary transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-brutify-text-primary hover:scale-102 active:scale-98 cursor-pointer"
            style={{ willChange: 'transform' }}
          >
            <Bookmark className="h-3 w-3" />
            Vault
          </button>
          {video.hasTranscript && (
            <button
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] font-body font-medium text-brutify-text-secondary transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04] hover:text-brutify-text-primary hover:scale-102 active:scale-98 cursor-pointer"
              style={{ willChange: 'transform' }}
            >
              <FileText className="h-3 w-3" />
              Transcript
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MetricPill({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[11px] font-body text-brutify-text-muted">
      {icon}
      {value}
    </span>
  );
}
