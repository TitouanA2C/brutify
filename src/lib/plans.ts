export interface PlanFeatures {
  canGenerateScript: boolean
  canTranscribe: boolean
  canAnalyze: boolean
  canFullAnalysis: boolean
  canCustomizeTone: boolean
  canExport: boolean
  canInspireVault: boolean
  autoTranscribeMaxDuration: number  // en secondes, 0 = désactivé
  freeFullAnalyses: number           // analyses concurrentielles gratuites/mois
  maxCreators: number                // -1 = illimité
  maxCredits: number
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  creator: {
    canGenerateScript: true,
    canTranscribe:     true,
    canAnalyze:        false,
    canFullAnalysis:   false,
    canCustomizeTone:  false,
    canExport:         false,
    canInspireVault:   false,
    autoTranscribeMaxDuration: 0,
    freeFullAnalyses:  0,
    maxCreators:       10,
    maxCredits:        500,
  },
  growth: {
    canGenerateScript: true,
    canTranscribe:     true,
    canAnalyze:        true,
    canFullAnalysis:   true,
    canCustomizeTone:  true,
    canExport:         false,
    canInspireVault:   true,
    autoTranscribeMaxDuration: 120,
    freeFullAnalyses:  0,
    maxCreators:       -1,
    maxCredits:        2000,
  },
  scale: {
    canGenerateScript: true,
    canTranscribe:     true,
    canAnalyze:        true,
    canFullAnalysis:   true,
    canCustomizeTone:  true,
    canExport:         true,
    canInspireVault:   true,
    autoTranscribeMaxDuration: 600,
    freeFullAnalyses:  1,
    maxCreators:       -1,
    maxCredits:        3000,
  },
}

export function canUseFeature(
  plan: string,
  feature: keyof Omit<PlanFeatures, "maxCredits" | "maxCreators">
): boolean {
  return PLAN_FEATURES[plan]?.[feature] ?? false
}

export function getMinPlanForFeature(
  feature: keyof Omit<PlanFeatures, "maxCredits" | "maxCreators">
): string {
  const order = ["creator", "growth", "scale"]
  for (const plan of order) {
    if (PLAN_FEATURES[plan]?.[feature]) return plan
  }
  return "scale"
}

export function getMaxCreditsForPlan(plan: string): number {
  return PLAN_FEATURES[plan]?.maxCredits ?? 500
}
