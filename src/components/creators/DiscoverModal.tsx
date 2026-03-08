"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Telescope, Users, Instagram, BadgeCheck,
  Plus, AlertTriangle, Globe, ChevronDown, Hash, Sparkles,
  ChevronLeft, Search, Flame, Check, Music2,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useDiscoverCreators, useNiches, type DiscoveredCreator, type DiscoverParams, type NicheDTO } from "@/hooks/useCreators"
import { Loading } from "@/components/ui/Loading"

const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const MIN_FOLLOWERS_OPTIONS = [
  { value: 1_000,   label: "1K+" },
  { value: 5_000,   label: "5K+" },
  { value: 10_000,  label: "10K+" },
  { value: 50_000,  label: "50K+" },
  { value: 100_000, label: "100K+" },
]

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return String(n)
}

// ─── Custom Select ────────────────────────────────────────────────────────────

function CustomSelect({
  value, onChange, options,
}: {
  value: number
  onChange: (v: number) => void
  options: { value: number; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
          open
            ? "border-brutify-gold/30 bg-brutify-gold/[0.06] text-brutify-text-primary"
            : "border-white/[0.06] bg-white/[0.02] text-brutify-text-primary hover:border-white/[0.12] hover:bg-white/[0.04]"
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-brutify-text-muted shrink-0" />
          <span>{selected?.label ?? "—"} abonnés</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 text-brutify-text-muted" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 rounded-xl border border-white/[0.08] bg-[#141416] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12, delay: i * 0.03 }}
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 text-xs font-body transition-all duration-150 cursor-pointer",
                    isSelected
                      ? "bg-brutify-gold/[0.08] text-brutify-gold"
                      : "text-brutify-text-secondary hover:bg-white/[0.04] hover:text-brutify-text-primary"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isSelected ? "bg-brutify-gold" : "bg-white/[0.15]")} />
                    <span className="font-medium">{opt.label}</span>
                    <span className={cn("text-[10px]", isSelected ? "text-brutify-gold/60" : "text-brutify-text-muted")}>abonnés min.</span>
                  </div>
                  {isSelected && <span className="text-brutify-gold text-[10px] font-bold">✓</span>}
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── NicheSelector ───────────────────────────────────────────────────────────

const TRENDING_SLUGS = ["business", "fitness", "finance", "marketing", "mindset"]

const NICHE_EMOJIS: Record<string, string> = {
  fitness: "💪", business: "🚀", finance: "💰", mindset: "🧠",
  nutrition: "🥗", marketing: "📈", tech: "💻", voyage: "✈️",
  cuisine: "👨‍🍳", lifestyle: "✨",
}

function NicheSelector({
  niches,
  loading,
  value,
  onChange,
  onCreateClick,
}: {
  niches: NicheDTO[]
  loading: boolean
  value: string
  onChange: (slug: string) => void
  onCreateClick: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selected = niches.find((n) => n.slug === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80)
  }, [open])

  const normalizeStr = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  const trendingNiches = niches.filter((n) => n.is_builtin && TRENDING_SLUGS.includes(n.slug))
  const customNiches   = niches.filter((n) => !n.is_builtin)
  const allNiches      = niches.filter((n) => n.is_builtin && !TRENDING_SLUGS.includes(n.slug))

  const filtered = query.trim()
    ? niches.filter((n) => normalizeStr(n.label).includes(normalizeStr(query)))
    : null

  const select = (slug: string) => {
    onChange(slug)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 transition-all duration-200 cursor-pointer",
          open
            ? "border-brutify-gold/30 bg-brutify-gold/[0.04] shadow-[0_0_12px_rgba(255,171,0,0.06)]"
            : selected
              ? "border-white/[0.1] bg-white/[0.03] hover:border-white/[0.15]"
              : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
        )}
      >
        {loading ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Loading variant="icon" size="sm" className="h-4 w-4 text-brutify-text-muted shrink-0" />
            <div className="h-3 w-20 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ) : selected ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-lg leading-none shrink-0 select-none">
              {NICHE_EMOJIS[selected.slug] ?? "🏷️"}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-body font-semibold text-brutify-text-primary truncate">
                  {selected.label}
                </span>
                {TRENDING_SLUGS.includes(selected.slug) && selected.is_builtin && (
                  <span className="shrink-0 flex items-center gap-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5">
                    <Flame className="h-2.5 w-2.5 text-orange-400" />
                    <span className="text-[9px] font-body font-medium text-orange-400">Tendance</span>
                  </span>
                )}
                {!selected.is_builtin && (
                  <span className="shrink-0 text-[9px] font-body text-brutify-text-muted/60 border border-white/[0.06] rounded-full px-1.5 py-0.5">custom</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Hash className="h-3.5 w-3.5 text-brutify-text-muted/50 shrink-0" />
            <span className="text-sm font-body text-brutify-text-muted/70">Choisir une niche...</span>
          </div>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-colors", open ? "text-brutify-gold/60" : "text-brutify-text-muted/50")} />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute z-50 top-[calc(100%+8px)] left-0 right-0 rounded-2xl border border-white/[0.08] bg-[#121214] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/[0.05]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brutify-text-muted" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une niche..."
                  className="w-full rounded-xl bg-white/[0.04] border border-white/[0.05] pl-9 pr-3 py-2 text-xs font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none focus:border-white/[0.12]"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brutify-text-muted hover:text-brutify-text-primary cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto">
              {filtered ? (
                /* Search results */
                filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 px-4">
                    <p className="text-xs font-body text-brutify-text-muted">Aucune niche trouvée pour &ldquo;{query}&rdquo;</p>
                    <button
                      onClick={() => { setOpen(false); setQuery(""); onCreateClick() }}
                      className="flex items-center gap-1.5 text-xs font-body text-brutify-gold hover:underline cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Créer &ldquo;{query}&rdquo;
                    </button>
                  </div>
                ) : (
                  <NicheList items={filtered} selected={value} onSelect={select} />
                )
              ) : (
                <>
                  {/* Trending */}
                  {trendingNiches.length > 0 && (
                    <NicheSection
                      title="🔥 Tendances"
                      items={trendingNiches}
                      selected={value}
                      onSelect={select}
                      isTrending
                    />
                  )}
                  {/* All built-in */}
                  {allNiches.length > 0 && (
                    <NicheSection
                      title="Toutes les niches"
                      items={allNiches}
                      selected={value}
                      onSelect={select}
                    />
                  )}
                  {/* Custom */}
                  {customNiches.length > 0 && (
                    <NicheSection
                      title="✨ Créées par la communauté"
                      items={customNiches}
                      selected={value}
                      onSelect={select}
                    />
                  )}
                </>
              )}
            </div>

            {/* Footer CTA */}
            <div className="border-t border-white/[0.05] p-2">
              <button
                onClick={() => { setOpen(false); setQuery(""); onCreateClick() }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-body font-medium text-brutify-text-muted hover:text-brutify-gold hover:bg-brutify-gold/[0.04] transition-all duration-200 cursor-pointer border border-transparent hover:border-brutify-gold/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Créer une nouvelle niche
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NicheSection({
  title, items, selected, onSelect, isTrending = false,
}: {
  title: string
  items: NicheDTO[]
  selected: string
  onSelect: (slug: string) => void
  isTrending?: boolean
}) {
  return (
    <div>
      <div className="px-3 pt-3 pb-1.5">
        <p className="text-[10px] font-body font-semibold text-brutify-text-muted uppercase tracking-wider">
          {title}
        </p>
      </div>
      <NicheList items={items} selected={selected} onSelect={onSelect} isTrending={isTrending} />
    </div>
  )
}

function NicheList({
  items, selected, onSelect, isTrending = false,
}: {
  items: NicheDTO[]
  selected: string
  onSelect: (slug: string) => void
  isTrending?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-0.5 px-2 pb-2">
      {items.map((n, i) => {
        const isSelected = n.slug === selected
        return (
          <motion.button
            key={n.slug}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, delay: i * 0.02 }}
            onClick={() => onSelect(n.slug)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150 cursor-pointer group",
              isSelected
                ? "bg-brutify-gold/[0.1] border border-brutify-gold/20"
                : "border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
            )}
          >
            <span className="text-lg leading-none shrink-0">
              {NICHE_EMOJIS[n.slug] ?? "🏷️"}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-xs font-body font-semibold truncate",
                isSelected ? "text-brutify-gold" : "text-brutify-text-secondary group-hover:text-brutify-text-primary"
              )}>
                {n.label}
              </p>
              {isTrending && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Flame className="h-2.5 w-2.5 text-orange-400/70" />
                  <span className="text-[9px] font-body text-orange-400/60">Tendance</span>
                </div>
              )}
            </div>
            {isSelected && <Check className="h-3.5 w-3.5 text-brutify-gold shrink-0" />}
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── HashtagInput ─────────────────────────────────────────────────────────────

function HashtagInput({
  label, placeholder, tags, onChange,
}: {
  label: string
  placeholder: string
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState("")

  const addTag = (raw: string) => {
    const cleaned = raw.replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, "")
    if (cleaned && !tags.includes(cleaned) && tags.length < 4) {
      onChange([...tags, cleaned])
    }
    setInput("")
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div>
      <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-1.5">
        {label} <span className="normal-case text-brutify-text-muted/60">({tags.length}/4)</span>
      </label>
      <div className={cn(
        "flex flex-wrap gap-1.5 rounded-xl border p-2.5 min-h-[42px] transition-all duration-200",
        tags.length === 0 && !input
          ? "border-white/[0.06] bg-white/[0.02]"
          : "border-brutify-gold/20 bg-brutify-gold/[0.02]"
      )}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-brutify-gold/10 border border-brutify-gold/20 px-2 py-0.5 text-[11px] font-body font-medium text-brutify-gold"
          >
            <Hash className="h-2.5 w-2.5" />
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-brutify-gold/60 hover:text-brutify-gold ml-0.5 cursor-pointer"
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < 4 && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={() => { if (input.trim()) addTag(input) }}
            placeholder={tags.length === 0 ? placeholder : "Ajouter..."}
            className="flex-1 min-w-[100px] bg-transparent text-xs font-body text-brutify-text-primary placeholder:text-brutify-text-muted/50 outline-none"
          />
        )}
      </div>
    </div>
  )
}

// ─── AddNicheForm ─────────────────────────────────────────────────────────────

function AddNicheForm({
  onSuccess,
  onCancel,
  createNiche,
}: {
  onSuccess: (niche: NicheDTO) => void
  onCancel: () => void
  createNiche: (p: { label: string; hashtags_broad: string[]; hashtags_niche: string[]; hashtags_fr: string[] }) => Promise<NicheDTO>
}) {
  const [label, setLabel] = useState("")
  const [broad, setBroad] = useState<string[]>([])
  const [niche, setNiche] = useState<string[]>([])
  const [fr, setFr] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allTags = [...broad, ...niche, ...fr]
  const canSubmit = label.trim().length >= 2 && allTags.length >= 2

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const created = await createNiche({
        label: label.trim(),
        hashtags_broad: broad,
        hashtags_niche: niche,
        hashtags_fr: fr,
      })
      onSuccess(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: expoOut }}
      className="flex flex-col gap-4"
    >
      {/* Back */}
      <button
        onClick={onCancel}
        className="flex items-center gap-1.5 text-xs font-body text-brutify-text-muted hover:text-brutify-text-primary transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Retour
      </button>

      <div>
        <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-1.5">
          Nom de la niche
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex: Immobilier, Crypto, Mode..."
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 px-3 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all focus:border-brutify-gold/20"
        />
      </div>

      <div className="rounded-xl border border-brutify-gold/10 bg-brutify-gold/[0.02] p-3.5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="h-3.5 w-3.5 text-brutify-gold/60" />
          <p className="text-[11px] font-body font-medium text-brutify-gold/80">
            Hashtags de recherche — Appuie sur Entrée ou virgule pour ajouter
          </p>
        </div>
        <HashtagInput
          label="Hashtags larges (volume)"
          placeholder="fitness, business..."
          tags={broad}
          onChange={setBroad}
        />
        <HashtagInput
          label="Hashtags ciblés (niche)"
          placeholder="coachfitness, solopreneur..."
          tags={niche}
          onChange={setNiche}
        />
        <HashtagInput
          label="Hashtags français"
          placeholder="fitnessfr, entrepreneurfr..."
          tags={fr}
          onChange={setFr}
        />
      </div>

      <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3 py-2">
        <Sparkles className="h-3.5 w-3.5 text-brutify-gold/40 shrink-0" />
        <p className="text-[11px] font-body text-brutify-text-muted">
          Cette niche sera disponible pour <span className="text-brutify-text-secondary">tous les utilisateurs</span> de Brutify
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <p className="text-xs font-body text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/[0.06] py-2.5 text-xs font-body font-medium text-brutify-text-muted hover:text-brutify-text-primary transition-all cursor-pointer"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-body font-semibold transition-all cursor-pointer",
            canSubmit && !loading
              ? "bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-black hover:shadow-[0_0_16px_rgba(255,171,0,0.3)]"
              : "bg-white/[0.04] text-brutify-text-muted cursor-not-allowed"
          )}
        >
          {loading ? <Loading variant="icon" size="sm" className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {loading ? "Création..." : "Créer la niche"}
        </button>
      </div>
    </motion.div>
  )
}

