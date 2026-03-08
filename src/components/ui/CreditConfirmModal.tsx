"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, AlertTriangle, X, ShoppingCart } from "lucide-react";
import { Loading } from "@/components/ui/Loading";
import { Button } from "@/components/ui/Button";
import { useCredits } from "@/lib/credits-context";

interface CreditConfirmModalProps {
  open: boolean;
  cost: number;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CreditConfirmModal({
  open,
  cost,
  actionLabel,
  onConfirm,
  onCancel,
}: CreditConfirmModalProps) {
  const { credits } = useCredits();
  const router = useRouter();
  const [buyingCredits, setBuyingCredits] = useState(false);
  const canAfford = credits >= cost;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  const handleBuyCredits = async () => {
    setBuyingCredits(true);
    try {
      const res = await fetch("/api/stripe/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 }),
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
    setBuyingCredits(false);
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
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmation Brutpoints"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-t-2xl md:rounded-2xl border border-brutify-gold/20 bg-[#111113] shadow-[0_0_50px_rgba(255,171,0,0.2),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] pointer-events-none opacity-[0.06]"
              style={{
                background:
                  "radial-gradient(ellipse at center top, #FFAB00 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />

            <button
              onClick={onCancel}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border hover:border-brutify-gold/30 transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 px-6 pt-6 pb-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-brutify-gold/30 bg-brutify-gold/[0.12] mb-4 shadow-[0_0_30px_rgba(255,171,0,0.3)]">
                <CreditCard className="h-6 w-6 text-brutify-gold" />
              </div>

              <h3 className="font-display text-xl tracking-wider text-brutify-text-primary mb-1">
                CONFIRMER
              </h3>
              <p className="text-sm font-body text-brutify-text-secondary">
                {actionLabel}
              </p>

              <div className="mt-4 rounded-xl bg-black/30 border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-body text-brutify-text-muted">Coût</span>
                  <span className="font-display text-lg text-brutify-gold">
                    {cost} BP
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-brutify-text-muted">Solde actuel</span>
                  <span className="text-sm font-body font-medium text-brutify-text-primary">
                    {credits} BP
                  </span>
                </div>
                {canAfford && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-xs font-body text-brutify-text-muted">Après action</span>
                    <span className="text-sm font-body font-medium text-brutify-text-secondary">
                      {credits - cost} BP
                    </span>
                  </div>
                )}
              </div>

              {!canAfford && (
                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-brutify-danger/10 border border-brutify-danger/20 px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-brutify-danger shrink-0" />
                    <p className="text-xs font-body text-brutify-danger">
                      Brutpoints insuffisants. Il te manque{" "}
                      <span className="font-semibold">{cost - credits} BP</span>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 flex items-center gap-2 px-6 pb-6">
              {canAfford ? (
                <>
                  <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="md" className="flex-1 shadow-[0_0_40px_rgba(255,171,0,0.35)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] hover:scale-[1.02] transition-all duration-200" onClick={onConfirm}>
                    Confirmer
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="md" className="flex-1" onClick={onCancel}>
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    onClick={handleBuyCredits}
                    disabled={buyingCredits}
                  >
                    {buyingCredits ? (
                      <Loading variant="icon" size="sm" className="h-4 w-4" />
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        Acheter des Brutpoints
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
