"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Play,
  PenTool,
  Lightbulb,
  ScrollText,
  LayoutDashboard,
  Trash2,
  Clock,
  X,
  Bookmark,
  Loader2,
  Sparkles,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  useVault,
  useCreateVaultItem,
  useDeleteVaultItem,
  type VaultItem,
} from "@/hooks/useVault";
import { cn } from "@/lib/utils";

type VaultType = "video" | "script" | "manual" | "ai";
type FilterType = "all" | VaultType;

const typeFilters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "ai", label: "✨ Inspiration IA" },
  { value: "video", label: "Vidéos" },
  { value: "script", label: "Scripts" },
  { value: "manual", label: "Idées manuelles" },
];

const typeConfig: Record<VaultType, { label: string; icon: typeof Play; color: string }> = {
  video:  { label: "Vidéo",          icon: Play,       color: "#FFD700" },
  script: { label: "Script",         icon: PenTool,    color: "#FFAB00" },
  manual: { label: "Manuel",         icon: Lightbulb,  color: "#CC8800" },
  ai:     { label: "Inspiration IA", icon: Sparkles,   color: "#A855F7" },
};

const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const gridStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const cardAnim = {
  hidden:  { opacity: 0, y: 30, scale: 0.92, filter: "blur(4px)" },
  show:    { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.4, ease: EASE_EXPO } },
  exit:    { opacity: 0, scale: 0.90, filter: "blur(4px)", transition: { duration: 0.3, ease: "easeIn" as const } },
};

