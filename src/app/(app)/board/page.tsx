"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Circle, Calendar, MoreHorizontal, Pencil, Trash2, X,
  LayoutDashboard, Play, Sparkles, ChevronLeft, ChevronRight,
  Clock, Check, List,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  useBoard, useCreateBoardItem, useUpdateBoardItem, useDeleteBoardItem, type BoardItem,
} from "@/hooks/useBoard";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast-context";
import { Loading } from "@/components/ui/Loading";
import { DatePicker } from "@/components/ui/DatePicker";

// ─── Types & Config ───────────────────────────────────────────────────────────

type BrutBoardStatus = "inspiration" | "idea" | "draft" | "in_progress" | "scheduled" | "published";
type Platform = "instagram" | "tiktok" | "youtube";
type ViewMode = "list" | "calendar";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const statusConfig: Record<BrutBoardStatus, { label: string; color: string; dot: string; bg: string; border: string; order: number }> = {
  inspiration: { label: "Inspiration", color: "#A855F7", dot: "bg-violet-400",    bg: "bg-violet-500/[0.06]",     border: "border-violet-500/[0.15]",     order: -1 },
  idea:        { label: "Idée",       color: "#6B7280", dot: "bg-white/30",      bg: "bg-white/[0.03]",          border: "border-white/[0.06]",         order: 0 },
  draft:       { label: "Brouillon",  color: "#FFAB00", dot: "bg-orange-400",    bg: "bg-orange-400/[0.04]",     border: "border-orange-400/[0.12]",    order: 1 },
  in_progress: { label: "En cours",   color: "#CC8800", dot: "bg-yellow-500",    bg: "bg-yellow-500/[0.04]",     border: "border-yellow-500/[0.12]",    order: 2 },
  scheduled:   { label: "Planifié",   color: "#8B5CF6", dot: "bg-brutify-gold",  bg: "bg-brutify-gold/[0.04]",   border: "border-brutify-gold/[0.12]",  order: 3 },
  published:   { label: "Publié",     color: "#00E5A0", dot: "bg-emerald-400",   bg: "bg-emerald-400/[0.04]",    border: "border-emerald-400/[0.12]",   order: 4 },
};
const statusOrder: BrutBoardStatus[] = ["inspiration","idea","draft","in_progress","scheduled","published"];

