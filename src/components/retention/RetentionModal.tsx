"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Pause, TrendingDown, Heart, Zap, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RetentionModalProps {
  currentPlan: "creator" | "growth" | "scale"
  monthlyPrice: number
  onClose: () => void
  onAcceptOffer: (offerType: "discount" | "pause" | "downgrade") => void
  onConfirmCancel: () => void
}

export function RetentionModal({
  currentPlan,
  monthlyPrice,
  onClose,
  onAcceptOffer,
  onConfirmCancel,
}: RetentionModalProps) {
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  const planNames = {
    creator: "Creator",
    growth: "Growth",
    scale: "Scale",
  }

  const discountedPrice = Math.round(monthlyPrice * 0.7 * 100) / 100 // -30%
  const savings = monthlyPrice - discountedPrice

  const offers = [
    {
      id: "discount",
      icon: Heart,
      iconColor: "text-pink-500",
      bgColor: "from-pink-500/10 to-pink-600/10",
      borderColor: "border-pink-500/30",
      glowColor: "bg-pink-500",
      title: "-30% pendant 3 mois",
      subtitle: `${discountedPrice}€/mois au lieu de ${monthlyPrice}€`,
      savings: `Économise ${savings}€/mois`,
      features: [
        "Garde toutes tes features",
        "Garde tous tes créateurs et scripts",
        "Retour au tarif normal après 3 mois",
        `Économie totale : ${Math.round(savings * 3)}€`,
      ],
      cta: "Accepter -30%",
      badge: "MEILLEURE OFFRE",
    },
    {
      id: "pause",
      icon: Pause,
      iconColor: "text-blue-500",
      bgColor: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-500/30",
      glowColor: "bg-blue-500",
      title: "Pause de 2 mois",
      subtitle: "Garde ton plan sans payer",
      savings: `Économise ${monthlyPrice * 2}€`,
      features: [
        "Accès suspendu pendant 2 mois",
        "Garde toutes tes données",
        "Réactivation automatique après",
        "0€ pendant la pause",
      ],
      cta: "Mettre en pause",
      badge: null,
    },
    ...(currentPlan !== "creator" ? [{
      id: "downgrade",
      icon: TrendingDown,
      iconColor: "text-orange-500",
      bgColor: "from-orange-500/10 to-orange-600/10",
      borderColor: "border-orange-500/30",
      glowColor: "bg-orange-500",
      title: "Passer en Creator",
      subtitle: "Réduis tes coûts",
      savings: currentPlan === "scale" 
        ? `Économise ${monthlyPrice - 19}€/mois` 
        : `Économise ${monthlyPrice - 19}€/mois`,
      features: [
        "500 BP / mois",
        "Scripts IA illimités",
        "Garde tes données et watchlist",
        "Upgrade à tout moment",
      ],
      cta: "Downgrade vers Creator",
      badge: null,
    }] : []),
  ]

  const handleSelectOffer = (offerId: string) => {
    setSelectedOffer(offerId)
    setConfirming(true)
  }

  const handleConfirmOffer = () => {
    if (!selectedOffer) return
    onAcceptOffer(selectedOffer as "discount" | "pause" | "downgrade")
  }

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50"
        />

        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl pointer-events-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="relative rounded-3xl border border-brutify-gold/20 bg-gradient-to-b from-[#1a1a1c] to-[#0f0f10] shadow-[0_0_50px_rgba(255,171,0,0.25),0_20px_80px_rgba(0,0,0,0.8)] p-8 md:p-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border-brutify-gold/30 transition-all duration-200"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>

              {!confirming ? (
                /* ═══ ÉTAPE 1 : OFFRES DE RÉTENTION ═══ */
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-xs font-bold uppercase tracking-wide text-red-400">
                        Avant de partir...
                      </span>
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl tracking-wider text-white mb-3">
                      On ne veut pas te perdre 💔
                    </h2>
                    <p className="text-base font-body text-white/70 max-w-xl mx-auto">
                      Tu es sur le point d'annuler {planNames[currentPlan]}. Choisis l'option qui te convient le mieux :
                    </p>
                  </div>

                  {/* Offres */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {offers.map((offer, i) => {
                      const Icon = offer.icon
                      return (
                        <motion.div
                          key={offer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.1 }}
                          className="relative"
                        >
                          {offer.badge && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                              <span className="bg-pink-500 text-white text-[9px] font-bold rounded-full px-3 py-1 uppercase tracking-wide shadow-lg whitespace-nowrap">
                                {offer.badge}
                              </span>
                            </div>
                          )}

                          <div
                            className={cn(
                              "relative rounded-2xl border p-5 h-full flex flex-col",
                              `bg-gradient-to-b ${offer.bgColor}`,
                              offer.borderColor,
                              offer.id === "discount" && "shadow-[0_0_30px_rgba(236,72,153,0.2)]"
                            )}
                          >
                            {/* Glow */}
                            {offer.id === "discount" && (
                              <div className={cn("absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10", offer.glowColor)} />
                            )}

                            {/* Header */}
                            <div className="mb-4">
                              <div className={cn("inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3", offer.iconColor, `bg-current/10`)}>
                                <Icon className={cn("h-5 w-5", offer.iconColor)} />
                              </div>
                              <h3 className="font-display text-xl tracking-wide text-white mb-1">
                                {offer.title}
                              </h3>
                              <p className="text-xs font-body text-white/70 mb-1">
                                {offer.subtitle}
                              </p>
                              <p className={cn("text-[11px] font-bold", offer.iconColor)}>
                                {offer.savings}
                              </p>
                            </div>

                            {/* Features */}
                            <div className="mb-5 flex-1 space-y-2">
                              {offer.features.map((feature) => (
                                <div key={feature} className="flex items-start gap-2">
                                  <Check className="h-3 w-3 text-green-400 shrink-0 mt-0.5" />
                                  <span className="text-[11px] font-body text-white/70">
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* CTA */}
                            <button
                              onClick={() => handleSelectOffer(offer.id)}
                              className={cn(
                                "w-full rounded-xl py-3 text-sm font-body font-bold transition-all duration-200",
                                "flex items-center justify-center gap-2",
                                offer.id === "discount" && "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.3),0_0_40px_rgba(236,72,153,0.1)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4),0_0_50px_rgba(236,72,153,0.15)] hover:scale-[1.02]",
                                offer.id === "pause" && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:scale-[1.01]",
                                offer.id === "downgrade" && "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 hover:scale-[1.01]"
                              )}
                            >
                              {offer.cta}
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Cancel button */}
                  <div className="text-center space-y-2">
                    <button
                      onClick={onConfirmCancel}
                      className="text-sm font-body text-red-400/70 hover:text-red-400 transition-colors underline underline-offset-2"
                    >
                      Non, je veux vraiment annuler
                    </button>
                    <p className="text-[10px] font-body text-white/40">
                      Tu perdras l'accès à toutes les features premium
                    </p>
                  </div>
                </>
              ) : (
                /* ═══ ÉTAPE 2 : CONFIRMATION ═══ */
                <>
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-500/10 border border-green-500/30 mb-4">
                      <Check className="h-8 w-8 text-green-400" />
                    </div>
                    <h2 className="font-display text-2xl tracking-wider text-white mb-2">
                      Offre activée !
                    </h2>
                    <p className="text-sm font-body text-white/70">
                      Ton offre spéciale de rétention a été appliquée. Tu continues à profiter de Brutify.
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmOffer}
                    className="w-full rounded-xl py-4 px-6 text-base font-body font-bold bg-gold-gradient text-brutify-bg shadow-[0_0_30px_rgba(255,171,0,0.4),0_0_60px_rgba(255,171,0,0.15)] hover:shadow-[0_0_50px_rgba(255,171,0,0.6),0_0_80px_rgba(255,171,0,0.2)] hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Zap className="h-5 w-5" />
                    C'est compris !
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>
  )
}
