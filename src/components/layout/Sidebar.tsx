"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Play,
  PenTool,
  LayoutDashboard,
  Bookmark,
  Settings,
  CreditCard,
  X,
  Sparkles,
  ChevronRight,
  Bell,
  Check,
  RefreshCw,
  TrendingUp,
  FileText,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useCredits } from "@/lib/credits-context";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/creators", label: "Créateurs", icon: Users },
  { href: "/videos", label: "Vidéos", icon: Play },
  { href: "/scripts", label: "Scripts", icon: PenTool },
  { href: "/board", label: "BrutBoard", icon: Home },
  { href: "/vault", label: "Banque d'idées", icon: Bookmark },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function notifStyle(type: string): { icon: React.ReactNode; iconBg: string } {
  switch (type) {
    case "scrape_done": return { icon: <RefreshCw className="h-3 w-3" />, iconBg: "bg-emerald-500/[0.15] text-emerald-400" };
    case "outlier":     return { icon: <Zap className="h-3 w-3" />,       iconBg: "bg-brutify-gold/[0.15] text-brutify-gold" };
    case "growth":      return { icon: <TrendingUp className="h-3 w-3" />, iconBg: "bg-brutify-gold/[0.15] text-brutify-gold" };
    case "script":      return { icon: <FileText className="h-3 w-3" />,  iconBg: "bg-brutify-gold/[0.15] text-brutify-gold" };
    default:            return { icon: <Bell className="h-3 w-3" />,      iconBg: "bg-white/[0.06] text-brutify-text-muted" };
  }
}

function formatRelTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const { profile } = useUser();
  const { credits, maxCredits } = useCredits();
  const pct = maxCredits > 0 ? Math.round((credits / maxCredits) * 100) : 0;
  const borrowedCredits = profile?.borrowed_credits ?? 0;
  const rolloverCredits = profile?.rollover_credits ?? 0;

  const userName = profile?.full_name ?? "Utilisateur";
  const userPlan = profile?.plan ?? "creator";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const sidebarContent = (
    <aside className="flex h-screen w-[260px] flex-col bg-[#0A0A0E] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[250px] opacity-[0.035]"
          style={{
            background:
              "radial-gradient(ellipse at center top, #FFAB00 0%, transparent 60%)",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] opacity-[0.02]"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, #FFAB00 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex h-[72px] items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5"
          aria-label="Accueil Brutify"
        >
          <div 
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-brutify-gold to-brutify-gold-dark shadow-[0_0_20px_rgba(255,171,0,0.25)] transition-shadow duration-300 group-hover:shadow-[0_0_35px_rgba(255,171,0,0.45)]"
            style={{ filter: 'drop-shadow(0 0 20px rgba(255,171,0,0.25))' }}
          >
            <Sparkles className="h-4 w-4 text-black" />
          </div>
          <span 
            className="font-display text-xl tracking-[0.15em] text-gold-gradient select-none"
            style={{ filter: 'drop-shadow(0 0 15px rgba(255,171,0,0.2))' }}
          >
            BRUTIFY
          </span>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors duration-200 md:hidden cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Navigation */}
      <nav
        className="relative z-10 flex-1 px-3 py-5 overflow-y-auto"
        aria-label="Navigation principale"
      >
        <p className="px-3 mb-3 text-[10px] font-body font-semibold uppercase tracking-[0.2em] text-brutify-text-muted/50">
          Menu
        </p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-body font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "text-brutify-gold"
                      : "text-brutify-text-secondary hover:text-brutify-text-primary"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-brutify-gold/[0.1] border border-brutify-gold/[0.25] shadow-[0_0_25px_rgba(255,171,0,0.2)]"
                      transition={{ type: "spring", bounce: 0.12, duration: 0.3 }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-bar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-brutify-gold to-brutify-gold-dark shadow-[0_0_12px_rgba(255,171,0,0.6)]"
                      transition={{ type: "spring", bounce: 0.12, duration: 0.3 }}
                    />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/[0.08] transition-colors duration-200" />
                  )}
                  <div className={cn(
                    "relative z-10 flex items-center gap-3 w-full transition-transform duration-200",
                    !isActive && "group-hover:translate-x-1"
                  )}>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-brutify-gold/[0.15] shadow-[0_0_15px_rgba(255,171,0,0.15)]"
                        : "bg-white/[0.03] group-hover:bg-white/[0.08]"
                    )}>
                      <Icon
                        className={cn(
                          "h-[16px] w-[16px] transition-all duration-200",
                          isActive ? "text-brutify-gold" : "text-brutify-text-muted group-hover:text-brutify-text-primary"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 text-brutify-gold/60" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Nav-credits separator */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Credits card */}
      <div className="relative z-10 px-4 pb-3 pt-3">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-4 relative overflow-hidden">
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-16 opacity-[0.07] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, #FFAB00 0%, transparent 70%)",
              filter: "blur(16px)",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md",
                  pct <= 10 ? "bg-red-500/20 animate-pulse" : "bg-brutify-gold/[0.1]"
                )}>
                  <CreditCard
                    className={cn(
                      "h-3 w-3",
                      pct <= 10 ? "text-red-500" : "text-brutify-gold"
                    )}
                    aria-hidden="true"
                  />
                </div>
                <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted">
                  Brutpoints
                </span>
                {pct <= 10 && (
                  <span className="text-[8px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    Faible
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className={cn(
                  "font-display text-xl leading-none tracking-wider",
                  pct <= 10 ? "text-red-400" : "text-gold-gradient"
                )}>
                  {credits}
                </span>
                {(borrowedCredits > 0 || rolloverCredits > 0) && (
                  <div className="text-[9px] font-body text-white/50 mt-0.5 space-y-0.5">
                    {rolloverCredits > 0 && (
                      <div className="text-emerald-400/70">
                        (+{rolloverCredits} reportés)
                      </div>
                    )}
                    {borrowedCredits > 0 && (
                      <div className="text-orange-400/70">
                        (-{borrowedCredits} empruntés)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative mb-3">
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-white/[0.04]"
                role="progressbar"
                aria-valuenow={credits}
                aria-valuemax={maxCredits}
                aria-label="Brutpoints restants"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pct, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: expoOut }}
                  className={cn(
                    "h-full rounded-full",
                    pct > 20
                      ? "bg-gradient-to-r from-brutify-gold-dark via-brutify-gold to-[#FFD700] shadow-[0_0_15px_rgba(255,171,0,0.5)]"
                      : pct > 10
                        ? "bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                        : "bg-gradient-to-r from-red-600 via-red-500 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.7)] animate-pulse"
                  )}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className={cn(
                  "text-[10px] font-body",
                  pct <= 10 ? "text-red-400 font-semibold" : "text-brutify-text-muted/60"
                )}>
                  {pct <= 10 ? "⚠️ Critique" : pct <= 20 ? "⚠ Attention" : `${pct}% restant`}
                </span>
                <span className="text-[10px] font-body text-brutify-text-muted/40">
                  {maxCredits} max
                </span>
              </div>
            </div>

            {/* Alerte BP faibles — compact sidebar */}
            {pct <= 20 && (
              <div className={cn(
                "rounded-lg border p-2.5 mb-2",
                credits === 0
                  ? "border-red-500/25 bg-red-500/[0.06]"
                  : "border-orange-500/20 bg-orange-500/[0.04]"
              )}>
                <p className={cn(
                  "text-[10px] font-body font-semibold mb-1",
                  credits === 0 ? "text-red-400" : "text-orange-400"
                )}>
                  {credits === 0 ? "Plus de BrutPoints !" : "BP bientôt épuisés"}
                </p>
                <p className="text-[9px] font-body text-white/40 leading-relaxed">
                  {credits === 0
                    ? "Recharge pour continuer à créer."
                    : `Plus que ${credits} BP restants.`
                  }
                </p>
              </div>
            )}

            <Link
              href="/settings?tab=abonnement"
              onClick={onMobileClose}
              className={cn(
                "flex items-center justify-center gap-1.5 w-full rounded-lg border py-2 text-[11px] font-body font-semibold transition-all duration-200",
                pct <= 10
                  ? "bg-red-500/[0.12] border-red-500/30 text-red-400 hover:bg-red-500/[0.2] hover:border-red-500/50 animate-pulse"
                  : "bg-brutify-gold/[0.08] border-brutify-gold/[0.15] text-brutify-gold/90 hover:text-brutify-gold hover:bg-brutify-gold/[0.15] hover:border-brutify-gold/30 hover:shadow-[0_0_20px_rgba(255,171,0,0.2)] hover:scale-[1.02]"
              )}
            >
              {pct <= 10 ? <Zap className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
              {pct <= 10 ? "Recharger maintenant" : "Acheter des Brutpoints"}
            </Link>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="relative z-10 mx-5 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Bottom actions: notifs + user */}
      <div className="relative z-10 p-4 space-y-1">

        {/* Notification row */}
        <div ref={notifPanelRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-body font-medium transition-colors duration-150 cursor-pointer",
              notifOpen ? "bg-brutify-gold/[0.06] text-brutify-gold" : "text-brutify-text-secondary hover:text-brutify-text-primary hover:bg-white/[0.03]"
            )}
          >
            <div className={cn(
              "relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150",
              notifOpen ? "bg-brutify-gold/[0.12]" : "bg-white/[0.03] group-hover:bg-white/[0.05]"
            )}>
              <Bell className={cn("h-4 w-4", notifOpen ? "text-brutify-gold" : "text-brutify-text-muted group-hover:text-brutify-text-secondary")} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brutify-danger text-[9px] font-body font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="flex-1 text-left">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-body font-semibold text-brutify-gold bg-brutify-gold/[0.08] border border-brutify-gold/15 rounded-full px-1.5 py-0.5">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification panel — pops up above */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-white/[0.07] bg-[#111113] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                style={{ maxHeight: 340 }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brutify-gold/20 to-transparent" />
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
                  <span className="font-display text-xs uppercase tracking-widest text-brutify-text-primary">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-body text-brutify-gold/70 hover:text-brutify-gold cursor-pointer transition-colors">
                      <Check className="h-2.5 w-2.5" />Tout lire
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center py-6 gap-2">
                      <Bell className="h-6 w-6 text-brutify-text-muted/20" />
                      <p className="text-[11px] font-body text-brutify-text-muted/40">Aucune notification</p>
                    </div>
                  ) : notifications.map((n: AppNotification) => {
                    const { icon, iconBg } = notifStyle(n.type);
                    return (
                      <div
                        key={n.id}
                        onClick={() => markRead([n.id])}
                        className={cn(
                          "flex items-start gap-2.5 px-4 py-2.5 cursor-pointer transition-colors duration-100",
                          !n.read ? "bg-brutify-gold/[0.02] hover:bg-brutify-gold/[0.04]" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md", iconBg)}>{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={cn("text-[12px] font-body truncate", !n.read ? "font-semibold text-brutify-text-primary" : "font-medium text-brutify-text-secondary")}>
                              {n.title}
                            </p>
                            {!n.read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brutify-gold" />}
                          </div>
                          {n.description && <p className="text-[10px] font-body text-brutify-text-muted truncate mt-0.5">{n.description}</p>}
                          <p className="text-[10px] font-body text-brutify-text-muted/40 mt-0.5">{formatRelTime(n.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User block → settings */}
        <Link
          href="/settings"
          onClick={onMobileClose}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 -mx-0 transition-colors duration-150 hover:bg-white/[0.03] cursor-pointer"
        >
          <div className="relative shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-xs font-body font-bold text-black shadow-[0_0_10px_rgba(255,171,0,0.2)]">
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brutify-success border-2 border-[#0A0A0E]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-body font-medium text-brutify-text-primary group-hover:text-white transition-colors duration-150">
              {userName}
            </p>
            <p className="text-[10px] font-body text-brutify-text-muted truncate">
              Plan <span className="text-brutify-gold font-medium capitalize">{userPlan}</span>
            </p>
          </div>
          <Settings className="h-3.5 w-3.5 text-brutify-text-muted/40 group-hover:text-brutify-text-muted group-hover:rotate-45 transition-all duration-300" />
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block fixed left-0 top-0 z-40">
        {sidebarContent}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onMobileClose}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: expoOut }}
              className="fixed left-0 top-0 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
