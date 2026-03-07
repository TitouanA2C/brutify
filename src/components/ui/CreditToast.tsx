"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, X } from "lucide-react";

interface CreditToastProps {
  open: boolean;
  message: string;
  cost: number;
  remaining: number;
  onClose: () => void;
  duration?: number;
}

export function CreditToast({
  open,
  message,
  cost,
  remaining,
  onClose,
  duration = 4000,
}: CreditToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, onClose, duration]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#111113]/95 backdrop-blur-md px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brutify-gold/[0.1]">
            <CreditCard className="h-4 w-4 text-brutify-gold" />
          </div>
          <div>
            <p className="text-sm font-body font-medium text-brutify-text-primary">
              {message}
            </p>
            <p className="text-xs font-body text-brutify-text-muted">
              -{cost} BP · {remaining} BP restants
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 flex h-6 w-6 items-center justify-center rounded-lg text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors duration-200"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
