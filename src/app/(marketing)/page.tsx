"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Search,
  Play,
  ChevronDown,
  Star,
  ArrowRight,
  Users,
  Eye,
  Menu,
  X,
  Bookmark,
  Plus,
  ChevronUp,
  Flame,
  Heart,
  MessageCircle,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrutifyLogo } from "@/components/ui/BrutifyLogo";
import { DotPattern } from "@/components/magicui/dot-pattern";

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
        <span className="text-[8px] font-display tracking-wider text-brutify-gold">8 TOP PERFS</span>
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
    { label: "Essai gratuit", id: "pricing" },
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
            className="group hidden md:inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-[14px] font-body font-bold text-[#0a0800] shadow-[0_0_20px_rgba(255,171,0,0.2)] hover:shadow-[0_0_32px_rgba(255,171,0,0.35)] hover:brightness-110 active:scale-[0.97] transition-all duration-200"
          >
            Essai gratuit
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
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
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-[15px] font-body font-bold text-[#0a0800] shadow-[0_0_20px_rgba(255,171,0,0.2)]"
            >
              Essai gratuit
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
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
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] leading-[0.95] tracking-wider mb-6"
          >
            Finis de chercher.{" "}
            <br />
            <span className="text-gold-gradient">Commence à créer.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Brutify analyse les vidéos qui performent dans ta niche, identifie pourquoi, et génère ton prochain script structuré. Tu n&apos;as plus qu&apos;à filmer.
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-3 rounded-2xl bg-gold-gradient px-10 py-4 shadow-[0_0_40px_rgba(255,171,0,0.25),0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.4),0_4px_20px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-[0.97] transition-all duration-200"
            >
              {/* Ambient glow */}
              <div className="absolute -inset-6 rounded-3xl bg-brutify-gold/20 blur-2xl group-hover:bg-brutify-gold/30 transition-all duration-500 -z-10" />
              <span className="text-base font-body font-bold text-[#0a0800]">
                Commencer gratuitement
              </span>
              <ArrowRight className="h-4 w-4 text-[#0a0800]/70 group-hover:translate-x-0.5 transition-transform duration-200" />
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

// ─── Account Analysis (Section 2) ───────────────────────────────────────────

function AccountAnalysis() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [handle, setHandle] = useState("");

  return (
    <section className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6 text-xs font-body font-medium text-brutify-gold uppercase tracking-wider"
        >
          Veille concurrentielle
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4"
        >
          Vois exactement ce qui performe chez{" "}
          <span className="text-gold-gradient">n&apos;importe quel créateur.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Entre le nom d&apos;un compte et découvre ses vidéos classées par Brut Score — le score qui identifie les contenus qui sont sortis du lot.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center gap-3 max-w-lg mx-auto"
        >
          <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brutify-text-muted" />
            <input
              type="text"
              placeholder="@nom du compte..."
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full h-12 rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-4 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted focus:outline-none focus:border-brutify-gold/30 focus:ring-1 focus:ring-brutify-gold/20 transition-all"
            />
          </div>
          <Link
            href={`/signup${handle ? `?account=${encodeURIComponent(handle)}` : ""}`}
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gold-gradient px-6 py-3 text-sm font-body font-bold text-[#0a0800] shadow-[0_0_24px_rgba(255,171,0,0.2),0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_0_36px_rgba(255,171,0,0.35),0_2px_12px_rgba(0,0,0,0.2)] hover:brightness-110 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
          >
            Analyser
            <ArrowRight className="h-4 w-4 text-[#0a0800]/70 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-xs font-body text-brutify-text-muted mt-4"
        >
          Instagram · TikTok · YouTube
        </motion.p>
      </div>
    </section>
  );
}

// ─── Features ───────────────────────────────────────────────────────────────

