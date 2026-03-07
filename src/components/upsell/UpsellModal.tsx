"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Zap, TrendingUp, Check, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type { UpsellTrigger, UpsellOfferType } from "@/lib/upsell-triggers"

interface UpsellModalProps {
  trigger: UpsellTrigger
  onClose: () => void
  onAccept: () => void
}

interface OfferDetails {
  badge: string
  badgeColor: string
  headline: string
  subheadline: string
  discount: string
  features: string[]
  cta: string
  urgency: string
  priceOld?: string
  priceNew: string
  planName: string
  promoCode: string // Code promo pour la page pricing
}

const OFFER_CONFIGS: Record<UpsellOfferType, OfferDetails> = {
  free_to_creator_trial: {
    badge: "OFFRE SPÉCIALE",
    badgeColor: "from-brutify-gold to-yellow-500",
    headline: "7 jours gratuits sur Creator",
    subheadline: "500 BP/mois · Scripts illimités · BrutBoard complet",
    discount: "100% OFFERT",
    features: [
      "500 BrutPoints par mois",
      "Scripts IA illimités",
      "Transcription vidéo",
      "Analyse concurrentielle",
      "BrutBoard & Banque d'idées",
      "Dashboard créateurs complet",
      "Radar jusqu'à 10 créateurs",
    ],
    cta: "Démarrer l'essai gratuit",
    urgency: "Sans carte bancaire · Annulation automatique",
    priceNew: "0€",
    planName: "Creator",
    promoCode: "TRIAL7",
  },

  trial_to_creator_15: {
    badge: "OFFRE DE LANCEMENT",
    badgeColor: "from-brutify-gold to-yellow-500",
    headline: "-15% sur ton 1er mois Creator",
    subheadline: "Continue ton aventure · Pas de pause dans ton flow",
    discount: "-15%",
    features: [
      "500 BrutPoints par mois",
      "Scripts IA illimités",
      "Transcription vidéo",
      "Analyse concurrentielle",
      "BrutBoard & Banque d'idées",
      "Dashboard créateurs complet",
      "Radar jusqu'à 10 créateurs",
    ],
    cta: "Continuer sur Creator",
    urgency: "Offre réservée aux utilisateurs en essai",
    priceOld: "19€",
    priceNew: "16€",
    planName: "Creator",
    promoCode: "CREATOR15",
  },

  trial_to_growth_30: {
    badge: "OFFRE EXCLUSIVE TRIAL",
    badgeColor: "from-purple-500 to-pink-500",
    headline: "-30% sur ton 1er mois Growth",
    subheadline: "Scale direct · Débloquer toutes les features avancées",
    discount: "-30%",
    features: [
      "2 000 BrutPoints par mois",
      "Tout Creator inclus",
      "Transcription vidéo IA",
      "Analyse deep IA",
      "Analyse concurrentielle",
      "Inspiration vault IA",
      "Radar créateurs illimité",
    ],
    cta: "Passer à Growth maintenant",
    urgency: "Offre unique pour ton premier upgrade",
    priceOld: "39€",
    priceNew: "27€",
    planName: "Growth",
    promoCode: "TRIALGROWTH30",
  },

  creator_to_growth_20: {
    badge: "ONE-TIME OFFER",
    badgeColor: "from-purple-500 to-pink-500",
    headline: "-20% sur ton 1er mois Growth",
    subheadline: "2000 BP/mois · Transcription · Analyse IA · Radar illimité",
    discount: "-20%",
    features: [
      "2 000 BrutPoints par mois",
      "Tout Creator inclus",
      "Transcription vidéo IA",
      "Analyse deep IA",
      "Analyse concurrentielle",
      "Inspiration vault IA",
      "Radar créateurs illimité",
      "Personnalisation ton & style",
    ],
    cta: "Upgrader maintenant",
    urgency: "Offre valable uniquement maintenant",
    priceOld: "39€",
    priceNew: "31€",
    planName: "Growth",
    promoCode: "GROWTH20",
  },

  growth_to_scale_bonus: {
    badge: "POWER USER",
    badgeColor: "from-green-500 to-emerald-600",
    headline: "+1000 BP OFFERTS · Scale",
    subheadline: "7000 BP le 1er mois · Multi-users · Export · Support prioritaire",
    discount: "+1000 BP",
    features: [
      "6 000 BrutPoints par mois",
      "+ 1 000 BP bonus (1er mois)",
      "Tout Growth inclus",
      "Multi-utilisateurs (3 seats)",
      "Export scripts & analyses",
      "Support prioritaire",
      "API access (bientôt)",
    ],
    cta: "Passer à Scale",
    urgency: "Bonus one-time pour power users",
    priceOld: "79€",
    priceNew: "79€",
    planName: "Scale",
    promoCode: "SCALEBONUS",
  },

  any_annual_save: {
    badge: "MEILLEURE OFFRE",
    badgeColor: "from-brutify-gold to-orange-500",
    headline: "3 MOIS OFFERTS en annuel",
    subheadline: "Économise jusqu'à 264€/an · Même plan, meilleur prix",
    discount: "3 MOIS OFFERTS",
    features: [
      "Même plan que maintenant",
      "3 mois offerts (33% d'économie)",
      "Facturé annuellement",
      "Résiliation à tout moment",
      "Toutes les features incluses",
    ],
    cta: "Passer en annuel",
    urgency: "Économise dès aujourd'hui",
    priceNew: "Voir pricing",
    planName: "Annuel",
    promoCode: "ANNUAL",
  },
}

