"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronRight, Sparkles, Instagram, Youtube } from "lucide-react"
import { Loading } from "@/components/ui/Loading"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/useUser"
import { BrutifyLogo } from "@/components/ui/BrutifyLogo"
import { cn } from "@/lib/utils"

const NICHES = [
  "Business", "Fitness", "Finance", "Mindset", "Nutrition",
  "Marketing", "Tech", "Voyage", "Cuisine", "Lifestyle",
  "Mode", "Musique", "Gaming", "Éducation",
]

const AUDIENCE_RANGES = [
  { id: "0-1k", label: "0 – 1 000", sub: "Je débute", emoji: "🌱" },
  { id: "1k-10k", label: "1 000 – 10 000", sub: "En croissance", emoji: "🚀" },
  { id: "10k-100k", label: "10 000 – 100 000", sub: "Confirmé", emoji: "⚡" },
  { id: "100k+", label: "+ 100 000", sub: "Top créateur", emoji: "👑" },
]

/** Pain points & désirs — ce que le créateur vise (vues, visibilité, rémunération, UGC, etc.) */
const PRIORITY_GOALS = [
  { id: "more_views", label: "Plus de vues & portée", sub: "Faire décoller mes contenus", emoji: "📈" },
  { id: "brand_visibility", label: "Visibilité marque / service", sub: "Promouvoir mon activité ou mon SaaS", emoji: "🎯" },
  { id: "monetize", label: "Rémunération", sub: "Monétiser mon audience", emoji: "💰" },
  { id: "ugc", label: "UGC & partenariats", sub: "Travailler avec des marques", emoji: "🤝" },
  { id: "authority", label: "Devenir une référence", sub: "Expertise reconnue dans ma niche", emoji: "⭐" },
  { id: "leads_sales", label: "Leads & ventes", sub: "Générer des opportunités ou des ventes", emoji: "🛒" },
]

const FREQUENCY_OPTIONS = [
  { id: "rare", label: "< 1 / semaine", sub: "Quand j'ai le temps" },
  { id: "regular", label: "1 – 3 / semaine", sub: "Régulier" },
  { id: "daily", label: "Quotidien", sub: "Tous les jours" },
  { id: "multiple", label: "Plusieurs / jour", sub: "Je suis une machine" },
]

/** Tracking lead / attribution & qualification (onboarding) */
const LEAD_SOURCE_OPTIONS = [
  { id: "social", label: "Réseaux sociaux", sub: "Instagram, TikTok, YouTube…" },
  { id: "search", label: "Recherche Google", sub: "J'ai cherché un outil" },
  { id: "friend", label: "Un proche / bouche-à-oreille", sub: "Recommandation" },
  { id: "ad", label: "Une pub", sub: "Meta, Google, autre" },
  { id: "influencer", label: "Un créateur / influenceur", sub: "Vidéo ou post" },
  { id: "other", label: "Autre", sub: "Autre canal" },
]

const CREATION_CONTEXT_OPTIONS = [
  { id: "solo", label: "En solo", sub: "Je gère tout" },
  { id: "assistant", label: "Avec un assistant", sub: "VA ou freelance" },
  { id: "team", label: "En équipe / agence", sub: "Plusieurs personnes" },
]

