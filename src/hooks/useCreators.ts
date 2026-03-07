"use client"

import useSWR, { useSWRConfig } from "swr"
import { useCallback } from "react"
import type { CreatorDTO, VideoDTO } from "@/lib/api/helpers"

// ─── Niches ──────────────────────────────────────────────────────────────────

export interface NicheDTO {
  id: string
  slug: string
  label: string
  hashtags_broad: string[]
  hashtags_niche: string[]
  hashtags_fr: string[]
  is_builtin: boolean
  created_by: string | null
}

interface NichesResponse {
  niches: NicheDTO[]
}

export function useNiches() {
  const { mutate: globalMutate } = useSWRConfig()
  const { data, error, isLoading, mutate } = useSWR<NichesResponse>("/api/niches", {
    revalidateOnFocus: false,
  })

  const createNiche = useCallback(
    async (payload: {
      label: string
      hashtags_broad: string[]
      hashtags_niche: string[]
      hashtags_fr: string[]
    }) => {
      const res = await fetch("/api/niches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Erreur création niche")
      await mutate()
      return json.niche as NicheDTO
    },
    [mutate]
  )

  return {
    niches: data?.niches ?? [],
    isLoading,
    error,
    mutate,
    createNiche,
  }
}

interface SearchResponse {
  creators: CreatorDTO[]
  canScrape: boolean
  canSearch: boolean
  query: string
}

export interface InstagramSearchProfile {
  username: string
  fullName: string | null
  bio: string | null
  followersCount: number
  profilePicUrl: string | null
  verified: boolean
}

interface InstagramSearchResponse {
  profiles: InstagramSearchProfile[]
  query: string
}

export function useCreatorSearch(params: {
  q?: string
  platform?: string
  niche?: string
}) {
  const sp = new URLSearchParams()
  if (params.q) sp.set("q", params.q)
  if (params.platform) sp.set("platform", params.platform)
  if (params.niche) sp.set("niche", params.niche)
  const qs = sp.toString()

  const hasParams = qs.length > 0
  const { data, error, isLoading, mutate } = useSWR<SearchResponse>(
    hasParams ? `/api/creators/search?${qs}` : null,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  return {
    creators: data?.creators ?? [],
    canScrape: data?.canScrape ?? false,
    canSearch: data?.canSearch ?? false,
    isLoading,
    error,
    mutate,
  }
}

export function useInstagramSearch(keyword: string | null) {
  const { data, error, isLoading } = useSWR<InstagramSearchResponse>(
    keyword && keyword.length >= 2
      ? `/api/scraping/instagram/search?q=${encodeURIComponent(keyword)}`
      : null,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  )

  return {
    profiles: data?.profiles ?? [],
    isLoading,
    error,
  }
}

interface CreatorDetailResponse {
  creator: CreatorDTO
  videos: VideoDTO[]
}

export function useCreatorDetail(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<CreatorDetailResponse>(
    id ? `/api/creators/${id}` : null,
    { revalidateOnFocus: false }
  )

  return {
    creator: data?.creator ?? null,
    videos: data?.videos ?? [],
    isLoading,
    error,
    mutate,
  }
}

export interface DiscoveredCreator {
  username: string
  fullName: string | null
  bio: string | null
  followersCount: number
  postsCount: number
  profilePicUrl: string | null
  verified: boolean
  engagementRate: number
}

interface DiscoverResponse {
  creators: DiscoveredCreator[]
  niche: string
  lang: string
  count: number
}

export interface DiscoverParams {
  niche: string
  platform: "instagram" | "tiktok"
  lang: "fr" | "all"
  minFollowers: number
  scanId: number  // incrémenté à chaque clic → force un nouveau fetch Apify
}

export function useDiscoverCreators(params: DiscoverParams | null) {
  const key = params
    ? `/api/scraping/instagram/discover?niche=${params.niche}&platform=${params.platform}&lang=${params.lang}&minFollowers=${params.minFollowers}&_sid=${params.scanId}`
    : null

  const { data, error, isLoading } = useSWR<DiscoverResponse>(key, {
    revalidateOnFocus: false,
    dedupingInterval: 0, // pas de cache : chaque scan lance un vrai appel Apify
  })

  return {
    creators: data?.creators ?? [],
    isLoading,
    error,
  }
}

interface SuggestionsResponse {
  creators: CreatorDTO[]
}

export function useCreatorSuggestions(niche: string | null) {
  const { data, error, isLoading } = useSWR<SuggestionsResponse>(
    niche ? `/api/creators/suggestions?niche=${encodeURIComponent(niche)}` : null,
    { revalidateOnFocus: false }
  )

  return {
    creators: data?.creators ?? [],
    isLoading,
    error,
  }
}
