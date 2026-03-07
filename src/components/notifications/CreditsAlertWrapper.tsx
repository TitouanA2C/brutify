"use client"

import { useCredits } from "@/lib/credits-context"
import { useUser } from "@/hooks/useUser"
import { CreditsAlert } from "./CreditsAlert"
import { FREE_TRANSCRIPTS_LIMITS } from "@/lib/credits-rules"

const maxCreditsMap: Record<string, number> = {
  creator: 500,
  growth: 2000,
  scale: 6000,
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
