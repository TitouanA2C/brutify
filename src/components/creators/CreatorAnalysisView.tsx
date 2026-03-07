"use client"

import { useState } from "react"
import {
  Target,
  MessageSquareQuote,
  FileText,
  Gem,
  Funnel,
  Lightbulb,
  BarChart3,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreatorAnalysisResult } from "@/lib/ai/creator-analysis"

interface CreatorAnalysisViewProps {
  analysis: CreatorAnalysisResult
  creatorName: string
  videosAnalyzed: number
  analyzedAt: string
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  color,
  children,
  defaultOpen = true,
}: {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: `${color}30`, background: `${color}12` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <span className="font-display text-sm uppercase tracking-wider text-white flex-1 text-left">
          {title}
        </span>
        {open
          ? <ChevronDown className="h-4 w-4 text-white/30" />
          : <ChevronRight className="h-4 w-4 text-white/30" />
        }
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  )
}

// ─── Pill badge ───────────────────────────────────────────────────────────────

function Pill({ children, color = "#FFAB00" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-body font-medium"
      style={{ color, borderColor: `${color}30`, background: `${color}10` }}
    >
      {children}
    </span>
  )
}

// ─── Copyable template card ──────────────────────────────────────────────────

function TemplateCard({ template, hookType, basedOn }: {
  template: string
  hookType: string
  basedOn: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-brutify-gold/20 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Pill color="#FFAB00">{hookType}</Pill>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-body text-white/30 hover:text-brutify-gold transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <p className="text-[13px] font-body text-white/90 leading-relaxed mb-2">
        {template}
      </p>
      <p className="text-[10px] font-body text-white/30">
        Inspiré de : {basedOn}
      </p>
    </div>
  )
}

// ─── Funnel bar ──────────────────────────────────────────────────────────────

