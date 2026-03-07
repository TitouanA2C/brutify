"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/hooks/useUser"
import type { UpsellTriggerType, UpsellTrigger } from "@/lib/upsell-triggers"
import { UPSELL_TRIGGERS, canShowTrigger } from "@/lib/upsell-triggers"

/**
 * Hook pour déclencher et gérer les modals d'upsell
 */
export function useUpsellTrigger() {
  const { profile } = useUser()
  const [currentTrigger, setCurrentTrigger] = useState<UpsellTrigger | null>(null)
  const [shownHistory, setShownHistory] = useState<Record<UpsellTriggerType, number | null>>(() => {
    // Charger l'historique depuis localStorage
    if (typeof window === "undefined") return {} as Record<UpsellTriggerType, number | null>
    
    try {
      const stored = localStorage.getItem("brutify_upsell_history")
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  // Sauvegarder l'historique dans localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("brutify_upsell_history", JSON.stringify(shownHistory))
    } catch {
      // Ignore storage errors
    }
  }, [shownHistory])

  /**
   * Déclencher un upsell manuellement
   */
  const triggerUpsell = useCallback((triggerType: UpsellTriggerType, force = false) => {
    if (!profile) return

    const trigger = UPSELL_TRIGGERS[triggerType]
    const userPlan = profile.plan ?? "creator"
    const lastShown = shownHistory[triggerType] ?? null

    // En mode force (dev/test), bypasser les vérifications
    if (!force) {
      // Vérifier l'éligibilité
      if (!canShowTrigger(triggerType, userPlan, lastShown)) {
        console.log(`[Upsell] Trigger ${triggerType} not eligible for plan ${userPlan}`)
        return
      }

      // Ne montrer qu'un seul upsell à la fois
      if (currentTrigger) {
        console.log(`[Upsell] Already showing a trigger, skipping`)
        return
      }
    } else {
      // En mode force, fermer l'upsell actuel s'il y en a un
      if (currentTrigger) {
        console.log(`[Upsell] Force mode: closing current trigger`)
      }
    }

    console.log(`[Upsell] Showing trigger: ${triggerType}${force ? ' (forced)' : ''}`)
    setCurrentTrigger(trigger)
    
    // Enregistrer qu'on a montré ce trigger (sauf en mode force)
    if (!force) {
      setShownHistory(prev => ({
        ...prev,
        [triggerType]: Date.now(),
      }))
    }
  }, [profile, shownHistory, currentTrigger])

  /**
   * Fermer l'upsell actuel
   */
  const closeUpsell = useCallback(() => {
    setCurrentTrigger(null)
  }, [])

  /**
   * L'utilisateur a accepté l'upsell (tracking)
   */
  const acceptUpsell = useCallback(() => {
    if (currentTrigger) {
      console.log(`[Upsell] User accepted: ${currentTrigger.type}`)
      // TODO: Track conversion dans la DB ou analytics
    }
    setCurrentTrigger(null)
  }, [currentTrigger])

  return {
    currentTrigger,
    triggerUpsell,
    closeUpsell,
    acceptUpsell,
  }
}

// Export alias pour compatibilité
export { useUpsellTrigger as useUpsell }
