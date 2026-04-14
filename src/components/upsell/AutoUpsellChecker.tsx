"use client"

import { useEffect, useRef } from "react"
import { useUser } from "@/hooks/useUser"
import { useCredits } from "@/lib/credits-context"
import { useUpsell } from "@/hooks/useUpsellTrigger"
import { PLAN_FEATURES } from "@/lib/plans"

/**
 * Composant invisible qui check les conditions upsell en background.
 * Triggers couverts : credits_50_percent, power_user_detected
 * (Les autres sont declenches ponctuellement dans leurs pages respectives)
 */
export function AutoUpsellChecker() {
  const { profile } = useUser()
  const { credits, maxCredits, history } = useCredits()
  const { triggerUpsell } = useUpsell()
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!profile || checkedRef.current) return
    checkedRef.current = true

    const plan = profile.plan

    // credits_50_percent : 50% des BP consommes
    if (maxCredits > 0 && credits <= maxCredits * 0.5 && credits > 0) {
      triggerUpsell("credits_50_percent")
      return
    }

    // power_user_detected : beaucoup d'actions recentes (20+ dans l'historique)
    if (plan === "growth" && history.length >= 20) {
      const today = new Date().toDateString()
      const todayActions = history.filter(
        (h) => new Date(h.date).toDateString() === today
      )
      if (todayActions.length >= 20) {
        triggerUpsell("power_user_detected")
      }
    }
  }, [profile, credits, maxCredits, history, triggerUpsell])

  return null
}
