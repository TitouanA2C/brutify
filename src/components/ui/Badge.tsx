"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "gold" | "success" | "danger" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-brutify-gold/[0.12] text-brutify-gold border border-brutify-gold/30 shadow-[0_0_15px_rgba(255,171,0,0.2)] animate-pulse",
  success: "bg-brutify-success/15 text-brutify-success border border-brutify-success/20",
  danger: "bg-brutify-danger/15 text-brutify-danger border border-brutify-danger/20",
  neutral: "bg-white/[0.03] text-brutify-text-secondary border border-white/[0.06]",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-body font-medium transition-transform duration-200 hover:scale-105",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
