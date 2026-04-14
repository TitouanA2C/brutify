/**
 * Système de déclenchement d'upsells intelligents
 * Basé sur les quick wins et les moments clés de l'utilisateur
 */

export type UpsellTriggerType =
  | "first_script_success"      // Premier script généré avec succès
  | "script_streak"              // 3 scripts en moins de 24h
  | "first_analysis"             // Première analyse IA (feature payante découverte)
  | "transcription_limit"        // Essai de transcrire sans accès (Creator only)
  | "radar_limit"                // Limite de 10 créateurs atteinte (Creator)
  | "credits_50_percent"         // 50% des BP consommés en moins de 7 jours (user actif)
  | "multi_feature_use"          // Utilisé 3+ features différentes en 1 session
  | "creator_list_full"          // Watchlist pleine, voudrait en ajouter plus
  | "power_user_detected"        // 20+ actions en 1 journée
  | "trial_ending_soon"          // Trial se termine dans <24h (trial→creator ou growth)
  | "trial_power_user"           // Utilisateur très actif en trial (trial→growth direct)

export type UpsellOfferType = 
  | "free_to_creator_trial"      // Free → Creator (7j gratuits)
  | "trial_to_creator_15"        // Trial → Creator payant (-15% first month)
  | "trial_to_growth_30"         // Trial → Growth (-30% first month)
  | "creator_to_growth_20"       // Creator → Growth (-20% first month)
  | "growth_to_scale_bonus"      // Growth → Scale (+1000 BP bonus)
  | "any_annual_save"            // Mensuel → Annuel (3 mois offerts)

export interface UpsellTrigger {
  type: UpsellTriggerType
  title: string
  description: string
  eligiblePlans: string[]        // Plans pouvant voir cette offre
  targetPlan: string             // Plan vers lequel upsell
  offer: UpsellOfferType
  priority: number               // 1-10 (10 = max urgence)
  cooldown: number               // Temps min entre 2 affichages (ms)
}

export const UPSELL_TRIGGERS: Record<UpsellTriggerType, UpsellTrigger> = {
  first_script_success: {
    type: "first_script_success",
    title: "🎉 Ton premier script forgé !",
    description: "Tu viens de débloquer le potentiel de Brutify. Continue ton élan et passe au plan payant.",
    eligiblePlans: ["creator"],
    targetPlan: "creator", // trial→creator par défaut
    offer: "trial_to_creator_15",
    priority: 9,
    cooldown: 24 * 60 * 60 * 1000, // 24h
  },
  
  script_streak: {
    type: "script_streak",
    title: "🔥 Tu es en feu !",
    description: "3 scripts en 24h ! Passe à Growth pour 2000 BP/mois et scale ton contenu.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 8,
    cooldown: 7 * 24 * 60 * 60 * 1000, // 7 jours
  },

  first_analysis: {
    type: "first_analysis",
    title: "💎 Tu veux débloquer l'analyse IA ?",
    description: "Cette feature est dispo sur Growth. Upgrade maintenant avec -20% sur le 1er mois.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 7,
    cooldown: 3 * 24 * 60 * 60 * 1000, // 3 jours
  },

  transcription_limit: {
    type: "transcription_limit",
    title: "🎤 Besoin de transcriptions ?",
    description: "Growth débloque les transcriptions IA + analyse deep. Essaie maintenant avec -20%.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 8,
    cooldown: 3 * 24 * 60 * 60 * 1000,
  },

  radar_limit: {
    type: "radar_limit",
    title: "📡 Watchlist pleine !",
    description: "Tu suis déjà 10 créateurs. Growth débloque un radar illimité + features avancées.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 7,
    cooldown: 5 * 24 * 60 * 60 * 1000,
  },

  credits_50_percent: {
    type: "credits_50_percent",
    title: "⚡ Tu carbures !",
    description: "50% de tes BP déjà utilisés. Passe au plan supérieur pour ne jamais manquer de crédit.",
    eligiblePlans: ["creator", "growth"],
    targetPlan: "growth", // ou scale si déjà growth
    offer: "creator_to_growth_20",
    priority: 6,
    cooldown: 14 * 24 * 60 * 60 * 1000,
  },

  multi_feature_use: {
    type: "multi_feature_use",
    title: "🚀 Tu explores tout Brutify !",
    description: "Tu utilises déjà 3+ features. Growth débloque TOUT : transcription, analyse, radar illimité.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 7,
    cooldown: 7 * 24 * 60 * 60 * 1000,
  },

  creator_list_full: {
    type: "creator_list_full",
    title: "📈 Watchlist saturée",
    description: "Tu veux suivre plus de créateurs ? Growth = radar illimité + 2000 BP/mois.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "creator_to_growth_20",
    priority: 8,
    cooldown: 5 * 24 * 60 * 60 * 1000,
  },

  power_user_detected: {
    type: "power_user_detected",
    title: "⚡ Power user détecté !",
    description: "20+ actions aujourd'hui ! Scale débloque multi-users + 3000 BP/mois. -25% sur le 1er mois.",
    eligiblePlans: ["growth"],
    targetPlan: "scale",
    offer: "growth_to_scale_bonus",
    priority: 9,
    cooldown: 14 * 24 * 60 * 60 * 1000,
  },

  trial_ending_soon: {
    type: "trial_ending_soon",
    title: "⏰ Ton essai se termine bientôt !",
    description: "Ne perds pas ton flow. Continue sur Creator avec -15% sur ton 1er mois.",
    eligiblePlans: ["creator"],
    targetPlan: "creator",
    offer: "trial_to_creator_15",
    priority: 10, // Haute priorité
    cooldown: 3 * 24 * 60 * 60 * 1000,
  },

  trial_power_user: {
    type: "trial_power_user",
    title: "🚀 Tu utilises déjà Brutify comme un pro !",
    description: "Passe direct à Growth avec -30% et débloquer toutes les features avancées.",
    eligiblePlans: ["creator"],
    targetPlan: "growth",
    offer: "trial_to_growth_30",
    priority: 9,
    cooldown: 5 * 24 * 60 * 60 * 1000,
  },
}

/**
 * Détermine si un trigger peut être affiché maintenant
 */
export function canShowTrigger(
  triggerType: UpsellTriggerType,
  userPlan: string,
  lastShown: number | null
): boolean {
  const trigger = UPSELL_TRIGGERS[triggerType]
  
  // Vérifier l'éligibilité du plan
  if (!trigger.eligiblePlans.includes(userPlan)) {
    return false
  }

  // Vérifier le cooldown
  if (lastShown) {
    const timeSinceLastShown = Date.now() - lastShown
    if (timeSinceLastShown < trigger.cooldown) {
      return false
    }
  }

  return true
}

/**
 * Récupère le trigger le plus prioritaire pour l'utilisateur
 */
export function getHighestPriorityTrigger(
  eligibleTriggers: UpsellTriggerType[],
  userPlan: string,
  shownHistory: Record<UpsellTriggerType, number | null>
): UpsellTrigger | null {
  const availableTriggers = eligibleTriggers
    .filter(type => canShowTrigger(type, userPlan, shownHistory[type]))
    .map(type => UPSELL_TRIGGERS[type])
    .sort((a, b) => b.priority - a.priority)

  return availableTriggers[0] ?? null
}
