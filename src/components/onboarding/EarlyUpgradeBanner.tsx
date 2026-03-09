"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Clock, Zap, X } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { isInTrialPeriod, isBonusUnlocked } from "@/lib/credits-rules"

/**
 * Banner pour promouvoir le bonus d'upgrade anticipé (+300 BP)
 * Visible uniquement pendant les 7 premiers jours ET si pas déjà upgrader
 */
export function EarlyUpgradeBanner() {
  const { profile } = useUser()
  const [dismissed, setDismissed] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("")

  useEffect(() => {
    if (!profile?.created_at) return

    const createdAt = new Date(profile.created_at).getTime()
    const trialEnd = createdAt + 7 * 24 * 60 * 60 * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remaining = trialEnd - now

      if (remaining <= 0) {
        setTimeRemaining("")
        return
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const days = Math.floor(hours / 24)

      if (days > 1) {
        setTimeRemaining(`${days} jours`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h`)
      } else {
        setTimeRemaining("< 1h")
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [profile])

  if (!profile) return null

  // Ne pas afficher si :
  // - Pas en période d'essai
  // - A déjà un abonnement actif
  // - A déjà débloqué le bonus
  // - Banner dismissed
  const inTrial = isInTrialPeriod(profile.created_at || new Date().toISOString(), 7)
  const hasSubscription = !!profile.stripe_subscription_id
  const bonusUnlocked = isBonusUnlocked(profile.activation_bonuses, "early_upgrade")

  if (!inTrial || hasSubscription || bonusUnlocked || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative mb-6 rounded-2xl border border-brutify-gold/30 bg-gradient-to-r from-brutify-gold/10 via-brutify-gold/5 to-transparent p-4 shadow-[0_0_30px_rgba(255,171,0,0.15)]"
      >
        {/* Glow effect (ne doit pas bloquer les clics) */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-brutify-gold/5 to-transparent blur-xl" />

        {/* Close button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 z-10 rounded p-1 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brutify-gold/20 border border-brutify-gold/40">
            <Sparkles className="h-6 w-6 text-brutify-gold" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-base text-white">
                🎁 Bonus d'upgrade anticipé
              </h3>
              {timeRemaining && (
                <div className="inline-flex items-center gap-1 rounded-full bg-brutify-gold/20 border border-brutify-gold/40 px-2 py-0.5">
                  <Clock className="h-3 w-3 text-brutify-gold" />
                  <span className="text-[10px] font-body font-bold text-brutify-gold">
                    {timeRemaining}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm font-body text-white/70 mb-3">
              Upgrade maintenant pendant ton essai et reçois <strong className="text-brutify-gold">300 BP bonus</strong> instantanément.
            </p>

            <Link
              href="/settings?tab=abonnement"
              className="inline-flex items-center gap-2 rounded-xl bg-brutify-gold hover:bg-brutify-gold-light px-4 py-2 text-sm font-body font-bold text-black transition-all hover:scale-105"
            >
              <Zap className="h-4 w-4" />
              Débloquer le bonus
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