const platformLabels: Record<Platform, string> = { instagram: "IG", tiktok: "TT", youtube: "YT" };
const platformColors: Record<Platform, string> = { instagram: "#E1306C", tiktok: "#00F2EA", youtube: "#FF0000" };
const platformSvg: Record<Platform, (cls: string) => React.ReactNode> = {
  instagram: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  tiktok: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-5.58-2.2V2h3.45a4.83 4.83 0 002.13 4.69z" />
    </svg>
  ),
  youtube: (cls) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cls}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrutBoardPage() {
  const router = useRouter();
  const toast = useToast();
  const { items, isLoading, mutate } = useBoard();
  const { create, isCreating } = useCreateBoardItem();
  const { update } = useUpdateBoardItem();
  const { remove } = useDeleteBoardItem();

  const [view, setView] = useState<ViewMode>("list");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<BoardItem | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BrutBoardStatus | "all">("all");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const grouped = useMemo(() => {
    const g: Record<BrutBoardStatus, BoardItem[]> = { inspiration: [], idea: [], draft: [], in_progress: [], scheduled: [], published: [] };
    items.forEach(i => { const s = i.status as BrutBoardStatus; if (g[s]) g[s].push(i); });
    return g;
  }, [items]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay() - 1; if (startDay < 0) startDay = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i, pm = month === 0 ? 12 : month, py = month === 0 ? year - 1 : year;
      days.push({ date: `${py}-${String(pm).padStart(2,"0")}-${String(d).padStart(2,"0")}`, day: d, isCurrentMonth: false, isToday: false });
    }
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear() });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nm = month+2>12?1:month+2, ny = month+2>12?year+1:year;
      days.push({ date: `${ny}-${String(nm).padStart(2,"0")}-${String(d).padStart(2,"0")}`, day: d, isCurrentMonth: false, isToday: false });
    }
    return days;
  }, [year, month]);

  const filteredItems = useMemo(() =>
    statusFilter === "all" ? items : items.filter(i => i.status === statusFilter)
  , [items, statusFilter]);

  type CalendarEvent = { item: BoardItem; type: "shoot" | "edit" | "publish" | "scheduled" };
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    const add = (date: string | null | undefined, item: BoardItem, type: CalendarEvent["type"]) => {
      if (!date) return;
      const d = date.slice(0, 10);
      if (!map[d]) map[d] = [];
      if (!map[d].some(e => e.item.id === item.id && e.type === type)) {
        map[d].push({ item, type });
      }
    };
    filteredItems.forEach(i => {
      add(i.shoot_date, i, "shoot");
      add(i.edit_date, i, "edit");
      add(i.publish_date, i, "publish");
      if (!i.shoot_date && !i.edit_date && !i.publish_date && i.scheduled_date) {
        add(i.scheduled_date, i, "scheduled");
      }
    });
    return map;
  }, [filteredItems]);

  const EVENT_TYPE_CONFIG: Record<CalendarEvent["type"], { label: string; color: string; bg: string; border: string; icon: string }> = {
    shoot:     { label: "Tournage",    color: "#60A5FA", bg: "bg-blue-400/[0.08]",    border: "border-blue-400/[0.15]",   icon: "🎬" },
    edit:      { label: "Montage",     color: "#A78BFA", bg: "bg-purple-400/[0.08]",  border: "border-purple-400/[0.15]", icon: "✂️" },
    publish:   { label: "Publication", color: "#FFAB00", bg: "bg-brutify-gold/[0.08]", border: "border-brutify-gold/[0.15]", icon: "🚀" },
    scheduled: { label: "Planifié",    color: "#8B5CF6", bg: "bg-purple-500/[0.06]",  border: "border-purple-500/[0.12]", icon: "📅" },
  };

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [items]);

  const openNew = useCallback((date?: string) => {
    setPrefillDate(date);
    setEditItem(null);
    setShowModal(true);
  }, []);

  const openEdit = useCallback((item: BoardItem) => {
    if (item.script_id) {
      router.push(`/scripts?edit=${item.script_id}`);
      return;
    }
    setEditItem(item);
    setPrefillDate(undefined);
    setShowModal(true);
    setMenuOpenId(null);
  }, [router]);

  const openScripts = useCallback((item: BoardItem) => {
    if (item.script_id) {
      router.push(`/scripts?edit=${item.script_id}`);
    } else {
      router.push(`/scripts?board_item_id=${item.id}`);
    }
  }, [router]);

  const handleSave = useCallback(async (body: {
    title: string; status?: string; scheduled_date?: string; platform?: string; notes?: string;
  }) => {
    setShowModal(false);
    if (editItem) {
      mutate(prev => ({ items: (prev?.items ?? []).map(i => i.id === editItem.id ? { ...i, ...body } : i) }), false);
      await update(editItem.id, body);
    } else {
      const result = await create(body);
      if (result?.bonusClaimable) {
        toast.success(`Bonus débloqué ! Récupère tes ${result.bonusClaimable.reward} BP sur le dashboard.`);
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    }
    setEditItem(null);
  }, [editItem, create, update, mutate, toast, router]);

  const handleDelete = useCallback(async (id: string) => {
    setShowModal(false);
    setMenuOpenId(null);
    mutate(prev => ({ items: (prev?.items ?? []).filter(i => i.id !== id) }), false);
    await remove(id);
    setEditItem(null);
  }, [remove, mutate]);

  const handleChangeStatus = useCallback(async (id: string, newStatus: BrutBoardStatus) => {
    setMenuOpenId(null);
    mutate(prev => ({ items: (prev?.items ?? []).map(i => i.id === id ? { ...i, status: newStatus } : i) }), false);
    await update(id, { status: newStatus });
  }, [update, mutate]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loading variant="page" size="lg" />
    </div>
  );

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(new Date().getDate()).padStart(2,"0")}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }} className="max-w-[1400px] mx-auto">
      <PageHeader title="BrutBoard" subtitle={`${items.length} contenus`}>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="md" onClick={() => openNew(view === "calendar" ? todayStr : undefined)}>
            <Plus className="h-4 w-4" />Nouveau contenu
          </Button>
        </div>
      </PageHeader>

      {/* View toggle + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setStatusFilter("all")} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-body font-medium transition-all duration-200 border cursor-pointer", statusFilter==="all" ? "bg-brutify-gold/[0.08] border-brutify-gold/30 text-brutify-gold shadow-[0_0_24px_rgba(255,171,0,0.25)]" : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:shadow-[0_0_12px_rgba(255,171,0,0.08)]")}>
            <span className="h-2 w-2 rounded-full bg-white/40" />Tous<span className="text-[10px] opacity-50">{statusCounts.all}</span>
          </button>
          {statusOrder.map(s => (
            <button key={s} onClick={() => setStatusFilter(statusFilter===s?"all":s)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-body font-medium transition-all duration-200 border cursor-pointer", statusFilter===s ? "bg-brutify-gold/[0.08] border-brutify-gold/30 text-brutify-gold shadow-[0_0_24px_rgba(255,171,0,0.25)]" : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1] hover:shadow-[0_0_12px_rgba(255,171,0,0.08)]")}>
              <span className={cn("h-2 w-2 rounded-full", statusConfig[s].dot)} />{statusConfig[s].label}<span className="text-[10px] opacity-50">{statusCounts[s]||0}</span>
            </button>
          ))}
        </div>

        {/* Right: view toggle + calendar nav */}
        <div className="flex items-center gap-2">
          {view === "calendar" && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentDate(new Date(year,month-1,1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.1] transition-all cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] font-body text-brutify-text-secondary hover:text-brutify-text-primary hover:border-white/[0.1] transition-all cursor-pointer">Aujourd&apos;hui</button>
              <span className="font-display text-base tracking-wider text-brutify-text-primary min-w-[120px] sm:min-w-[160px] text-center">{MONTHS[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year,month+1,1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.1] transition-all cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
            </div>
          )}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            {([{ key: "list" as ViewMode, icon: <List className="h-3.5 w-3.5" />, label: "Liste" }, { key: "calendar" as ViewMode, icon: <Calendar className="h-3.5 w-3.5" />, label: "Calendrier" }] as const).map(v => (
              <button key={v.key} onClick={() => setView(v.key)} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-body font-medium transition-all duration-150 cursor-pointer", view===v.key ? "bg-brutify-gold/[0.08] border border-brutify-gold/20 text-brutify-gold" : "border border-transparent text-brutify-text-muted hover:text-brutify-text-primary")}>
                {v.icon}{v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.18 }}>
            {items.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-8">
                {statusOrder.map(status => {
                  const group = (statusFilter==="all" ? grouped[status] : grouped[status].filter(i=>i.status===statusFilter));
                  if (group.length === 0) return null;
                  const cfg = statusConfig[status];
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        <h3 className="font-display text-base uppercase tracking-wider text-gold-gradient">{cfg.label}</h3>
                        <span className="text-xs font-body text-brutify-text-muted">{group.length}</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>
                      <div className="space-y-2">
                        {group.map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={mounted ? false : { opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05, duration: 0.3, ease: EASE }}
                          >
                            <BoardItemRow
                              item={item} menuOpen={menuOpenId===item.id}
                              onToggleMenu={() => setMenuOpenId(menuOpenId===item.id?null:item.id)}
                              onCloseMenu={() => setMenuOpenId(null)}
                              onEdit={openEdit} onDelete={handleDelete} onChangeStatus={handleChangeStatus}
                              onOpenScripts={openScripts}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            {/* Calendar grid */}
            <div className="rounded-2xl border border-white/[0.06] bg-[#111113]/40 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
              <div className="grid grid-cols-7 border-b border-white/[0.06]">
                {DAYS.map(d => <div key={d} className="py-3 text-center text-[9px] sm:text-[11px] font-body font-semibold uppercase tracking-wider text-brutify-text-muted">{d}</div>)}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayEvents = eventsByDate[day.date] || [];
                  const isSelected = selectedDay === day.date;
                  return (
                    <div key={day.date+i} onClick={() => setSelectedDay(isSelected?null:day.date)}
                      className={cn("relative min-h-[70px] sm:min-h-[110px] border-b border-r border-white/[0.03] p-1.5 transition-all duration-200 cursor-pointer group",
                        !day.isCurrentMonth && "opacity-30", day.isToday && "bg-brutify-gold/[0.02]",
                        isSelected && "bg-white/[0.03] ring-1 ring-inset ring-brutify-gold/20", !isSelected && "hover:bg-white/[0.03] hover:border-brutify-gold/30 hover:shadow-[0_0_15px_rgba(255,171,0,0.15)]")}>
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className={cn("text-xs font-body font-medium", day.isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-brutify-gold text-black font-bold" : day.isCurrentMonth ? "text-brutify-text-secondary" : "text-brutify-text-muted")}>{day.day}</span>
                        {day.isCurrentMonth && (
                          <button onClick={e => { e.stopPropagation(); openNew(day.date); }} className="flex h-5 w-5 items-center justify-center rounded-md text-brutify-text-muted/0 group-hover:text-brutify-text-muted hover:!text-brutify-gold hover:bg-brutify-gold/[0.06] transition-all cursor-pointer"><Plus className="h-3 w-3" /></button>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((evt, j) => {
                          const cfg = EVENT_TYPE_CONFIG[evt.type];
                          return (
                            <button key={evt.item.id+evt.type+j} onClick={e => { e.stopPropagation(); openEdit(evt.item); }}
                              className={cn("w-full rounded-md px-1.5 py-0.5 text-left text-[10px] font-body font-medium truncate transition-all border cursor-pointer hover:brightness-125", cfg.bg, cfg.border)}>
                              <span className="flex items-center gap-1">
                                <span className="shrink-0 text-[8px]">{cfg.icon}</span>
                                <span className="truncate" style={{ color: cfg.color }}>{evt.item.title}</span>
                              </span>
                            </button>
                          );
                        })}
                        {dayEvents.length > 3 && <span className="block text-[9px] font-body text-brutify-text-muted px-1.5">+{dayEvents.length-3} de plus</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day panel */}
            <AnimatePresence>
              {selectedDay && (eventsByDate[selectedDay]?.length ?? 0) > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-[#111113]/40 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-base uppercase tracking-wider text-brutify-text-primary">{formatDateFr(selectedDay)}</h3>
                      <button onClick={() => setSelectedDay(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-brutify-text-muted hover:text-brutify-text-primary transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-2">
                      {(eventsByDate[selectedDay] ?? []).map((evt, i) => {
                        const evtCfg = EVENT_TYPE_CONFIG[evt.type];
                        return (
                          <motion.div key={evt.item.id+evt.type} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.04, duration: 0.2 }}
                            onClick={() => openEdit(evt.item)}
                            className={cn("flex items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer hover:border-white/[0.12]", evtCfg.bg, evtCfg.border)}>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: evtCfg.color + "15" }}>
                              {evtCfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body font-medium text-brutify-text-primary truncate">{evt.item.title}</p>
                              <span className="text-[10px] font-body font-medium" style={{ color: evtCfg.color }}>{evtCfg.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {evt.item.platform && (
                                <span className="flex items-center gap-1 text-[10px] font-body text-brutify-text-muted">
                                  {platformSvg[(evt.item.platform as Platform)]("h-3 w-3")}
                                </span>
                              )}
                              <span className={cn("h-2 w-2 rounded-full", statusConfig[evt.item.status as BrutBoardStatus]?.dot)} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <ContentModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditItem(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        item={editItem}
        prefillDate={prefillDate}
        isCreating={isCreating}
      />
    </motion.div>
  );
}

// ─── Board item row ────────────────────────────────────────────────────────────

function BoardItemRow({ item, menuOpen, onToggleMenu, onCloseMenu, onEdit, onDelete, onChangeStatus, onOpenScripts }: {
  item: BoardItem;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onEdit: (item: BoardItem) => void;
  onDelete: (id: string) => void;
  onChangeStatus: (id: string, status: BrutBoardStatus) => void;
  onOpenScripts: (item: BoardItem) => void;
}) {
  const cfg = statusConfig[item.status as BrutBoardStatus];
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, onCloseMenu]);

  const hasPlanning = !!(item.shoot_date || item.edit_date || item.publish_date);
  const formattedDate = hasPlanning
    ? (item.publish_date || item.shoot_date || item.edit_date
        ? new Date((item.publish_date || item.shoot_date || item.edit_date)!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : "Non planifié")
    : item.scheduled_date
      ? new Date(item.scheduled_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      : "Non planifié";

  return (
    <div
      onClick={() => onEdit(item)}
      className="group relative flex items-center flex-wrap gap-2 sm:gap-3 rounded-2xl border border-brutify-gold/10 bg-[#111113]/60 backdrop-blur-sm px-4 py-3.5 transition-all duration-200 hover:border-brutify-gold/25 hover:bg-[#111113]/80 shadow-[0_2px_8px_rgba(0,0,0,0.2)] cursor-pointer">
      <Circle className="h-3 w-3 shrink-0 fill-current" style={{ color: cfg?.color ?? "#6B7280" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-body font-medium text-brutify-text-primary truncate">{item.title}</p>
          {item.platform && platformLabels[item.platform as Platform] && (
            <span className="text-[10px] font-body font-bold uppercase tracking-wider rounded-full px-1.5 py-0.5 border shrink-0"
              style={{ color: cfg?.color, borderColor: (cfg?.color)+"30", backgroundColor: (cfg?.color)+"10" }}>
              {platformLabels[item.platform as Platform]}
            </span>
          )}
        </div>
        {item.notes && <p className="text-xs font-body text-brutify-text-muted truncate">{item.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Calendar className="h-3 w-3 text-brutify-text-muted" />
        <span className="text-[11px] font-body text-brutify-text-muted whitespace-nowrap">{formattedDate}</span>
      </div>
      {item.status !== "published" && (() => {
        const idx = statusOrder.indexOf(item.status as BrutBoardStatus);
        const next = statusOrder[idx + 1];
        if (!next) return null;
        const nextCfg = statusConfig[next];
        return (
          <button
            onClick={e => { e.stopPropagation(); onChangeStatus(item.id, next); }}
            title={nextCfg.label}
            className="flex h-7 items-center gap-1 shrink-0 rounded-lg border px-2 py-1 text-[10px] font-body font-medium transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:scale-[0.96]"
            style={{ color: nextCfg.color, borderColor: nextCfg.color + "30", backgroundColor: nextCfg.color + "10" }}
          >
            {nextCfg.label}
            <ChevronRight className="h-3 w-3" />
          </button>
        );
      })()}
      <div className="relative" ref={menuRef}>
        <button onClick={e => { e.stopPropagation(); onToggleMenu(); }} className="flex h-7 w-7 items-center justify-center rounded-2xl text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors cursor-pointer">
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 z-30 w-48 rounded-2xl border border-white/[0.06] bg-[#111113] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
              <button onClick={() => onEdit(item)} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-body text-brutify-text-secondary hover:bg-white/[0.04] hover:text-brutify-text-primary transition-colors cursor-pointer">
                <Pencil className="h-3.5 w-3.5" />Éditer
              </button>
              <button onClick={() => { onCloseMenu(); onOpenScripts(item); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-body text-brutify-text-secondary hover:bg-white/[0.04] hover:text-brutify-text-primary transition-colors cursor-pointer">
                <Sparkles className="h-3.5 w-3.5" />{item.script_id ? "Éditer le script" : "Forger un script"}
              </button>
              <div className="border-t border-white/[0.06]">
                <p className="px-3 pt-2 pb-1 text-[9px] font-body font-medium uppercase tracking-wider text-brutify-text-muted">Changer statut</p>
                {statusOrder.filter(s => s !== item.status).map(s => (
                  <button key={s} onClick={() => onChangeStatus(item.id, s)} className="flex w-full items-center gap-2 px-3 py-2 text-xs font-body text-brutify-text-secondary hover:bg-white/[0.04] hover:text-brutify-text-primary transition-colors cursor-pointer">
                    <Circle className="h-2.5 w-2.5 fill-current" style={{ color: statusConfig[s].color }} />{statusConfig[s].label}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/[0.06]">
                <button onClick={() => onDelete(item.id)} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-body text-brutify-danger hover:bg-brutify-danger/10 transition-colors cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />Supprimer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

function ContentModal({ open, onClose, onSave, onDelete, item, prefillDate, isCreating }: {
  open: boolean; onClose: () => void;
  onSave: (b: { title: string; status?: string; scheduled_date?: string; platform?: string; notes?: string }) => void;
  onDelete: (id: string) => void;
  item: BoardItem | null; prefillDate?: string; isCreating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<BrutBoardStatus>("idea");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (item) {
      setTitle(item.title); setStatus((item.status as BrutBoardStatus)||"idea");
      const sd = item.scheduled_date ?? ""; setDate(sd.slice(0,10)); setTime(sd.slice(11,16));
      setPlatform((item.platform as Platform)||"instagram"); setNotes(item.notes||"");
    } else {
      setTitle(""); setStatus("idea"); setDate(prefillDate||""); setTime("");
      setPlatform("instagram"); setNotes("");
    }
  }, [open, item, prefillDate]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);

  const handleSubmit = () => {
    if (!title.trim() || isCreating) return;
    const scheduled = date ? (time ? `${date}T${time}` : date) : undefined;
    onSave({ title: title.trim(), status, scheduled_date: scheduled, platform, notes: notes.trim()||undefined });
  };

  const isEdit = !!item;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-0 md:px-4" onClick={onClose} role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xl" />
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, y: 10, scale: 0.94, filter: "blur(2px)" }} transition={{ duration: 0.3, ease: EASE }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-2xl md:rounded-2xl border-2 border-brutify-gold/30 bg-[#111113] shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_32px_rgba(255,171,0,0.2)] overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-brutify-gold/60 to-transparent" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-display text-lg tracking-wider text-gold-gradient">{isEdit ? "MODIFIER" : "NOUVEAU CONTENU"}</h2>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-xl text-brutify-text-muted hover:text-brutify-text-primary hover:bg-white/[0.05] transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Titre</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleSubmit()}
                  placeholder="Ex: TikTok — Les 3 erreurs du débutant"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none focus:border-brutify-gold/30 transition-all" />
              </div>
              {/* Status */}
              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Statut</label>
                <div className="flex gap-1.5 flex-wrap">
                  {statusOrder.map(s => (
                    <button key={s} onClick={() => setStatus(s)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-body font-medium transition-all border cursor-pointer", status===s ? "bg-brutify-gold/[0.08] border-brutify-gold/20 text-brutify-gold" : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1]")}>
                      <span className={cn("h-2 w-2 rounded-full", statusConfig[s].dot)} />{statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Date planifiée</label>
                  <DatePicker value={date} onChange={setDate} className="w-full" />
                </div>
                <div>
                  <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Heure (opt.)</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-body text-brutify-text-primary outline-none focus:border-brutify-gold/30 [color-scheme:dark] transition-all" />
                </div>
              </div>
              {/* Platform */}
              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Plateforme</label>
                <div className="flex gap-2">
                  {(["instagram","tiktok","youtube"] as Platform[]).map(p => (
                    <button key={p} onClick={() => setPlatform(p)} className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-body font-medium transition-all cursor-pointer", platform===p ? "border-brutify-gold/20 bg-brutify-gold/[0.08] text-brutify-gold" : "border-white/[0.06] text-brutify-text-muted hover:border-white/[0.1]")}>
                      {platformSvg[p]("h-4 w-4")}{p.charAt(0).toUpperCase()+p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="text-xs font-body font-medium text-brutify-text-secondary mb-1.5 block">Notes (opt.)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Détails, idées, références..." rows={2}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none focus:border-brutify-gold/30 resize-none transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
              {isEdit && (
                <button onClick={() => onDelete(item!.id)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/15 text-red-400/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/[0.04] transition-all cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/[0.06] py-3 text-sm font-body font-medium text-brutify-text-muted hover:text-brutify-text-primary hover:border-white/[0.1] transition-all cursor-pointer">Annuler</button>
              <button onClick={handleSubmit} disabled={!title.trim()||isCreating}
                className={cn("flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-body font-semibold transition-all cursor-pointer", title.trim()&&!isCreating ? "bg-gradient-to-b from-brutify-gold to-brutify-gold-dark text-black hover:shadow-[0_0_20px_rgba(255,171,0,0.3)]" : "bg-white/[0.04] text-brutify-text-muted cursor-not-allowed")}>
                {isCreating ? <Loading variant="icon" size="sm" className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {isEdit ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111113]/60 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.25)]"
      >
        <LayoutDashboard className="h-9 w-9 text-brutify-text-muted" />
      </motion.div>
      <p className="font-display text-xl uppercase tracking-wider text-brutify-text-secondary mb-2">Ton BrutBoard est vide</p>
      <p className="text-sm font-body text-brutify-text-muted text-center max-w-sm mb-6">Commence par trouver des inspirations dans Vidéos ou génère un script.</p>
      <div className="flex items-center gap-3">
        <Link href="/videos"><Button variant="secondary" size="md"><Play className="h-4 w-4" />Explorer les vidéos</Button></Link>
        <Link href="/scripts"><Button variant="primary" size="md"><Sparkles className="h-4 w-4" />Forger un script</Button></Link>
      </div>
    </div>
  );
}

function formatDateFr(dateStr: string): string {
  return new Date(dateStr+"T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
