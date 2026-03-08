"use client";

import { cn } from "@/lib/utils";

type LoadingVariant = "page" | "block" | "inline" | "icon";

interface LoadingProps {
  variant?: LoadingVariant;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: "h-5 w-5 border-[2px]",
  md: "h-8 w-8 border-[2.5px]",
  lg: "h-12 w-12 border-[3px]",
};

export function Loading({ variant = "block", size = "md", label, className }: LoadingProps) {
  const isPage = variant === "page";
  const isInline = variant === "inline";
  const isIcon = variant === "icon";

  if (isInline) {
    return (
      <span
        className={cn("inline-flex items-center gap-2 text-brutify-text-muted", className)}
        role="status"
        aria-label={label ?? "Chargement"}
      >
        <span className="brutify-loading-dots flex gap-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brutify-gold" />
          <span className="h-1.5 w-1.5 rounded-full bg-brutify-gold" />
          <span className="h-1.5 w-1.5 rounded-full bg-brutify-gold" />
        </span>
        {label != null && <span className="text-xs font-body">{label}</span>}
      </span>
    );
  }

  const spinner = (
    <span
      className={cn(
        "brutify-loading-spinner inline-block rounded-full border-solid border-brutify-gold/25 border-t-brutify-gold",
        sizeMap[size],
        "animate-brutify-spin",
        "shadow-[0_0_12px_rgba(255,171,0,0.25)]",
        isIcon && className
      )}
      aria-hidden
    />
  );

  if (isIcon) {
    return (
      <span className="inline-flex shrink-0" role="status" aria-label={label ?? "Chargement"}>
        {spinner}
      </span>
    );
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {spinner}
      {label != null && (
        <span className="text-sm font-body text-brutify-text-muted">
          {label}
        </span>
      )}
    </div>
  );

  if (isPage) {
    return (
      <div
        className={cn("flex min-h-[200px] flex-col items-center justify-center py-16", className)}
        role="status"
        aria-label={label ?? "Chargement"}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center py-8", className)}
      role="status"
      aria-label={label ?? "Chargement"}
    >
      {content}
    </div>
  );
}
