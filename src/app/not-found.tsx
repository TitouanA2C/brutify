"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brutify-dark px-4 text-center">
      <p className="font-display text-7xl font-bold text-brutify-gold">404</p>
      <h1 className="mt-4 font-display text-xl tracking-wide text-brutify-text-primary">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-sm font-body text-brutify-text-muted">
        La page que tu cherches n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-xl bg-brutify-gold px-6 py-2.5 text-sm font-body font-semibold text-brutify-dark transition-all hover:brightness-110"
      >
        Retour au dashboard
      </Link>
    </div>
  )
}
