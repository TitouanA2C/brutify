"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import {
  Search,
  PenTool,
  Play,
  ChevronDown,
  Star,
  ArrowRight,
  Check,
  Users,
  Eye,
  Menu,
  X,
  FileText,
  Bookmark,
  Brain,
  FolderOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flame,
  Heart,
  MessageCircle,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS, type PlanKey } from "@/lib/stripe/config";
import { BrutifyLogo } from "@/components/ui/BrutifyLogo";
import { VideoPlayer } from "@/components/ui/VideoPlayer";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";

// ─── Mini UI Components for Features ─────────────────────────────────────────

function MiniCreatorCard() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-3 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Creator identity */}
      <div className="flex items-center gap-2.5 mb-3">
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(225,48,108,0)",
              "0 0 0 4px rgba(225,48,108,0.1)",
              "0 0 0 0 rgba(225,48,108,0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 ring-2 ring-pink-500/20"
        />
        <div className="flex-1 min-w-0">
          <div className="h-2 w-20 bg-white/15 rounded mb-1.5" />
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ background: "linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)" }} />
            <div className="h-1.5 w-16 bg-pink-500/20 rounded" />
          </div>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 border border-white/[0.06]">
          <div className="h-1 w-8 bg-white/15 rounded mb-1" />
          <motion.div
            animate={{
              width: ["48px", "52px", "48px"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="h-2.5 bg-brutify-gold/30 rounded"
          />
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5 border border-white/[0.06]">
          <div className="h-1 w-10 bg-white/15 rounded mb-1" />
          <div className="h-2.5 w-10 bg-white/25 rounded" />
        </div>
      </div>

      {/* Outlier badge with pulse */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 8px rgba(255,171,0,0.2)",
            "0 0 16px rgba(255,171,0,0.4)",
            "0 0 8px rgba(255,171,0,0.2)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-brutify-gold/25 bg-brutify-gold/[0.08] w-fit"
      >
        <Flame className="h-2.5 w-2.5 text-brutify-gold" />
        <span className="text-[8px] font-display tracking-wider text-brutify-gold">8 OUTLIERS</span>
      </motion.div>
    </div>
  );
}

function MiniVideoCard() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 overflow-hidden scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Thumbnail with gradient */}
      <div className="relative h-20 bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-orange-900/20 overflow-hidden">
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Play className="h-3 w-3 text-white/90 ml-0.5" />
          </div>
        </div>
        
        {/* Outlier badge */}
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-brutify-gold/20 border border-brutify-gold/40 shadow-[0_0_12px_rgba(255,171,0,0.3)]">
            <Flame className="h-2.5 w-2.5 text-brutify-gold-light" />
            <span className="text-[9px] font-display tracking-wider text-brutify-gold">15x</span>
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10">
          <span className="text-[8px] font-body font-semibold text-white/90">0:42</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-2.5">
        <div className="h-1.5 w-full bg-white/10 rounded mb-1.5" />
        <div className="h-1.5 w-3/4 bg-white/10 rounded mb-3" />
        
        {/* Stats row */}
        <div className="flex gap-1.5">
          <motion.div
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(255,171,0,0)",
                "0 0 0 2px rgba(255,171,0,0.2)",
                "0 0 0 0 rgba(255,171,0,0)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20"
          >
            <Eye className="h-2.5 w-2.5 text-brutify-gold" />
            <span className="text-[8px] font-display text-brutify-gold">2.4M</span>
          </motion.div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Heart className="h-2.5 w-2.5 text-white/40" />
            <span className="text-[8px] text-white/50">180K</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <MessageCircle className="h-2.5 w-2.5 text-white/40" />
            <span className="text-[8px] text-white/50">4.2K</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniHooksList() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-3 space-y-2 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {[
        { tag: "Curiosité", emoji: "🤔", width: "w-full", lines: 2 },
        { tag: "Contrarian", emoji: "⚡", width: "w-5/6", lines: 2 },
        { tag: "Question", emoji: "❓", width: "w-11/12", lines: 1 },
      ].map((hook, i) => (
        <div key={i} className="rounded-lg border border-brutify-gold/15 bg-brutify-gold/[0.04] p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px]">{hook.emoji}</span>
            <span className="text-[8px] font-display uppercase tracking-wider text-brutify-gold/70">{hook.tag}</span>
            <div className="ml-auto h-1 w-1 rounded-full bg-brutify-gold/30" />
          </div>
          <div className="space-y-1">
            {Array.from({ length: hook.lines }).map((_, j) => (
              <div key={j} className={`h-1 ${j === hook.lines - 1 ? hook.width : "w-full"} bg-white/10 rounded`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniWatchlist() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-2.5 space-y-2 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {[
        { gradient: "from-pink-500 to-orange-400", platform: "#E1306C" },
        { gradient: "from-red-600 to-red-500", platform: "#FF0000" },
        { gradient: "from-cyan-500 to-pink-500", platform: "#69C9D0" },
      ].map((creator, i) => (
        <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.08] transition-colors group/item">
          <div className="relative">
            <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${creator.gradient}`} />
            <div 
              className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0d0d12]" 
              style={{ background: creator.platform }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="h-1.5 w-16 bg-white/12 rounded mb-1" />
            <div className="h-1 w-12 bg-white/[0.07] rounded" />
          </div>
          <div className="flex items-center gap-0.5">
            <div className="h-1 w-1 rounded-full bg-brutify-gold/40" />
            <div className="h-1 w-1 rounded-full bg-brutify-gold/40" />
            <div className="h-1 w-1 rounded-full bg-brutify-gold/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniTranscript() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-3 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.05]">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-brutify-gold" />
          <div className="h-1.5 w-16 bg-brutify-gold/20 rounded" />
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-brutify-gold/10 border border-brutify-gold/20">
          <span className="text-[7px] font-display text-brutify-gold">2 BP</span>
        </div>
      </div>
      
      {/* Transcript lines */}
      <div className="space-y-1.5">
        {[
          { width: "w-full", opacity: "opacity-100" },
          { width: "w-11/12", opacity: "opacity-100" },
          { width: "w-2/3", opacity: "opacity-90" },
          { width: "w-5/6", opacity: "opacity-90" },
          { width: "w-1/2", opacity: "opacity-80" },
        ].map((line, i) => (
          <div key={i} className={`h-1 ${line.width} ${line.opacity} bg-white/[0.08] rounded`} />
        ))}
      </div>
    </div>
  );
}

function MiniScript() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-brutify-gold/25 bg-gradient-to-br from-brutify-gold/[0.1] via-brutify-gold/[0.05] to-[#0d0d12]/95 p-3 scale-90 shadow-[0_0_24px_rgba(255,171,0,0.15),0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Header with icon */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-lg bg-brutify-gold/20 border border-brutify-gold/30 flex items-center justify-center">
            <ScrollText className="h-3 w-3 text-brutify-gold" />
          </div>
          <div className="h-1.5 w-20 bg-brutify-gold/30 rounded" />
        </div>
        <Star className="h-3 w-3 text-brutify-gold/50 fill-brutify-gold/20" />
      </div>
      
      {/* Script lines with different intensities */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-brutify-gold/20 rounded shadow-[0_0_8px_rgba(255,171,0,0.1)]" />
        <div className="h-1.5 w-5/6 bg-brutify-gold/15 rounded" />
        <div className="h-1.5 w-11/12 bg-brutify-gold/15 rounded" />
        <div className="h-1 w-1/2 bg-white/[0.08] rounded mt-2" />
        <div className="h-1.5 w-4/6 bg-brutify-gold/15 rounded" />
        <div className="h-1.5 w-full bg-brutify-gold/15 rounded" />
      </div>
      
      {/* Footer action - typing animation */}
      <div className="mt-2.5 pt-2 border-t border-brutify-gold/10 flex items-center gap-1">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-1 w-1 rounded-full bg-brutify-gold shadow-[0_0_6px_rgba(255,171,0,0.6)]"
        />
        <motion.div
          animate={{
            width: ["24px", "96px", "24px"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-1 bg-brutify-gold/20 rounded"
        />
      </div>
    </div>
  );
}

function MiniAnalysis() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-3 space-y-2 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Hook analysis */}
      <div className="rounded-lg border border-brutify-gold/20 bg-brutify-gold/[0.06] p-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-1 w-1 rounded-full bg-brutify-gold/60" />
          <div className="h-1 w-10 bg-brutify-gold/40 rounded" />
          <div className="ml-auto px-1.5 py-0.5 rounded bg-brutify-gold/15 border border-brutify-gold/25">
            <span className="text-[7px] font-display text-brutify-gold">HOOK</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-start gap-1">
            <div className="mt-1 h-0.5 w-0.5 rounded-full bg-brutify-gold/40" />
            <div className="h-1 w-full bg-white/[0.1] rounded" />
          </div>
          <div className="flex items-start gap-1">
            <div className="mt-1 h-0.5 w-0.5 rounded-full bg-brutify-gold/40" />
            <div className="h-1 w-4/5 bg-white/[0.1] rounded" />
          </div>
        </div>
      </div>

      {/* Structure + Style badges */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-1.5 text-center">
          <div className="h-1 w-12 mx-auto bg-white/10 rounded mb-1" />
          <div className="h-1.5 w-8 mx-auto bg-brutify-gold/20 rounded" />
        </div>
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-1.5 text-center">
          <div className="h-1 w-10 mx-auto bg-white/10 rounded mb-1" />
          <div className="h-1.5 w-10 mx-auto bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );
}

function MiniBoard() {
  return (
    <div className="absolute inset-3 top-10 rounded-xl border border-white/[0.08] bg-[#0d0d12]/95 p-2.5 space-y-1.5 scale-90 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {[
        { 
          status: "Idée", 
          color: "bg-purple-500/15", 
          border: "border-purple-500/25",
          dot: "bg-purple-400",
          width: "w-3/4" 
        },
        { 
          status: "En cours", 
          color: "bg-brutify-gold/15", 
          border: "border-brutify-gold/30",
          dot: "bg-brutify-gold",
          width: "w-5/6" 
        },
        { 
          status: "Publié", 
          color: "bg-green-500/15", 
          border: "border-green-500/25",
          dot: "bg-green-400",
          width: "w-2/3" 
        },
      ].map((item, i) => (
        <div key={i} className={`rounded-lg border ${item.border} ${item.color} p-2 transition-all hover:scale-[1.02]`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${item.dot} shadow-[0_0_6px_currentColor]`} />
            <div className="h-1 w-10 bg-white/15 rounded" />
          </div>
          <div className={`h-1.5 ${item.width} bg-white/15 rounded mb-1`} />
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded bg-white/[0.06] border border-white/[0.08]" />
            <div className="h-1 w-16 bg-white/[0.08] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "Comment ça marche", id: "how" },
    { label: "Pricing", id: "pricing" },
    { label: "FAQ", id: "faq" },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 md:px-6 pt-4 md:pt-5"
      aria-label="Navigation principale"
    >
      <nav
        className="relative w-full max-w-6xl flex items-center justify-between rounded-full px-5 md:px-8 py-3 bg-white/[0.03] backdrop-blur-xl border border-brutify-gold/[0.12] shadow-[0_0_20px_rgba(255,171,0,0.06),0_0_60px_rgba(255,171,0,0.03)]"
      >
        {/* Logo */}
        <BrutifyLogo size="md" />

        {/* Center links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-[14px] font-body font-medium text-white/50 hover:text-white transition-colors duration-200"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden md:inline-flex text-[14px] font-body font-medium text-white/40 hover:text-white transition-colors duration-200"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="hidden md:inline-flex items-center rounded-full border border-white/[0.15] bg-white/[0.05] px-5 py-2 text-[14px] font-body font-semibold text-white hover:bg-white/[0.1] hover:border-white/[0.25] transition-all duration-200"
          >
            Essai gratuit
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg md:hidden"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-white/60" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5 text-white/60" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-4 right-4 mt-2 rounded-2xl bg-[#0a0a0d]/95 backdrop-blur-xl border border-brutify-gold/[0.1] shadow-[0_0_30px_rgba(255,171,0,0.05)] p-4 flex flex-col gap-1 md:hidden"
          >
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="w-full text-left py-3 px-3 rounded-xl text-[15px] font-body font-medium text-white/50 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
              >
                {item.label}
              </button>
            ))}
            <div className="h-px bg-white/[0.06] my-2" />
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="w-full text-left py-3 px-3 rounded-xl text-[15px] font-body font-medium text-white/40 hover:text-white transition-colors duration-200 block"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.05] px-5 py-3 text-[15px] font-body font-semibold text-white"
            >
              Essai gratuit
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

// ─── Hero VSL ────────────────────────────────────────────────────────────────

function HeroVSL() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
      className="w-full max-w-5xl mx-auto mb-10 px-2 md:px-6"
    >
      <div className="relative">
        {/* Outer pulsing glow */}
        <motion.div
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -inset-6 rounded-3xl bg-brutify-gold/20 blur-3xl"
        />
        
        {/* Static gold glow */}
        <div
          className="absolute -inset-1 rounded-2xl pointer-events-none opacity-40"
          style={{
            background: "linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,171,0,0.1) 40%, transparent 60%, rgba(204,136,0,0.08) 100%)",
          }}
        />

        {/* Video container with premium border */}
        <div className="relative rounded-2xl overflow-hidden border border-brutify-gold/20 shadow-[0_0_40px_rgba(255,171,0,0.15),0_20px_80px_rgba(0,0,0,0.6)]">
          <VideoPlayer 
            src="/videos/demo.mp4"
            className="aspect-video w-full"
            vslMode={true}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Dot Pattern Background */}
      <DotPattern
        className="opacity-20"
        width={40}
        height={40}
        cx={1}
        cy={1}
        cr={0.8}
        glow={false}
      />
      
      {/* Hero-specific intense glow behind title area */}
      <div
        className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none opacity-[0.08]"
        style={{
          background: "radial-gradient(ellipse at center, #FFAB00 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      {/* Soft warm light from top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none opacity-[0.05]"
        style={{
          background: "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,171,0,0.4) 120deg, transparent 240deg)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Trust badge with animated number */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-8"
          >
            <div className="flex -space-x-1.5">
              {[11, 5, 9].map((img) => (
                <div key={img} className="h-5 w-5 rounded-full border border-brutify-bg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.pravatar.cc/40?img=${img}`} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-xs font-body font-medium text-brutify-gold">
              Utilisé par <NumberTicker value={76099} className="text-xs font-body font-medium text-brutify-gold" /> créateurs
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] leading-[0.95] tracking-wider mb-6"
          >
            Crée du contenu{" "}
            <span className="text-gold-gradient">viral</span>
            <br />
            en quelques secondes
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
          >
            La façon la plus simple de rechercher les meilleurs créateurs, trouver les vidéos virales, et les transformer en tes propres contenus gagnants.
          </motion.p>
        </div>

        {/* VSL Video — Sortie du conteneur max-w-4xl */}
        <HeroVSL />

        <div className="max-w-4xl mx-auto">
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
          >
            <Link href="/signup" className="group relative inline-flex">
              {/* Ambient glow */}
              <div className="absolute -inset-3 rounded-2xl bg-brutify-gold/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
              {/* Outer gold border ring */}
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-b from-brutify-gold-light via-brutify-gold to-brutify-gold-dark opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Border Beam Animation */}
              <BorderBeam size={300} duration={12} delay={0} colorFrom="#FFD700" colorTo="#FFAB00" />
              {/* Inner button */}
              <div className="relative flex items-center gap-3 rounded-[10px] bg-gradient-to-b from-[#1a1400] via-[#130f00] to-[#0d0a00] px-8 py-3.5">
                <span className="text-[15px] font-body font-semibold text-brutify-gold-light group-hover:text-white transition-colors duration-200">
                  Essai gratuit
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brutify-gold/15 group-hover:bg-brutify-gold/25 transition-colors duration-200">
                  <ArrowRight className="h-3.5 w-3.5 text-brutify-gold transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown className="h-6 w-6 text-brutify-text-muted" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Features (8 features like Sandcastles) ──────────────────────────────────

const featuresData = [
  {
    icon: Users,
    title: "Découvre les créateurs qui cartonnent",
    titleAccent: "cartonnent",
    description: "Identifie les créateurs les plus performants dans ta niche et réplique leurs stratégies dans ta prochaine vidéo.",
    miniUI: MiniCreatorCard,
  },
  {
    icon: Eye,
    title: "Trouve les vidéos virales",
    titleAccent: "virales",
    description: "Explore une base de données de milliers de vidéos outliers validées sur Instagram, TikTok et YouTube.",
    miniUI: MiniVideoCard,
  },
  {
    icon: Star,
    title: "Génère des dizaines de hooks gagnants",
    titleAccent: "hooks gagnants",
    description: "Élimine le hasard en utilisant des templates de hooks qui ont généré des millions de vues.",
    miniUI: MiniHooksList,
  },
  {
    icon: Bookmark,
    title: "Construis des listes de créateurs performants",
    titleAccent: "créateurs performants",
    description: "Suis n'importe quel créateur sur Instagram, TikTok et YouTube depuis un seul endroit.",
    miniUI: MiniWatchlist,
  },
  {
    icon: FileText,
    title: "Télécharge la transcription de n'importe quelle vidéo",
    titleAccent: "transcription",
    description: "Gagne du temps en utilisant des transcriptions de haute qualité comme référence.",
    miniUI: MiniTranscript,
  },
  {
    icon: PenTool,
    title: "Écris des scripts viraux en quelques secondes",
    titleAccent: "scripts viraux",
    description: "Utilise des frameworks narratifs éprouvés qui ont généré des milliards de vues.",
    miniUI: MiniScript,
  },
  {
    icon: Brain,
    title: "Comprends pourquoi les meilleures vidéos ont buzzé",
    titleAccent: "buzzé",
    description: "Obtiens une analyse approfondie des hooks, du storytelling, des formats et des styles.",
    miniUI: MiniAnalysis,
  },
  {
    icon: FolderOpen,
    title: "Organise tes idées gagnantes avec le BrutBoard",
    titleAccent: "BrutBoard",
    description: "Crée des collections d'idées gagnantes pour accélérer ton workflow de création.",
    miniUI: MiniBoard,
  },
];

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [activeFeature, setActiveFeature] = useState(0);

  const scrollFeatures = (dir: "left" | "right") => {
    const next = dir === "right"
      ? Math.min(activeFeature + 1, featuresData.length - 1)
      : Math.max(activeFeature - 1, 0);
    setActiveFeature(next);
  };

  return (
    <section id="features" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header with staggered text reveal */}
        <div className="flex items-end justify-between mb-14">
          <div className="overflow-hidden">
            <motion.h2
              initial={{ opacity: 0, y: 60 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary leading-tight"
            >
              Tout ce qu&apos;il te faut pour créer
            </motion.h2>
            <motion.h2
              initial={{ opacity: 0, y: 60 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary leading-tight"
            >
              du contenu <span className="text-gold-gradient">qui gagne</span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:flex items-center gap-2"
          >
            <button
              onClick={() => scrollFeatures("left")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.15] transition-colors duration-200"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollFeatures("right")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-brutify-gold/10 text-brutify-gold hover:bg-brutify-gold/20 transition-colors duration-200"
              aria-label="Suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>
        </div>

        {/* Feature cards with AnimatePresence for page transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {featuresData.slice(activeFeature, activeFeature + 4).map((feat, i) => {
              const Icon = feat.icon;
              const MiniUI = feat.miniUI;
              const titleParts = feat.title.split(feat.titleAccent);
              return (
                <motion.div
                  key={feat.titleAccent}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{
                    delay: 0.2 + i * 0.12,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="group flex flex-col rounded-2xl border border-white/[0.06] bg-[#111113]/60 backdrop-blur-sm overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-brutify-gold/20 hover:shadow-[0_0_30px_rgba(255,171,0,0.12)]"
                >
                  {/* Real UI preview area */}
                  <div className="relative h-44 bg-[#0a0a0e] border-b border-white/[0.04] overflow-hidden">
                    {/* Window chrome (top bar) */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-[#0d0d12]/80 border-b border-white/[0.04] flex items-center px-3 gap-1.5 z-10">
                      <div className="h-2 w-2 rounded-full bg-red-500/40" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500/40" />
                      <div className="h-2 w-2 rounded-full bg-green-500/40" />
                    </div>

                    {/* Mini UI Component */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 pt-8"
                    >
                      <MiniUI />
                    </motion.div>

                    {/* Gold shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-brutify-gold/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Subtle scan line effect */}
                    <motion.div
                      animate={{
                        y: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-brutify-gold/[0.02] to-transparent opacity-50 pointer-events-none"
                    />
                  </div>

                  {/* Text */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-body text-sm font-semibold text-brutify-text-primary leading-snug mb-2">
                      {titleParts[0]}
                      <span className="text-brutify-gold">{feat.titleAccent}</span>
                      {titleParts[1] || ""}
                    </h3>
                    <p className="text-xs font-body text-brutify-text-secondary leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              );
          })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const stepsData = [
  {
    step: "ÉTAPE 1",
    title: "Personnalise ton feed",
    description: "Découvre les créateurs qui cartonnent sur Instagram, TikTok et YouTube Shorts.",
  },
  {
    step: "ÉTAPE 2",
    title: "Trouve les vidéos outliers",
    description: "Explore les vidéos les plus performantes dans ta niche.",
  },
  {
    step: "ÉTAPE 3",
    title: "Comprends pourquoi elles ont buzzé",
    description: "Obtiens une analyse approfondie de pourquoi ces vidéos ont explosé, et comment tu peux recréer leur succès.",
  },
  {
    step: "ÉTAPE 4",
    title: "Écris tes propres scripts gagnants",
    description: "Transforme tes idées en scripts uniques, en utilisant des structures narratives basées sur la data.",
  },
];

function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const prevStep = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const raw = v * stepsData.length;
    const step = Math.min(stepsData.length - 1, Math.floor(raw));
    if (step !== prevStep.current) {
      prevStep.current = step;
      setActiveStep(step);
    }
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const progressOpacity = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [0, 1, 1, 0]);
  const progressScale = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [0.6, 1, 1, 0.6]);
  const progressX = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [20, 0, 0, 20]);
  const progressBlur = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [8, 0, 0, 8]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.9, 1], [0, 0.6, 0.6, 0]);

  return (
    <section id="how" className="relative border-t border-white/[0.04]">
      <div
        ref={containerRef}
        style={{ height: `${stepsData.length * 50}vh` }}
        className="relative"
      >
        <div className="sticky top-0 h-screen flex items-center">
          <motion.div
            className="fixed right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4"
            style={{
              opacity: progressOpacity,
              scale: progressScale,
              x: progressX,
              filter: useTransform(progressBlur, (v) => `blur(${v}px)`),
            }}
          >
            <div className="relative flex flex-col items-center">
              <motion.div
                className="absolute -inset-5 rounded-full"
                style={{
                  opacity: glowOpacity,
                  background: "radial-gradient(circle, rgba(255,171,0,0.25) 0%, transparent 65%)",
                  filter: "blur(12px)",
                }}
              />
              <div className="w-1.5 h-48 rounded-full bg-white/[0.1] overflow-hidden relative border border-white/[0.06]">
                <motion.div
                  className="absolute top-0 left-0 w-full rounded-full bg-gradient-to-b from-brutify-gold to-brutify-gold-light shadow-[0_0_8px_rgba(255,171,0,0.5)]"
                  style={{ height: progressHeight }}
                />
              </div>
            </div>
            <motion.div
              className="flex flex-col items-center gap-1"
              key={activeStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-lg font-display text-brutify-gold tabular-nums">
                {activeStep + 1}
              </span>
              <div className="w-3 h-px bg-brutify-gold/40" />
              <span className="text-[10px] font-body text-brutify-text-muted tabular-nums">
                {stepsData.length}
              </span>
            </motion.div>
          </motion.div>

          <div className="w-full px-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10">
                <h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4">
                  Comment ça marche
                </h2>
                <p className="text-base font-body text-brutify-text-secondary max-w-xl">
                  Brutify gère le gros du travail de recherche et de rédaction pour que tu puisses te concentrer sur la création de tes vidéos.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                <div className="space-y-2">
                  {stepsData.map((step, i) => (
                    <div
                      key={step.step}
                      className={cn(
                        "w-full text-left rounded-xl p-5 transition-all duration-500 border",
                        activeStep === i
                          ? "border-brutify-gold/20 bg-brutify-gold/[0.04]"
                          : "border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-body font-semibold uppercase tracking-wider transition-colors duration-500",
                        activeStep === i ? "text-brutify-gold" : "text-brutify-text-muted"
                      )}>
                        {step.step}
                      </span>
                      <h3 className={cn(
                        "font-display text-xl md:text-2xl tracking-wider mt-1 transition-colors duration-500",
                        activeStep === i ? "text-brutify-text-primary" : "text-brutify-text-muted"
                      )}>
                        {step.title}
                      </h3>
                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-500",
                          activeStep === i ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                        )}
                      >
                        <p className="text-sm font-body text-brutify-text-secondary leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 flex items-center gap-2">
                    {stepsData.map((_, i) => (
                      <div key={i} className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gold-gradient"
                          initial={false}
                          animate={{ width: activeStep >= i ? "100%" : "0%" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D12] p-6 min-h-[400px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeStep}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="space-y-4"
                    >
                      {activeStep === 0 && (
                        <div className="space-y-3">
                          {/* Search bar - vraie UI */}
                          <div className="flex items-center gap-2 mb-4">
                            <Search className="h-4 w-4 text-brutify-gold/60" />
                            <div className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 flex items-center backdrop-blur-sm">
                              <span className="text-sm font-body text-brutify-text-muted">Rechercher un créateur...</span>
                            </div>
                            <button className="rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-body font-semibold text-[#0d0a00] shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.5)] transition-all">
                              Ajouter
                            </button>
                          </div>
                          
                          {/* Créateurs avec vrais éléments */}
                          {[
                            { handle: "@fitness.coach", followers: "142K", gradient: "from-pink-500 to-orange-400", platform: "#E1306C" },
                            { handle: "@business.bro", followers: "89K", gradient: "from-red-600 to-red-500", platform: "#FF0000" },
                            { handle: "@nutrition.queen", followers: "256K", gradient: "from-purple-500 to-pink-500", platform: "#E1306C" },
                          ].map((creator, i) => (
                            <motion.div
                              key={creator.handle}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
                              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 hover:border-white/[0.1] hover:bg-white/[0.04] transition-all group/item"
                            >
                              <div className="relative">
                                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${creator.gradient} ring-2 ring-white/[0.08] group-hover/item:ring-brutify-gold/20 transition-all`} />
                                <div 
                                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0d12] flex items-center justify-center"
                                  style={{ background: creator.platform }}
                                >
                                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-body font-semibold text-brutify-text-primary">{creator.handle}</p>
                                <p className="text-xs font-body text-brutify-text-muted">{creator.followers} abonnés</p>
                              </div>
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-brutify-gold/20 bg-brutify-gold/[0.08]">
                                <Flame className="h-3 w-3 text-brutify-gold" />
                                <span className="text-[10px] font-display text-brutify-gold">{[8, 5, 12][i]}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {activeStep === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {[
                            { score: 35.7, views: "3.4M", gradient: "from-purple-900/60 via-pink-900/40 to-orange-900/30" },
                            { score: 12.4, views: "1.8M", gradient: "from-blue-900/60 via-purple-900/40 to-pink-900/30" },
                            { score: 8.9, views: "920K", gradient: "from-cyan-900/60 via-blue-900/40 to-purple-900/30" },
                            { score: 24.1, views: "2.1M", gradient: "from-pink-900/60 via-red-900/40 to-orange-900/30" },
                            { score: 6.6, views: "1.2M", gradient: "from-green-900/60 via-emerald-900/40 to-cyan-900/30" },
                            { score: 41.2, views: "5.6M", gradient: "from-yellow-900/60 via-orange-900/40 to-red-900/30" },
                          ].map((video, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.06, duration: 0.3 }}
                              className="rounded-xl overflow-hidden aspect-[9/16] bg-black/40 border border-white/[0.06] flex flex-col hover:border-brutify-gold/20 transition-all group/vid relative"
                            >
                              {/* Thumbnail with gradient */}
                              <div className={`flex-1 bg-gradient-to-br ${video.gradient} relative overflow-hidden`}>
                                {/* Play button */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/vid:opacity-100 transition-opacity">
                                  <div className="h-7 w-7 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                    <Play className="h-3.5 w-3.5 text-white ml-0.5" />
                                  </div>
                                </div>
                                
                                {/* Outlier badge */}
                                <div className="absolute top-2 left-2">
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-brutify-gold/20 border border-brutify-gold/40 shadow-[0_0_12px_rgba(255,171,0,0.3)] backdrop-blur-sm">
                                    <Flame className="h-2.5 w-2.5 text-brutify-gold-light" />
                                    <span className="text-[9px] font-display tracking-wider text-brutify-gold">{video.score}x</span>
                                  </div>
                                </div>

                                {/* Duration */}
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-white/10">
                                  <span className="text-[8px] font-body font-semibold text-white/90">{["0:42", "0:58", "1:12", "0:35", "1:05", "0:51"][i]}</span>
                                </div>
                              </div>
                              
                              {/* Info footer */}
                              <div className="px-2 py-2 bg-[#0d0d12]/90 border-t border-white/[0.04]">
                                <div className="h-1.5 rounded bg-white/[0.06] w-full mb-1.5" />
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-2.5 w-2.5 text-brutify-gold" />
                                    <span className="text-[9px] font-display text-brutify-gold">{video.views}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-2.5 w-2.5 text-white/40" />
                                    <span className="text-[9px] text-white/50">{["280K", "95K", "68K", "156K", "82K", "412K"][i]}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                      {activeStep === 2 && (
                        <div className="space-y-3">
                          {/* Hook analysis - vrai style Brutify */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.06] p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-brutify-gold" />
                                <span className="text-[11px] font-body font-bold uppercase tracking-wider text-brutify-gold/80">Hook · Curiosité</span>
                              </div>
                              <span className="text-sm font-display text-brutify-gold">92/100</span>
                            </div>
                            <p className="text-xs font-body italic text-brutify-text-secondary leading-relaxed mb-2">
                              &ldquo;Personne ne te dit ça, mais c&apos;est la vraie raison...&rdquo;
                            </p>
                            <div className="flex gap-1.5">
                              <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20">
                                <p className="text-[8px] text-brutify-text-muted mb-0.5">Rétention</p>
                                <p className="text-xs font-display text-brutify-gold">87%</p>
                              </div>
                              <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                                <p className="text-[8px] text-brutify-text-muted mb-0.5">Impact</p>
                                <p className="text-xs font-display text-white/80">9.2/10</p>
                              </div>
                            </div>
                          </motion.div>

                          {/* Structure analysis */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted/70">Structure</span>
                              <span className="text-sm font-display text-white/90">87/100</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {["Hook", "Problème", "Solution", "CTA"].map((step, j) => (
                                <span key={j} className="text-[9px] font-body px-2 py-1 rounded-lg bg-brutify-gold/[0.06] border border-brutify-gold/15 text-brutify-text-secondary">
                                  {step}
                                </span>
                              ))}
                            </div>
                          </motion.div>

                          {/* Style analysis */}
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted/70">Style</span>
                              <span className="text-sm font-display text-white/90">85/100</span>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { label: "Ton direct", value: 95 },
                                { label: "Rythme rapide", value: 88 },
                                { label: "Émotionnel", value: 72 },
                              ].map((metric, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <span className="text-[9px] font-body text-brutify-text-muted w-16">{metric.label}</span>
                                  <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                    <motion.div
                                      className="h-full rounded-full bg-gradient-to-r from-brutify-gold to-brutify-gold-light"
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${metric.value}%` }}
                                      transition={{ delay: 0.4 + j * 0.1, duration: 0.5, ease: "easeOut" }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-body text-brutify-gold/80 w-6 text-right">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      )}
                      {activeStep === 3 && (
                        <div className="space-y-2.5">
                          {/* Script avec vrai design Brutify */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05, duration: 0.3 }}
                            className="rounded-xl border border-brutify-gold/25 bg-brutify-gold/[0.08] p-4 relative overflow-hidden"
                          >
                            <motion.div
                              animate={{
                                boxShadow: [
                                  "0 0 0 0 rgba(255,171,0,0)",
                                  "0 0 0 8px rgba(255,171,0,0.08)",
                                  "0 0 0 0 rgba(255,171,0,0)",
                                ],
                              }}
                              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-brutify-gold/30 backdrop-blur-sm"
                            >
                              <Sparkles className="h-2.5 w-2.5 text-brutify-gold" />
                              <span className="text-[9px] font-display tracking-wider text-brutify-gold uppercase">Hook</span>
                            </motion.div>
                            <p className="text-sm font-body font-semibold italic text-brutify-text-primary mt-7 leading-relaxed">
                              &ldquo;Personne ne te le dit, mais c&apos;est LA raison pourquoi tu n&apos;arrives pas à percer...&rdquo;
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-brutify-gold/60" />
                              <span className="text-[9px] font-body text-brutify-gold/60">Curiosité + Pattern Interrupt</span>
                            </div>
                          </motion.div>

                          {/* Développement */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.3 }}
                            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                          >
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[10px] font-body font-bold text-brutify-text-muted uppercase tracking-wider">Développement</span>
                              <span className="text-[9px] font-body text-brutify-text-muted/60">0:05 - 0:35</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="h-5 w-5 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-display text-brutify-gold">1</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-2 rounded bg-white/[0.06] w-full" />
                                  <div className="h-2 rounded bg-white/[0.06] w-11/12" />
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="h-5 w-5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-display text-white/60">2</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-2 rounded bg-white/[0.06] w-10/12" />
                                  <div className="h-2 rounded bg-white/[0.06] w-9/12" />
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="h-5 w-5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[9px] font-display text-white/60">3</span>
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="h-2 rounded bg-white/[0.06] w-full" />
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* CTA */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.3 }}
                            className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 relative"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-body font-bold text-emerald-400 uppercase tracking-wider">CTA · Action</span>
                            </div>
                            <p className="text-xs font-body font-semibold text-brutify-text-primary leading-relaxed mb-2.5">
                              &ldquo;Clique sur le lien en bio maintenant et obtiens un accès immédiat...&rdquo;
                            </p>
                            <div className="flex items-center gap-1.5">
                              <div className="px-2 py-1 rounded-lg bg-emerald-500/[0.12] border border-emerald-500/25">
                                <span className="text-[8px] font-body text-emerald-400">Urgence</span>
                              </div>
                              <div className="px-2 py-1 rounded-lg bg-emerald-500/[0.12] border border-emerald-500/25">
                                <span className="text-[8px] font-body text-emerald-400">Clarté</span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Social proof banner ─────────────────────────────────────────────────────

const floatingCards = [
  {
    id: "outlier",
    className: "top-[12%] left-[3%] lg:left-[5%] w-52",
    delay: 0.8,
    rotate: -6,
    content: (
      <div className="space-y-3">
        {/* Header avec badge animé */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,171,0,0)",
                  "0 0 0 4px rgba(255,171,0,0.15)",
                  "0 0 0 0 rgba(255,171,0,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-2 rounded-full bg-brutify-gold"
            />
            <span className="text-[10px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Outlier Score</span>
          </div>
          <Flame className="h-3.5 w-3.5 text-brutify-gold" />
        </div>
        
        {/* Score principal avec glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-brutify-gold/20 blur-xl" />
          <p className="font-display text-3xl tracking-wider text-gold-gradient relative drop-shadow-[0_0_8px_rgba(255,171,0,0.5)]">105.3x</p>
        </div>
        
        {/* Métriques détaillées */}
        <div className="space-y-2">
          <div className="flex justify-between text-[9px] font-body items-center">
            <span className="text-brutify-text-muted">Engagement</span>
            <span className="text-brutify-gold font-semibold">11.2%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "72%" }}
              transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brutify-gold to-brutify-gold-light shadow-[0_0_8px_rgba(255,171,0,0.4)]"
            />
          </div>
          
          <div className="flex justify-between text-[9px] font-body items-center">
            <span className="text-brutify-text-muted">Rétention</span>
            <span className="text-brutify-gold font-semibold">89%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "89%" }}
              transition={{ delay: 1.1, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brutify-gold to-brutify-gold-light shadow-[0_0_8px_rgba(255,171,0,0.4)]"
            />
          </div>
        </div>
        
        {/* Stats en bas */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs font-display text-white/90">3.2M</p>
            <p className="text-[8px] text-brutify-text-muted">vues</p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-xs font-display text-white/90">280K</p>
            <p className="text-[8px] text-brutify-text-muted">likes</p>
          </div>
          <div className="h-6 w-px bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-xs font-display text-white/90">18K</p>
            <p className="text-[8px] text-brutify-text-muted">partages</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "views",
    className: "top-[8%] left-[28%] lg:left-[22%] w-36",
    delay: 1.1,
    rotate: 3,
    content: (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-brutify-gold" />
          <span className="text-[10px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Analytics</span>
        </div>
        
        {/* Nombre de vues principal */}
        <div className="text-center py-2">
          <p className="font-display text-2xl tracking-wider text-brutify-text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">3.2M</p>
          <span className="text-[9px] font-body text-brutify-text-muted uppercase tracking-wider">vues</span>
        </div>
        
        {/* Croissance */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20">
          <ChevronUp className="h-3 w-3 text-emerald-400" />
          <span className="text-xs font-display text-emerald-400">+240%</span>
          <span className="text-[8px] font-body text-emerald-400/60">vs avg</span>
        </div>
        
        {/* Mini graphique */}
        <div className="flex items-end justify-between h-8 gap-0.5">
          {[0.4, 0.6, 0.45, 0.8, 0.55, 1.0, 0.9].map((height, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: height }}
              transition={{ delay: 1.3 + i * 0.05, duration: 0.3, ease: "easeOut" }}
              className="flex-1 rounded-t bg-gradient-to-t from-brutify-gold/40 to-brutify-gold/20 border-t border-brutify-gold/30 origin-bottom"
              style={{ height: `${height * 100}%` }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "likes",
    className: "top-[6%] right-[28%] lg:right-[22%] w-32",
    delay: 1.3,
    rotate: -2,
    content: (
      <div className="space-y-2.5">
        {/* Header avec icône heart animée */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-body font-semibold text-brutify-text-muted uppercase tracking-wider">Engagement</span>
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Heart className="h-3 w-3 text-pink-500/80 fill-pink-500/80" />
          </motion.div>
        </div>
        
        {/* Stats avec gradients */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-brutify-text-muted">Likes</span>
            <span className="text-sm font-display text-brutify-text-primary">169K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-brutify-text-muted">Comments</span>
            <span className="text-sm font-display text-brutify-text-primary">12.4K</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-brutify-text-muted">Shares</span>
            <span className="text-sm font-display text-brutify-text-primary">8.2K</span>
          </div>
        </div>
        
        {/* Ratio */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-brutify-text-muted">Taux d'engagement</span>
            <span className="text-xs font-display text-brutify-gold">5.9%</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "creator",
    className: "top-[10%] right-[3%] lg:right-[5%] w-56",
    delay: 0.9,
    rotate: 5,
    content: (
      <div className="space-y-3">
        {/* Profil créateur avec vraie UI */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255,0,0,0)",
                  "0 0 0 3px rgba(255,0,0,0.2)",
                  "0 0 0 0 rgba(255,0,0,0)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-9 w-9 rounded-full bg-gradient-to-br from-red-500 to-orange-400 ring-2 ring-red-500/20"
            />
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#FF0000] border-2 border-[#0c0c14] flex items-center justify-center">
              <Play className="h-1.5 w-1.5 text-white fill-white ml-0.5" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-body font-bold text-brutify-text-primary">@hormozi</p>
            <p className="text-[9px] font-body text-brutify-text-muted">4.1M abonnés</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brutify-gold/[0.08] border border-brutify-gold/20">
            <Flame className="h-2.5 w-2.5 text-brutify-gold" />
            <span className="text-[9px] font-display text-brutify-gold">12</span>
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
            <p className="text-xs font-display text-white/90">156</p>
            <p className="text-[7px] text-brutify-text-muted">vidéos</p>
          </div>
          <div className="rounded-lg bg-brutify-gold/[0.06] border border-brutify-gold/15 px-2 py-1.5 text-center">
            <p className="text-xs font-display text-brutify-gold">42.3x</p>
            <p className="text-[7px] text-brutify-gold/80">avg score</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
            <p className="text-xs font-display text-white/90">8.4%</p>
            <p className="text-[7px] text-brutify-text-muted">engage</p>
          </div>
        </div>
        
        {/* CTA ajout à watchlist */}
        <div className="space-y-1.5">
          <span className="text-[8px] font-body text-brutify-text-muted/70">Ajouter à une liste :</span>
          <div className="h-7 rounded-lg border border-white/[0.08] bg-white/[0.03] flex items-center justify-between px-2.5 hover:border-white/[0.12] transition-all group/select">
            <span className="text-[9px] font-body text-brutify-text-muted">Business & Finance</span>
            <ChevronDown className="h-2.5 w-2.5 text-brutify-text-muted/60 group-hover/select:text-brutify-gold transition-colors" />
          </div>
          <button className="w-full rounded-lg bg-gold-gradient px-3 py-2 text-[10px] font-body font-bold text-[#0d0a00] shadow-[0_0_16px_rgba(255,171,0,0.25)] hover:shadow-[0_0_24px_rgba(255,171,0,0.4)] transition-all">
            Ajouter
          </button>
        </div>
      </div>
    ),
  },
  {
    id: "search",
    className: "bottom-[28%] left-[2%] lg:left-[8%] w-64",
    delay: 1.5,
    rotate: -3,
    content: (
      <div className="space-y-2.5">
        {/* Barre de recherche avancée */}
        <div className="flex gap-2">
          <div className="flex-1 h-8 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center px-3 backdrop-blur-sm hover:border-brutify-gold/20 transition-all group/search">
            <Search className="h-3 w-3 text-brutify-gold/60 mr-2 group-hover/search:text-brutify-gold transition-colors" />
            <span className="text-[10px] font-body text-brutify-text-muted">Business & Finance</span>
          </div>
          <button className="h-8 rounded-xl bg-gold-gradient px-3 flex items-center shadow-[0_0_16px_rgba(255,171,0,0.25)]">
            <span className="text-[10px] font-body font-bold text-[#0d0a00]">Go</span>
          </button>
        </div>
        
        {/* Filtres actifs */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "Vues", active: false },
            { label: "Instagram", active: false },
            { label: "> 5x outlier", active: true },
            { label: "30 derniers jours", active: true },
          ].map((filter, i) => (
            <span key={filter.label} className={cn(
              "text-[8px] font-body px-2.5 py-1 rounded-full border transition-all",
              filter.active 
                ? "border-brutify-gold/30 bg-brutify-gold/[0.1] text-brutify-gold shadow-[0_0_8px_rgba(255,171,0,0.15)]" 
                : "border-white/[0.08] bg-white/[0.02] text-brutify-text-muted hover:border-white/[0.12]"
            )}>{filter.label}</span>
          ))}
        </div>
        
        {/* Résultats count */}
        <div className="flex items-center gap-2 pt-1">
          <div className="h-1 w-1 rounded-full bg-brutify-gold animate-pulse" />
          <span className="text-[9px] font-body text-brutify-text-muted">
            <span className="text-brutify-gold font-semibold">1,247</span> vidéos trouvées
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "videos",
    className: "bottom-[10%] left-[18%] lg:left-[22%] w-72",
    delay: 1.8,
    rotate: 2,
    content: (
      <div className="space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-3 w-3 text-brutify-gold" />
            <span className="text-[10px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Top Outliers</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/20">
            <span className="text-[8px] font-display text-brutify-gold">4</span>
          </div>
        </div>
        
        {/* Grille de vidéos avec vrais détails */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { score: "35.7x", views: "2.1M", gradient: "from-purple-900/70 to-pink-900/50", color: "#E1306C" },
            { score: "28.4x", views: "890K", gradient: "from-red-900/70 to-orange-900/50", color: "#FF0000" },
            { score: "19.2x", views: "1.4M", gradient: "from-blue-900/70 to-cyan-900/50", color: "#1DA1F2" },
            { score: "42.1x", views: "3.2M", gradient: "from-yellow-900/70 to-red-900/50", color: "#FF0000" },
          ].map((video, i) => (
            <div key={i} className="space-y-1">
              {/* Thumbnail */}
              <div className={`aspect-[9/14] rounded-lg bg-gradient-to-br ${video.gradient} border border-white/[0.08] flex items-center justify-center relative overflow-hidden group/vid hover:border-brutify-gold/20 transition-all`}>
                {/* Play button au hover */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
                >
                  <div className="h-5 w-5 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-2.5 w-2.5 text-black ml-0.5 fill-black" />
                  </div>
                </motion.div>
                
                {/* Score badge */}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-brutify-gold/20 border border-brutify-gold/40 backdrop-blur-sm shadow-[0_0_8px_rgba(255,171,0,0.3)]">
                  <span className="text-[8px] font-display text-brutify-gold">{video.score}</span>
                </div>
                
                {/* Platform badge */}
                <div 
                  className="absolute top-1 right-1 h-3 w-3 rounded-full flex items-center justify-center border border-white/20"
                  style={{ background: video.color }}
                >
                  <div className="h-1 w-1 rounded-full bg-white" />
                </div>
                
                {/* Durée */}
                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10">
                  <span className="text-[7px] font-body font-semibold text-white/90">{["0:58", "1:12", "0:45", "0:38"][i]}</span>
                </div>
              </div>
              
              {/* Infos */}
              <div className="flex items-center gap-1">
                <Eye className="h-2 w-2 text-brutify-gold/70" />
                <span className="text-[8px] font-display text-brutify-gold">{video.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "script",
    className: "bottom-[18%] right-[2%] lg:right-[6%] w-52",
    delay: 1.6,
    rotate: 4,
    content: (
      <div className="space-y-2.5">
        {/* Header script */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="h-3 w-3 text-brutify-gold" />
            <span className="text-[9px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Script Editor</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/[0.12] border border-emerald-500/25">
            <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[7px] font-body text-emerald-400">Saved</span>
          </div>
        </div>
        
        {/* Hook avec glow */}
        <motion.div 
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(255,171,0,0)",
              "0 0 0 6px rgba(255,171,0,0.08)",
              "0 0 0 0 rgba(255,171,0,0)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-lg border border-brutify-gold/25 bg-brutify-gold/[0.06] p-2.5"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-2.5 w-2.5 text-brutify-gold" />
            <span className="text-[8px] font-body font-bold text-brutify-gold uppercase tracking-wider">Hook</span>
            <span className="ml-auto text-[7px] font-display text-brutify-gold/60">0:00-0:03</span>
          </div>
          <p className="text-[9px] font-body text-brutify-text-primary italic leading-relaxed">
            &ldquo;Cette entreprise est l&apos;arme secrète derrière Apple et Nvidia...&rdquo;
          </p>
        </motion.div>
        
        {/* Développement */}
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
            <span className="text-[8px] font-body font-semibold text-brutify-text-muted uppercase tracking-wider">Body</span>
            <span className="ml-auto text-[7px] font-display text-brutify-text-muted/60">0:03-0:45</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 rounded bg-white/[0.06] w-full" />
            <div className="h-1.5 rounded bg-white/[0.06] w-11/12" />
            <div className="h-1.5 rounded bg-white/[0.06] w-10/12" />
          </div>
        </div>
        
        {/* CTA */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[8px] font-body font-bold text-emerald-400 uppercase tracking-wider">CTA</span>
            <span className="ml-auto text-[7px] font-display text-emerald-400/60">0:45-0:52</span>
          </div>
          <p className="text-[9px] font-body text-brutify-text-secondary leading-relaxed">
            Lien en bio pour accès immédiat
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "hook",
    className: "bottom-[6%] right-[20%] lg:right-[24%] w-48",
    delay: 2.0,
    rotate: -4,
    content: (
      <div className="space-y-2.5">
        {/* Header avec sparkles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="h-3 w-3 text-brutify-gold" />
            </motion.div>
            <span className="text-[9px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Hook IA</span>
          </div>
          <span className="text-sm font-display text-brutify-gold">92/100</span>
        </div>
        
        {/* Barre de score avec glow */}
        <div className="relative">
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "92%" }}
              transition={{ delay: 2.2, duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-brutify-gold to-brutify-gold-light shadow-[0_0_8px_rgba(255,171,0,0.5)]"
            />
          </div>
        </div>
        
        {/* Métriques détaillées */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-brutify-gold/[0.06] border border-brutify-gold/15 px-2 py-1.5 text-center">
            <p className="text-[10px] font-display text-brutify-gold">A+</p>
            <p className="text-[7px] text-brutify-gold/70">Curiosité</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5 text-center">
            <p className="text-[10px] font-display text-white/90">89%</p>
            <p className="text-[7px] text-brutify-text-muted">Rétention</p>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {["Pattern Interrupt", "Curiosity Gap"].map((tag) => (
            <span key={tag} className="text-[7px] font-body px-2 py-0.5 rounded-full bg-brutify-gold/[0.08] border border-brutify-gold/20 text-brutify-gold/90">
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
  },
];

function SocialProofBanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const target = 2847000;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView]);

  return (
    <section ref={ref} className="relative py-32 md:py-44 px-6 border-t border-white/[0.04] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ background: "radial-gradient(ellipse at center, #FFAB00 0%, transparent 60%)" }}
      />

      {/* Floating UI cards */}
      <div className="absolute inset-0 hidden md:block">
        {floatingCards.map((card) => (
          <motion.div
            key={card.id}
            className={cn("absolute", card.className)}
            initial={{ opacity: 0, y: 60, scale: 0.85, rotate: 0 }}
            animate={inView ? {
              opacity: 1,
              y: 0,
              scale: 1,
              rotate: card.rotate,
            } : {}}
            transition={{
              delay: card.delay,
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c14]/80 backdrop-blur-md p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {card.content}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Title content */}
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6 text-xs font-body font-medium text-brutify-gold">
            Des millions de vidéos analysées chaque jour
          </span>
          <h2 className="font-display text-4xl md:text-6xl tracking-wider text-brutify-text-primary mb-2">
            Trouve le top <span className="text-gold-gradient">1%</span> des outliers
          </h2>
          <p className="font-display text-4xl md:text-6xl tracking-wider text-brutify-text-primary">
            dans chaque niche
          </p>
          <p className="mt-6 font-display text-2xl text-gold-gradient">
            {count.toLocaleString("fr-FR")}+
          </p>
          <p className="text-sm font-body text-brutify-text-muted">vidéos analysées</p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonialsRow1 = [
  { text: "J'ai testé l'essai gratuit et c'est incroyable. Ça m'a littéralement économisé des jours entiers de recherche pour trouver des angles et des hooks percutants.", name: "Marie Dubois", role: "Créatrice fitness · 47K", avatar: 5, stars: 5 },
  { text: "Le scripting IA me fait gagner un temps fou chaque semaine. Je recommande à 100%.", name: "@chloe_biz", role: "Coach business", avatar: null, stars: 5 },
  { text: "Avant Brutify j'utilisais 3 outils différents. Maintenant tout est centralisé et ça marche 10x mieux.", name: "Julien R.", role: "Agence créa · Paris", avatar: 15, stars: 5 },
  { text: "Mes vues ont triplé sur IG en seulement deux vidéos créées avec cet outil. Le stress de l'écriture a complètement disparu.", name: "Sofia Martinez", role: "Nutritionniste · 89K", avatar: 23, stars: 5 },
  { text: "L'analyse des hooks est un game changer total. Je comprends enfin pourquoi certains contenus cartonnent.", name: "maxime_tech", role: "YouTuber tech · 156K", avatar: null, stars: 5 },
  { text: "On a intégré Brutify dans notre workflow d'agence. Nos clients ont vu +180% d'engagement moyen en 3 mois.", name: "Laura Chen", role: "Directrice @StudioFlow", avatar: 32, stars: 5 },
  { text: "Le meilleur investissement que j'ai fait pour ma création de contenu cette année. Résultats visibles dès la première semaine.", name: "Romain_pro", role: "Coach mindset · 72K", avatar: 52, stars: 5 },
];

const testimonialsRow2 = [
  { text: "Brutify est une pépite. Je suis nutritionniste et ça marche parfaitement pour mon contenu science et santé. Je ne peux plus m'en passer.", name: "Lucas Ferreira", role: "Créateur santé · 124K", avatar: 12, stars: 5 },
  { text: "Le timing parfait pour ma boîte. Les scripts sont incroyables, toutes les boucles de curiosité sont présentes.", name: "antoine.dev", role: "Fondateur SaaS", avatar: null, stars: 5 },
  { text: "Vous avez construit quelque chose de vraiment utile. Brutify est dans une ligue à part. On sent la réflexion jusque dans les détails.", name: "Thomas W.", role: "Consultant digital", avatar: 60, stars: 5 },
  { text: "J'ai doublé mon nombre d'abonnés en 6 semaines grâce aux scripts générés. La qualité est hallucinante.", name: "@emmalifestyle", role: "Créatrice lifestyle · 203K", avatar: 44, stars: 5 },
  { text: "L'outil de recherche de créateurs est magique. Je trouve des inspirations dans des niches auxquelles je n'aurais jamais pensé.", name: "Karim B.", role: "Vidéaste freelance", avatar: null, stars: 5 },
  { text: "Mon taux de rétention a explosé depuis que j'utilise les hooks analysés par Brutify. +65% sur mes dernières vidéos.", name: "Camille Renard", role: "Formatrice en ligne · 95K", avatar: 26, stars: 5 },
  { text: "Simple, efficace, et les résultats parlent d'eux-mêmes. 5 étoiles sans hésiter.", name: "nico_content", role: "Content manager", avatar: null, stars: 5 },
];

function TestimonialCard({ t }: { t: typeof testimonialsRow1[0] }) {
  const getInitials = (name: string) => {
    const cleaned = name.replace(/^@/, "").replace(/_/g, " ");
    return cleaned
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const initials = getInitials(t.name);
  const hasAvatar = t.avatar !== null;

  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[340px] rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#111113]/80 to-[#0d0d12]/60 backdrop-blur-sm p-6 select-none hover:border-white/[0.1] transition-all duration-300 group/card relative overflow-hidden">
      {/* Subtle gold glow on hover */}
      <div className="absolute inset-0 bg-brutify-gold/0 group-hover/card:bg-brutify-gold/[0.02] rounded-2xl transition-all duration-500 pointer-events-none" />
      
      {/* Top right corner accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brutify-gold/[0.03] to-transparent rounded-bl-[100px] pointer-events-none" />
      
      <div className="relative">
        <div className="flex gap-0.5 mb-3">
          {[...Array(t.stars)].map((_, j) => (
            <Star 
              key={j} 
              className="h-3.5 w-3.5 fill-brutify-gold text-brutify-gold drop-shadow-[0_0_4px_rgba(255,171,0,0.3)]" 
            />
          ))}
        </div>
        <span className="font-display text-3xl text-brutify-gold/30 leading-none">&ldquo;</span>
        <p className="text-sm font-body text-brutify-text-secondary leading-relaxed mb-5 mt-1">
          {t.text}
        </p>
        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06] group-hover/card:border-white/[0.08] transition-colors">
          {hasAvatar ? (
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-brutify-elevated ring-2 ring-white/[0.08] group-hover/card:ring-brutify-gold/20 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`https://i.pravatar.cc/80?img=${t.avatar}`} 
                alt={t.name} 
                className="h-full w-full object-cover" 
              />
            </div>
          ) : (
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-brutify-gold/25 via-brutify-gold/15 to-brutify-gold-dark/20 border border-brutify-gold/30 flex items-center justify-center ring-1 ring-brutify-gold/10 shadow-[0_0_12px_rgba(255,171,0,0.15)] group-hover/card:shadow-[0_0_16px_rgba(255,171,0,0.25)] transition-all">
              <span className="font-display text-sm tracking-wider text-brutify-gold drop-shadow-[0_0_4px_rgba(255,171,0,0.4)]">
                {initials}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-body font-semibold text-brutify-text-primary truncate">
              {t.name}
            </p>
            <p className="text-[11px] font-body text-brutify-text-muted truncate">
              {t.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, reverse = false }: { items: typeof testimonialsRow1; reverse?: boolean }) {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden group">
      <motion.div
        className="flex gap-5 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -(items.length * 360), right: 0 }}
        dragElastic={0.1}
        animate={{ x: reverse ? [-(items.length * 360), 0] : [0, -(items.length * 360)] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: items.length * 8,
            ease: "linear",
          },
        }}
        whileDrag={{ animationPlayState: "paused" } as never}
        onDragStart={(_, info) => { void info; }}
        style={{ width: "max-content" }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </motion.div>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#060608] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#060608] to-transparent pointer-events-none z-10" />
    </div>
  );
}

function Testimonials() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 border-t border-white/[0.04] overflow-hidden" ref={ref}>
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="h-3 w-3 fill-brutify-gold text-brutify-gold" />
              ))}
            </div>
            <span className="text-xs font-body font-medium text-brutify-gold">4.9/5</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary">
            Utilisé par <span className="text-gold-gradient">76K+</span> créateurs et marques
          </h2>
        </motion.div>
      </div>

      <div className="space-y-5">
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <MarqueeRow items={testimonialsRow1} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <MarqueeRow items={testimonialsRow2} reverse />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [annual, setAnnual] = useState(false);

  const planKeys: PlanKey[] = ["creator", "growth", "scale"];
  const plans = planKeys.map((key) => {
    const p = PLANS[key];
    return {
      name: p.name,
      desc: p.description ?? p.tagline,
      price: annual ? p.yearlyPrice : p.monthlyPrice,
      bp: `${p.credits.toLocaleString("fr-FR")} BP / mois`,
      highlight: p.highlight ?? "",
      includes: p.includes ?? "Inclus :",
      features: p.features,
      popular: p.popular ?? false,
      trialText: p.trialText ?? null,
    };
  });

  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6 text-xs font-body font-medium text-brutify-gold"
          >
            Arrête de perdre du temps sur du contenu qui ne marche pas
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-6"
          >
            Tarifs scalables
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-3"
          >
            <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-body font-medium transition-all duration-200",
                  !annual ? "bg-brutify-text-primary text-brutify-bg" : "text-brutify-text-muted"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-body font-medium transition-all duration-200",
                  annual ? "bg-brutify-text-primary text-brutify-bg" : "text-brutify-text-muted"
                )}
              >
                Annuel
              </button>
            </div>
            {annual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs font-display text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-3 py-1"
              >
                3 MOIS OFFERTS
              </motion.span>
            )}
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50, scale: 0.92 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className={cn(
                "relative rounded-2xl border p-6 transition-colors duration-300",
                plan.popular
                  ? "border-brutify-gold/20 bg-[#111113]/80"
                  : "border-white/[0.06] bg-[#111113]/60 hover:border-white/[0.1]"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-display text-2xl tracking-wider text-brutify-text-primary">
                  {plan.name}
                </h3>
                {plan.popular && (
                  <span className="rounded-full bg-gold-gradient px-2.5 py-0.5 text-[10px] font-body font-bold uppercase tracking-wider text-brutify-bg">
                    Populaire
                  </span>
                )}
              </div>
              <p className="text-xs font-body text-brutify-text-secondary mb-5 leading-relaxed">
                {plan.desc}
              </p>
              <div className="flex items-baseline gap-1 mb-0.5">
                <span className="font-display text-5xl text-brutify-text-primary">
                  {plan.price}€
                </span>
                <span className="text-sm font-body text-brutify-text-muted">/mois</span>
              </div>
              <p className="text-[10px] font-body text-brutify-text-muted mb-3">
                {annual ? `Facturé ${plan.price * 12}€/an` : "Facturé mensuellement"}
              </p>

              {/* BP highlight */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-2 mb-4">
                <p className="text-xs font-body text-brutify-gold font-semibold">{plan.bp}</p>
                <p className="text-[10px] font-body text-brutify-text-muted">{plan.highlight}</p>
              </div>

              <div className="border-t border-white/[0.06] pt-4 mb-5">
                <p className="text-xs font-body text-brutify-text-muted italic mb-3">{plan.includes}</p>
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs font-body text-brutify-text-secondary">
                      <Check className="h-3.5 w-3.5 text-brutify-gold shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/signup"
                className={cn(
                  "block w-full rounded-xl py-3 text-center font-body text-sm font-semibold transition-all duration-200",
                  plan.popular
                    ? "bg-gold-gradient text-brutify-bg shadow-gold-glow hover:shadow-gold-glow-lg"
                    : "border border-white/[0.08] text-brutify-text-secondary hover:border-brutify-gold/30 hover:text-brutify-text-primary"
                )}
              >
                {plan.name === "Creator" ? "Démarrer l'essai gratuit →" : `Passer en ${plan.name} →`}
              </Link>
              {plan.trialText && (
                <p className="text-center text-[10px] font-body text-brutify-text-muted mt-2">
                  {plan.trialText}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ with tabs ───────────────────────────────────────────────────────────

const faqTabs = {
  Général: [
    { q: "C'est quoi exactement Brutify ?", a: "Brutify est une plateforme SaaS qui combine veille créateurs, détection de vidéos outliers, scripting IA et calendrier éditorial. Tu trouves les contenus qui performent, tu analyses pourquoi, et tu génères tes propres scripts basés sur les meilleures structures." },
    { q: "À qui s'adresse Brutify ?", a: "Brutify est conçu pour les créateurs de contenu, les marques, les agences social media et toute personne qui publie du contenu court sur Instagram, TikTok ou YouTube." },
    { q: "Est-ce que je dois connecter mes réseaux sociaux ?", a: "Non. Brutify est un outil de recherche, d'analyse et de rédaction. Tu n'as pas besoin de connecter tes comptes. On analyse les contenus publics des créateurs que tu suis." },
    { q: "Comment sont détectés les outliers ?", a: "Notre algorithme compare les performances de chaque vidéo à la moyenne du créateur. Un outlier de 10x signifie que la vidéo a fait 10 fois plus de vues que la moyenne." },
    { q: "Quelles plateformes sont supportées ?", a: "Instagram (Reels), TikTok et YouTube (Shorts et long format). Nous ajoutons régulièrement de nouvelles plateformes." },
    { q: "Combien de créateurs je peux suivre ?", a: "Ça dépend de ton plan. Le plan Creator permet jusqu'à 10 créateurs au Radar, Growth et Scale sont illimités." },
  ],
  Facturation: [
    { q: "Je peux changer de plan ?", a: "Oui, tu peux upgrader ou downgrader ton plan à tout moment depuis les paramètres. Le changement est effectif immédiatement." },
    { q: "Comment annuler mon abonnement ?", a: "Tu peux annuler à tout moment en un clic depuis les paramètres. Aucun engagement, aucun frais cachés. Tes Brutpoints restent actifs jusqu'à la fin de la période payée." },
    { q: "Quelle est la politique de remboursement ?", a: "Nous offrons un remboursement complet dans les 7 premiers jours si tu n'es pas satisfait. Aucune question posée." },
    { q: "Je peux mettre en pause mon abonnement ?", a: "Pas encore, mais tu peux annuler et reprendre à tout moment. Tes données sont conservées pendant 90 jours." },
  ],
  Compte: [
    { q: "Je n'ai pas reçu mon email de vérification — que faire ?", a: "Vérifie ton dossier spam. Si tu ne le trouves toujours pas, contacte-nous via le support et on réglera ça en quelques minutes." },
    { q: "Comment créer un compte ?", a: "Clique sur 'Essai gratuit', entre ton email et ton mot de passe. C'est prêt en 30 secondes. Aucune carte bancaire requise pour l'essai." },
    { q: "Comment réinitialiser mon mot de passe ?", a: "Clique sur 'Mot de passe oublié' sur la page de connexion. Tu recevras un email avec un lien de réinitialisation." },
    { q: "Je peux changer l'email de mon compte ?", a: "Oui, depuis les paramètres de ton compte. Un email de confirmation sera envoyé à ta nouvelle adresse." },
    { q: "Comment activer l'authentification à deux facteurs (2FA) ?", a: "Va dans Paramètres > Sécurité et active la 2FA. Tu pourras utiliser une app d'authentification comme Google Authenticator." },
  ],
};

function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState<keyof typeof faqTabs>("Général");
  const [open, setOpen] = useState<number | null>(null);

  const currentFaqs = faqTabs[activeTab];

  return (
    <section id="faq" className="py-24 px-6 border-t border-white/[0.04] relative overflow-hidden" ref={ref}>
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-[0.03]"
        style={{ background: "radial-gradient(ellipse at center top, #FFAB00 0%, transparent 60%)", filter: "blur(60px)" }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-16">
          {/* Left: title */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32 lg:self-start"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-3 py-1 mb-5"
            >
              <span className="text-[10px] font-body font-semibold text-brutify-gold uppercase tracking-wider">Support</span>
            </motion.div>
            <h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary leading-tight mb-3">
              Des<br />questions ?
            </h2>
            <p className="text-sm font-body text-brutify-text-secondary mb-6 leading-relaxed">
              Tout ce que tu dois savoir pour démarrer. Tu ne trouves pas ta réponse ?
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href="mailto:contact@brutify.app"
                className="group inline-flex items-center gap-2 rounded-xl border border-brutify-gold/20 bg-brutify-gold/[0.04] px-5 py-3 text-sm font-body font-semibold text-brutify-gold hover:bg-brutify-gold/[0.08] hover:border-brutify-gold/30 transition-all duration-300"
              >
                Contacte-nous
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: tabs + accordion */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-1 mb-8"
            >
              {(Object.keys(faqTabs) as (keyof typeof faqTabs)[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setOpen(null); }}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-body font-medium transition-all duration-200",
                    activeTab === tab
                      ? "bg-brutify-text-primary text-brutify-bg"
                      : "text-brutify-text-muted hover:text-brutify-text-secondary"
                  )}
                >
                  {tab}
                </button>
              ))}
            </motion.div>

            <div className="space-y-3">
              {currentFaqs.map((item, i) => (
                <motion.div
                  key={`${activeTab}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    "rounded-xl border transition-all duration-300",
                    open === i
                      ? "border-brutify-gold/15 bg-brutify-gold/[0.03]"
                      : "border-white/[0.06] bg-[#111113]/40 hover:border-white/[0.1] hover:bg-[#111113]/60"
                  )}
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <div className={cn(
                        "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 text-[11px] font-body font-bold",
                        open === i
                          ? "bg-brutify-gold/15 text-brutify-gold"
                          : "bg-white/[0.04] text-brutify-text-muted"
                      )}>
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <span className={cn(
                        "text-sm font-body font-medium transition-colors duration-300",
                        open === i ? "text-brutify-text-primary" : "text-brutify-text-secondary"
                      )}>
                        {item.q}
                      </span>
                    </div>
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                      open === i
                        ? "bg-brutify-gold/15 rotate-45"
                        : "bg-white/[0.04]"
                    )}>
                      <Plus className={cn(
                        "h-3.5 w-3.5 transition-colors duration-300",
                        open === i ? "text-brutify-gold" : "text-brutify-text-muted"
                      )} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pl-[60px]">
                          <p className="text-sm font-body text-brutify-text-secondary leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer CTA ──────────────────────────────────────────────────────────────

function FooterCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-28 md:py-36 px-6 border-t border-white/[0.04] relative overflow-hidden" ref={ref}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,171,0,0.08) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #FFAB00 0%, transparent 50%)", filter: "blur(80px)" }}
      />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-sm font-body font-semibold text-brutify-gold uppercase tracking-widest mb-6"
          >
            Prêt à dominer ta niche ?
          </motion.p>

          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-brutify-text-primary leading-[0.95] mb-6">
            Arrête de{" "}
            <span className="text-gold-gradient">deviner.</span>
            <br />
            Commence à{" "}
            <span className="text-gold-gradient">performer.</span>
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base md:text-lg font-body text-brutify-text-secondary max-w-xl mx-auto mb-10"
          >
            Rejoins les 76 000+ créateurs qui utilisent Brutify pour trouver les contenus viraux et générer des scripts qui convertissent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-3 rounded-xl bg-gold-gradient px-8 py-4 font-body text-base font-bold text-brutify-bg shadow-[0_0_30px_rgba(255,171,0,0.3),0_0_60px_rgba(255,171,0,0.1)] hover:shadow-[0_0_40px_rgba(255,171,0,0.4),0_0_80px_rgba(255,171,0,0.15)] transition-all duration-300 hover:scale-[1.03]"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <span className="text-xs font-body text-brutify-text-muted">
              Aucune carte bancaire requise
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-10 flex items-center justify-center gap-6"
          >
            <div className="flex -space-x-2">
              {[5, 12, 23, 33, 44].map((id) => (
                <div key={id} className="h-8 w-8 rounded-full border-2 border-[#060608] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.pravatar.cc/64?img=${id}`} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-3 w-3 fill-brutify-gold text-brutify-gold" />
                ))}
              </div>
              <span className="text-xs font-body text-brutify-text-muted">4.9/5 sur 2 400+ avis</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <BrutifyLogo size="sm" animated={false} />
            <div className="h-3 w-px bg-white/[0.08] hidden md:block" />
            <p className="text-[11px] font-body text-brutify-text-muted">
              © 2026 Brutify. Tous droits réservés.
            </p>
          </div>
          <div className="flex items-center gap-5">
            {["Features", "Pricing", "FAQ", "Contact"].map((link) => (
              <span
                key={link}
                className="text-[11px] font-body text-brutify-text-muted hover:text-brutify-gold transition-colors duration-200 cursor-pointer"
              >
                {link}
              </span>
            ))}
            <div className="h-3 w-px bg-white/[0.08] hidden md:block" />
            <span className="text-[11px] font-body text-brutify-text-muted hover:text-brutify-text-secondary transition-colors duration-200 cursor-pointer">
              Confidentialité
            </span>
            <span className="text-[11px] font-body text-brutify-text-muted hover:text-brutify-text-secondary transition-colors duration-200 cursor-pointer">
              CGU
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="brutify-scrollbar relative min-h-screen bg-[#060608] overflow-x-clip">
      {/* ── Deep ambient background ── */}
      {/* Base radial gradient — warm dark center */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,171,0,0.06) 0%, rgba(204,136,0,0.02) 40%, transparent 70%)",
        }}
      />
      {/* Large top-center gold bloom */}
      <div
        className="fixed top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none opacity-[0.045]"
        style={{
          background: "radial-gradient(ellipse at center, #FFAB00 0%, transparent 65%)",
          filter: "blur(80px)",
        }}
      />
      {/* Left accent blob */}
      <div
        className="fixed top-[20%] left-[-100px] w-[600px] h-[600px] pointer-events-none opacity-[0.03] animate-aurora-1"
        style={{
          background: "radial-gradient(circle, #CC8800 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      {/* Right accent blob */}
      <div
        className="fixed top-[30%] right-[-100px] w-[500px] h-[500px] pointer-events-none opacity-[0.025] animate-aurora-2"
        style={{
          background: "radial-gradient(circle, #FFD700 0%, transparent 60%)",
          filter: "blur(100px)",
        }}
      />
      {/* Bottom deep glow */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] pointer-events-none opacity-[0.02]"
        style={{
          background: "radial-gradient(ellipse at center bottom, #FFAB00 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Subtle vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, #060608 100%)",
        }}
      />

      <div className="noise-overlay" />
      <div className="grid-overlay" />

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <SocialProofBanner />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FooterCTA />
        <Footer />
      </div>
    </div>
  );
}