const featuresData = [
  {
    icon: Users,
    title: "Vois qui domine dans ta niche",
    titleAccent: "domine",
    description: "Identifie les créateurs qui sur-performent sur Instagram, TikTok et YouTube — et comprends ce qui les rend incontournables.",
    miniUI: MiniCreatorCard,
  },
  {
    icon: Eye,
    title: "Trouve les vidéos qui performent. Pas toutes — les bonnes.",
    titleAccent: "les bonnes",
    description: "Accede a une base de videos virales validees par la data. Plus de scroll au hasard.",
    miniUI: MiniVideoCard,
  },
  {
    icon: Star,
    title: "Un hook qui accroche dès la première seconde.",
    titleAccent: "première seconde",
    description: "Génère des hooks basés sur des structures qui ont prouvé leur efficacité — curiosité, contrarian, question. Aucun hasard.",
    miniUI: MiniHooksList,
  },
  {
    icon: Bookmark,
    title: "Centralise ta veille. Arrête de tout éparpiller.",
    titleAccent: "ta veille",
    description: "Suis tous tes créateurs de référence sur toutes les plateformes depuis un seul endroit.",
    miniUI: MiniWatchlist,
  },
];

function Features() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="features" className="py-24 px-6" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <div className="overflow-hidden">
            <motion.h2
              initial={{ opacity: 0, y: 60 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary leading-tight"
            >
              Ce qui se passe dans Brutify{" "}
              <span className="text-gold-gradient">avant que tu filmes.</span>
            </motion.h2>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuresData.map((feat, i) => {
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
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

const stepsData = [
  {
    step: "ÉTAPE 1",
    title: "Trouve les créateurs qui dominent",
    description: "Recherche et ajoute les créateurs qui performent dans ton domaine. Organise-les en bibliothèques pour avoir tout centralisé.",
  },
  {
    step: "ÉTAPE 2",
    title: "Identifie ce qui performe vraiment",
    description: "Accède aux vidéos qui sur-performent dans ta niche. Validées par la data, pas par ton intuition.",
  },
  {
    step: "ÉTAPE 3",
    title: "Comprends pourquoi ça marche",
    description: "Chaque vidéo est analysée en profondeur — structure, hook, rétention. Tu sais exactement quoi reproduire.",
  },
  {
    step: "ÉTAPE 4",
    title: "Génère ton script. Prêt à filmer.",
    description: "Brutify structure ton contenu de A à Z — hook, corps, CTA. Tu n'as plus qu'à appuyer sur REC.",
  },
];

function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how" className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4">
            Comment ça marche
          </h2>
          <p className="text-base font-body text-brutify-text-secondary max-w-xl">
            De l&apos;idée au script. En quelques minutes. Sans friction.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: clickable steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-2"
          >
            {stepsData.map((step, i) => (
              <button
                key={step.step}
                onClick={() => setActiveStep(i)}
                className={cn(
                  "w-full text-left rounded-xl p-5 transition-all duration-300 border cursor-pointer",
                  activeStep === i
                    ? "border-brutify-gold/20 bg-brutify-gold/[0.04]"
                    : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]"
                )}
              >
                <span className={cn(
                  "text-xs font-body font-semibold uppercase tracking-wider transition-colors duration-300",
                  activeStep === i ? "text-brutify-gold" : "text-brutify-text-muted"
                )}>
                  {step.step}
                </span>
                <h3 className={cn(
                  "font-display text-xl md:text-2xl tracking-wider mt-1 transition-colors duration-300",
                  activeStep === i ? "text-brutify-text-primary" : "text-brutify-text-muted"
                )}>
                  {step.title}
                </h3>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    activeStep === i ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
                  )}
                >
                  <p className="text-sm font-body text-brutify-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </button>
            ))}

            <div className="mt-4 flex items-center gap-2">
              {stepsData.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className="flex-1 h-[3px] rounded-full bg-white/[0.06] overflow-hidden cursor-pointer"
                >
                  <motion.div
                    className="h-full rounded-full bg-gold-gradient"
                    initial={false}
                    animate={{ width: activeStep >= i ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Right: visual preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl border border-white/[0.06] bg-[#0D0D12] p-6 min-h-[400px] flex flex-col justify-center"
          >
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
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="h-4 w-4 text-brutify-gold/60" />
                      <div className="flex-1 h-10 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 flex items-center backdrop-blur-sm">
                        <span className="text-sm font-body text-brutify-text-muted">Rechercher un créateur...</span>
                      </div>
                      <button className="rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-body font-semibold text-[#0d0a00] shadow-[0_0_20px_rgba(255,171,0,0.3)] hover:shadow-[0_0_30px_rgba(255,171,0,0.5)] transition-all">
                        Ajouter
                      </button>
                    </div>
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
                        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                      >
                        <div className="relative">
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${creator.gradient} ring-2 ring-white/[0.08]`} />
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0d0d12] flex items-center justify-center" style={{ background: creator.platform }}>
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
                  <div className="grid grid-cols-3 gap-2.5">
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
                        className="rounded-xl overflow-hidden aspect-[9/16] bg-black/40 border border-white/[0.06] flex flex-col"
                      >
                        <div className={`flex-1 bg-gradient-to-br ${video.gradient} relative`}>
                          <div className="absolute top-2 left-2">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-brutify-gold/20 border border-brutify-gold/40 backdrop-blur-sm">
                              <Flame className="h-2.5 w-2.5 text-brutify-gold-light" />
                              <span className="text-[9px] font-display text-brutify-gold">{video.score}x</span>
                            </div>
                          </div>
                        </div>
                        <div className="px-2 py-2 bg-[#0d0d12]/90 border-t border-white/[0.04]">
                          <div className="flex items-center gap-1">
                            <Eye className="h-2.5 w-2.5 text-brutify-gold" />
                            <span className="text-[9px] font-display text-brutify-gold">{video.views}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="space-y-3">
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
                        {["Hook", "Problème", "Solution", "CTA"].map((s, j) => (
                          <span key={j} className="text-[9px] font-body px-2 py-1 rounded-lg bg-brutify-gold/[0.06] border border-brutify-gold/15 text-brutify-text-secondary">
                            {s}
                          </span>
                        ))}
                      </div>
                    </motion.div>
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.3 }}
                      className="rounded-xl border border-brutify-gold/25 bg-brutify-gold/[0.08] p-4 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-brutify-gold/30 backdrop-blur-sm w-fit mb-3">
                        <Sparkles className="h-2.5 w-2.5 text-brutify-gold" />
                        <span className="text-[9px] font-display tracking-wider text-brutify-gold uppercase">Hook</span>
                      </div>
                      <p className="text-sm font-body font-semibold italic text-brutify-text-primary leading-relaxed">
                        &ldquo;Personne ne te le dit, mais c&apos;est LA raison pourquoi tu n&apos;arrives pas à percer...&rdquo;
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-brutify-gold/60" />
                        <span className="text-[9px] font-body text-brutify-gold/60">Curiosité + Pattern Interrupt</span>
                      </div>
                    </motion.div>
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
                        {[1, 2, 3].map((n) => (
                          <div key={n} className="flex items-start gap-2">
                            <div className={cn("h-5 w-5 rounded-lg flex items-center justify-center flex-shrink-0", n === 1 ? "bg-brutify-gold/[0.08] border border-brutify-gold/20" : "bg-white/[0.04] border border-white/[0.06]")}>
                              <span className={cn("text-[9px] font-display", n === 1 ? "text-brutify-gold" : "text-white/60")}>{n}</span>
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 rounded bg-white/[0.06] w-full" />
                              {n < 3 && <div className="h-2 rounded bg-white/[0.06] w-10/12" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] font-body font-bold text-emerald-400 uppercase tracking-wider">CTA · Action</span>
                      </div>
                      <p className="text-xs font-body font-semibold text-brutify-text-primary leading-relaxed">
                        &ldquo;Clique sur le lien en bio maintenant et obtiens un accès immédiat...&rdquo;
                      </p>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
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
            <span className="text-[10px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Score Viral</span>
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
            { label: "> 5x viral", active: true },
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
            <span className="text-[10px] font-body font-bold text-brutify-text-secondary uppercase tracking-wider">Top Virales</span>
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
          <h2 className="font-display text-4xl md:text-6xl tracking-wider text-brutify-text-primary mb-2">
            <span className="text-gold-gradient">1%</span> des vidéos génèrent 90% des vues.
          </h2>
          <p className="font-display text-4xl md:text-6xl tracking-wider text-brutify-text-primary">
            On t&apos;aide à comprendre pourquoi.
          </p>
          <p className="mt-6 text-base md:text-lg font-body text-brutify-text-secondary max-w-xl mx-auto">
            Des millions de vidéos analysées chaque jour pour que tu tombes toujours sur les bonnes.
          </p>
          <p className="mt-4 font-display text-2xl text-gold-gradient">
            {count.toLocaleString("fr-FR")}+
          </p>
          <p className="text-sm font-body text-brutify-text-muted">vidéos analysées</p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Analytics (Section 6) ──────────────────────────────────────────────────

function Analytics() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6 text-xs font-body font-medium text-brutify-gold uppercase tracking-wider"
        >
          Tes stats
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4"
        >
          Tes vidéos méritent mieux que les stats de{" "}
          <span className="text-gold-gradient">tes réseaux.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Brutify centralise tes performances sur Instagram, TikTok et YouTube dans un seul dashboard. Vues, rétention, engagement — et ton Brut Score pour savoir quelles vidéos ont vraiment surperformé.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.1] px-6 py-3 text-sm font-body font-semibold text-white hover:bg-white/[0.12] hover:border-white/[0.18] active:scale-[0.97] transition-all duration-200"
          >
            Voir mes stats
            <ArrowRight className="h-3.5 w-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing CTA ─────────────────────────────────────────────────────────────

function Pricing() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center rounded-full border border-brutify-gold/20 bg-brutify-gold/[0.06] px-4 py-1.5 mb-6 text-xs font-body font-medium text-brutify-gold uppercase tracking-wider"
        >
          Essai gratuit
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4"
        >
          Teste Brutify <span className="text-gold-gradient">gratuitement</span> pendant 7 jours.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-xl mx-auto leading-relaxed mb-4"
        >
          Accède a la generation de scripts, au radar createurs et au BrutBoard — sans engagement et sans carte bancaire.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <Link href="/signup" className="group relative inline-flex">
            <div className="absolute -inset-4 rounded-2xl bg-brutify-gold/15 blur-xl group-hover:bg-brutify-gold/25 transition-all duration-500" />
            <div className="relative flex items-center gap-3 rounded-2xl bg-gold-gradient px-10 py-4 shadow-[0_0_40px_rgba(255,171,0,0.25),0_4px_16px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_60px_rgba(255,171,0,0.4),0_4px_20px_rgba(0,0,0,0.3)] group-hover:brightness-110 active:scale-[0.97] transition-all duration-200">
              <span className="text-base font-body font-bold text-[#0a0800]">
                Demarrer l&apos;essai gratuit
              </span>
              <ArrowRight className="h-4.5 w-4.5 text-[#0a0800]/70 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          </Link>
          <span className="text-xs font-body text-brutify-text-muted">
            7 jours offerts · Annulable a tout moment
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── FAQ with tabs ───────────────────────────────────────────────────────────

const faqTabs = {
  "Général": [
    { q: "C'est quoi exactement Brutify ?", a: "Brutify est un outil de pré-production pour créateurs. Il t'aide à trouver ce qui performe dans ta niche, à comprendre pourquoi, et à générer des scripts structurés — avant même d'allumer ta caméra." },
    { q: "À qui s'adresse Brutify ?", a: "À tous les créateurs qui veulent arrêter de deviner et commencer à créer avec méthode — que tu sois débutant, créateur régulier ou que tu gères une équipe de contenu." },
    { q: "Quelles plateformes sont supportées ?", a: "Instagram, TikTok et YouTube." },
    { q: "Est-ce que je dois connecter mes réseaux sociaux ?", a: "Oui, tu connectes tes comptes pour accéder à tes analytics et à l'analyse de tes propres vidéos. Pour analyser les comptes d'autres créateurs, aucune connexion n'est nécessaire." },
    { q: "Comment sont repérées les vidéos qui surperforment ?", a: "Brutify analyse en continu les vidéos publiées sur Instagram, TikTok et YouTube. Chaque vidéo reçoit un Brut Score — un indicateur qui mesure à quel point elle sur-performe la moyenne du compte qui la publie." },
  ],
  "Facturation": [
    { q: "Est-ce que je peux changer de plan ?", a: "Oui, tu peux upgrader ou downgrader à tout moment depuis ton espace compte." },
    { q: "Comment fonctionne l'essai gratuit ?", a: "L'essai gratuit de 7 jours est disponible sur le plan Creator. Tu as accès à toutes les fonctionnalités du plan pendant 7 jours." },
    { q: "Est-ce que je peux annuler à tout moment ?", a: "Oui, sans engagement et sans frais. Tu peux annuler depuis ton espace compte quand tu veux." },
  ],
  "Brut Points": [
    { q: "C'est quoi les Brut Points ?", a: "Les Brut Points (BP) sont les crédits utilisés pour les actions IA dans Brutify — générer un script, analyser une vidéo, scripter depuis une vidéo concurrentielle. Chaque plan inclut un quota mensuel de BP." },
    { q: "Que se passe-t-il si j'utilise tous mes BP ?", a: "Tu peux recharger des BP à tout moment depuis la boutique. Les abonnés bénéficient d'une réduction sur chaque recharge — jusqu'à −40% sur le plan Scale." },
    { q: "Les BP non utilisés sont-ils reportés ?", a: "Non, les Brut Points expirent à la fin de chaque mois. Ils se remettent à zéro au renouvellement de ton abonnement." },
  ],
  "Ce en quoi on croit": [
    { q: "Pourquoi Brutify existe ?", a: "Parce que la majorité des créateurs passent plus de temps à chercher quoi créer qu'à créer. On a voulu construire un système — pas juste un outil — pour que chaque créateur ait accès à une méthode claire, peu importe son niveau ou ses ressources." },
    { q: "Quelle est la philosophie derrière Brutify ?", a: "Clarté avant action. On croit que le vrai problème du créateur n'est pas de manquer de talent ou de motivation — c'est de manquer de système. Brutify est là pour combler ce manque." },
    { q: "Brutify remplace-t-il la créativité ?", a: "Non. Brutify structure — il ne crée pas à ta place. L'idée finale, l'angle, la façon dont tu parles à ta caméra — c'est toi. Brutify te donne le cadre pour que ton énergie aille au bon endroit." },
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
            <h2 className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary leading-tight mb-3">
              Des<br />questions ?
            </h2>
            <p className="text-sm font-body text-brutify-text-secondary mb-6 leading-relaxed">
              Tout ce que tu dois savoir pour démarrer.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link
                href="mailto:contact@brutify.app"
                className="group inline-flex items-center gap-2 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.1] px-5 py-3 text-sm font-body font-semibold text-white hover:bg-white/[0.12] hover:border-white/[0.18] active:scale-[0.97] transition-all duration-200"
              >
                Contacte-nous
                <ArrowRight className="h-3.5 w-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
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

// ─── Not Convinced (Section 10) ─────────────────────────────────────────────

function NotConvinced() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-24 px-6 border-t border-white/[0.04]" ref={ref}>
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl md:text-5xl tracking-wider text-brutify-text-primary mb-4"
        >
          Pas convaincu que Brutify soit ce qu&apos;il te faut ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base md:text-lg font-body font-light text-brutify-text-secondary max-w-xl mx-auto leading-relaxed mb-10"
        >
          Demande directement a une IA ce qu&apos;elle en pense.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href={`https://chat.openai.com/?q=${encodeURIComponent("Je suis un créateur de contenu sur les réseaux sociaux (Instagram, TikTok, YouTube). J'ai du mal à trouver des idées de contenu qui performent, à analyser ce que font les meilleurs créateurs de ma niche, et à structurer mes scripts vidéo. J'ai trouvé Brutify, un outil qui permet de : 1) Suivre et analyser les créateurs qui surperforment dans ma niche 2) Identifier automatiquement les vidéos qui ont le mieux performé grâce à un score appelé Brut Score 3) Générer des scripts structurés (hook, corps, CTA) basés sur des structures qui marchent 4) Planifier mon calendrier éditorial avec un board de contenu. Est-ce que ce type d'outil serait utile pour un créateur comme moi ? Quels seraient les avantages concrets ?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.1] px-6 py-3 text-sm font-body font-semibold text-white hover:bg-white/[0.12] hover:border-white/[0.18] active:scale-[0.97] transition-all duration-200"
          >
            Demander a ChatGPT
            <ArrowRight className="h-3.5 w-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
          </a>
          <a
            href={`https://claude.ai/new?q=${encodeURIComponent("Je suis un créateur de contenu sur les réseaux sociaux (Instagram, TikTok, YouTube). J'ai du mal à trouver des idées de contenu qui performent, à analyser ce que font les meilleurs créateurs de ma niche, et à structurer mes scripts vidéo. J'ai trouvé Brutify, un outil qui permet de : 1) Suivre et analyser les créateurs qui surperforment dans ma niche 2) Identifier automatiquement les vidéos qui ont le mieux performé grâce à un score appelé Brut Score 3) Générer des scripts structurés (hook, corps, CTA) basés sur des structures qui marchent 4) Planifier mon calendrier éditorial avec un board de contenu. Est-ce que ce type d'outil serait utile pour un créateur comme moi ? Quels seraient les avantages concrets ?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-white/[0.07] backdrop-blur-sm border border-white/[0.1] px-6 py-3 text-sm font-body font-semibold text-white hover:bg-white/[0.12] hover:border-white/[0.18] active:scale-[0.97] transition-all duration-200"
          >
            Demander a Claude
            <ArrowRight className="h-3.5 w-3.5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
          </a>
        </motion.div>
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
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wider text-brutify-text-primary leading-[0.95] mb-6">
            Crée du contenu{" "}
            <span className="text-gold-gradient">viral</span>
            <br />
            en quelques secondes.
          </h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-base md:text-lg font-body text-brutify-text-secondary max-w-xl mx-auto mb-10"
          >
            Rejoins les créateurs qui ont arrêté de deviner.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <Link href="/signup" className="group relative inline-flex">
              {/* Ambient glow */}
              <div className="absolute -inset-6 rounded-3xl bg-brutify-gold/20 blur-2xl group-hover:bg-brutify-gold/30 transition-all duration-500" />
              {/* Button */}
              <div className="relative flex items-center gap-3 rounded-2xl bg-gold-gradient px-10 py-4 shadow-[0_0_40px_rgba(255,171,0,0.25),0_4px_16px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_60px_rgba(255,171,0,0.4),0_4px_20px_rgba(0,0,0,0.3)] group-hover:brightness-110 active:scale-[0.97] transition-all duration-200">
                <span className="text-base font-body font-bold text-[#0a0800]">
                  Commencer gratuitement
                </span>
                <ArrowRight className="h-4.5 w-4.5 text-[#0a0800]/70 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </Link>
            <span className="text-xs font-body text-brutify-text-muted">
              7 jours offerts · Annulable à tout moment
            </span>
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
            {["Features", "Essai gratuit", "FAQ", "Contact"].map((link) => (
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
        <AccountAnalysis />
        <Features />
        <HowItWorks />
        <SocialProofBanner />
        <Analytics />
        <Pricing />
        <FAQ />
        <NotConvinced />
        <FooterCTA />
        <Footer />
      </div>
    </div>
  );
}
