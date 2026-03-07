"use client"

import { useEffect, useRef } from "react"
import { useCredits } from "@/lib/credits-context"
import { CreditsToast } from "./CreditsToast"

export function CreditsToastWrapper() {
  const { credits } = useCredits()
  const previousCreditsRef = useRef(credits)

  useEffect(() => {
    // Mettre à jour le ref après le rendu
    const previousValue = previousCreditsRef.current
    previousCreditsRef.current = credits

    // Pour le premier render, on initialise sans déclencher de toast
    if (previousValue === credits) return
  }, [credits])

  return (
    <CreditsToast
      credits={credits}
      previousCredits={previousCreditsRef.current}
    />
  )
}
