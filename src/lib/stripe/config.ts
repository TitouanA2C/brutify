import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error("STRIPE_SECRET_KEY non configurée")
    _stripe = new Stripe(key, { typescript: true })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type PlanKey = "creator" | "growth" | "scale"

export interface PlanConfig {
  name: string
  tagline: string
  monthlyPriceId: string
  yearlyPriceId: string
  monthlyPrice: number
  yearlyPrice: number             // par mois, facturé annuellement
  yearlyTotal: number             // total facturé en une fois
  yearlyMonthlySavings: number    // économie vs mensuel
  yearlyTotalSavings: number      // économie totale/an
  credits: number                 // BP par mois
  pricePerBp: number              // €/BP au tarif mensuel
  trialDays?: number
  trialText?: string | null       // ex. "7 jours d'essai gratuit · Carte requise"
  features: string[]
  includes?: string               // ex. "Tout Creator, plus :" (LP)
  highlight?: string              // accroche conversion (ROI framing)
  popular?: boolean
  bpDiscount?: number             // % réduction sur recharges BP (-15, -25, -40)
  description?: string            // description longue (LP)
}

// ─── Stratégie pricing ────────────────────────────────────────────────────────
//
//  BP packs à l'unité  : 0.090€/BP  → ancre haute
//  Creator (mensuel)   : 0.038€/BP  → 58% moins cher que packs
//  Growth  (mensuel)   : 0.020€/BP  → 78% moins cher que packs  ← hero
//  Scale   (mensuel)   : 0.013€/BP  → 86% moins cher que packs
//
//  Annuel = 3 mois offerts sur tous les plans (save ~33%)
//  Essai gratuit Creator : quota réduit pour limiter l'abus (full 500 au 1er paiement).
// ─────────────────────────────────────────────────────────────────────────────

/** BP offerts pendant les 7 jours d'essai gratuit (au lieu du quota mensuel complet). */
export const TRIAL_CREDITS = 100

export const PLANS: Record<PlanKey, PlanConfig> = {
  creator: {
    name: "Creator",
    tagline: "Pour commencer à scaler",
    description: "Pour les créateurs qui démarrent et veulent un système clair pour ne plus jamais manquer d'idées.",
    monthlyPriceId: process.env.STRIPE_CREATOR_MONTHLY_PRICE_ID ?? "price_creator_monthly",
    yearlyPriceId:  process.env.STRIPE_CREATOR_YEARLY_PRICE_ID  ?? "price_creator_yearly",
    monthlyPrice: 19,
    yearlyPrice: 14,           // 14€/mois facturé 168€/an
    yearlyTotal: 168,
    yearlyMonthlySavings: 5,   // 19 - 14
    yearlyTotalSavings: 60,    // 228 - 168
    credits: 500,
    pricePerBp: 0.038,
    trialDays: 7,
    trialText: "7 jours offerts · Annulable à tout moment",
    features: [
      "Scripts IA illimités",
      "3 transcriptions gratuites / mois",
      "Transcription vidéo",
      "BrutBoard",
      "Dashboard créateurs complet",
      "Radar jusqu'à 10 créateurs",
      "-15% sur recharges BP",
    ],
    highlight: "Idéal pour démarrer",
    bpDiscount: 15,
  },
  growth: {
    name: "Growth",
    tagline: "Pour les créateurs sérieux",
    description: "Pour les créateurs qui veulent analyser plus, scripter plus vite et aller plus loin chaque mois.",
    monthlyPriceId: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID ?? "price_growth_monthly",
    yearlyPriceId:  process.env.STRIPE_GROWTH_YEARLY_PRICE_ID  ?? "price_growth_yearly",
    monthlyPrice: 39,
    yearlyPrice: 28,           // 28€/mois facturé 336€/an
    yearlyTotal: 336,
    yearlyMonthlySavings: 11,  // 39 - 28
    yearlyTotalSavings: 132,   // 468 - 336
    credits: 2000,
    pricePerBp: 0.020,
    features: [
      "Tout Creator inclus",
      "4x plus de Brutpoints",
      "5 transcriptions gratuites / mois",
      "Auto-transcription ≤ 2 min",
      "Analyse IA deep",
      "Analyse concurrentielle complète",
      "Inspiration IA",
      "Personnalisation du ton",
      "Radar illimité",
      "-25% sur recharges BP",
    ],
    includes: "Tout Creator, plus :",
    highlight: "Le meilleur rapport qualité / prix",
    popular: true,
    bpDiscount: 25,
  },
  scale: {
    name: "Scale",
    tagline: "Pour les équipes & agences",
    description: "Pour les équipes qui veulent travailler ensemble sur un seul compte, à grande échelle.",
    monthlyPriceId: process.env.STRIPE_SCALE_MONTHLY_PRICE_ID ?? "price_scale_monthly",
    yearlyPriceId:  process.env.STRIPE_SCALE_YEARLY_PRICE_ID  ?? "price_scale_yearly",
    monthlyPrice: 79,
    yearlyPrice: 57,           // 57€/mois facturé 684€/an
    yearlyTotal: 684,
    yearlyMonthlySavings: 22,  // 79 - 57
    yearlyTotalSavings: 264,   // 948 - 684
    credits: 3000,
    pricePerBp: 0.026,
    features: [
      "Tout Growth inclus",
      "6x plus de Brutpoints que Creator",
      "10 transcriptions gratuites / mois",
      "Auto-transcription ≤ 10 min",
      "1 analyse concurrentielle / mois offerte",
      "Multi-utilisateurs (3 seats)",
      "Export scripts & analyses",
      "Support prioritaire",
      "-40% sur recharges BP",
    ],
    includes: "Tout Growth, plus :",
    highlight: "Pour les équipes & agences",
    bpDiscount: 40,
  },
} as const

