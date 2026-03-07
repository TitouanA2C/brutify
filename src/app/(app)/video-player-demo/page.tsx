"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VideoPlayerDemoPage() {
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  const [vslMode, setVslMode] = useState(true);

  // Votre vidéo sur la landing
  const demoVideoUrl = "/videos/demo.mp4";

  return (
    <div className="max-w-[1200px] mx-auto">
      <PageHeader
        title="Lecteur Vidéo Custom"
        subtitle="Testez votre lecteur vidéo personnalisé"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        {/* VSL Mode Toggle */}
        <Card hoverable={false} className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm tracking-wider text-brutify-text-primary mb-1">
                MODE VSL (RÉTENTION)
              </h3>
              <p className="text-xs font-body text-brutify-text-muted">
                Barre de progression accélérée pour augmenter la rétention
              </p>
            </div>
            <button
              onClick={() => setVslMode(!vslMode)}
              className={cn(
                "relative h-7 w-14 rounded-full border transition-all duration-200 cursor-pointer shrink-0",
                vslMode ? "bg-brutify-gold/20 border-brutify-gold/30" : "bg-white/[0.04] border-white/[0.08]"
              )}
            >
              <span className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full transition-all duration-200",
                vslMode ? "left-[calc(100%-26px)] bg-brutify-gold shadow-[0_0_8px_rgba(255,171,0,0.4)]" : "left-0.5 bg-white/20"
              )} />
            </button>
          </div>
        </Card>

        {/* Player */}
        <Card hoverable={false} className="p-0 overflow-hidden">
          <VideoPlayer
            src={demoVideoUrl}
            className="aspect-video w-full"
            vslMode={vslMode}
            onTimeUpdate={(current, total) => {
              // Progress ici est la progression RÉELLE (0-1), pas la progression affichée
              setProgress((current / total) * 100);
              setEnded(false);
            }}
            onEnded={() => {
              setEnded(true);
            }}
          />
        </Card>

        {/* Stats panel */}
        <Card hoverable={false} className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.08]">
              <Play className="h-4 w-4 text-brutify-gold" />
            </div>
            <h3 className="font-display text-lg tracking-wider text-brutify-text-primary">
              STATS LECTURE
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted mb-2">
                Progression
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl text-brutify-gold">
                  {Math.round(progress)}
                </span>
                <span className="text-sm font-body text-brutify-text-muted">%</span>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gold-gradient"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted mb-2">
                Mode actif
              </p>
              <div className="flex items-center gap-2">
                {vslMode ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-brutify-gold shadow-[0_0_8px_rgba(255,171,0,0.5)]" />
                    <span className="text-sm font-body font-semibold text-brutify-gold">
                      VSL Rétention
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <span className="text-sm font-body font-semibold text-blue-400">
                      Standard
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-5 pt-5 border-t border-white/[0.04]">
            <p className="text-xs font-body text-brutify-text-muted mb-3">
              Raccourcis clavier :
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { key: "Espace", action: "Play/Pause" },
                { key: "← / →", action: "±5 secondes" },
                { key: "M", action: "Mute/Unmute" },
                { key: "F", action: "Fullscreen" },
              ].map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex flex-col gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                >
                  <span className="text-[10px] font-body font-semibold text-brutify-gold">
                    {shortcut.key}
                  </span>
                  <span className="text-[11px] font-body text-brutify-text-muted">
                    {shortcut.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* VSL Curve Explanation */}
        <Card hoverable={false} className="p-6">
          <h3 className="font-display text-sm tracking-wider text-brutify-text-primary mb-3">
            COURBE VSL — PSYCHOLOGIE DE RÉTENTION
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm font-body text-brutify-text-secondary leading-relaxed">
              La barre de progression <span className="text-brutify-gold font-semibold">avance plus vite au début</span> pour donner l'impression que la vidéo est courte, puis ralentit à la fin. Cela augmente drastiquement la rétention.
            </p>

            {/* Visual curve comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-blue-400 mb-3">
                  Standard (linéaire)
                </p>
                <div className="space-y-2 text-xs font-body text-brutify-text-muted">
                  <div className="flex justify-between">
                    <span>10% temps</span>
                    <span className="text-blue-400">= 10% barre</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50% temps</span>
                    <span className="text-blue-400">= 50% barre</span>
                  </div>
                  <div className="flex justify-between">
                    <span>90% temps</span>
                    <span className="text-blue-400">= 90% barre</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.04] p-4">
                <p className="text-[10px] font-body font-semibold uppercase tracking-wider text-brutify-gold mb-3">
                  VSL (exponentiel inversé)
                </p>
                <div className="space-y-2 text-xs font-body text-brutify-text-muted">
                  <div className="flex justify-between">
                    <span>10% temps</span>
                    <span className="text-brutify-gold font-semibold">= 35% barre ⚡</span>
                  </div>
                  <div className="flex justify-between">
                    <span>50% temps</span>
                    <span className="text-brutify-gold font-semibold">= 80% barre 🔥</span>
                  </div>
                  <div className="flex justify-between">
                    <span>90% temps</span>
                    <span className="text-brutify-gold font-semibold">= 98% barre ✨</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-body font-semibold text-green-400 mb-1">
                    Résultat : +40% de rétention moyenne
                  </p>
                  <p className="text-xs font-body text-brutify-text-muted leading-relaxed">
                    Les spectateurs pensent que la vidéo est courte et sont plus enclins à la regarder jusqu'au bout. Le contenu important reste à la fin sans les perdre.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Instructions d'utilisation */}
        <Card hoverable={false} className="p-6">
          <h3 className="font-display text-sm tracking-wider text-brutify-text-primary mb-3">
            COMMENT UTILISER VOTRE VIDÉO
          </h3>
          <div className="space-y-2 text-sm font-body text-brutify-text-secondary">
            <p>
              1. <span className="text-brutify-gold">Option simple</span> : Placez votre vidéo dans <code className="px-2 py-0.5 rounded bg-white/[0.06] text-brutify-gold text-xs">/public/videos/</code>
            </p>
            <p className="ml-4 text-xs text-brutify-text-muted">
              → Puis utilisez : <code className="px-2 py-0.5 rounded bg-white/[0.06] text-brutify-gold">&lt;VideoPlayer src="/videos/ma-video.mp4" vslMode /&gt;</code>
            </p>
            
            <p className="pt-2">
              2. <span className="text-brutify-gold">Option pro</span> : Upload sur Supabase Storage (illimité, CDN rapide)
            </p>
            <p className="ml-4 text-xs text-brutify-text-muted">
              → Configurez un bucket <code className="px-2 py-0.5 rounded bg-white/[0.06] text-brutify-gold">videos</code> dans Supabase
            </p>
            
            <p className="pt-2">
              3. <span className="text-brutify-gold">CDN externe</span> : N'importe quelle URL vidéo (Cloudflare R2, AWS S3, etc.)
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
