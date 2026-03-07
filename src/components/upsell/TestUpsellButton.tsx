"use client"

import { useUpsell } from "./UpsellProvider"
import type { UpsellTriggerType } from "@/lib/upsell-triggers"

/**
 * Composant de test pour déclencher manuellement les upsells
 * À utiliser uniquement en dev pour tester les différents triggers
 */
export function TestUpsellButton() {
  const { triggerUpsell } = useUpsell()

  const triggers: { type: UpsellTriggerType; label: string }[] = [
    { type: "first_script_success", label: "Premier script (Trial→Creator -15%)" },
    { type: "trial_ending_soon", label: "Trial expire (Trial→Creator -15%)" },
    { type: "trial_power_user", label: "Power user trial (Trial→Growth -30%)" },
    { type: "script_streak", label: "3 scripts en 24h (Creator→Growth)" },
    { type: "first_analysis", label: "Première analyse (Creator→Growth)" },
    { type: "transcription_limit", label: "Limite transcription (Creator→Growth)" },
    { type: "radar_limit", label: "Watchlist pleine (Creator→Growth)" },
    { type: "power_user_detected", label: "Power user (Growth→Scale)" },
  ]

  // Afficher uniquement en dev
  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl border border-white/10 bg-brutify-bg/90 backdrop-blur-xl shadow-2xl max-w-xs">
      <h3 className="text-xs font-bold text-brutify-gold mb-2 uppercase tracking-wide">
        🧪 Test Upsells (Dev only)
      </h3>
      <div className="space-y-2">
        {triggers.map((trigger) => (
          <button
            key={trigger.type}
            onClick={() => triggerUpsell(trigger.type, true)}
            className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/70 hover:text-white transition-colors border border-white/5"
          >
            {trigger.label}
          </button>
        ))}
      </div>
    </div>
  )
}
