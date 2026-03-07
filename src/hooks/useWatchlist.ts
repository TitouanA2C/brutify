"use client"

import useSWR from "swr"
import { useCallback, useMemo } from "react"
import type { CreatorDTO } from "@/lib/api/helpers"

interface WatchlistResponse {
  creators: CreatorDTO[]
}

export function useWatchlist() {
  const { data, error, isLoading, mutate } = useSWR<WatchlistResponse>(
    "/api/watchlist",
    { revalidateOnFocus: true }
  )

  const watchlistIds = useMemo(
    () => new Set(data?.creators?.map((c) => c.id) ?? []),
    [data?.creators]
  )

  const addToWatchlist = useCallback(
    async (creatorId: string) => {
      // Optimistic update : ajoute un placeholder pour que watchlistIds se mette à jour immédiatement
      mutate(
        (prev) => {
          if (!prev) return prev
          const already = prev.creators.some((c) => c.id === creatorId)
          if (already) return prev
          // Placeholder minimal — les données réelles arriveront au revalidate
          return {
            creators: [...prev.creators, { id: creatorId } as CreatorDTO],
          }
        },
        { revalidate: false }
      )
      try {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creator_id: creatorId }),
        })
      } finally {
        mutate()
      }
    },
    [mutate]
  )

  const removeFromWatchlist = useCallback(
    async (creatorId: string) => {
      mutate(
        (prev) => {
          if (!prev) return prev
          return {
            creators: prev.creators.filter((c) => c.id !== creatorId),
          }
        },
        { revalidate: false }
      )

      await fetch(`/api/watchlist/${creatorId}`, { method: "DELETE" })

      mutate()
    },
    [mutate]
  )

  const toggleWatchlist = useCallback(
    async (creatorId: string) => {
      if (watchlistIds.has(creatorId)) {
        await removeFromWatchlist(creatorId)
      } else {
        await addToWatchlist(creatorId)
      }
    },
    [watchlistIds, addToWatchlist, removeFromWatchlist]
  )

  const isInWatchlist = useCallback(
    (creatorId: string) => watchlistIds.has(creatorId),
    [watchlistIds]
  )

  return {
    creators: data?.creators ?? [],
    watchlistIds,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isLoading,
    error,
    mutate,
  }
}
