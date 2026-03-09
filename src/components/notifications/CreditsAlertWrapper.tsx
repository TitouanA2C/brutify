"use client"

import { useCredits } from "@/lib/credits-context"
import { useUser } from "@/hooks/useUser"
import { PLANS } from "@/lib/stripe/config"
import { FREE_TRANSCRIPTS_LIMITS } from "@/lib/credits-rules"
import { CreditsAlert } from "./CreditsAlert"

const maxCreditsMap: Record<string, number> = {
  creator: PLANS.creator.credits,
  growth: PLANS.growth.credits,
  scale: PLANS.scale.credits,
}

export function CreditsAlertWrapper() {
  const { profile } = useUser()
  const { credits } = useCredits()

  if (!profile) return null

  const plan = profile.plan ?? "creator"
  const maxCredits = maxCreditsMap[plan] ?? 500
  const hasActiveSubscription = !!profile.stripe_subscription_id
  const borrowedCredits = profile.borrowed_credits ?? 0
  const freeTranscriptsUsed = profile.free_transcripts_used ?? 0
  const freeTranscriptsLimit = FREE_TRANSCRIPTS_LIMITS[plan] ?? 0

  return (
    <CreditsAlert
      credits={credits}
      maxCredits={maxCredits}
      plan={plan}
      hasActiveSubscription={hasActiveSubscription}
      borrowedCredits={borrowedCredits}
      freeTranscriptsUsed={freeTranscriptsUsed}
      freeTranscriptsLimit={freeTranscriptsLimit}
    />
  )
}
