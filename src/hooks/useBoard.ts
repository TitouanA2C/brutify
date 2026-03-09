"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useCallback, useState } from "react"
import type { Tables } from "@/lib/supabase/types"

type BoardItemRow = Tables<"board_items">

export interface BoardItem extends BoardItemRow {
  scripts?: { id: string; title: string; hook_text: string | null } | null
  videos?: { id: string; title: string | null; thumbnail_url: string | null } | null
}

const BOARD_KEY = "/api/board"

export function useBoard(status?: string) {
  const params = new URLSearchParams()
  if (status && status !== "all") params.set("status", status)
  const key = params.toString() ? `${BOARD_KEY}?${params}` : BOARD_KEY

  const { data, error, isLoading, mutate } = useSWR<{ items: BoardItem[] }>(
    key,
    { revalidateOnFocus: false }
  )

  return {
    items: data?.items ?? [],
    error,
    isLoading,
    mutate,
  }
}

export function useCreateBoardItem() {
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(
    async (body: {
      title: string
      status?: string
      scheduled_date?: string
      platform?: string
      script_id?: string
      source_video_id?: string
      notes?: string
    }) => {
      setIsCreating(true)
      try {
        const res = await fetch(BOARD_KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Erreur")
        globalMutate((key: string) => key.startsWith(BOARD_KEY))
        return {
          item: json.item as BoardItem,
          bonusClaimable: json.bonusClaimable as { id: string; name: string; reward: number } | undefined,
        }
      } finally {
        setIsCreating(false)
      }
    },
    []
  )

  return { create, isCreating }
}

export function useUpdateBoardItem() {
  const [isUpdating, setIsUpdating] = useState(false)

  const update = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      setIsUpdating(true)
      try {
        const res = await fetch(`${BOARD_KEY}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Erreur")
        globalMutate((key: string) => key.startsWith(BOARD_KEY))
        return json.item as BoardItem
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  return { update, isUpdating }
}

export function useDeleteBoardItem() {
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`${BOARD_KEY}/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur")
      globalMutate((key: string) => key.startsWith(BOARD_KEY))
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { remove, isDeleting }
}
