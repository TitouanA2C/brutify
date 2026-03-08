"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  requiredPlan: string;
}

const planLabels: Record<string, string> = {
  growth: "Growth",
  scale: "Scale",
  creator: "Creator",
};

const featureLabels: Record<string, string> = {
  canTranscribe: "Transcription vidéo",
  canAnalyze: "Analyse IA",
  canCustomizeTone: "Personnalisation du ton",
  canExport: "Export",
};

export function UpgradeModal({
  open,
  onClose,
  feature,
  requiredPlan,
}: UpgradeModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: requiredPlan, interval: "month" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push("/settings");
      }
    } catch {
      router.push("/settings");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center px-0 md:px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Upgrade nécessaire"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-t-2xl md:rounded-2xl border border-brutify-gold/20 bg-[#111113] shadow-[0_0_50px_rgba(255,171,0,0.25),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] pointer-events-none opacity-[0.08]"
              style={{
                background:
                  "radial-gradient(ellipse at center top, #FFAB00 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />

            <button
              onClick={onClose}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border hover:border-brutify-gold/30 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 px-6 pt-6 pb-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brutify-gold/30 bg-brutify-gold/[0.12] mb-4 shadow-[0_0_30px_rgba(255,171,0,0.3)]">
                <Zap className="h-6 w-6 text-brutify-gold" />
              </div>

              <h3 className="font-display text-xl tracking-wider text-brutify-text-primary mb-1">
                UPGRADE TON PLAN
              </h3>
              <p className="text-sm font-body text-brutify-text-secondary">
                <span className="text-brutify-gold font-medium">
                  {featureLabels[feature] ?? feature}
                </span>{" "}
                est disponible a partir du plan{" "}
                <span className="text-brutify-gold font-medium">
                  {planLabels[requiredPlan] ?? requiredPlan}
                </span>
              </p>

              <div className="mt-4 rounded-xl bg-black/30 border border-white/[0.06] p-4">
                <p className="text-xs font-body text-brutify-text-muted mb-2">
                  Le plan {planLabels[requiredPlan] ?? requiredPlan} inclut :
                </p>
                <ul className="text-left text-xs font-body text-brutify-text-secondary space-y-1.5">
                  {requiredPlan === "growth" && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Analyse video IA avancee
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Transcription automatique
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Personnalisation du ton
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        800 Brutpoints / mois
                      </li>
                    </>
                  )}
                  {requiredPlan === "scale" && (
                    <>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Tout Growth inclus
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Multi-utilisateurs (3)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        Export complet
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-brutify-gold" />
                        2500 Brutpoints / mois
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 px-6 pb-6">
              <Button variant="ghost" size="md" className="flex-1" onClick={onClose}>
                Plus tard
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 shadow-[0_0_40px_rgba(255,171,0,0.35)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] hover:scale-[1.02] transition-all duration-200"
                onClick={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <Loading variant="icon" size="sm" className="h-4 w-4" />
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Upgrade
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