export default function VaultPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const { items, isLoading, mutate } = useVault(typeFilter === "all" ? undefined : typeFilter);
  const { create, isCreating } = useCreateVaultItem();
  const { remove } = useDeleteVaultItem();
  const [showNewModal, setShowNewModal] = useState(false);

  // Inspiration IA state
  const [inspiring, setInspiring] = useState(false);
  const [inspireError, setInspireError] = useState<string | null>(null);
  const [inspireSuccess, setInspireSuccess] = useState<number | null>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      mutate((prev) => ({ items: (prev?.items ?? []).filter((i) => i.id !== id) }), false);
      await remove(id);
    },
    [remove, mutate]
  );

  const handleAdd = useCallback(
    async (body: { type: "video" | "script" | "manual"; content: string; tags?: string[] }) => {
      setShowNewModal(false);
      await create(body);
    },
    [create]
  );

  const handleInspire = useCallback(async () => {
    setInspiring(true);
    setInspireError(null);
    setInspireSuccess(null);
    try {
      const res = await fetch("/api/vault/inspire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count: 6 }) });
      const data = await res.json();
      if (!res.ok) { setInspireError(data.error ?? "Erreur lors de la génération"); return; }
      setInspireSuccess(data.count ?? 0);
      mutate();
      setTypeFilter("ai");
    } catch {
      setInspireError("Erreur réseau");
    } finally {
      setInspiring(false);
    }
  }, [mutate]);

  // Auto-hide success banner after 4s
  useEffect(() => {
    if (!inspireSuccess) return;
    const t = setTimeout(() => setInspireSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [inspireSuccess]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-brutify-gold" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_EXPO }}
      className="max-w-[1400px] mx-auto"
    >
      <PageHeader
        title="Vault"
        subtitle={`${items.length} idée${items.length !== 1 ? "s" : ""} sauvegardée${items.length !== 1 ? "s" : ""}`}
      >
        {/* Inspiration IA button */}
        <Button
          variant="secondary"
          size="md"
          onClick={handleInspire}
          disabled={inspiring}
        >
          {inspiring ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {inspiring ? "Génération…" : "Inspiration IA"}
        </Button>

        <Button variant="primary" size="md" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle idée
        </Button>
      </PageHeader>

      {/* Inspire status banners */}
      <AnimatePresence>
        {inspiring && (
          <motion.div
            key="inspiring-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4"
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/25">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 rounded-xl"
                style={{ background: "conic-gradient(from 0deg, transparent 60%, rgba(168,85,247,0.5) 100%)" }}
              />
              <Sparkles className="relative z-10 h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-body font-semibold text-purple-300">Analyse de tes créateurs en cours…</p>
              <p className="text-[11px] font-body text-purple-400/60">Récupération des vidéos · Construction du contexte · Génération des idées</p>
            </div>
          </motion.div>
        )}

        {inspireError && (
          <motion.div
            key="inspire-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-4"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm font-body text-red-400 flex-1">{inspireError}</p>
            <button onClick={() => setInspireError(null)} className="text-red-400/50 hover:text-red-400 cursor-pointer transition-colors">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {inspireSuccess !== null && (
          <motion.div
            key="inspire-success"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-6 flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-5 py-4"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />
            <p className="text-sm font-body text-purple-300">
              <span className="font-semibold">{inspireSuccess} idée{inspireSuccess > 1 ? "s" : ""}</span> générée{inspireSuccess > 1 ? "s" : ""} depuis tes créateurs et ajoutée{inspireSuccess > 1 ? "s" : ""} au Vault.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Type filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1, ease: EASE_EXPO }}
        className="flex flex-wrap items-center gap-2 mb-8"
      >
        {typeFilters.map((tf, i) => (
          <motion.button
            key={tf.value}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06, duration: 0.25, ease: EASE_EXPO }}
            onClick={() => setTypeFilter(tf.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-body font-medium border transition-all duration-200 cursor-pointer",
              typeFilter === tf.value && tf.value === "ai"
                ? "bg-purple-500/[0.15] border-purple-500/40 text-purple-300 shadow-[0_0_28px_rgba(139,92,246,0.3)]"
                : typeFilter === tf.value
                  ? "bg-brutify-gold/[0.1] border-brutify-gold/30 text-brutify-gold shadow-[0_0_28px_rgba(255,171,0,0.25)]"
                  : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:text-brutify-text-secondary hover:shadow-[0_0_12px_rgba(255,171,0,0.08)]"
            )}
          >
            {tf.label}
          </motion.button>
        ))}
      </motion.div>

      {items.length > 0 ? (
        <motion.div
          variants={gridStagger}
          initial="hidden"
          animate="show"
          key={typeFilter}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                variants={cardAnim}
                layout
                layoutId={item.id}
                custom={i}
              >
                <IdeaCard item={item} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState type={typeFilter} onAdd={() => setShowNewModal(true)} onInspire={handleInspire} inspiring={inspiring} />
      )}

      <NewIdeaModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onAdd={handleAdd}
        isCreating={isCreating}
      />
    </motion.div>
  );
}

// ── Idea Card ─────────────────────────────────────────────────────────────────

function IdeaCard({ item, onDelete }: { item: VaultItem; onDelete: (id: string) => void }) {
  const cfg = typeConfig[item.type as VaultType];
  const Icon = cfg?.icon ?? Lightbulb;
  const isAI = item.type === "ai";

  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : "Récent";

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.3, ease: "easeOut" } }}
      className={cn(
        "group relative flex flex-col rounded-2xl border backdrop-blur-sm p-5 transition-all duration-300",
        isAI
          ? "border-purple-500/30 bg-purple-500/[0.06] hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
          : "border-brutify-gold/10 bg-[#111113]/60 hover:border-brutify-gold/30 hover:shadow-[0_0_40px_rgba(255,171,0,0.25)] shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
      )}
    >
      {/* Permanent glow orbs */}
      {isAI ? (
        <>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-all duration-500" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        </>
      ) : (
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brutify-gold/[0.08] blur-3xl pointer-events-none group-hover:bg-brutify-gold/[0.15] transition-all duration-500" />
      )}

      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-body font-bold uppercase tracking-wider"
          style={{
            color: cfg?.color ?? "#CC8800",
            borderColor: (cfg?.color ?? "#CC8800") + "30",
            backgroundColor: (cfg?.color ?? "#CC8800") + "10",
          }}
        >
          <Icon className="h-3 w-3" />
          {cfg?.label ?? item.type}
        </span>
        {item.source_handle && (
          <span className="text-[11px] font-body text-brutify-text-muted">@{item.source_handle}</span>
        )}
      </div>

      <p className={cn(
        "text-sm font-body leading-relaxed mb-4 line-clamp-4 flex-1",
        isAI ? "text-purple-100/80" : "text-brutify-text-secondary"
      )}>
        {item.content}
      </p>

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-body",
                isAI
                  ? "border-purple-500/20 bg-purple-500/[0.08] text-purple-300"
                  : "border-brutify-gold/20 bg-brutify-gold/[0.06] text-brutify-gold"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-body text-brutify-text-muted">
          <Clock className="h-3 w-3" />
          {formattedDate}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ActionBtn icon={<ScrollText className="h-3 w-3" />} tooltip="Forger un script" onClick={() => {}} isAI={isAI} />
          <ActionBtn icon={<LayoutDashboard className="h-3 w-3" />} tooltip="Planifier" onClick={() => {}} isAI={isAI} />
          <ActionBtn icon={<Trash2 className="h-3 w-3" />} tooltip="Supprimer" onClick={() => onDelete(item.id)} danger />
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ icon, tooltip, onClick, danger, isAI }: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  danger?: boolean;
  isAI?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-125 hover:-translate-y-0.5",
        danger
          ? "border-white/[0.06] text-brutify-text-muted hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]"
          : isAI
            ? "border-purple-500/20 text-purple-400/60 hover:border-purple-500/50 hover:text-purple-300 hover:bg-purple-500/[0.12] hover:shadow-[0_0_16px_rgba(139,92,246,0.2)]"
            : "border-white/[0.06] text-brutify-text-muted hover:border-brutify-gold/30 hover:text-brutify-gold hover:bg-brutify-gold/[0.1] hover:shadow-[0_0_16px_rgba(255,171,0,0.2)]"
      )}
    >
      {icon}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  type,
  onAdd,
  onInspire,
  inspiring,
}: {
  type: FilterType;
  onAdd: () => void;
  onInspire: () => void;
  inspiring: boolean;
}) {
  const isAIFilter = type === "ai";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_EXPO }}
      className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-2xl border mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)]",
          isAIFilter
            ? "border-purple-500/20 bg-purple-500/[0.06]"
            : "border-white/[0.06] bg-[#111113]/60"
        )}
      >
        {isAIFilter
          ? <Sparkles className="h-9 w-9 text-purple-400/60" />
          : <Bookmark className="h-9 w-9 text-brutify-text-muted" />
        }
      </motion.div>
      <p className="font-display text-xl uppercase tracking-wider text-brutify-text-secondary mb-2">
        {isAIFilter ? "Aucune idée IA générée" : "Ton Vault est vide"}
      </p>
      <p className="text-sm font-body text-brutify-text-muted text-center max-w-sm mb-6">
        {isAIFilter
          ? "Génère des idées depuis les vidéos de tes créateurs. L'IA analyse les formats qui performent et propose des concepts originaux."
          : "Sauvegarde tes idées ici pour ne rien oublier. Ajoute des inspirations depuis les vidéos ou note tes propres concepts."
        }
      </p>
      <div className="flex items-center gap-3">
        {isAIFilter ? (
          <Button variant="primary" size="md" onClick={onInspire} disabled={inspiring}>
            {inspiring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {inspiring ? "Génération…" : "Générer des idées IA"}
          </Button>
        ) : (
          <>
            <Button variant="secondary" size="md" onClick={onInspire} disabled={inspiring}>
              {inspiring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Inspiration IA
            </Button>
            <Button variant="primary" size="md" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Ajouter une idée
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── New Idea Modal ────────────────────────────────────────────────────────────

function NewIdeaModal({
  open, onClose, onAdd, isCreating,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (body: { type: "video" | "script" | "manual"; content: string; tags?: string[] }) => void;
  isCreating: boolean;
}) {
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(",", "");
      if (newTag && !tags.includes(newTag)) setTags((prev) => [...prev, newTag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!content.trim() || isCreating) return;
    onAdd({ type: "manual", content: content.trim(), tags: tags.length > 0 ? tags : undefined });
    setContent(""); setTags([]); setTagInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-0 md:px-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Nouvelle idée"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: EASE_EXPO }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-2xl md:rounded-2xl border border-white/[0.08] bg-[#111113] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_rgba(255,171,0,0.05)] overflow-hidden max-h-[90vh] md:max-h-none overflow-y-auto"
          >
            <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(255,171,0,0.06) 0%, transparent 70%)" }} />

            <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display text-lg tracking-wider text-brutify-text-primary">NOUVELLE IDÉE</h2>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-2xl text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors duration-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Ton idée</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Décris ton idée, concept, angle de vidéo…"
                  rows={4}
                  className="w-full rounded-2xl border border-white/[0.06] bg-brutify-elevated px-4 py-2.5 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-200 focus:border-brutify-gold/30 focus:ring-1 focus:ring-brutify-gold/20 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Tags</label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-brutify-elevated px-3 py-2 min-h-[42px] transition-all duration-200 focus-within:border-brutify-gold/30 focus-within:ring-1 focus-within:ring-brutify-gold/20">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-2 py-0.5 text-[11px] font-body text-brutify-gold">
                      {tag}
                      <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-brutify-gold-light transition-colors cursor-pointer">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Ajoute des tags (Entrée pour valider)" : ""}
                    className="flex-1 min-w-[120px] bg-transparent text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none"
                  />
                </div>
                <p className="text-[10px] font-body text-brutify-text-muted mt-1">Appuie sur Entrée ou virgule pour ajouter un tag</p>
              </div>
            </div>

            <div className="relative flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
              <Button variant="ghost" size="md" onClick={onClose}>Annuler</Button>
              <Button variant="primary" size="md" onClick={handleSubmit} disabled={!content.trim() || isCreating}>
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sauvegarder"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
