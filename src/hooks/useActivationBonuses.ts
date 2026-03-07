import { useEffect, useState } from "react"
import { useUser } from "./useUser"

interface ActivationBonus {
  id: string
  name: string
  description: string
  reward: number
  unlocked: boolean
}

interface ActivationBonusState {
  bonuses: ActivationBonus[]
  totalEarned: number
  totalPossible: number
  inTrial: boolean
}

/**
 * Hook pour gérer les bonus d'activation
 * Auto-check les conditions et débloquer les bonus
 */
export function useActivationBonuses() {
  const { profile } = useUser()
  const [state, setState] = useState<ActivationBonusState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return

    fetchState()
  }, [profile])

  async function fetchState() {
    try {
      const res = await fetch("/api/activation/bonus")
      if (!res.ok) return

      const data = await res.json()
      setState(data)
    } catch (err) {
      console.error("[useActivationBonuses] Failed to fetch:", err)
    } finally {
      setLoading(false)
    }
  }

  async function unlockBonus(bonusId: string): Promise<boolean> {
    try {
      const res = await fetch("/api/activation/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusId }),
      })

      if (res.ok) {
        await fetchState()
        return true
      }
      
      return false
    } catch (err) {
      console.error("[useActivationBonuses] Failed to unlock:", err)
      return false
    }
  }

  return {
    state,
    loading,
    unlockBonus,
    refresh: fetchState,
  }
}
