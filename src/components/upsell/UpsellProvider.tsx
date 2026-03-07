"use client"

import { createContext, useContext, ReactNode } from "react"
import { useUpsellTrigger } from "@/hooks/useUpsellTrigger"
import { UpsellModal } from "./UpsellModal"
import type { UpsellTriggerType } from "@/lib/upsell-triggers"

interface UpsellContextValue {
  triggerUpsell: (triggerType: UpsellTriggerType, force?: boolean) => void
}

const UpsellContext = createContext<UpsellContextValue | null>(null)

export function UpsellProvider({ children }: { children: ReactNode }) {
  const { currentTrigger, triggerUpsell, closeUpsell, acceptUpsell } = useUpsellTrigger()

  return (
    <UpsellContext.Provider value={{ triggerUpsell }}>
      {children}
      
      {/* Modal d'upsell global */}
      {currentTrigger && (
        <UpsellModal
          trigger={currentTrigger}
          onClose={closeUpsell}
          onAccept={acceptUpsell}
        />
      )}
    </UpsellContext.Provider>
  )
}

/**
 * Hook pour déclencher des upsells depuis n'importe où dans l'app
 */
export function useUpsell() {
  const context = useContext(UpsellContext)
  if (!context) {
    throw new Error("useUpsell must be used within UpsellProvider")
  }
  return context
}
