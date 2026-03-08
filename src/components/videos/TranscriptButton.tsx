"use client"

import { useState } from "react"
import { FileText, Sparkles, Check } from "lucide-react"
import { Loading } from "@/components/ui/Loading"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { FREE_TRANSCRIPTS_LIMITS } from "@/lib/credits-rules"

interface TranscriptButtonProps {
  videoId: string
  hasTranscript: boolean
  onTranscribed?: () => void
}

export function TranscriptButton({ videoId, hasTranscript, onTranscribed }: TranscriptButtonProps) {
  const { profile } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = profile?.plan ?? "creator"
  const freeTranscriptsUsed = profile?.free_transcripts_used ?? 0
  const freeLimit = FREE_TRANSCRIPTS_LIMITS[plan] || 0
  const hasFreeTranscript = freeTranscriptsUsed < freeLimit
  const freeRemaining = Math.max(0, freeLimit - freeTranscriptsUsed)

  const handleTranscribe = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/videos/${videoId}/transcribe`, {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erreur lors de la transcription")
        setLoading(false)
        return
      }

      onTranscribed?.()
      window.location.reload()
    } catch (err) {
      setError("Erreur réseau")
      setLoading(false)
    }
  }

  if (hasTranscript) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm font-body font-semibold text-emerald-400"
      >
        <Check className="h-4 w-4" />
        Transcrit
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleTranscribe}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-body font-semibold transition-all",
          hasFreeTranscript
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            : "bg-brutify-gold/10 border border-brutify-gold/30 text-brutify-gold hover:bg-brutify-gold/20",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loading variant="icon" size="sm" className="h-4 w-4" />
            Transcription...
          </>
        ) : hasFreeTranscript ? (
          <>
            <Sparkles className="h-4 w-4" />
            Transcrire (gratuit)
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Transcrire (3 BP)
          </>
        )}
      </button>

      {hasFreeTranscript && (
        <p className="text-[10px] font-body text-emerald-400/70">
          {freeRemaining} transcription{freeRemaining > 1 ? 's' : ''} gratuite{freeRemaining > 1 ? 's' : ''} restante{freeRemaining > 1 ? 's' : ''}
        </p>
      )}

      {error && (
        <p className="text-xs font-body text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
