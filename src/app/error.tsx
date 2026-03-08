"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brutify-dark px-4 text-center">
      <p className="font-display text-5xl font-bold text-red-400">Oops</p>
      <h1 className="mt-4 font-display text-xl tracking-wide text-brutify-text-primary">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-sm font-body text-brutify-text-muted">
        Quelque chose s&apos;est mal passé. Réessaie ou retourne au dashboard.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.08] px-5 py-2.5 text-sm font-body font-semibold text-brutify-gold transition-all hover:bg-brutify-gold/[0.15] cursor-pointer"
        >
          Réessayer
        </button>
        <a
          href="/dashboard"
          className="rounded-xl bg-brutify-gold px-5 py-2.5 text-sm font-body font-semibold text-brutify-dark transition-all hover:brightness-110"
        >
          Dashboard
        </a>
      </div>
    </div>
  )
}
