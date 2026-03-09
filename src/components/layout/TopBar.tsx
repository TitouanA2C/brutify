"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronDown,
  Menu,
  Settings,
  LogOut,
  User,
  CreditCard,
  Check,
  Zap,
  TrendingUp,
  Star,
  RefreshCw,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";

const expoOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface TopBarProps {
  onMenuClick?: () => void;
}

function notifStyle(type: string): { icon: React.ReactNode; iconBg: string } {
  switch (type) {
    case "scrape_done":
      return { icon: <RefreshCw className="h-3.5 w-3.5" />, iconBg: "bg-emerald-500/[0.12] text-emerald-400" };
    case "outlier":
      return { icon: <Zap className="h-3.5 w-3.5" />, iconBg: "bg-brutify-gold/[0.12] text-brutify-gold" };
    case "growth":
      return { icon: <TrendingUp className="h-3.5 w-3.5" />, iconBg: "bg-blue-500/[0.12] text-blue-400" };
    case "script":
      return { icon: <FileText className="h-3.5 w-3.5" />, iconBg: "bg-brutify-gold/[0.12] text-brutify-gold" };
    case "credits":
      return { icon: <CreditCard className="h-3.5 w-3.5" />, iconBg: "bg-white/[0.06] text-brutify-text-muted" };
    default:
      return { icon: <Star className="h-3.5 w-3.5" />, iconBg: "bg-white/[0.06] text-brutify-text-muted" };
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days}j`;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, profile } = useUser();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const profileName = profile?.full_name?.trim();
  const authName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    (user?.user_metadata?.name as string | undefined)?.trim();
  const userName =
    (profileName && profileName.length > 2 ? profileName : null) ??
    authName ??
    (user?.email ? user.email.split("@")[0] : null) ??
    "Utilisateur";
  const userEmail = profile?.email ?? user?.email ?? "";
  const userPlan = profile?.plan ?? "creator";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-white/[0.06] bg-brutify-bg/60 backdrop-blur-xl px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] md:hidden transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.1] cursor-pointer"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5 text-brutify-text-secondary" aria-hidden="true" />
      </button>

      <div className="hidden md:block" />

      {/* Right section */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        {/* ── Notifications ── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer",
              notifOpen
                ? "bg-white/[0.06] border-white/[0.1]"
                : "bg-transparent border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
            )}
            aria-label={`Notifications (${unreadCount} non lues)`}
          >
            <Bell className="h-4 w-4 text-brutify-text-secondary" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brutify-danger text-[9px] font-body font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.2, ease: expoOut }}
                className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl border border-white/[0.06] bg-[#111113] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Gold glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brutify-gold/30 to-transparent" />

                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <h3 className="font-display text-sm uppercase tracking-wider text-brutify-text-primary">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-[11px] font-body font-medium text-brutify-gold/70 hover:text-brutify-gold transition-colors cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Bell className="h-8 w-8 text-brutify-text-muted/20" />
                      <p className="text-[12px] font-body text-brutify-text-muted/40">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map((notif: AppNotification, i: number) => {
                      const { icon, iconBg } = notifStyle(notif.type);
                      const isUnread = !notif.read;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25, ease: expoOut }}
                          onClick={() => markRead([notif.id])}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 transition-colors duration-150 cursor-pointer",
                            isUnread
                              ? "bg-brutify-gold/[0.02] hover:bg-brutify-gold/[0.04]"
                              : "hover:bg-white/[0.02]"
                          )}
                        >
                          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-[13px] font-body truncate",
                                isUnread
                                  ? "font-semibold text-brutify-text-primary"
                                  : "font-medium text-brutify-text-secondary"
                              )}>
                                {notif.title}
                              </p>
                              {isUnread && (
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-brutify-gold shadow-[0_0_6px_rgba(255,171,0,0.4)]" />
                              )}
                            </div>
                            {notif.description && (
                              <p className="text-[11px] font-body text-brutify-text-muted truncate mt-0.5">
                                {notif.description}
                              </p>
                            )}
                            <p className="text-[10px] font-body text-brutify-text-muted/50 mt-1">
                              {formatRelativeTime(notif.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-white/[0.06] px-4 py-2.5">
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="w-full text-center text-[11px] font-body font-medium text-brutify-text-muted hover:text-brutify-text-primary transition-colors cursor-pointer"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── User menu ── */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200 border cursor-pointer",
              userOpen
                ? "bg-white/[0.04] border-white/[0.06]"
                : "border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
            )}
            aria-label="Menu utilisateur"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-xs font-body font-bold text-brutify-bg shadow-[0_0_8px_rgba(255,171,0,0.2)]">
              {initials}
            </div>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-brutify-text-muted hidden md:block transition-transform duration-200",
                userOpen && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.2, ease: expoOut }}
                className="absolute right-0 top-full mt-2 w-[220px] rounded-2xl border border-white/[0.06] bg-[#111113] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                {/* Gold glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-brutify-gold/30 to-transparent" />

                {/* User info */}
                <div className="px-4 pt-4 pb-3">
                  <p className="text-sm font-body font-semibold text-brutify-text-primary truncate">
                    {userName}
                  </p>
                  <p className="text-[11px] font-body text-brutify-text-muted truncate">
                    {userEmail}
                  </p>
                </div>

                <div className="h-px bg-white/[0.06] mx-3" />

                {/* Menu items */}
                <div className="py-1.5">
                  <UserMenuItem
                    href="/profile"
                    icon={<User className="h-3.5 w-3.5" />}
                    label="Mon profil"
                    onClick={() => setUserOpen(false)}
                  />
                  <UserMenuItem
                    href="/settings?tab=abonnement"
                    icon={<CreditCard className="h-3.5 w-3.5" />}
                    label="Abonnement"
                    badge={userPlan}
                    onClick={() => setUserOpen(false)}
                  />
                  <UserMenuItem
                    href="/settings?tab=parametres"
                    icon={<Settings className="h-3.5 w-3.5" />}
                    label="Paramètres"
                    onClick={() => setUserOpen(false)}
                  />
                </div>

                <div className="h-px bg-white/[0.06] mx-3" />

                <div className="py-1.5">
                  <Link
                    href="/api/auth/logout"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-2 text-[13px] font-body font-medium text-brutify-danger/80 hover:text-brutify-danger hover:bg-brutify-danger/[0.04] transition-all duration-150 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Se déconnecter
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function UserMenuItem({
  href,
  icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-[13px] font-body font-medium text-brutify-text-secondary hover:text-brutify-text-primary hover:bg-white/[0.03] transition-all duration-150"
    >
      <span className="text-brutify-text-muted">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] font-body font-semibold text-brutify-gold bg-brutify-gold/[0.08] border border-brutify-gold/15 rounded-full px-2 py-0.5 capitalize">
          {badge}
        </span>
      )}
    </Link>
  );
}
