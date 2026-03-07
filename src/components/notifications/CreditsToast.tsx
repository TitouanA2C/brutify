"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Zap, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CreditsToastProps {
  credits: number
  previousCredits: number
}

export function CreditsToast({ credits, previousCredits }: CreditsToastProps) {
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<"warning" | "critical" | "empty" | null>(null)

  useEffect(() => {
    // Détecter les seuils critiques franchis à la baisse
    if (previousCredits > 0 && credits === 0) {
      // Passage à 0 BP
      setToastType("empty")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 8000) // 8 secondes
    } else if (previousCredits > 10 && credits <= 10 && credits > 0) {
      // Passage sous 10 BP (critique)
      setToastType("critical")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 6000) // 6 secondes
    } else if (previousCredits > 20 && credits <= 20 && credits > 10) {
      // Passage sous 20 BP (warning)
      setToastType("warning")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000) // 5 secondes
    }
  }, [credits, previousCredits])

  if (!showToast || !toastType) return null

  const toastConfig = {
    warning: {
      icon: AlertTriangle,
      title: "Attention aux BrutPoints",
      message: `Plus que ${credits} BP ! Pense à recharger bientôt.`,
      bgClass: "bg-gradient-to-r from-orange-500/90 to-orange-600/90",
      iconClass: "text-white",
    },
    critical: {
      icon: AlertTriangle,
      title: "BrutPoints presque épuisés !",
      message: `Plus que ${credits} BP ! Recharge maintenant.`,
      bgClass: "bg-gradient-to-r from-red-500/90 to-red-600/90",
      iconClass: "text-white",
    },
    empty: {
      icon: Zap,
      title: "Plus de BrutPoints !",
      message: "Recharge maintenant pour continuer à créer.",
      bgClass: "bg-gradient-to-r from-red-600/90 to-red-700/90",
      iconClass: "text-white animate-pulse",
    },
  }

  const config = toastConfig[toastType]
  const Icon = config.icon

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className={cn(
            "rounded-2xl border border-white/20 p-4 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl",
            config.bgClass
          )}>
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={cn("shrink-0", config.iconClass)}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-display text-sm tracking-wide text-white font-bold mb-0.5">
                  {config.title}
                </h4>
                <p className="text-xs font-body text-white/90 mb-2">
                  {config.message}
                </p>
                <Link
                  href="/settings?tab=abonnement"
                  className="inline-flex items-center gap-1.5 text-xs font-body font-bold text-white hover:text-white/80 transition-colors underline underline-offset-2"
                >
                  Recharger maintenant →
                </Link>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowToast(false)}
                className="shrink-0 text-white/60 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