function proxyImg(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

interface SuggestedCreator {
  id: string
  name: string | null
  handle: string
  platform: string
  followers: number | null
  avatar_url: string | null
  niche: string | null
}

const easeExpo = [0.16, 1, 0.3, 1] as const

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSuccessReturn = searchParams.get("success") === "1"
  const { user, refreshProfile } = useUser()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null)
  const [selectedAudienceRange, setSelectedAudienceRange] = useState<string | null>(null)
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set())
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null)
  const [instagramHandle, setInstagramHandle] = useState("")
  const [tiktokHandle, setTiktokHandle] = useState("")
  const [youtubeHandle, setYoutubeHandle] = useState("")
  const [creators, setCreators] = useState<SuggestedCreator[]>([])
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set())
  const [loadingCreators, setLoadingCreators] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"creator" | "growth" | "scale">("creator")
  const [leadSource, setLeadSource] = useState<string | null>(null)
  const [creationContext, setCreationContext] = useState<string | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Chargement des créateurs par niche via l’API serveur (évite timeout Supabase côté client)
  const fetchCreators = useCallback(async (niche: string) => {
    const log = (msg: string, extra?: unknown) =>
      console.log("[Onboarding] fetchCreators:", msg, extra ?? "")
    log("début", { niche })
    setLoadingCreators(true)
    try {
      const normalizedNiche = niche?.trim() ?? ""
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15_000)
      const res = await fetch(
        `/api/onboarding/creators?niche=${encodeURIComponent(normalizedNiche)}`,
        { credentials: "include", signal: controller.signal }
      )
      clearTimeout(timeoutId)
      const json = await res.json().catch(() => ({}))
      const list = Array.isArray(json.creators) ? json.creators : []
      if (!res.ok) {
        console.warn("[Onboarding] fetchCreators API:", res.status, json.error)
        setCreators([])
        return
      }
      log("réponse OK", { count: list.length })
      setCreators(list)
    } catch (err) {
      console.error("[Onboarding] fetchCreators exception:", err)
      setCreators([])
    } finally {
      log("fin (loading = false)")
      setLoadingCreators(false)
    }
  }, [])

  useEffect(() => {
    if (step === 5 && selectedNiche) {
      console.log("[Onboarding] fetchCreators", { step, selectedNiche })
      fetchCreators(selectedNiche)
    }
  }, [step, selectedNiche, fetchCreators])

  const toggleCreator = (id: string) => {
    setSelectedCreators((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleFinish = async () => {
    console.log("[Onboarding] handleFinish called", { user: !!user, selectedPlan })
    if (!user) {
      setCheckoutError("Session expirée. Rafraîchis la page et réessaie.")
      return
    }
    setFinishing(true)
    setCheckoutError(null)

    try {
      // Sauvegarde profil en fire-and-forget (ne bloque pas la redirection Stripe)
      const updatePayload: Record<string, unknown> = {
        niche: selectedNiche,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }
      if (instagramHandle) updatePayload.instagram_handle = instagramHandle.replace(/^@/, "")
      if (tiktokHandle) updatePayload.tiktok_handle = tiktokHandle.replace(/^@/, "")
      if (youtubeHandle) updatePayload.youtube_handle = youtubeHandle.replace(/^@/, "")
      if (leadSource) updatePayload.lead_source = leadSource
      if (creationContext) updatePayload.creation_context = creationContext

      console.log("[Onboarding] saving profile (non-blocking)…", updatePayload)
      const profileSave = Promise.resolve(
        supabase.from("profiles").update(updatePayload).eq("id", user.id)
      ).then(({ error }) => { if (error) console.error("[Onboarding] profile save error:", error) })
       .catch((e: unknown) => console.error("[Onboarding] profile save exception:", e))

      if (selectedCreators.size > 0) {
        Promise.resolve(
          supabase.from("watchlists").upsert(
            Array.from(selectedCreators).map((creatorId) => ({ user_id: user.id, creator_id: creatorId })),
            { onConflict: "user_id,creator_id" }
          )
        ).then(({ error }) => { if (error) console.error("[Onboarding] watchlist save error:", error) })
         .catch((e: unknown) => console.error("[Onboarding] watchlist save exception:", e))
      }

      const body: { plan: "creator" | "growth" | "scale"; interval: "month"; promoCode?: string } = {
        plan: selectedPlan,
        interval: "month",
      }
      if (selectedPlan === "growth") {
        body.promoCode = "ONBOARDING_GROWTH_40"
      }

      // Attendre la sauvegarde profil max 3s puis lancer Stripe quoi qu'il arrive
      await Promise.race([profileSave, new Promise(r => setTimeout(r, 3000))])

      console.log("[Onboarding] calling /api/stripe/checkout…", body)
      const res = await fetch("/api/stripe/checkout?from=onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      console.log("[Onboarding] checkout response status:", res.status)
      const data = await res.json().catch(() => ({}))
      console.log("[Onboarding] checkout response data:", data)

      if (!res.ok) {
        setCheckoutError(data.error || `Erreur ${res.status} — impossible de créer la session. Réessaie ou contacte-nous.`)
        setFinishing(false)
        return
      }
      if (data.url) {
        console.log("[Onboarding] redirecting to Stripe:", data.url)
        window.location.href = data.url
        return
      }

      console.warn("[Onboarding] no url in response, fallback to dashboard")
      window.location.href = "/dashboard"
    } catch (err) {
      console.error("[Onboarding] Error:", err)
      setCheckoutError("Une erreur est survenue. Vérifie ta connexion et réessaie.")
      setFinishing(false)
    }
  }

  const steps = [
    { label: "Niche", number: 1 },
    { label: "Audience", number: 2 },
    { label: "Priorités", number: 3 },
    { label: "Fréquence", number: 4 },
    { label: "Réseaux", number: 5 },
    { label: "Créateurs", number: 6 },
    { label: "D'où tu viens", number: 7 },
    { label: "Plan", number: 8 },
  ]

  const [dashboardRedirecting, setDashboardRedirecting] = useState(false)

  // Au retour Stripe : synchro abonnement → plan + 500 BP (au cas où le webhook n'a pas encore été reçu)
  useEffect(() => {
    if (!isSuccessReturn) return
    fetch("/api/stripe/sync-subscription", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (data.synced) console.log("[Onboarding] subscription synced:", data) })
      .catch((e) => console.warn("[Onboarding] sync-subscription failed:", e))
  }, [isSuccessReturn])

  if (isSuccessReturn) {
    const handleGoToDashboard = async () => {
      setDashboardRedirecting(true)
      try {
        await fetch("/api/stripe/sync-subscription", { credentials: "include" })
        const res = await fetch("/api/onboarding/complete", {
          method: "POST",
          credentials: "include",
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          console.error("[Onboarding] complete error:", data.error)
        }
        window.location.href = "/dashboard"
      } catch (e) {
        console.error("[Onboarding] complete request failed:", e)
        window.location.href = "/dashboard"
      } finally {
        setDashboardRedirecting(false)
      }
    }

    return (
      <div className="min-h-screen overflow-x-hidden flex flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[800px] min-w-0"
        >
          <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl p-4 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-x-hidden max-w-full text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-brutify-gold/[0.1] border border-brutify-gold/20">
              <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-brutify-gold" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2">
              Ton profil est <span className="text-gold-gradient">prêt</span> !
            </h2>
            <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-8">
              On a tout ce qu&apos;il faut pour personnaliser ton expérience.
            </p>
            <motion.button
              type="button"
              onClick={handleGoToDashboard}
              disabled={dashboardRedirecting}
              whileHover={dashboardRedirecting ? undefined : { scale: 1.02 }}
              whileTap={dashboardRedirecting ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-6 py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.35)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-80 min-h-[44px]"
            >
              {dashboardRedirecting ? (
                <Loading variant="icon" size="sm" className="h-4 w-4" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Accéder au dashboard
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeExpo }}
        className="w-full max-w-[800px] min-w-0"
      >
        <div className="mb-6 sm:mb-8 flex flex-col items-center gap-2 sm:gap-3 text-center px-1">
          <BrutifyLogo size="lg" />
          <p className="text-xs sm:text-sm text-brutify-text-secondary font-body max-w-[280px] sm:max-w-none">
            Configure ton espace en quelques étapes — on s’occupe du reste.
          </p>
        </div>

        {/* Barre de progression — rapide au début, lente à la fin (ease-in) */}
        <div className="mb-6 sm:mb-8 w-full max-w-[480px] mx-auto px-1">
          <div className="h-1.5 sm:h-2 w-full rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-brutify-gold to-brutify-gold-light shadow-[0_0_12px_rgba(255,171,0,0.4)]"
              initial={false}
              animate={{
                width: `${(() => {
                  const total = steps.length
                  const t = total <= 1 ? 1 : step / (total - 1) // 0 à l'étape 0, 1 à la dernière
                  const easeIn = 1 - Math.pow(1 - t, 2) // rapide au début, lent à la fin
                  return easeIn * 100
                })()}%`,
              }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] sm:text-xs font-body text-brutify-text-muted">
            {step + 1 === steps.length ? "Presque fini" : "Tu avances bien"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl sm:rounded-2xl border border-white/[0.06] bg-[#111113]/80 backdrop-blur-xl p-4 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_40px_rgba(255,171,0,0.04)] overflow-x-hidden max-w-full">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepNiche key="niche" selected={selectedNiche} onSelect={setSelectedNiche} onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <StepAudience
                key="audience"
                selected={selectedAudienceRange}
                onSelect={setSelectedAudienceRange}
                onNext={() => setStep(2)}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <StepFormats
                key="formats"
                selected={selectedFormats}
                onToggle={(id) => {
                  setSelectedFormats((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) next.delete(id); else next.add(id)
                    return next
                  })
                }}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepFrequency
                key="frequency"
                selected={selectedFrequency}
                onSelect={setSelectedFrequency}
                onNext={() => setStep(4)}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StepSocials
                key="socials"
                instagram={instagramHandle}
                tiktok={tiktokHandle}
                youtube={youtubeHandle}
                onChangeInstagram={setInstagramHandle}
                onChangeTiktok={setTiktokHandle}
                onChangeYoutube={setYoutubeHandle}
                onNext={() => setStep(5)}
                onBack={() => setStep(3)}
              />
            )}
            {step === 5 && (
              <StepCreators
                key="creators"
                niche={selectedNiche!}
                creators={creators}
                loading={loadingCreators}
                selected={selectedCreators}
                onToggle={toggleCreator}
                onNext={() => setStep(6)}
                onBack={() => setStep(4)}
              />
            )}
            {step === 6 && (
              <StepLeadTracking
                key="tracking"
                leadSource={leadSource}
                creationContext={creationContext}
                onLeadSource={setLeadSource}
                onCreationContext={setCreationContext}
                onNext={() => setStep(7)}
                onBack={() => setStep(5)}
              />
            )}
            {step === 7 && (
              <StepPlanSelection
                key="plan"
                selectedPlan={selectedPlan}
                onSelect={setSelectedPlan}
                onNext={handleFinish}
                onBack={() => setStep(6)}
                finishing={finishing}
                checkoutError={checkoutError}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Step Audience ──────────────────────────────────────────────── */

function StepAudience({ selected, onSelect, onNext, onBack }: {
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Ton <span className="text-gold-gradient">audience</span> actuelle
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-6">
        On calibre tes recommandations selon ta taille de communauté.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-2">
        {AUDIENCE_RANGES.map((range, i) => (
          <motion.button
            key={range.id}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(range.id)}
            className={cn(
              "relative rounded-2xl border-2 p-4 text-left transition-all duration-200",
              selected === range.id
                ? "border-brutify-gold bg-brutify-gold/[0.08] shadow-[0_0_24px_rgba(255,171,0,0.2)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            )}
          >
            <span className="text-2xl mb-2 block">{range.emoji}</span>
            <p className="font-display text-sm tracking-wide text-brutify-text-primary mb-0.5">{range.label}</p>
            <p className="text-xs font-body text-brutify-text-muted">{range.sub}</p>
            {selected === range.id && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 h-5 w-5 rounded-full bg-brutify-gold flex items-center justify-center">
                <Check className="h-3 w-3 text-brutify-bg" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onNext} disabled={!selected} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          Continuer <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step Priorités (pain points & désirs) ───────────────────────── */

function StepFormats({ selected, onToggle, onNext, onBack }: {
  selected: Set<string>
  onToggle: (id: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Ce que tu <span className="text-gold-gradient">vises</span>
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-1">
        Plusieurs réponses possibles — on adapte tes recommandations.
      </p>
      <p className="text-[10px] font-body text-brutify-text-muted/60 mb-5">
        Vues, visibilité, rémunération, UGC, partenariats…
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
        {PRIORITY_GOALS.map((goal, i) => {
          const isSelected = selected.has(goal.id)
          return (
            <motion.button
              key={goal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.04 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggle(goal.id)}
              className={cn(
                "relative rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 flex items-start gap-3",
                isSelected
                  ? "border-brutify-gold bg-brutify-gold/[0.08] shadow-[0_0_16px_rgba(255,171,0,0.15)]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]"
              )}
            >
              <span className="text-2xl shrink-0">{goal.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-body font-semibold", isSelected ? "text-brutify-gold" : "text-brutify-text-primary")}>
                  {goal.label}
                </p>
                <p className="text-xs font-body text-brutify-text-muted mt-0.5">{goal.sub}</p>
              </div>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 h-5 w-5 rounded-full bg-brutify-gold flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-brutify-bg" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 flex items-center justify-center gap-2"
        >
          {selected.size === 0 ? "Passer" : "Continuer"} <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step Frequency ─────────────────────────────────────────────── */

function StepFrequency({ selected, onSelect, onNext, onBack }: {
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Ta <span className="text-gold-gradient">fréquence</span> de publication
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-6">
        Pas de jugement. On veut juste t'aider à publier plus régulièrement 😉
      </p>

      <div className="space-y-2.5">
        {FREQUENCY_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.07, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(opt.id)}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 flex items-center justify-between gap-3",
              selected === opt.id
                ? "border-brutify-gold bg-brutify-gold/[0.08] shadow-[0_0_20px_rgba(255,171,0,0.15)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            )}
          >
            <div>
              <p className={cn("text-sm font-body font-semibold", selected === opt.id ? "text-brutify-gold" : "text-brutify-text-primary")}>
                {opt.label}
              </p>
              <p className="text-xs font-body text-brutify-text-muted mt-0.5">{opt.sub}</p>
            </div>
            <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
              selected === opt.id ? "border-brutify-gold bg-brutify-gold" : "border-white/[0.2] bg-transparent"
            )}>
              {selected === opt.id && <Check className="h-3 w-3 text-brutify-bg" />}
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onNext} disabled={!selected} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          Continuer <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 0: Niche ──────────────────────────────────────────────── */

function StepNiche({ selected, onSelect, onNext }: {
  selected: string | null
  onSelect: (niche: string) => void
  onNext: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Quelle est ta <span className="text-gold-gradient">niche</span> ?
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-4 sm:mb-6">
        On va personnaliser ton expérience en fonction de ton domaine.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {NICHES.map((niche, i) => (
          <motion.button key={niche} initial={{ opacity: 0, scale: 0.8, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onSelect(niche)}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-body font-medium transition-all duration-200",
              selected === niche
                ? "border-brutify-gold/30 bg-brutify-gold/[0.08] text-brutify-gold shadow-[0_0_25px_rgba(255,171,0,0.2)] scale-105"
                : "border-white/[0.06] bg-white/[0.02] text-brutify-text-secondary hover:border-white/[0.12] hover:bg-white/[0.04]"
            )}
          >{niche}</motion.button>
        ))}
      </div>

      <motion.button onClick={onNext} disabled={!selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4, ease: [0.16, 1, 0.3, 1] }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        className="mt-8 w-full rounded-xl bg-gold-gradient px-5 py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        Continuer <ChevronRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  )
}

/* ─── Step 2: Social handles ─────────────────────────────────────── */

// TikTok SVG icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.24 8.24 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z" />
    </svg>
  )
}

function SocialInput({
  icon, label, placeholder, value, onChange, required, accentColor,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  accentColor: string
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-body font-semibold uppercase tracking-wider text-brutify-text-muted/60">
        {icon}
        {label}
        {required && <span className="text-brutify-gold text-[10px]">requis</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-body text-brutify-text-muted/40 select-none">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border bg-white/[0.03] pl-7 pr-4 py-3 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted/30 outline-none transition-all duration-200",
            value
              ? `border-[${accentColor}]/30 focus:border-[${accentColor}]/50 shadow-[0_0_12px_${accentColor}10]`
              : "border-white/[0.08] focus:border-white/[0.2]"
          )}
          style={value ? { borderColor: `${accentColor}50` } : undefined}
        />
        {value && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}25` }}
          >
            <Check className="h-2.5 w-2.5" style={{ color: accentColor }} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

function StepSocials({
  instagram, tiktok, youtube,
  onChangeInstagram, onChangeTiktok, onChangeYoutube,
  onNext, onBack,
}: {
  instagram: string; tiktok: string; youtube: string
  onChangeInstagram: (v: string) => void
  onChangeTiktok: (v: string) => void
  onChangeYoutube: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Tes <span className="text-gold-gradient">réseaux</span>
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-4 sm:mb-6">
        Renseigne tes profils pour voir tes propres stats dans Brutify. Tu pourras les modifier plus tard.
      </p>

      <div className="space-y-4">
        <SocialInput
          icon={<Instagram className="h-3.5 w-3.5" style={{ color: "#E1306C" }} />}
          label="Instagram"
          placeholder="ton.handle"
          value={instagram}
          onChange={onChangeInstagram}
          required
          accentColor="#E1306C"
        />
        <SocialInput
          icon={<TikTokIcon className="h-3.5 w-3.5 text-[#69C9D0]" />}
          label="TikTok"
          placeholder="ton.handle"
          value={tiktok}
          onChange={onChangeTiktok}
          accentColor="#69C9D0"
        />
        <SocialInput
          icon={<Youtube className="h-3.5 w-3.5 text-[#FF0000]" />}
          label="YouTube"
          placeholder="@TaChaine"
          value={youtube}
          onChange={onChangeYoutube}
          accentColor="#FF0000"
        />
      </div>

      {!instagram && (
        <p className="mt-4 text-[11px] font-body text-brutify-text-muted/40 text-center">
          Instagram est recommandé pour débloquer les stats de ton profil.
        </p>
      )}

      <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >
          Retour
        </motion.button>
        <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 flex items-center justify-center gap-2"
        >
          {instagram ? "Continuer" : "Passer cette étape"}
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 2: Creators ───────────────────────────────────────────── */

function StepCreators({ niche, creators, loading, selected, onToggle, onNext, onBack }: {
  niche: string; creators: SuggestedCreator[]; loading: boolean
  selected: Set<string>; onToggle: (id: string) => void
  onNext: () => void; onBack: () => void
}) {
  const platformEmoji: Record<string, string> = { instagram: "IG", tiktok: "TK", youtube: "YT" }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Créateurs <span className="text-gold-gradient">{niche}</span>
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-4 sm:mb-6">
        Sélectionne ceux que tu veux suivre. Tu pourras en ajouter plus tard.
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 gap-4">
          <Loading variant="page" size="md" className="text-brutify-gold" />
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 min-w-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 h-16">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              </div>
            ))}
          </div>
        </div>
      ) : creators.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-brutify-text-muted font-body">
            Aucun créateur trouvé pour cette niche. Tu pourras en ajouter manuellement depuis le dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-h-[280px] sm:max-h-[320px] overflow-y-auto overflow-x-hidden pr-1 min-w-0">
          {creators.map((creator) => {
            const isSelected = selected.has(creator.id)
            return (
              <motion.button key={creator.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onToggle(creator.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                  isSelected ? "border-brutify-gold/30 bg-brutify-gold/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                )}
              >
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isSelected ? "bg-brutify-gold/20 text-brutify-gold" : "bg-white/[0.06] text-brutify-text-muted"
                )}>
                  {proxyImg(creator.avatar_url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={proxyImg(creator.avatar_url)!} alt="" className="h-10 w-10 rounded-full object-cover" />
                    : creator.handle.charAt(0).toUpperCase()
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-body font-semibold text-brutify-text-primary">{creator.name ?? creator.handle}</p>
                  <p className="text-xs text-brutify-text-muted font-body">
                    {creator.handle} · {platformEmoji[creator.platform] ?? creator.platform}
                    {creator.followers ? ` · ${formatFollowers(creator.followers)}` : ""}
                  </p>
                </div>
                <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
                  isSelected ? "border-brutify-gold bg-brutify-gold" : "border-white/[0.15] bg-transparent"
                )}>
                  {isSelected && <Check className="h-3 w-3 text-brutify-bg" />}
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_20px_rgba(255,171,0,0.15)] hover:shadow-[0_0_30px_rgba(255,171,0,0.25)] transition-shadow duration-200 flex items-center justify-center gap-2"
        >
          Continuer <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step Lead Tracking (attribution & qualification) ────────────── */

function StepLeadTracking({
  leadSource,
  creationContext,
  onLeadSource,
  onCreationContext,
  onNext,
  onBack,
}: {
  leadSource: string | null
  creationContext: string | null
  onLeadSource: (v: string) => void
  onCreationContext: (v: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        D&apos;où tu <span className="text-gold-gradient">viens</span> ?
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-6">
        2 questions rapides pour mieux te connaître.
      </p>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-body font-semibold text-brutify-text-muted uppercase tracking-wider mb-2">
            Comment as-tu connu Brutify ?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onLeadSource(opt.id)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-200",
                  leadSource === opt.id
                    ? "border-brutify-gold bg-brutify-gold/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
                )}
              >
                <p className={cn("text-xs font-body font-medium truncate", leadSource === opt.id ? "text-brutify-gold" : "text-brutify-text-secondary")}>{opt.label}</p>
                <p className="text-[10px] font-body text-brutify-text-muted truncate mt-0.5">{opt.sub}</p>
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-body font-semibold text-brutify-text-muted uppercase tracking-wider mb-2">
            Tu crées comment ?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {CREATION_CONTEXT_OPTIONS.map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCreationContext(opt.id)}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-200",
                  creationContext === opt.id
                    ? "border-brutify-gold bg-brutify-gold/[0.08]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]"
                )}
              >
                <p className={cn("text-xs font-body font-medium", creationContext === opt.id ? "text-brutify-gold" : "text-brutify-text-secondary")}>{opt.label}</p>
                <p className="text-[10px] font-body text-brutify-text-muted truncate mt-0.5">{opt.sub}</p>
              </motion.button>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onNext} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 flex items-center justify-center gap-2"
        >
          Continuer <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 3: Plan Selection ─────────────────────────────────────── */

function StepPlanSelection({ selectedPlan, onSelect, onNext, onBack, finishing, checkoutError }: {
  selectedPlan: "creator" | "growth" | "scale"
  onSelect: (plan: "creator" | "growth" | "scale") => void
  onNext: () => void
  onBack: () => void
  finishing?: boolean
  checkoutError?: string | null
}) {
  const plans = [
    {
      key: "creator" as const,
      name: "Creator",
      tagline: "Pour commencer à scaler",
      bp: "500 BP / mois",
      price: "19€/mois",
      trial: "7 jours gratuits",
      features: ["Scripts IA illimités (2 BP)", "Radar 10 créateurs", "BrutBoard complet", "Dashboard & analytics"],
      badge: "Recommandé",
      welcomeBadge: null as string | null,
      firstMonthPrice: null as string | null,
    },
    {
      key: "growth" as const,
      name: "Growth",
      tagline: "Pour les créateurs sérieux",
      bp: "2 000 BP / mois",
      price: "39€/mois",
      firstMonthPrice: "23,40€",
      features: ["Tout Creator inclus", "Transcription (3 BP)", "Analyse IA (5 BP)", "Radar illimité"],
      badge: null,
      welcomeBadge: "-40% 1er mois",
    },
    {
      key: "scale" as const,
      name: "Scale",
      tagline: "Pour les équipes & agences",
      bp: "3 000 BP / mois",
      price: "79€/mois",
      features: ["Tout Growth inclus", "Multi-users (3 seats)", "Export", "Support prioritaire"],
      badge: null,
      welcomeBadge: null as string | null,
      firstMonthPrice: null as string | null,
    },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="min-w-0">
      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Choisis ton <span className="text-gold-gradient">plan</span>
      </h2>
      <p className="text-sm sm:text-base text-brutify-text-secondary font-body mb-1 max-w-md">
        Démarre avec 7 jours gratuits ou profite de l’offre bienvenue sur Growth.
      </p>
      <p className="text-xs text-brutify-text-muted/80 font-body mb-6 sm:mb-8">
        Rejoint par des centaines de créateurs qui scalent leur contenu avec Brutify.
      </p>

      {/* Padding pour ne pas couper le glow des cartes */}
      <div className="py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 min-w-0">
        {plans.map((plan) => (
          <motion.button
            key={plan.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(plan.key)}
            className={cn(
              "relative rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-200 min-w-0",
              selectedPlan === plan.key
                ? "border-brutify-gold bg-brutify-gold/[0.08] shadow-[0_0_32px_rgba(255,171,0,0.25),0_0_0_1px_rgba(255,171,0,0.2)]"
                : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
            )}
          >
            {(plan.badge || plan.welcomeBadge) && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-3">
                <span className={cn(
                  "text-[10px] font-bold rounded-full px-2.5 py-1 uppercase tracking-wide shadow-lg",
                  plan.welcomeBadge ? "text-brutify-bg bg-emerald-500" : "text-brutify-bg bg-brutify-gold"
                )}>
                  {plan.welcomeBadge ?? plan.badge}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-display text-base sm:text-lg tracking-wider text-brutify-text-primary">
                {plan.name.toUpperCase()}
              </h3>
              <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 mt-0.5",
                selectedPlan === plan.key ? "border-brutify-gold bg-brutify-gold" : "border-white/[0.2] bg-transparent"
              )}>
                {selectedPlan === plan.key && <Check className="h-3 w-3 text-brutify-bg" />}
              </div>
            </div>
            <p className="text-xs font-body text-brutify-text-muted mb-4">{plan.tagline}</p>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              {plan.firstMonthPrice && (
                <>
                  <span className="text-sm font-body text-brutify-text-muted line-through">{plan.price}</span>
                  <span className="font-display text-2xl sm:text-3xl text-gold-gradient">{plan.firstMonthPrice}</span>
                  <span className="text-xs font-body text-brutify-text-muted">1er mois</span>
                </>
              )}
              {!plan.firstMonthPrice && (
                <span className="font-display text-2xl sm:text-3xl text-gold-gradient">{plan.price}</span>
              )}
            </div>
            <p className="text-xs font-body text-brutify-gold/90 mb-2">{plan.bp}</p>
            {plan.trial ? (
              <p className="text-xs font-body text-emerald-400 font-medium mb-4">{plan.trial}</p>
            ) : (
              <div className="mb-4" aria-hidden="true" />
            )}
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs font-body text-brutify-text-secondary">
                  <Check className="h-3.5 w-3.5 text-brutify-gold shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.button>
        ))}
      </div>

      {checkoutError && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-body text-red-300">
          {checkoutError}
        </p>
      )}

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} disabled={finishing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0 disabled:opacity-50"
        >Retour</motion.button>
        <motion.button onClick={onNext} disabled={finishing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none min-h-[44px]"
        >
          {finishing ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <><span>Continuer</span> <ChevronRight className="h-4 w-4" /></>}
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 4: Ready (affiché après retour Stripe via ?success=1) ───── */

function StepReady({ niche, audienceRange, formats, frequency, creatorsCount, instagramHandle, selectedPlan, finishing, onFinish, onBack }: {
  niche: string; audienceRange: string | null
  formats: Set<string>; frequency: string | null
  creatorsCount: number; instagramHandle: string; selectedPlan: string
  finishing: boolean; onFinish: () => void; onBack: () => void
}) {
  const planLabels: Record<string, string> = {
    free: "Free (50 BP)",
    creator: "Creator · 7j gratuits (500 BP)",
    growth: "Growth · -40% 1er mois (2000 BP)",
    scale: "Scale (3000 BP)",
  }
  const audienceLabel = audienceRange ? AUDIENCE_RANGES.find((a) => a.id === audienceRange)?.label ?? audienceRange : null
  const formatsLabel = formats.size > 0
    ? Array.from(formats).map((id) => PRIORITY_GOALS.find((f) => f.id === id)?.label ?? id).join(", ")
    : null
  const frequencyLabel = frequency ? FREQUENCY_OPTIONS.find((f) => f.id === frequency)?.label ?? frequency : null
  const summaryItems = [
    { label: "Niche", value: niche },
    ...(audienceLabel ? [{ label: "Audience", value: audienceLabel }] : []),
    ...(formatsLabel ? [{ label: "Priorités", value: formatsLabel }] : []),
    ...(frequencyLabel ? [{ label: "Fréquence", value: frequencyLabel }] : []),
    { label: "Créateurs suivis", value: String(creatorsCount) },
    ...(instagramHandle ? [{ label: "Instagram", value: `@${instagramHandle.replace(/^@/, "")}` }] : []),
    { label: "Plan", value: planLabels[selectedPlan] ?? selectedPlan },
  ]

  // Confetti particles
  const confettiColors = ["#FFAB00", "#FFD700", "#FFA500", "#FFE5B4"]
  const confetti = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1,
    rotation: Math.random() * 360,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }} className="text-center relative min-w-0">
      {/* Confetti */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0, y: -20, x: `${particle.x}%`, rotate: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: 400, 
            rotate: particle.rotation,
            scale: [0, 1, 1, 0.5]
          }}
          transition={{ 
            delay: particle.delay, 
            duration: particle.duration,
            ease: "easeOut"
          }}
          className="absolute top-0 w-2 h-2 rounded-sm pointer-events-none"
          style={{ backgroundColor: particle.color }}
        />
      ))}
      <div className="mx-auto mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-brutify-gold/[0.1] border border-brutify-gold/20">
        <Sparkles className="h-7 w-7 sm:h-8 sm:w-8 text-brutify-gold" />
      </div>

      <h2 className="font-display text-xl sm:text-2xl tracking-wider text-brutify-text-primary mb-2 break-words">
        Ton profil est <span className="text-gold-gradient">prêt</span> !
      </h2>
      <p className="text-xs sm:text-sm text-brutify-text-secondary font-body mb-6 sm:mb-8">
        On a tout ce qu&apos;il faut pour personnaliser ton expérience.
      </p>

      <div className="mx-auto w-full max-w-[280px] sm:max-w-xs space-y-2 sm:space-y-3 mb-6 sm:mb-8">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
            <span className="text-xs sm:text-sm text-brutify-text-secondary font-body truncate">{item.label}</span>
            <span className="text-xs sm:text-sm font-body font-semibold text-brutify-gold truncate">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3">
        <motion.button onClick={onBack} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-semibold text-brutify-text-primary hover:bg-white/[0.06] transition-all duration-200 min-w-0"
        >Retour</motion.button>
        <motion.button onClick={onFinish} disabled={finishing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="flex-1 min-w-[120px] rounded-xl bg-gold-gradient px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-body font-bold text-brutify-bg shadow-[0_0_40px_rgba(255,171,0,0.35)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)] transition-shadow duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {finishing ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <><Sparkles className="h-4 w-4" />Commencer</>}
        </motion.button>
      </div>
    </motion.div>
  )
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loading variant="page" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