export function UpsellModal({ trigger, onClose, onAccept }: UpsellModalProps) {
  const [isClosing, setIsClosing] = useState(false)
  const offer = OFFER_CONFIGS[trigger.offer]

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 200)
  }

  const handleAccept = () => {
    onAccept()
    handleClose()
  }

  return (
    <AnimatePresence>
      {!isClosing && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: 20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl pointer-events-auto"
            >
              <div className="relative rounded-3xl border border-brutify-gold/20 bg-gradient-to-b from-[#1a1a1c] to-[#0f0f10] shadow-[0_0_50px_rgba(255,171,0,0.25),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brutify-gold/10 via-transparent to-purple-500/10 pointer-events-none" />
                
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 z-[100] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] hover:border-brutify-gold/30 transition-all duration-200 cursor-pointer"
                  aria-label="Fermer"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="relative z-[1] p-8 md:p-10">
                  {/* Badge */}
                  <div className="flex justify-center mb-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-lg",
                      `bg-gradient-to-r ${offer.badgeColor}`
                    )}>
                      <Sparkles className="h-3 w-3" />
                      {offer.badge}
                    </div>
                  </div>

                  {/* Trigger context */}
                  <div className="text-center mb-6">
                    <p className="text-sm font-body text-brutify-gold mb-2">
                      {trigger.title}
                    </p>
                    <h2 className="font-display text-3xl md:text-4xl tracking-wider text-white mb-3">
                      {offer.headline}
                    </h2>
                    <p className="text-base font-body text-white/70">
                      {offer.subheadline}
                    </p>
                  </div>

                  {/* Prix */}
                  <div className="flex items-center justify-center gap-3 mb-8">
                    {offer.priceOld && (
                      <span className="text-2xl font-display text-white/40 line-through">
                        {offer.priceOld}
                      </span>
                    )}
                    <span className="text-5xl font-display text-brutify-gold">
                      {offer.priceNew}
                    </span>
                    {offer.priceOld && (
                      <div className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold text-white",
                        `bg-gradient-to-r ${offer.badgeColor}`
                      )}>
                        {offer.discount}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {offer.features.map((feature, i) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-start gap-2"
                      >
                        <div className="shrink-0 mt-0.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-brutify-gold/20">
                            <Check className="h-3 w-3 text-brutify-gold" />
                          </div>
                        </div>
                        <span className="text-sm font-body text-white/80">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="space-y-3">
                    <Link
                      href={`/settings?tab=abonnement&promo=${offer.promoCode}`}
                      onClick={handleAccept}
                      className={cn(
                        "group relative w-full rounded-2xl py-4 px-6 text-base font-body font-bold text-white transition-all duration-200",
                        "flex items-center justify-center gap-2",
                        "bg-gradient-to-r from-brutify-gold to-yellow-500",
                        "shadow-[0_0_40px_rgba(255,171,0,0.5),0_0_80px_rgba(255,171,0,0.2)]",
                        "hover:shadow-[0_0_60px_rgba(255,171,0,0.7),0_0_100px_rgba(255,171,0,0.3)]",
                        "hover:scale-[1.03] active:scale-[0.98]"
                      )}
                    >
                      <span>{offer.cta}</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 text-sm font-body text-white/50 hover:text-white/80 transition-colors"
                    >
                      Peut-être plus tard
                    </button>
                  </div>

                  {/* Urgence / Sécurité */}
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs font-body text-white/50">
                    <Clock className="h-3 w-3" />
                    <span>{offer.urgency}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
