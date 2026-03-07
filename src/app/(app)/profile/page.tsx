"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Edit3,
  Check,
  X,
  Crown,
  Users,
  Video,
  FileText,
  Loader2,
  Sparkles,
  Target,
  Mic,
  PenTool,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const PLAN_COLORS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  creator: { label: "Creator", color: "text-brutify-gold",         bg: "bg-brutify-gold/[0.08]",      border: "border-brutify-gold/20" },
  growth:  { label: "Growth",  color: "text-brutify-gold",        bg: "bg-brutify-gold/[0.08]",     border: "border-brutify-gold/20" },
  scale:   { label: "Scale",   color: "text-purple-400",          bg: "bg-purple-500/[0.08]",       border: "border-purple-500/20" },
};

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  credits: number;
  niche: string | null;
  tone_of_voice: string | null;
  writing_style: string | null;
  created_at: string;
}

interface Stats { creators: number; videos: number; scripts: number; }

function EditableField({
  label,
  icon,
  value,
  placeholder,
  onSave,
  readOnly,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder: string;
  onSave: (v: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-body font-medium uppercase tracking-wider text-brutify-text-muted/60">
        <span className="[&_svg]:h-3 [&_svg]:w-3">{icon}</span>
        {label}
      </label>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
            className="flex-1 rounded-xl border-2 border-brutify-gold/30 bg-white/[0.03] px-3 py-2 text-sm font-body text-brutify-text-primary outline-none focus:border-brutify-gold/50 focus:shadow-[0_0_24px_rgba(255,171,0,0.2)] focus:ring-2 focus:ring-brutify-gold/30 transition-all duration-200"
            placeholder={placeholder}
          />
          <button
            onClick={save}
            disabled={saving}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brutify-gold/10 border border-brutify-gold/20 text-brutify-gold hover:bg-brutify-gold/20 transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => { setDraft(value); setEditing(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.12] transition-all cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="group flex items-center justify-between rounded-xl border border-brutify-gold/10 bg-white/[0.02] px-3 py-2.5 transition-all duration-200 hover:border-brutify-gold/30 hover:shadow-[0_0_16px_rgba(255,171,0,0.1)]">
          <span className={cn("text-sm font-body", value ? "text-brutify-text-primary" : "text-brutify-text-muted/50")}>
            {value || placeholder}
          </span>
          {!readOnly && (
            <button
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex h-6 w-6 items-center justify-center rounded-md text-brutify-text-muted hover:text-brutify-gold cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { profile: ctxProfile, refreshProfile } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ creators: 0, videos: 0, scripts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfileData(d.profile);
        if (d.stats) setStats(d.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = useCallback(async (field: string, value: string) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (data.profile) {
      setProfileData(data.profile);
      await refreshProfile();
    }
  }, [refreshProfile]);

  const plan = profileData?.plan ?? ctxProfile?.plan ?? "creator";
  const planStyle = PLAN_COLORS[plan] ?? PLAN_COLORS.free;
  const memberSince = profileData?.created_at
    ? new Date(profileData.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : "—";

  const avatarUrl = profileData?.avatar_url || ctxProfile?.avatar_url;
  const fullName = profileData?.full_name || ctxProfile?.full_name || "";
  const email = profileData?.email || ctxProfile?.email || "";
  const initials = fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || email[0]?.toUpperCase() || "?";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-brutify-gold" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease }}
      className="max-w-2xl mx-auto"
    >
      <PageHeader title="Mon profil" subtitle="Gère tes informations personnelles" />

      {/* ── Identity card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05, ease }}
        className="mb-6 rounded-2xl border-2 border-brutify-gold/20 bg-[#111113]/60 backdrop-blur-sm overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_40px_rgba(255,171,0,0.15)]"
      >
        {/* Banner */}
        <div className="relative h-24 bg-gradient-to-br from-brutify-gold/15 via-transparent to-purple-500/10 overflow-hidden">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 80% at 20% 50%, rgba(255,171,0,0.2) 0%, transparent 70%)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 100% at 80% 50%, rgba(255,171,0,0.15) 0%, transparent 60%)" }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-px bg-gradient-to-r from-transparent via-brutify-gold/50 to-transparent shadow-[0_0_12px_rgba(255,171,0,0.3)]" />
        </div>

        <div className="px-6 -mt-10 pb-6">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-[72px] w-[72px] rounded-2xl border-4 border-brutify-gold/40 bg-[#111113] overflow-hidden shadow-[0_0_40px_rgba(255,171,0,0.35)]" style={{ outline: "3px solid rgba(255,171,0,0.3)" }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={fullName} fill className="object-cover" sizes="72px" unoptimized />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-brutify-gold/10 text-brutify-gold font-display text-2xl">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {/* Name + plan */}
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="font-display text-xl uppercase tracking-wider text-white truncate">
                {fullName || "Nom non renseigné"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-body font-semibold", planStyle.color, planStyle.bg, planStyle.border)}>
                  <Crown className="h-2.5 w-2.5" />
                  {planStyle.label}
                </span>
                <span className="text-[11px] font-body text-brutify-text-muted/50">
                  Membre depuis {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-0">
            {[
              { icon: <Users className="h-4 w-4" />, label: "Créateurs", value: stats.creators },
              { icon: <Video className="h-4 w-4" />, label: "Vidéos analysées", value: stats.videos },
              { icon: <FileText className="h-4 w-4" />, label: "Scripts générés", value: stats.scripts },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.4, ease }}
                className="rounded-xl border-2 border-brutify-gold/15 bg-white/[0.02] p-3 text-center transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-brutify-gold/40 hover:shadow-[0_0_28px_rgba(255,171,0,0.2)]"
              >
                <div className="flex justify-center text-brutify-gold/60 mb-1">{s.icon}</div>
                <p className="font-display text-xl text-brutify-text-primary">{s.value}</p>
                <p className="text-[10px] font-body text-brutify-text-muted/60 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Informations ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15, ease }}
        className="mb-6 rounded-2xl border-2 border-brutify-gold/10 bg-[#111113]/60 backdrop-blur-sm p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]"
      >
        <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-muted/60 mb-4">
          Informations
        </h3>
        <div className="space-y-4">
          <EditableField
            label="Nom complet"
            icon={<User />}
            value={fullName}
            placeholder="Ton prénom et nom"
            onSave={(v) => updateField("full_name", v)}
          />
          <EditableField
            label="Email"
            icon={<Mail />}
            value={email}
            placeholder="—"
            onSave={async () => {}}
            readOnly
          />
        </div>
      </motion.div>

      {/* ── Préférences contenu ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease }}
        className="mb-6 rounded-2xl border-2 border-brutify-gold/10 bg-[#111113]/60 backdrop-blur-sm p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]"
      >
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-brutify-gold" />
          <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-muted/60">
            Préférences IA
          </h3>
        </div>
        <p className="text-[11px] font-body text-brutify-text-muted/50 mb-4">
          Ces infos personnalisent la génération de scripts
        </p>
        <div className="space-y-4">
          <EditableField
            label="Niche"
            icon={<Target />}
            value={profileData?.niche ?? ""}
            placeholder="ex : Business en ligne, Fitness, Finance..."
            onSave={(v) => updateField("niche", v)}
          />
          <EditableField
            label="Ton de voix"
            icon={<Mic />}
            value={profileData?.tone_of_voice ?? ""}
            placeholder="ex : Direct, inspirant, éducatif..."
            onSave={(v) => updateField("tone_of_voice", v)}
          />
          <EditableField
            label="Style d'écriture"
            icon={<PenTool />}
            value={profileData?.writing_style ?? ""}
            placeholder="ex : Court et percutant, storytelling..."
            onSave={(v) => updateField("writing_style", v)}
          />
        </div>
      </motion.div>

      {/* ── Plan & BP ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.25, ease }}
        className="rounded-2xl border-2 border-brutify-gold/10 bg-[#111113]/60 backdrop-blur-sm p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3),0_0_20px_rgba(255,171,0,0.08)]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm uppercase tracking-widest text-brutify-text-muted/60 mb-0.5">
              Abonnement
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-body font-semibold", planStyle.color, planStyle.bg, planStyle.border)}>
                <Crown className="h-3 w-3" />
                Plan {planStyle.label}
              </span>
              <span className="text-sm font-body text-brutify-text-muted">
                · <span className="text-brutify-gold font-semibold">{profileData?.credits ?? 0} BP</span> restants
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.06] px-3 py-2 text-xs font-body font-semibold text-brutify-gold hover:bg-brutify-gold/[0.1] transition-all"
          >
            Gérer
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

