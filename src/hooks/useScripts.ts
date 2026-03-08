import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"

// ─── List all scripts ────────────────────────────────────────────────────────

export function useScripts() {
  const { data, error, isLoading, mutate } = useSWR("/api/scripts")

  return {
    scripts: (data?.scripts ?? []) as ScriptRow[],
    isLoading,
    error,
    mutate,
  }
}

// ─── Single script ───────────────────────────────────────────────────────────

export function useScriptDetail(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/scripts/${id}` : null
  )

  return {
    script: (data?.script ?? null) as ScriptRow | null,
    isLoading,
    error,
    mutate,
  }
}

// ─── Update script ───────────────────────────────────────────────────────────

export function useUpdateScript() {
  const [isUpdating, setIsUpdating] = useState(false)

  const update = useCallback(
    async (id: string, fields: Partial<ScriptRow>) => {
      setIsUpdating(true)
      try {
        const res = await fetch(`/api/scripts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Erreur de mise à jour")
        return data.script as ScriptRow
      } finally {
        setIsUpdating(false)
      }
    },
    []
  )

  return { update, isUpdating }
}

// ─── Delete script ───────────────────────────────────────────────────────────

export function useDeleteScript() {
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteScript = useCallback(async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur de suppression")
      return true
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return { deleteScript, isDeleting }
}

// ─── Generate script with streaming ──────────────────────────────────────────

export interface GenerateScriptParams {
  subject: string
  initial_draft?: string
  hook_type: string
  structure_type: string
  tone?: string
  niche?: string
  angle?: string
  source_video_id?: string
}

interface StreamDelta {
  type: "delta"
  text: string
}

interface StreamDone {
  type: "done"
  script: ScriptRow
  sections: { hook: string; body: string; cta: string; ai_notes: string }
  credits_consumed: number
}

interface StreamError {
  type: "error"
  error: string
}

type StreamEvent = StreamDelta | StreamDone | StreamError

export function useGenerateScript() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamedText, setStreamedText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (
      params: GenerateScriptParams,
      onDelta?: (text: string, full: string) => void,
      onDone?: (result: StreamDone) => void,
      onError?: (error: string, status?: number, data?: Record<string, unknown>) => void
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsGenerating(true)
      setStreamedText("")
      setError(null)

      let fullText = ""

      try {
        const res = await fetch("/api/scripts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errData = await res.json()
          const msg = errData.error ?? "Erreur de génération"
          setError(msg)
          onError?.(msg, res.status, errData)
          setIsGenerating(false)
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          setError("Pas de flux de données")
          setIsGenerating(false)
          return
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const json = line.slice(6)

            try {
              const event: StreamEvent = JSON.parse(json)

              if (event.type === "delta") {
                fullText += event.text
                setStreamedText(fullText)
                onDelta?.(event.text, fullText)
              } else if (event.type === "done") {
                onDone?.(event as StreamDone)
              } else if (event.type === "error") {
                setError(event.error)
                onError?.(event.error)
              }
            } catch {
              // ignore malformed SSE
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const msg = err instanceof Error ? err.message : "Erreur réseau"
          setError(msg)
          onError?.(msg)
        }
      }

      setIsGenerating(false)
    },
    []
  )

  const abort = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
  }, [])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return { generate, abort, isGenerating, streamedText, error }
}

// ─── Shared type ─────────────────────────────────────────────────────────────

export interface ScriptRow {
  id: string
  user_id: string
  title: string | null
  subject: string | null
  initial_draft: string | null
  hook_type: string | null
  hook_text: string | null
  structure_type: string | null
  body: string | null
  cta: string | null
  ai_notes: string | null
  tone: string | null
  niche: string | null
  source_video_id: string | null
  status: "draft" | "saved" | "archived"
  created_at: string | null
  updated_at: string | null
}