// ─── DiscoverModal ────────────────────────────────────────────────────────────

interface DiscoverModalProps {
  open: boolean
  onClose: () => void
  onAddCreator: (username: string) => void
}

export function DiscoverModal({ open, onClose, onAddCreator }: DiscoverModalProps) {
  const { niches, isLoading: nichesLoading, createNiche } = useNiches()
  const [selectedSlug, setSelectedSlug] = useState<string>("business")
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram")
  const [lang, setLang] = useState<"fr" | "all">("fr")
  const [minFollowers, setMinFollowers] = useState(10_000)
  const [activeParams, setActiveParams] = useState<DiscoverParams | null>(null)
  const [scanCounter, setScanCounter] = useState(0)
  const [addedUsernames, setAddedUsernames] = useState<Set<string>>(new Set())
  const [showAddForm, setShowAddForm] = useState(false)

  const { creators, isLoading, error } = useDiscoverCreators(activeParams)

  // Sélectionne automatiquement la première niche disponible
  useEffect(() => {
    if (niches.length > 0 && !niches.find((n) => n.slug === selectedSlug)) {
      setSelectedSlug(niches[0].slug)
    }
  }, [niches, selectedSlug])

  const handleSearch = useCallback(() => {
    setAddedUsernames(new Set())
    setScanCounter((n) => {
      const next = n + 1
      setActiveParams({ niche: selectedSlug, platform, lang, minFollowers, scanId: next })
      return next
    })
  }, [selectedSlug, platform, lang, minFollowers])

  const handleAdd = useCallback(
    (username: string) => {
      setAddedUsernames((prev) => new Set([...prev, username]))
      onAddCreator(username)
    },
    [onAddCreator]
  )

  const handleNicheCreated = (niche: NicheDTO) => {
    setSelectedSlug(niche.slug)
    setShowAddForm(false)
  }

  const hasResults = !isLoading && creators.length > 0
  const isEmpty = !isLoading && activeParams !== null && creators.length === 0 && !error

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, y: 10, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: expoOut }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-brutify-gold/20 bg-[#0e0e10] shadow-[0_0_50px_rgba(255,171,0,0.2),0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-brutify-gold/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brutify-gold/10 border border-brutify-gold/20">
                  <Telescope className="h-4.5 w-4.5 text-brutify-gold" />
                </div>
                <div>
                  <h3 className="font-display text-lg uppercase tracking-wider text-brutify-text-primary">
                    Découvrir des créateurs
                  </h3>
                  <p className="text-[11px] font-body text-brutify-text-muted">
                    Scan {platform === "instagram" ? "Instagram" : "TikTok"} par niche · Résultats triés par pertinence
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-brutify-text-muted hover:text-brutify-text-primary hover:border-brutify-gold/30 shadow-[0_0_8px_rgba(255,171,0,0.15)] hover:shadow-[0_0_20px_rgba(255,171,0,0.4)] transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 pb-5 shrink-0 border-b border-white/[0.05]">
              <AnimatePresence mode="wait">
                {showAddForm ? (
                  <AddNicheForm
                    key="add-form"
                    onSuccess={handleNicheCreated}
                    onCancel={() => setShowAddForm(false)}
                    createNiche={createNiche}
                  />
                ) : (
                  <motion.div
                    key="filters"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Plateforme */}
                    <div className="mb-4">
                      <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-2">
                        Plateforme
                      </label>
                      <div className="flex gap-2">
                        {(["instagram", "tiktok"] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-body font-medium transition-all duration-200 cursor-pointer",
                              platform === p
                                ? p === "instagram"
                                  ? "bg-[#E1306C]/10 border-[#E1306C]/30 text-[#E1306C]"
                                  : "bg-[#69C9D0]/10 border-[#69C9D0]/30 text-[#69C9D0]"
                                : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:bg-white/[0.03] hover:text-brutify-text-secondary"
                            )}
                          >
                            {p === "instagram" ? (
                              <Instagram className="h-4 w-4" />
                            ) : (
                              <Music2 className="h-4 w-4" />
                            )}
                            {p === "instagram" ? "Instagram" : "TikTok"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Niche */}
                    <div className="mb-4">
                      <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-2">
                        Niche
                      </label>
                      <NicheSelector
                        niches={niches}
                        loading={nichesLoading}
                        value={selectedSlug}
                        onChange={setSelectedSlug}
                        onCreateClick={() => setShowAddForm(true)}
                      />
                    </div>

                    {/* Langue + Followers */}
                    <div className="flex gap-4 flex-wrap">
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-2">
                          Langue cible
                        </label>
                        <div className="flex gap-2">
                          {(["fr", "all"] as const).map((l) => (
                            <button
                              key={l}
                              onClick={() => setLang(l)}
                              className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-body font-medium transition-all duration-200 cursor-pointer",
                                lang === l
                                  ? "bg-brutify-gold/[0.08] border-brutify-gold/20 text-brutify-gold"
                                  : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:bg-white/[0.03]"
                              )}
                            >
                              <Globe className="h-3.5 w-3.5" />
                              {l === "fr" ? "Français" : "Tous"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block text-[11px] font-body font-medium text-brutify-text-muted uppercase tracking-wider mb-2">
                          Followers minimum
                        </label>
                        <CustomSelect value={minFollowers} onChange={setMinFollowers} options={MIN_FOLLOWERS_OPTIONS} />
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className={cn(
                        "mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-body font-semibold transition-all duration-300 cursor-pointer",
                        isLoading
                          ? "bg-brutify-gold/30 text-black/50 cursor-not-allowed"
                          : "bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-black shadow-[0_0_30px_rgba(255,171,0,0.3)] hover:shadow-[0_0_50px_rgba(255,171,0,0.5)] hover:scale-[1.02]"
                      )}
                    >
                      {isLoading ? (
                        <><Loading variant="icon" size="sm" className="h-4 w-4 shrink-0" />Scan en cours… (~1-2 min)</>
                      ) : platform === "instagram" ? (
                        <><Instagram className="h-4 w-4" />Scanner Instagram</>
                      ) : (
                        <><Music2 className="h-4 w-4" />Scanner TikTok</>
                      )}
                    </button>

                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-brutify-gold/10 bg-brutify-gold/[0.03] p-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <Loading variant="icon" size="sm" className="h-3.5 w-3.5 text-brutify-gold/60 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] font-body text-brutify-gold/80 font-medium mb-0.5">
                              Pipeline en cours d&apos;exécution
                            </p>
                            <p className="text-[10px] font-body text-brutify-text-muted leading-relaxed">
                              Recherche Instagram par mot-clé → scan hashtags → scraping profils → scoring qualité
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            {!showAddForm && (
              <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-body text-red-400">
                      {error instanceof Error ? error.message : "Erreur lors de la découverte"}
                    </p>
                  </div>
                )}
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] mb-4">
                      <Users className="h-6 w-6 text-brutify-text-muted" />
                    </div>
                    <p className="font-display text-base uppercase tracking-wider text-brutify-text-secondary mb-1">Aucun créateur trouvé</p>
                    <p className="text-xs font-body text-brutify-text-muted text-center max-w-xs">
                      Essaie avec une autre niche, une langue différente ou un seuil de followers plus bas.
                    </p>
                  </div>
                )}
                {!activeParams && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brutify-gold/10 bg-brutify-gold/[0.03] mb-4">
                      <Telescope className="h-6 w-6 text-brutify-gold/40" />
                    </div>
                    <p className="text-sm font-body text-brutify-text-muted text-center max-w-xs leading-relaxed">
                      Configure tes filtres et lance le scan pour découvrir des créateurs dans ta niche.
                    </p>
                  </div>
                )}
                {hasResults && (
                  <div>
                    <p className="text-xs font-body text-brutify-text-muted mb-4">
                      <span className="text-brutify-text-primary font-medium">{creators.length} créateurs</span> découverts
                      {activeParams?.lang === "fr" && " · contenu français"}
                      {" · "}triés par pertinence
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      <AnimatePresence mode="popLayout">
                        {creators.map((creator, i) => (
                          <motion.div
                            key={creator.username}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.05, ease: expoOut }}
                            className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] hover:shadow-[0_0_16px_rgba(255,171,0,0.06)] transition-all duration-200"
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.04]">
                              {creator.profilePicUrl ? (
                                <Image src={creator.profilePicUrl} alt={creator.username} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Users className="h-5 w-5 text-brutify-text-muted" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="text-sm font-body font-semibold text-brutify-text-primary truncate">
                                  {creator.fullName || creator.username}
                                </p>
                                {creator.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-400" />}
                              </div>
                              <p className="text-xs font-body text-brutify-text-muted mb-1.5">@{creator.username}</p>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Instagram className="h-3 w-3 text-brutify-text-muted" />
                                  <span className="text-xs font-body font-medium text-brutify-text-secondary">
                                    {formatFollowers(creator.followersCount)}
                                  </span>
                                </div>
                                {creator.engagementRate > 0 && (
                                  <span className={cn(
                                    "text-[10px] font-body font-medium px-1.5 py-0.5 rounded-full",
                                    creator.engagementRate > 5
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : creator.engagementRate > 2
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-white/[0.06] text-brutify-text-muted"
                                  )}>
                                    {creator.engagementRate}% eng.
                                  </span>
                                )}
                              </div>
                              {creator.bio && (
                                <p className="mt-1.5 text-[11px] font-body text-brutify-text-muted line-clamp-1 leading-relaxed">
                                  {creator.bio}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleAdd(creator.username)}
                              disabled={addedUsernames.has(creator.username)}
                              className={cn(
                                "shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-body font-medium transition-all duration-200 border cursor-pointer",
                                addedUsernames.has(creator.username)
                                  ? "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 cursor-default"
                                  : "border-brutify-gold/20 bg-brutify-gold/[0.06] text-brutify-gold hover:bg-brutify-gold/[0.12]"
                              )}
                            >
                              {addedUsernames.has(creator.username) ? "Ajouté ✓" : <><Plus className="h-3.5 w-3.5" />Analyser</>}
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
