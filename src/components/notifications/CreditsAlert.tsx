"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Zap, TrendingDown, RefreshCcw, Sparkles } from "lucide-react"
import { Loading } from "@/components/ui/Loading"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CreditsAlertProps {
  credits: number
  maxCredits: number
  plan: string
  hasActiveSubscription?: boolean
  borrowedCredits?: number
  freeTranscriptsUsed?: number
  freeTranscriptsLimit?: number
}

type AlertLevel = "warning" | "critical" | "empty"

export function CreditsAlert({ 
  credits, 
  maxCredits, 
  plan,
  hasActiveSubscription = false,
  borrowedCredits = 0,
  freeTranscriptsUsed = 0,
  freeTranscriptsLimit = 0,
}: CreditsAlertProps) {
  const [dismissed, setDismissed] = useState(false)
  const [alertLevel, setAlertLevel] = useState<AlertLevel | null>(null)
  const [borrowing, setBorrowing] = useState(false)
  const [borrowAmount, setBorrowAmount] = useState(50)
  const [borrowError, setBorrowError] = useState<string | null>(null)
  
  const maxBorrowable = Math.floor(maxCredits * 0.2)
  const availableToBorrow = Math.max(0, maxBorrowable - borrowedCredits)
  const hasFreeTranscripts = freeTranscriptsUsed < freeTranscriptsLimit
  const freeTranscriptsRemaining = Math.max(0, freeTranscriptsLimit - freeTranscriptsUsed)

  useEffect(() => {
    // Calculer le pourcentage restant
    const percentage = maxCredits > 0 ? (credits / maxCredits) * 100 : 0

    // Définir le niveau d'alerte
    if (credits === 0) {
      setAlertLevel("empty")
    } else if (percentage <= 10) {
      setAlertLevel("critical")
    } else if (percentage <= 20) {
      setAlertLevel("warning")
    } else {
      setAlertLevel(null)
    }

    // Reset dismissed state when alert level changes
    setDismissed(false)
  }, [credits, maxCredits])

  // Ne rien afficher si pas d'alerte ou si dismissed
  if (!alertLevel || dismissed) return null

  const handleBorrow = async (amount: number) => {
    setBorrowing(true)
    setBorrowError(null)

    try {
      const res = await fetch("/api/credits/borrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })

      const data = await res.json()

      if (!res.ok) {
        setBorrowError(data.error || "Erreur lors de l'emprunt")
        setBorrowing(false)
        return
      }

      // Refresh la page pour mettre à jour les crédits
      window.location.reload()
    } catch (err) {
      setBorrowError("Erreur réseau")
      setBorrowing(false)
    }
  }

  const alertConfig = {
    warning: {
      icon: TrendingDown,
      color: "orange",
      title: "Attention, tes BrutPoints baissent",
      message: `Il te reste ${credits} BP (${Math.round((credits / maxCredits) * 100)}%). Pense à recharger pour ne pas être bloqué en pleine création.`,
      cta: "Recharger maintenant",
      bgClass: "bg-orange-500/10 border-orange-500/30",
      iconClass: "text-orange-500",
      textClass: "text-orange-100",
      buttonClass: "bg-orange-500 hover:bg-orange-600 text-white",
    },
    critical: {
      icon: AlertTriangle,
      color: "red",
      title: "⚠️ BrutPoints presque épuisés !",
      message: `Plus que ${credits} BP restants ! Recharge maintenant pour continuer à forger tes scripts sans interruption.`,
      cta: "Recharger d'urgence",
      bgClass: "bg-red-500/10 border-red-500/30",
      iconClass: "text-red-500",
      textClass: "text-red-100",
      buttonClass: "bg-red-500 hover:bg-red-600 text-white",
    },
    empty: {
      icon: Zap,
      color: "red",
      title: "🚨 Plus de BrutPoints !",
      message: hasActiveSubscription && availableToBorrow > 0
        ? "Tes BP mensuels sont épuisés. Emprunte sur le mois prochain ou achète un pack."
        : "Tes BP mensuels sont épuisés. Achète un pack pour continuer.",
      cta: "Acheter des BP",
      bgClass: "bg-red-500/10 border-red-500/30",
      iconClass: "text-red-500",
      textClass: "text-red-100",
      buttonClass: "bg-red-500 hover:bg-red-600 text-white animate-pulse",
    },
  }

  const config = alertConfig[alertLevel]
  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative rounded-2xl border p-4 mb-6 shadow-[0_0_30px_rgba(0,0,0,0.3)]",
          config.bgClass
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn("shrink-0", config.iconClass)}>
            <Icon className="h-6 w-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-display text-base tracking-wide mb-1", config.textClass)}>
              {config.title}
            </h3>
            <p className="text-sm font-body text-white/70 mb-3">
              {config.message}
            </p>

            {/* Options d'action */}
            <div className="space-y-3">
              {/* Transcriptions gratuites (si disponibles) */}
              {alertLevel === "empty" && hasFreeTranscripts && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-body font-bold text-emerald-400">
                      Transcriptions gratuites disponibles
                    </span>
                  </div>
                  <p className="text-xs font-body text-white/60 mb-2">
                    {freeTranscriptsRemaining} transcription{freeTranscriptsRemaining > 1 ? 's' : ''} gratuite{freeTranscriptsRemaining > 1 ? 's' : ''} restante{freeTranscriptsRemaining > 1 ? 's' : ''} ce mois-ci.
                  </p>
                  <p className="text-[10px] font-body text-emerald-400/70">
                    💡 Pas de BP nécessaires pour les transcriptions gratuites
                  </p>
                </div>
              )}

              {/* Emprunt BP (si éligible) */}
              {alertLevel === "empty" && hasActiveSubscription && availableToBorrow > 0 && (
                <div className="rounded-xl border border-brutify-gold/20 bg-brutify-gold/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCcw className="h-4 w-4 text-brutify-gold" />
                    <span className="text-xs font-body font-bold text-brutify-gold">
                      Emprunter sur le mois prochain
                    </span>
                  </div>
                  <p className="text-xs font-body text-white/60 mb-3">
                    Jusqu'à {availableToBorrow} BP disponibles. Déduits au renouvellement.
                  </p>
                  
                  {borrowError && (
                    <p className="text-xs font-body text-red-400 mb-2">
                      {borrowError}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {[50, 100, 200].filter(amt => amt <= availableToBorrow).map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleBorrow(amt)}
                        disabled={borrowing}
                        className="flex-1 rounded-lg bg-brutify-gold/10 border border-brutify-gold/30 px-3 py-2 text-xs font-body font-bold text-brutify-gold hover:bg-brutify-gold/20 hover:border-brutify-gold/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {borrowing ? (
                          <Loading variant="icon" size="sm" className="h-3 w-3 mx-auto" />
                        ) : (
                          `${amt} BP`
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA standard */}
              <Link
                href="/settings?tab=abonnement"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-body font-bold transition-all duration-200",
                  alertLevel === "empty" && hasActiveSubscription && availableToBorrow > 0
                    ? "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                    : config.buttonClass
                )}
              >
                <Zap className="h-4 w-4" />
                {alertLevel === "empty" && hasActiveSubscription && availableToBorrow > 0
                  ? "Ou acheter un pack"
                  : config.cta}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