function FunnelBar({ label, percentage, color }: {
  label: string
  percentage: number
  color: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-body font-medium text-white/60">{label}</span>
        <span className="text-[13px] font-display tracking-wider" style={{ color }}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CreatorAnalysisView({
  analysis,
  creatorName,
  videosAnalyzed,
  analyzedAt,
}: CreatorAnalysisViewProps) {
  const date = new Date(analyzedAt)
  const dateStr = date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-1 mb-1">
        <div>
          <h3 className="font-display text-sm uppercase tracking-wider text-brutify-gold">
            Analyse Concurrentielle
          </h3>
          <p className="text-[11px] font-body text-white/30 mt-0.5">
            {videosAnalyzed} vidéos analysées · {dateStr}
          </p>
        </div>
      </div>

      {/* ── Key Takeaways ── */}
      {analysis.key_takeaways?.length > 0 && (
        <div className="rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.04] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brutify-gold" />
            <span className="font-display text-xs uppercase tracking-wider text-brutify-gold">
              Insights Clés
            </span>
          </div>
          <ul className="space-y-2">
            {analysis.key_takeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-md bg-brutify-gold/10 text-[10px] font-display text-brutify-gold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[12px] font-body text-white/80 leading-relaxed">
                  {takeaway}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 1. Positionnement ── */}
      <Section
        icon={<Target className="h-4 w-4" />}
        title="Positionnement"
        color="#8B5CF6"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoCard
              label="Positionnement global"
              value={analysis.positioning.global_positioning}
            />
            <InfoCard
              label="Angle de différenciation"
              value={analysis.positioning.differentiation_angle}
            />
            <InfoCard
              label="Promesse implicite"
              value={analysis.positioning.implicit_promise}
            />
            <InfoCard
              label="Construction d'autorité"
              value={analysis.positioning.authority_building}
            />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
              Ton & Vocabulaire
            </p>
            <p className="text-[12px] font-body text-white/70 mb-2">{analysis.positioning.tone}</p>
            <div className="flex flex-wrap gap-1.5">
              {analysis.positioning.signature_vocabulary?.map((word, i) => (
                <Pill key={i} color="#8B5CF6">{word}</Pill>
              ))}
            </div>
          </div>

          {analysis.positioning.icp && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                ICP (Viewer type)
              </p>
              <p className="text-[12px] font-body text-white/70 mb-2">
                {analysis.positioning.icp.estimated_profile}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-[10px] font-body text-white/30 mb-1">Pain Points</p>
                  <ul className="space-y-1">
                    {analysis.positioning.icp.pain_points?.map((p, i) => (
                      <li key={i} className="text-[11px] font-body text-red-400/80 flex items-start gap-1">
                        <ArrowDownRight className="h-3 w-3 shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-body text-white/30 mb-1">Aspirations</p>
                  <ul className="space-y-1">
                    {analysis.positioning.icp.aspirations?.map((a, i) => (
                      <li key={i} className="text-[11px] font-body text-emerald-400/80 flex items-start gap-1">
                        <ArrowUpRight className="h-3 w-3 shrink-0 mt-0.5" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 2. Hooks ── */}
      <Section
        icon={<MessageSquareQuote className="h-4 w-4" />}
        title="Hooks"
        color="#F59E0B"
      >
        <div className="space-y-4">
          {/* Top 5 */}
          {analysis.hooks.top_5?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Top 5 Hooks
              </p>
              <div className="space-y-2">
                {analysis.hooks.top_5.map((hook, i) => (
                  <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brutify-gold/10 text-[10px] font-display text-brutify-gold">
                        #{i + 1}
                      </span>
                      <Pill color="#F59E0B">{hook.hook_type}</Pill>
                      <div className="flex items-center gap-0.5 ml-auto">
                        <Zap className="h-3 w-3 text-brutify-gold" />
                        <span className="text-[11px] font-display text-brutify-gold">
                          {hook.outlier_score}x
                        </span>
                      </div>
                    </div>
                    <p className="text-[12px] font-body text-white/90 leading-relaxed italic mb-1">
                      &ldquo;{hook.hook_text}&rdquo;
                    </p>
                    <p className="text-[10px] font-body text-white/40">{hook.analysis}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {analysis.hooks.linguistic_patterns && (
            <InfoCard label="Patterns linguistiques" value={analysis.hooks.linguistic_patterns} />
          )}

          {/* Top performing types */}
          {analysis.hooks.top_performing_types?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Types les plus performants
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.hooks.top_performing_types.map((t, i) => (
                  <Pill key={i} color="#F59E0B">{t}</Pill>
                ))}
              </div>
            </div>
          )}

          {/* Templates réutilisables */}
          {analysis.hooks.reusable_templates?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Templates Réutilisables
              </p>
              <div className="grid grid-cols-1 gap-2">
                {analysis.hooks.reusable_templates.map((t, i) => (
                  <TemplateCard key={i} {...t} hookType={t.hook_type} basedOn={t.based_on} />
                ))}
              </div>
            </div>
          )}

          {/* Hook catalog (collapsed by default) */}
          {analysis.hooks.catalog?.length > 0 && (
            <HookCatalog catalog={analysis.hooks.catalog} />
          )}
        </div>
      </Section>

      {/* ── 3. Structures de script ── */}
      <Section
        icon={<FileText className="h-4 w-4" />}
        title="Structures de Script"
        color="#06B6D4"
      >
        <div className="space-y-3">
          {analysis.script_structures.detected_structures?.map((s, i) => (
            <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pill color="#06B6D4">{s.name}</Pill>
                  <span className="text-[10px] font-body text-white/30">
                    {s.frequency} vidéo{s.frequency > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-cyan-400/60" />
                  <span className="text-[11px] font-body text-cyan-400/80">
                    {s.avg_outlier_score.toFixed(1)}x moy.
                  </span>
                </div>
              </div>
              <p className="text-[12px] font-body text-white/70 leading-relaxed whitespace-pre-line">
                {s.skeleton}
              </p>
              {s.example_video && (
                <p className="text-[10px] font-body text-white/30 mt-2">
                  Ex: {s.example_video}
                </p>
              )}
            </div>
          ))}

          {analysis.script_structures.best_performing_combos && (
            <InfoCard
              label="Meilleures combinaisons hook + structure"
              value={analysis.script_structures.best_performing_combos}
            />
          )}

          {analysis.script_structures.retention_techniques?.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Techniques de rétention
              </p>
              <ul className="space-y-1.5">
                {analysis.script_structures.retention_techniques.map((t, i) => (
                  <li key={i} className="text-[12px] font-body text-white/70 flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* ── 4. Value Delivery ── */}
      <Section
        icon={<Gem className="h-4 w-4" />}
        title="Delivery de Valeur"
        color="#10B981"
        defaultOpen={false}
      >
        <div className="space-y-3">
          {analysis.value_delivery.primary_methods?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Méthodes principales
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.value_delivery.primary_methods.map((m, i) => (
                  <Pill key={i} color="#10B981">{m}</Pill>
                ))}
              </div>
            </div>
          )}
          <InfoCard label="Profondeur vs Surface" value={analysis.value_delivery.depth_vs_surface} />
          <InfoCard label="Ratio actionnable" value={analysis.value_delivery.actionability_ratio} />
          {analysis.value_delivery.cta_patterns && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Patterns de CTA
              </p>
              <div className="grid grid-cols-2 gap-3">
                <MiniInfo label="Types" value={analysis.value_delivery.cta_patterns.types?.join(", ")} />
                <MiniInfo label="Fréquence" value={analysis.value_delivery.cta_patterns.frequency} />
                <MiniInfo label="Agressivité vente" value={analysis.value_delivery.cta_patterns.sales_aggressiveness} />
                <MiniInfo label="Intégration" value={analysis.value_delivery.cta_patterns.integration_style} />
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 5. Funnel Strategy ── */}
      <Section
        icon={<Funnel className="h-4 w-4" />}
        title="Stratégie de Funnel"
        color="#EC4899"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <FunnelBar
              label="TOFU — Acquisition"
              percentage={analysis.funnel_strategy.tofu?.percentage ?? 0}
              color="#22D3EE"
            />
            <FunnelBar
              label="MOFU — Nurturing"
              percentage={analysis.funnel_strategy.mofu?.percentage ?? 0}
              color="#A78BFA"
            />
            <FunnelBar
              label="BOFU — Conversion"
              percentage={analysis.funnel_strategy.bofu?.percentage ?? 0}
              color="#F472B6"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { data: analysis.funnel_strategy.tofu, label: "TOFU", color: "#22D3EE" },
              { data: analysis.funnel_strategy.mofu, label: "MOFU", color: "#A78BFA" },
              { data: analysis.funnel_strategy.bofu, label: "BOFU", color: "#F472B6" },
            ].map(({ data, label, color }) => data && (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <Pill color={color}>{label}</Pill>
                <div className="mt-2 space-y-1">
                  {data.formats?.map((f, i) => (
                    <p key={i} className="text-[11px] font-body text-white/60">• {f}</p>
                  ))}
                </div>
                <p className="text-[10px] font-body text-white/30 mt-2">{data.detected_objective}</p>
              </div>
            ))}
          </div>

          {analysis.funnel_strategy.distribution_analysis && (
            <InfoCard label="Analyse de la répartition" value={analysis.funnel_strategy.distribution_analysis} />
          )}
          {analysis.funnel_strategy.recommended_distribution && (
            <InfoCard label="Distribution recommandée" value={analysis.funnel_strategy.recommended_distribution} />
          )}
        </div>
      </Section>

      {/* ── 6. Sujets & Thématiques ── */}
      <Section
        icon={<Lightbulb className="h-4 w-4" />}
        title="Sujets & Thématiques"
        color="#F97316"
      >
        <div className="space-y-4">
          {/* Piliers de contenu */}
          {analysis.topics.content_pillars?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Piliers de contenu
              </p>
              <div className="space-y-2">
                {analysis.topics.content_pillars.map((pillar, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-body font-medium text-white/90 truncate">
                          {pillar.name}
                        </span>
                        <span className="text-[10px] font-body text-white/30 shrink-0">
                          {pillar.percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pillar.percentage}%`, background: "#F97316" }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Zap className="h-3 w-3 text-orange-400/60" />
                      <span className="text-[11px] font-body text-orange-400/80">
                        {pillar.avg_outlier_score.toFixed(1)}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.topics.outlier_topics?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Sujets qui surperforment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {analysis.topics.outlier_topics.map((t, i) => (
                  <Pill key={i} color="#4ade80">{t}</Pill>
                ))}
              </div>
            </div>
          )}

          {analysis.topics.missed_opportunities?.length > 0 && (
            <div>
              <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-2">
                Opportunités manquées
              </p>
              <ul className="space-y-1.5">
                {analysis.topics.missed_opportunities.map((o, i) => (
                  <li key={i} className="text-[12px] font-body text-amber-400/80 flex items-start gap-2">
                    <Lightbulb className="h-3 w-3 shrink-0 mt-0.5" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* ── 7. Métriques ── */}
      <Section
        icon={<BarChart3 className="h-4 w-4" />}
        title="Métriques & Patterns"
        color="#6366F1"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <MetricCard
              label="Vues moyennes"
              value={formatBigNum(analysis.metrics.avg_views)}
              icon={<Users className="h-3.5 w-3.5" />}
            />
            <MetricCard
              label="Vues médianes"
              value={formatBigNum(analysis.metrics.median_views)}
              icon={<BarChart3 className="h-3.5 w-3.5" />}
            />
            <MetricCard
              label="Engagement"
              value={`${(analysis.metrics.avg_engagement_rate * 100).toFixed(1)}%`}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
            <MetricCard
              label="Outliers (>2x)"
              value={String(analysis.metrics.outlier_count)}
              icon={<Zap className="h-3.5 w-3.5" />}
              accent
            />
            <MetricCard
              label="Mega outliers (>10x)"
              value={String(analysis.metrics.mega_outlier_count)}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              accent
            />
          </div>

          {analysis.metrics.posting_frequency && (
            <InfoCard label="Fréquence de publication" value={analysis.metrics.posting_frequency} />
          )}
          {analysis.metrics.temporal_patterns && (
            <InfoCard label="Patterns temporels" value={analysis.metrics.temporal_patterns} />
          )}
          {analysis.metrics.performance_trend && (
            <InfoCard label="Tendance de performance" value={analysis.metrics.performance_trend} />
          )}
        </div>
      </Section>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoCard({ label, value }: { label: string; value: string }) {
  if (!value || value === "insufficient_data") return null
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40 mb-1">
        {label}
      </p>
      <p className="text-[12px] font-body text-white/70 leading-relaxed">{value}</p>
    </div>
  )
}

function MiniInfo({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <p className="text-[10px] font-body text-white/30 mb-0.5">{label}</p>
      <p className="text-[11px] font-body text-white/60">{value}</p>
    </div>
  )
}

function MetricCard({ label, value, icon, accent }: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={cn(
      "rounded-lg border p-3",
      accent
        ? "border-brutify-gold/20 bg-brutify-gold/[0.04]"
        : "border-white/[0.06] bg-white/[0.02]"
    )}>
      <div className={cn(
        "flex items-center gap-1 mb-1",
        accent ? "text-brutify-gold/50" : "text-white/30"
      )}>
        {icon}
        <span className="text-[9px] font-body font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn(
        "font-display text-lg tracking-wider",
        accent ? "text-brutify-gold" : "text-white"
      )}>
        {value}
      </p>
    </div>
  )
}

function HookCatalog({ catalog }: { catalog: CreatorAnalysisResult["hooks"]["catalog"] }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? catalog : catalog.slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-body font-medium uppercase tracking-wider text-white/40">
          Catalogue complet ({catalog.length} hooks)
        </p>
        {catalog.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-body text-brutify-gold/60 hover:text-brutify-gold transition-colors cursor-pointer"
          >
            {expanded ? "Réduire" : `Voir les ${catalog.length}`}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {shown.map((h, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] p-2.5">
            <Pill color="#F59E0B">{h.hook_type}</Pill>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-body text-white/70 truncate italic">
                &ldquo;{h.hook_text}&rdquo;
              </p>
              <p className="text-[10px] font-body text-white/30 truncate mt-0.5">
                {h.video_title}
              </p>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <Zap className="h-2.5 w-2.5 text-brutify-gold/50" />
              <span className="text-[10px] font-body text-brutify-gold/70">
                {h.outlier_score}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatBigNum(n: number): string {
  if (!n || isNaN(n)) return "0"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}
