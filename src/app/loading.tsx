export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brutify-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brutify-gold/20 border-t-brutify-gold" />
        <p className="text-xs font-body text-brutify-text-muted animate-pulse">
          Chargement…
        </p>
      </div>
    </div>
  )
}
