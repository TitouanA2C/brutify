"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScrapeStatus = "idle" | "step1" | "step2" | "step3" | "done" | "error";
export type SocialPlatform = "instagram" | "tiktok" | "youtube";

export interface ScrapeState {
  status: ScrapeStatus;
  result: { name?: string; followers?: number } | null;
  error: string | null;
}

export const SCRAPE_STEPS: Record<SocialPlatform, string[]> = {
  instagram: ["Connexion à Instagram", "Analyse du profil via Apify", "Ajout à ton radar"],
  tiktok:    ["Connexion à TikTok",    "Analyse du profil via Apify", "Ajout à ton radar"],
  youtube:   ["Connexion à YouTube",   "Analyse de la chaîne via Apify", "Ajout à ton radar"],
};

export const SCRAPE_ACCENT: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  tiktok:    "#69C9D0",
  youtube:   "#FF0000",
};

export function ScrapeStatusBlock({
  state,
  platform,
}: {
  state: ScrapeState;
  platform: SocialPlatform;
}) {
  const accentColor = SCRAPE_ACCENT[platform];
  const steps = SCRAPE_STEPS[platform];
  const stepKeys = ["step1", "step2", "step3"] as const;

  return (
    <AnimatePresence>
      {state.status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-12 overflow-hidden"
        >
          {state.status === "done" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-body font-semibold text-emerald-400">
                  Profil ajouté à ton radar !
                </p>
                {state.result && (
                  <p className="text-[11px] font-body text-brutify-text-muted/60 mt-0.5">
                    {state.result.name && (
                      <span className="text-brutify-text-muted">{state.result.name} · </span>
                    )}
                    {state.result.followers != null && (
                      <span>
                        {state.result.followers >= 1000
                          ? `${(state.result.followers / 1000).toFixed(0)}K`
                          : state.result.followers}{" "}
                        abonnés
                      </span>
                    )}
                    {platform === "instagram" && " — vidéos en cours de scraping en fond"}
                  </p>
                )}
              </div>
            </div>
          ) : state.status === "error" ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3">
              <X className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs font-body text-red-400">
                {state.error ?? "Erreur lors du scraping"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 space-y-2.5">
              {steps.map((label, i) => {
                const currentIdx = stepKeys.indexOf(
                  state.status as (typeof stepKeys)[number]
                );
                const isDone = currentIdx > i;
                const isActive = currentIdx === i;
                return (
                  <div key={label} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-all",
                        isDone
                          ? "bg-emerald-500/20"
                          : isActive
                          ? "bg-white/[0.08]"
                          : "bg-white/[0.04]"
                      )}
                      style={isActive ? { background: `${accentColor}20` } : undefined}
                    >
                      {isDone ? (
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      ) : isActive ? (
                        <Loader2
                          className="h-2.5 w-2.5 animate-spin"
                          style={{ color: accentColor }}
                        />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs font-body transition-colors",
                        isDone
                          ? "text-emerald-400"
                          : isActive
                          ? "text-brutify-text-primary"
                          : "text-brutify-text-muted/40"
                      )}
                    >
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
