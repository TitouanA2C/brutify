"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Check, 
  AlertCircle, 
  Loader2, 
  ShoppingCart, 
  Sparkles,
  Crown,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  Tag,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Configuration des codes promo
interface PromoConfig {
  code: string
  plan: PlanKey
  discount: number // pourcentage de réduction
  description: string
}

const PROMO_CONFIGS: Record<string, PromoConfig> = {
  GROWTH20: {
    code: "GROWTH20",
    plan: "growth",
    discount: 20,
    description: "-20% sur le 1er mois Growth",
  },
  CREATOR15: {
    code: "CREATOR15",
    plan: "creator",
    discount: 15,
    description: "-15% sur le 1er mois Creator",
  },
  TRIALGROWTH30: {
    code: "TRIALGROWTH30",
    plan: "growth",
    discount: 30,
    description: "-30% sur le 1er mois Growth",
  },
  TRIAL7: {
    code: "TRIAL7",
    plan: "creator",
    discount: 0, // trial gratuit géré par Stripe
    description: "7 jours d'essai gratuit",
  },
  SCALEBONUS: {
    code: "SCALEBONUS",
    plan: "scale",
    discount: 0, // bonus BP géré séparément
    description: "+1000 BP offerts le 1er mois",
  },
}

type PlanKey = "creator" | "growth" | "scale"
type Interval = "month" | "year"

interface PlanDisplay {
  key: PlanKey
  name: string
  tagline: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyTotalSavings: number
  credits: number
  highlight: string
  features: string[]
  popular?: boolean
  bpDiscount?: number
}

interface CreditPack {
  amount: number
  price: number
  priceCreator: number
  priceGrowth: number
  priceScale: number
  label: string
  pricePerBp: string
  badge?: string
  bonusBp?: number
  actualBp?: number
}

