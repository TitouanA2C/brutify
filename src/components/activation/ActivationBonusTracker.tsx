"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Loader2, Gift, Sparkles, Users, Video, PenTool, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"

interface Bonus {
  id: string
  name: string
  description: string
  reward: number
  unlocked: boolean
}

interface BonusState {
  bonuses: Bonus[]
  totalEarned: number
  totalPossible: number
  inTrial: boolean
}

const BONUS_ICONS: Record<string, any> = {
  follow_creators: Users,
  scrape_videos: Video,
  generate_script: PenTool,
  add_to_board: LayoutGrid,
  early_upgrade: Sparkles,
}

export function ActivationBonusTracker() {
  const { profile } = useUser()
  const [bonusState, setBonusState] = useState<BonusState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastUnlocked, setLastUnlocked] = useState<Bonus | null>(null)

  useEffect(() => {
    fetchBonusState()
  }, [profile])

  async function fetchBonusState() {
    try {
      const res = await fetch("/api/activation/bonus")
      if (!res.ok) return
      
      const data = await res.json()
      setBonusState(data)
    } catch (err) {
      console.error("Failed to fetch bonus state:", err)
    } finally {
      setLoading(false)
    }
  }

  async function unlockBonus(bonusId: string) {
    try {
      const res = await fetch("/api/activation/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusId }),
      })

      if (res.ok) {
        const data = await res.json()
        setLastUnlocked(data.bonus)
        setShowCelebration(true)
        
        setTimeout(() => {
          setShowCelebration(false)
          window.location.reload()
        }, 3000)
      }
    } catch (err) {
      console.error("Failed to unlock bonus:", err)
    }
  }

  // Ne pas afficher si pas en période d'essai
  if (!bonusState?.inTrial || loading) return null

  const progress = bonusState.totalPossible > 0
    ? (bonusState.totalEarned / bonusState.totalPossible) * 100
    : 0

  const unlockedCount = bonusState.bonuses.filter(b => b.unlocked).length
  const totalCount = bonusState.bonuses.length

  return (
    <>
      {/* Celebration modal */}
      <AnimatePresence>
        {showCelebration && lastUnlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative rounded-3xl border border-brutify-gold/30 bg-gradient-to-br from-brutify-gold/10 to-brutify-gold/5 p-8 max-w-md mx-4 text-center shadow-[0_0_50px_rgba(255,171,0,0.3)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brutify-gold/20 border-2 border-brutify-gold/50 mb-4"
              >
                <Gift className="h-8 w-8 text-brutify-gold" />
              </motion.div>
              
              <h3 className="font-display text-2xl text-white mb-2">
                Bonus débloqué ! 🎉
              </h3>
              
              <p className="font-body text-sm text-white/70 mb-4">
                {lastUnlocked.name}
              </p>
              
              <div className="inline-flex items-center gap-2 rounded-xl bg-brutify-gold/20 border border-brutify-gold/40 px-6 py-3">
                <Sparkles className="h-5 w-5 text-brutify-gold" />
                <span className="font-display text-2xl text-brutify-gold">
                  +{lastUnlocked.reward} BP
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracker card */}
      <div className="rounded-2xl border border-brutify-gold/20 bg-gradient-to-br from-brutify-gold/5 to-transparent p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-brutify-gold" />
            <h3 className="font-display text-sm uppercase tracking-wider text-white">
              Bonus d'activation
            </h3>
          </div>
          <span className="text-xs font-body text-brutify-gold">
            {unlockedCount}/{totalCount}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04] mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-brutify-gold-dark via-brutify-gold to-[#FFD700] shadow-[0_0_10px_rgba(255,171,0,0.5)]"
          />
        </div>

        {/* Bonus list */}
        <div className="space-y-2">
          {bonusState.bonuses.map((bonus) => {
            const Icon = BONUS_ICONS[bonus.id] || Gift
            return (
              <div
                key={bonus.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg p-2 transition-all",
                  bonus.unlocked
                    ? "bg-brutify-gold/10 border border-brutify-gold/30"
                    : "bg-white/[0.02] border border-white/[0.06]"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    bonus.unlocked
                      ? "bg-brutify-gold/20 text-brutify-gold"
                      : "bg-white/[0.04] text-white/40"
                  )}
                >
                  {bonus.unlocked ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-body font-semibold",
                    bonus.unlocked ? "text-white" : "text-white/60"
                  )}>
                    {bonus.description}
                  </p>
                </div>
                
                <span className={cn(
                  "text-xs font-display font-bold",
                  bonus.unlocked ? "text-brutify-gold" : "text-white/40"
                )}>
                  +{bonus.reward}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-body">
            <span className="text-white/60">Total gagné</span>
            <span className="font-bold text-brutify-gold">
              {bonusState.totalEarned} BP
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
