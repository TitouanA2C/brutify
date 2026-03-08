"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ExternalLink, Edit3, Trash2 } from "lucide-react";
import { Loading } from "@/components/ui/Loading";

interface SocialHandleFieldProps {
  icon: React.ReactNode;
  label: string;
  accentColor: string;
  value: string;
  placeholder: string;
  profileUrl: string | null;
  onSave: (v: string) => Promise<void>;
  onAfterSave?: (v: string) => void;
  onUnlink?: () => void;
}

export function SocialHandleField({
  icon,
  label,
  accentColor,
  value,
  placeholder,
  profileUrl,
  onSave,
  onAfterSave,
  onUnlink,
}: SocialHandleFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (!value && !editing) setDraft(""); }, [value, editing]);

  const handleSave = async () => {
    const clean = draft.replace(/^@/, "").trim();
    if (clean === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(clean);
    setSaving(false);
    setEditing(false);
    onAfterSave?.(clean);
  };

  const handleUnlink = async () => {
    setConfirmUnlink(false);
    setEditing(false);
    setUnlinking(true);
    try {
      await onSave("");
    } finally {
      setUnlinking(false);
    }
    onUnlink?.();
  };

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor: value ? `${accentColor}20` : "rgba(255,255,255,0.05)",
        background: value ? `${accentColor}06` : "transparent",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border"
          style={{ borderColor: `${accentColor}30`, background: `${accentColor}12`, color: accentColor }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-body font-semibold uppercase tracking-wider mb-1"
            style={{ color: `${accentColor}90` }}
          >
            {label}
          </p>

          {editing ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-brutify-text-muted/40">
                  @
                </span>
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/^@/, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") { setEditing(false); setDraft(value); }
                  }}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-white/[0.12] bg-white/[0.04] pl-6 pr-3 py-1.5 text-sm font-body text-brutify-text-primary outline-none focus:border-white/[0.25] transition-colors"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !draft.trim()}
                className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-brutify-gold/10 border border-brutify-gold/20 text-brutify-gold hover:bg-brutify-gold/20 transition-colors disabled:opacity-30"
              >
                {saving ? <Loading variant="icon" size="sm" className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(value); }}
                className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center border border-white/[0.08] text-brutify-text-muted hover:bg-white/[0.05] transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {value ? (
                <span className="text-sm font-body font-medium text-brutify-text-primary">
                  @{value}
                </span>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm font-body text-brutify-text-muted/40 hover:text-brutify-text-muted transition-colors flex items-center gap-1.5"
                >
                  <span>Connecter</span>
                  <span style={{ color: accentColor }} className="text-[11px]">+</span>
                </button>
              )}
              {value && (
                <div className="flex items-center gap-1 ml-auto">
                  {profileUrl && (
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-6 w-6 rounded-md flex items-center justify-center border border-white/[0.08] text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <button
                    onClick={() => { setEditing(true); setDraft(value); }}
                    className="h-6 w-6 rounded-md flex items-center justify-center border border-white/[0.08] text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => setConfirmUnlink(true)}
                    className="h-6 w-6 rounded-md flex items-center justify-center border border-red-500/20 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {confirmUnlink && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-red-500/15"
          >
            <div className="flex items-center justify-between px-3 py-2.5 bg-red-500/[0.04]">
              <p className="text-xs font-body text-red-400">
                Délier <span className="font-semibold">@{value}</span> de {label} ?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmUnlink(false)}
                  className="px-3 py-1 rounded-lg text-[11px] font-body border border-white/[0.08] text-brutify-text-muted hover:bg-white/[0.05] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="px-3 py-1 rounded-lg text-[11px] font-body font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {unlinking ? (
                    <Loading variant="icon" size="sm" className="h-3 w-3" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Délier
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