const PLANS_DISPLAY: PlanDisplay[] = [
  {
    key: "creator",
    name: "Creator",
    tagline: "Pour commencer à scaler",
    monthlyPrice: 19,
    yearlyPrice: 14,
    yearlyTotalSavings: 60,
    credits: 500,
    highlight: "~250 scripts / mois",
    bpDiscount: 15,
    features: [
      "500 Brutpoints / mois",
      "Scripts IA illimités",
      "Transcription vidéo",
      "Analyse concurrentielle",
      "BrutBoard & Banque d'idées",
      "Dashboard créateurs complet",
      "Radar jusqu'à 10 créateurs",
      "-15% sur recharges BP",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    tagline: "Pour les créateurs sérieux",
    monthlyPrice: 39,
    yearlyPrice: 28,
    yearlyTotalSavings: 132,
    credits: 2000,
    highlight: "~1 000 scripts / mois",
    popular: true,
    bpDiscount: 25,
    features: [
      "2 000 Brutpoints / mois",
      "Tout Creator inclus",
      "5 transcriptions gratuites / mois",
      "Auto-transcription ≤ 2 min",
      "Transcription vidéo (3 BP)",
      "Analyse IA deep (5 BP)",
      "Analyse concurrentielle (30 BP)",
      "Inspiration IA vault (4 BP)",
      "Radar illimité",
      "-25% sur recharges BP",
    ],
  },
  {
    key: "scale",
    name: "Scale",
    tagline: "Pour les équipes & agences",
    monthlyPrice: 79,
    yearlyPrice: 57,
    yearlyTotalSavings: 264,
    credits: 6000,
    highlight: "~3 000 scripts / mois",
    bpDiscount: 40,
    features: [
      "6 000 Brutpoints / mois",
      "Tout Growth inclus",
      "10 transcriptions gratuites / mois",
      "Auto-transcription ≤ 10 min",
      "1 analyse concurrentielle / mois offerte",
      "Multi-utilisateurs (3 seats)",
      "Export scripts & analyses",
      "Support prioritaire",
      "-40% sur recharges BP",
    ],
  },
]

const CREDIT_PACKS: CreditPack[] = [
  {
    amount: 100,
    price: 9,
    priceCreator: 8,
    priceGrowth: 7,
    priceScale: 5,
    label: "Starter",
    pricePerBp: "9.0 cts/BP",
  },
  {
    amount: 300,
    price: 22,
    priceCreator: 19,
    priceGrowth: 17,
    priceScale: 13,
    label: "Pratique",
    pricePerBp: "7.3 cts/BP",
  },
  {
    amount: 500,
    price: 25,
    priceCreator: 21,
    priceGrowth: 19,
    priceScale: 15,
    label: "Quick Refill",
    pricePerBp: "5.0 cts/BP",
    badge: "POPULAIRE",
  },
  {
    amount: 1000,
    price: 59,
    priceCreator: 50,
    priceGrowth: 44,
    priceScale: 35,
    label: "Pro",
    pricePerBp: "4.9 cts/BP",
    badge: "+20% OFFERT",
    bonusBp: 200,
    actualBp: 1200,
  },
]

interface PricingSectionProps {
  currentPlan: PlanKey
  hasActiveSub: boolean
  onPlanClick: (plan: PlanKey, interval: Interval) => void
  onBuyCredits: (amount: number) => void
  onCancelAttempt: () => void
  loadingPlan?: string | null
  loadingCredits?: number | null
  promoCode?: string | null
}

export function PricingSection({
  currentPlan,
  hasActiveSub,
  onPlanClick,
  onBuyCredits,
  onCancelAttempt,
  loadingPlan = null,
  loadingCredits = null,
  promoCode = null,
}: PricingSectionProps) {
  const [interval, setInterval] = useState<Interval>("month")
  const [activePromo, setActivePromo] = useState<PromoConfig | null>(null)
  const [showPromo, setShowPromo] = useState(false)

  // Détecter et appliquer le code promo depuis l'URL
  useEffect(() => {
    if (promoCode && PROMO_CONFIGS[promoCode]) {
      setActivePromo(PROMO_CONFIGS[promoCode])
      setShowPromo(true)
    }
  }, [promoCode])

  const planOrderMap: Record<string, number> = { 
    creator: 1, 
    growth: 2, 
    scale: 3 
  }

  // Appliquer le discount du promo sur un plan
  const getPriceWithPromo = (plan: PlanDisplay): { monthlyPrice: number; discount: number | null } => {
    if (!activePromo || activePromo.plan !== plan.key || interval !== "month") {
      return { monthlyPrice: plan.monthlyPrice, discount: null }
    }
    const discount = activePromo.discount
    const discountedPrice = plan.monthlyPrice * (1 - discount / 100)
    return { monthlyPrice: Math.round(discountedPrice), discount }
  }

  return (
    <>
      {/* Bannière promo code */}
      <AnimatePresence>
        {showPromo && activePromo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease }}
            className="mb-6"
          >
            <div className="relative rounded-2xl border border-brutify-gold/30 bg-gradient-to-r from-brutify-gold/10 to-purple-500/10 p-4 shadow-[0_0_30px_rgba(255,171,0,0.15)]">
              <button
                onClick={() => setShowPromo(false)}
                className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brutify-gold/20">
                  <Tag className="h-5 w-5 text-brutify-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-display uppercase tracking-wider text-brutify-gold">
                    Code promo actif : {activePromo.code}
                  </p>
                  <p className="text-xs font-body text-white/60 mt-0.5">
                    {activePromo.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. PLANS (PRIORITÉ MRR) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08, ease }}
        className="mb-12"
      >
        {/* Header Plans */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-2xl tracking-wider text-brutify-text-primary mb-1">
                PLANS
              </h2>
              <p className="text-sm font-body text-brutify-text-secondary">
                Facturation récurrente · Réductions exclusives · Features avancées
              </p>
            </div>
            {/* Toggle mensuel / annuel */}
            <div className="flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5">
              <button
                onClick={() => setInterval("month")}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
                  interval === "month"
                    ? "bg-brutify-gold/10 text-brutify-gold"
                    : "text-brutify-text-muted hover:text-brutify-text-primary"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setInterval("year")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
                  interval === "year"
                    ? "bg-brutify-gold/10 text-brutify-gold"
                    : "text-brutify-text-muted hover:text-brutify-text-primary"
                )}
              >
                Annuel
                <span className="rounded-full bg-green-500/20 border border-green-500/30 text-green-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  3 MOIS OFFERTS
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS_DISPLAY.map((plan, i) => {
            const promo = getPriceWithPromo(plan)
            const basePrice = interval === "year" ? plan.yearlyPrice : plan.monthlyPrice
            const price = promo.discount ? promo.monthlyPrice : basePrice
            const hasPromoDiscount = promo.discount && interval === "month"
            const isCurrentPlan = currentPlan === plan.key
            const isPopular = plan.popular

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.2, ease }}
                className="relative"
              >
                {/* Badge Recommandé */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-brutify-gold text-brutify-bg text-[9px] font-bold rounded-full px-3 py-1 uppercase tracking-wide shadow-lg whitespace-nowrap">
                      ⭐ Recommandé
                    </span>
                  </div>
                )}

                {/* Card Premium */}
                <div
                  className={cn(
                    "relative rounded-2xl border p-6 transition-all duration-300 h-full flex flex-col",
                    "bg-gradient-to-b from-[#111113] to-[#0a0a0b]",
                    isPopular && "border-brutify-gold/30 shadow-[0_0_30px_rgba(255,171,0,0.15)] hover:shadow-[0_0_40px_rgba(255,171,0,0.2)]",
                    isCurrentPlan && "border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]",
                    !isPopular && !isCurrentPlan && "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  {/* Glow */}
                  {isPopular && (
                    <div className="absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10 bg-brutify-gold" />
                  )}

                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-display text-2xl tracking-wider text-brutify-text-primary">
                        {plan.name.toUpperCase()}
                      </h3>
                      {isCurrentPlan && (
                        <Badge variant="gold">
                          <Crown className="h-3 w-3" />
                          Actuel
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] font-body text-brutify-text-muted">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Prix */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      {hasPromoDiscount && (
                        <span className="font-display text-2xl text-white/30 line-through">
                          {basePrice}
                        </span>
                      )}
                      <span className="font-display text-4xl text-brutify-gold">
                        {price}
                      </span>
                      <span className="text-sm font-body text-brutify-text-muted">€/mois</span>
                    </div>
                    {hasPromoDiscount ? (
                      <p className="text-[10px] font-body text-purple-400 mb-1 font-semibold">
                        🎉 -{promo.discount}% avec le code promo · 1er mois uniquement
                      </p>
                    ) : interval === "year" ? (
                      <p className="text-[10px] font-body text-green-400 mb-1">
                        Économise {plan.yearlyTotalSavings}€/an · Facturé {price * 12}€
                      </p>
                    ) : (
                      <p className="text-[10px] font-body text-brutify-text-muted/60">
                        ou {plan.yearlyPrice}€/mois en annuel
                      </p>
                    )}
                  </div>

                  {/* Highlight */}
                  <div className="mb-4 p-3 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20">
                    <p className="text-[11px] font-body text-brutify-gold font-semibold text-center">
                      {plan.highlight}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="mb-6 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          <div className="flex h-4 w-4 items-center justify-center rounded-md bg-brutify-gold/20">
                            <Check className="h-2.5 w-2.5 text-brutify-gold" />
                          </div>
                        </div>
                        <span className="text-[12px] font-body text-white/80">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {isCurrentPlan ? (
                    <>
                      <div className="w-full rounded-xl py-3.5 text-sm font-body font-bold bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        <span>Plan actuel</span>
                      </div>
                      {hasActiveSub && (
                        <button
                          onClick={onCancelAttempt}
                          className="mt-2 w-full text-center text-[10px] font-body text-brutify-text-muted hover:text-brutify-gold transition-colors cursor-pointer"
                        >
                          Gérer · Résilier à tout moment
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onPlanClick(plan.key, interval)}
                        disabled={loadingPlan !== null}
                        className={cn(
                          "w-full rounded-xl py-3.5 text-sm font-body font-bold transition-all duration-200",
                          "flex items-center justify-center gap-2",
                          isPopular && "bg-gold-gradient text-brutify-bg shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.4)] hover:scale-[1.02] active:scale-[0.98]",
                          !isPopular && "bg-white/[0.08] text-brutify-text-primary hover:bg-white/[0.12] hover:scale-[1.01]",
                          "disabled:opacity-50 disabled:hover:scale-100"
                        )}
                      >
                        {loadingPlan === plan.key ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Chargement...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Passer en {plan.name}</span>
                          </>
                        )}
                      </button>
                      {hasActiveSub && (planOrderMap[plan.key] ?? 0) > (planOrderMap[currentPlan] ?? 0) && (
                        <p className="mt-3 text-center text-[10px] font-body text-green-400/70">
                          Payez seulement la différence au prorata
                        </p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══ 2. BP PACKS (ANCRAGE PSYCHOLOGIQUE) ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.3, ease }}
        className="mb-10"
      >
        {/* Header BP */}
        <div className="mb-6">
          <h2 className="font-display text-xl tracking-wider text-brutify-text-primary mb-2">
            RECHARGES PONCTUELLES
          </h2>
          <p className="text-sm font-body text-brutify-text-secondary mb-3">
            Paiement unique · Crédits instantanés
          </p>
          
          {/* Ancrage selon le plan */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/[0.08] border border-green-500/20">
            <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-body text-white/90">
              <span className="text-green-400 font-semibold">Abonné {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} :</span>{" "}
              Tu bénéficies de{" "}
              <span className="text-green-400 font-semibold">
                {currentPlan === "scale" ? "-40%" : currentPlan === "growth" ? "-25%" : "-15%"}
              </span>{" "}
              sur toutes les recharges !
            </p>
          </div>
        </div>

        {/* Grid BP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKS.map((pack, i) => {
            const displayAmount = pack.actualBp ?? pack.amount
            const hasBonus = pack.bonusBp && pack.bonusBp > 0
            const isPopular = pack.badge === "POPULAIRE"
            const isBestDeal = pack.badge === "+20% OFFERT"
            
            // Calculer le prix avec réduction abonné
            const basePrice = pack.price
            let userPrice = basePrice
            let discount: string | null = null
            
            if (currentPlan === "scale") {
              userPrice = pack.priceScale
              discount = "-40%"
            } else if (currentPlan === "growth") {
              userPrice = pack.priceGrowth
              discount = "-25%"
            } else if (currentPlan === "creator") {
              userPrice = pack.priceCreator
              discount = "-15%"
            }

            return (
              <motion.div
                key={pack.amount}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.2, ease }}
                className="relative"
              >
                {/* Badge */}
                {pack.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className={cn(
                      "text-[9px] font-bold rounded-full px-3 py-1 uppercase tracking-wide shadow-lg whitespace-nowrap",
                      isPopular && "bg-brutify-gold text-brutify-bg",
                      isBestDeal && "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                    )}>
                      {pack.badge}
                    </span>
                  </div>
                )}

                {/* Card */}
                <div
                  className={cn(
                    "relative rounded-2xl border p-5 transition-all duration-300 h-full flex flex-col",
                    "bg-gradient-to-b from-[#111113] to-[#0a0a0b]",
                    isPopular && "border-brutify-gold/30 shadow-[0_0_30px_rgba(255,171,0,0.15)] hover:shadow-[0_0_40px_rgba(255,171,0,0.2)]",
                    isBestDeal && "border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)] hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]",
                    !pack.badge && "border-white/[0.06] hover:border-white/[0.12]"
                  )}
                >
                  {/* Glow */}
                  {(isPopular || isBestDeal) && (
                    <div className={cn(
                      "absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10",
                      isPopular && "bg-brutify-gold",
                      isBestDeal && "bg-green-500"
                    )} />
                  )}

                  {/* BP amount */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-display text-3xl tracking-wider text-brutify-text-primary">
                        {displayAmount}
                      </span>
                      <span className="text-xs font-body text-brutify-text-muted">BP</span>
                    </div>
                    {hasBonus && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-1 w-1 rounded-full bg-green-400" />
                        <p className="text-[10px] font-bold text-green-400">
                          +{pack.bonusBp} BP offerts
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="mb-4 flex-1">
                    <div className="flex items-baseline gap-1 mb-1">
                      {discount && (
                        <span className="text-lg font-display text-white/40 line-through mr-1">
                          {basePrice}€
                        </span>
                      )}
                      <span className="font-display text-2xl text-brutify-gold">
                        {userPrice}
                      </span>
                      <span className="text-xs font-body text-brutify-text-muted">€</span>
                      {discount && (
                        <span className="ml-1 text-[10px] font-bold text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">
                          {discount}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-body text-brutify-text-muted">
                      {pack.pricePerBp}
                      {discount && <span className="text-green-400 ml-1">(abonné)</span>}
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => onBuyCredits(pack.amount)}
                    disabled={loadingCredits !== null}
                    className={cn(
                      "w-full rounded-xl py-2.5 text-xs font-body font-bold transition-all duration-200",
                      "flex items-center justify-center gap-2",
                      isPopular && "bg-gold-gradient text-brutify-bg shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.4)] hover:scale-[1.02]",
                      isBestDeal && "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-[1.02]",
                      !pack.badge && "bg-white/[0.06] text-brutify-text-primary hover:bg-white/[0.1] hover:scale-[1.01]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    {loadingCredits === pack.amount ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Acheter</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer sécurité */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-body text-brutify-text-muted/50">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-[#635BFF] flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">S</span>
            </div>
            <span>Paiement sécurisé Stripe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-400" />
            <span>Crédits instantanés</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-green-400" />
            <span>Pas d'engagement</span>
          </div>
        </div>
      </motion.div>
    </>
  )
}