// ─── Packs BP à l'unité ───────────────────────────────────────────────────────
// Stratégie d'ancrage + boost conversion :
//  - 100/300 BP : ancrage psychologique (cher au BP)
//  - 500 BP à 25€ : nouveau sweet spot accessible (0.050€/BP)
//  - 1000 BP → 1200 BP : bonus perçu comme cadeau, meilleur deal apparent
// Tous restent + chers que Creator (0.038€/BP) → pousse vers l'abonnement

export interface CreditPack {
  amount: number
  price: number
  pricePerBp: number
  savingsVsCreator: number
  label: string
  priceId: string
  bonusBp?: number      // BP bonus offerts
  actualBp?: number     // BP réels crédités (amount + bonusBp)
  badge?: string        // badge marketing
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    amount: 100,
    price: 9,
    pricePerBp: 0.090,
    savingsVsCreator: 58,
    label: "Starter",
    priceId: process.env.STRIPE_CREDITS_100_PRICE_ID ?? "price_credits_100",
  },
  {
    amount: 300,
    price: 22,
    pricePerBp: 0.073,
    savingsVsCreator: 48,
    label: "Pratique",
    priceId: process.env.STRIPE_CREDITS_300_PRICE_ID ?? "price_credits_300",
  },
  {
    amount: 500,
    price: 25,
    pricePerBp: 0.050,
    savingsVsCreator: 24,
    label: "Quick Refill",
    badge: "POPULAIRE",
    priceId: process.env.STRIPE_CREDITS_500_PRICE_ID ?? "price_credits_500",
  },
  {
    amount: 1000,
    price: 59,
    bonusBp: 200,
    actualBp: 1200,
    pricePerBp: 0.049,    // 59€ / 1200 BP réels
    savingsVsCreator: 22,
    label: "Pro",
    badge: "+20% OFFERT",
    priceId: process.env.STRIPE_CREDITS_1000_PRICE_ID ?? "price_credits_1000",
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPlanByPriceId(priceId: string): { key: PlanKey; config: PlanConfig } | null {
  for (const [key, config] of Object.entries(PLANS)) {
    if (config.monthlyPriceId === priceId || config.yearlyPriceId === priceId) {
      return { key: key as PlanKey, config }
    }
  }
  return null
}

export function getCreditPackByPriceId(priceId: string) {
  return CREDIT_PACKS.find((p) => p.priceId === priceId) ?? null
}

/** Retourne le nombre de mois offerts pour le plan annuel vs mensuel */
export function monthsFreeAnnual(plan: PlanConfig): number {
  const yearlyEquiv = plan.yearlyPrice * 12
  const monthlyEquiv = plan.monthlyPrice * 12
  return Math.round((monthlyEquiv - yearlyEquiv) / plan.monthlyPrice)
}

// ─── Codes promo / Coupons Stripe ────────────────────────────────────────────

export interface PromoCodeConfig {
  code: string
  stripeCouponId: string
  discount: number
  description: string
}

/**
 * Mapping des codes promo Brutify vers les coupons Stripe
 * Les coupons doivent être créés dans le dashboard Stripe avec ces IDs
 */
export const PROMO_CODES: Record<string, PromoCodeConfig> = {
  CREATOR15: {
    code: "CREATOR15",
    stripeCouponId: "CREATOR15",
    discount: 15,
    description: "-15% sur le 1er mois Creator",
  },
  TRIALGROWTH30: {
    code: "TRIALGROWTH30",
    stripeCouponId: "TRIALGROWTH30",
    discount: 30,
    description: "-30% sur le 1er mois Growth",
  },
  GROWTH20: {
    code: "GROWTH20",
    stripeCouponId: "GROWTH20",
    discount: 20,
    description: "-20% sur le 1er mois Growth",
  },
  TRIAL7: {
    code: "TRIAL7",
    stripeCouponId: "TRIAL7",
    discount: 0,
    description: "7 jours d'essai gratuit",
  },
  SCALEBONUS: {
    code: "SCALEBONUS",
    stripeCouponId: "SCALEBONUS",
    discount: 0,
    description: "+1000 BP offerts le 1er mois",
  },
  /** Offre bienvenue onboarding : -40% sur le 1er mois Growth. Créer dans Stripe : percent_off=40, duration=once */
  ONBOARDING_GROWTH_40: {
    code: "ONBOARDING_GROWTH_40",
    stripeCouponId: "ONBOARDING_GROWTH_40",
    discount: 40,
    description: "-40% sur le 1er mois Growth (offre bienvenue)",
  },
}

export function getPromoCoupon(code: string): string | null {
  const promo = PROMO_CODES[code.toUpperCase()]
  return promo?.stripeCouponId ?? null
}
