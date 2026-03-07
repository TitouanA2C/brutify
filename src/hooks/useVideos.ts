"use client"

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import type { VideoFeedItemDTO, VideoDetailResponseDTO } from "@/lib/api/helpers"

interface VideoFeedResponse {
  videos: VideoFeedItemDTO[]
  page: number
  limit: number
  total: number
  totalPages: number
}

interface VideoFeedParams {
  creator_id?: string
  period?: number
  min_outlier?: number
  platform?: string
  sort?: string
  page?: number
  limit?: number
}

export function useVideos(params: VideoFeedParams = {}) {
  const sp = new URLSearchParams()
  if (params.creator_id) sp.set("creator_id", params.creator_id)
  if (params.period !== undefined) sp.set("period", String(params.period))
  if (params.min_outlier && params.min_outlier > 0) sp.set("min_outlier", String(params.min_outlier))
  if (params.platform) sp.set("platform", params.platform)
  if (params.sort) sp.set("sort", params.sort)
  if (params.page) sp.set("page", String(params.page))
  if (params.limit) sp.set("limit", String(params.limit))

  const qs = sp.toString()
  const url = `/api/videos${qs ? `?${qs}` : ""}`

  const { data, error, isLoading, mutate } = useSWR<VideoFeedResponse>(
    url,
    { revalidateOnFocus: false, dedupingInterval: 2000 }
  )

  return {
    videos: data?.videos ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    page: data?.page ?? 1,
    isLoading,
    error,
    mutate,
  }
}

export function useVideoDetail(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<VideoDetailResponseDTO>(
    id ? `/api/videos/${id}` : null,
    { revalidateOnFocus: false }
  )

  return {
    video: data?.video ?? null,
    creator: data?.creator ?? null,
    transcription: data?.transcription ?? null,
    analysis: data?.analysis ?? null,
    isLoading,
    error,
    mutate,
  }
}

async function postAction(url: string) {
  const res = await fetch(url, { method: "POST" })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export function useTranscribe(videoId: string | null) {
  const { trigger, isMutating, data, error, reset } = useSWRMutation(
    videoId ? `/api/videos/${videoId}/transcribe` : null,
    (url: string) => postAction(url)
  )

  return {
    transcribe: trigger,
    isTranscribing: isMutating,
    result: data ?? null,
    error,
    reset,
  }
}

export function useAnalyze(videoId: string | null) {
  const { trigger, isMutating, data, error, reset } = useSWRMutation(
    videoId ? `/api/videos/${videoId}/analyze` : null,
    (url: string) => postAction(url)
  )

  return {
    analyze: trigger,
    isAnalyzing: isMutating,
    result: data ?? null,
    error,
    reset,
  }
}
