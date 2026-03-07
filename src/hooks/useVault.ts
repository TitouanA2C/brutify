"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useCallback, useState } from "react"
import type { Tables } from "@/lib/supabase/types"

export type VaultItem = Tables<"vault_items">

const VAULT_KEY = "/api/vault"

export function useVault(type?: string) {
  const params = new URLSearchParams()
  if (type && type !== "all") params.set("type", type)
  const key = params.toString() ? `${VAULT_KEY}?${params}` : VAULT_KEY

  const { data, error, isLoading, mutate } = useSWR<{ items: VaultItem[] }>(
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

export function useCreateVaultItem() {
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(
    async (body: {
      type: "video" | "script" | "manual"
      content: string
      source_handle?: string
      source_video_id?: string
      source_script_id?: string
      tags?: string[]
    }) => {
      setIsCreating(true)
      try {
        const res = await fetch(VAULT_KEY, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Erreur")
        globalMutate((key: string) => key.startsWith(VAULT_KEY))
        return json.item as VaultItem
      } finally {
        setIsCreating(false)
      }
    },
    []
  )

  return { create, isCreating }
}

export function useDeleteVaultItem() {
  const [isDeleting, setIsDeleting] = useState(false)

  const remove = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`${VAULT_KEY}/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur")
      globalMutate((key: string) => key.startsWith(VAULT_KEY))
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { remove, isDeleting }
}
