"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

interface DatePickerProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ value, onChange, placeholder = "Choisir une date", className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const today = new Date()
  const parsed = value ? new Date(value + "T00:00:00") : null
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth())

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    onChange(`${viewYear}-${m}-${d}`)
    setOpen(false)
  }

  const displayValue = parsed
    ? `${parsed.getDate()} ${MONTHS[parsed.getMonth()]?.slice(0, 4)}. ${parsed.getFullYear()}`
    : null

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
  const isSelected = (day: number) =>
    parsed !== null && viewYear === parsed.getFullYear() && viewMonth === parsed.getMonth() && day === parsed.getDate()

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full rounded-lg border px-2.5 py-1.5 text-[11px] font-body transition-all duration-150 cursor-pointer text-left",
          open
            ? "border-brutify-gold/30 ring-1 ring-brutify-gold/20 bg-white/[0.04]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12]",
          displayValue ? "text-brutify-text-primary" : "text-brutify-text-muted/50"
        )}
      >
        <span className="flex-1 truncate">{displayValue ?? placeholder}</span>
        {value && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
            className="text-brutify-text-muted/40 hover:text-red-400 transition-colors p-0.5"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-[260px] rounded-xl border border-white/[0.08] bg-[#141416] shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-3 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Month/year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[12px] font-body font-semibold text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-body font-medium text-white/25 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                className={cn(
                  "h-8 w-full rounded-lg text-[11px] font-body font-medium transition-all duration-100 cursor-pointer",
                  isSelected(day)
                    ? "bg-brutify-gold text-black font-bold shadow-[0_0_12px_rgba(255,171,0,0.3)]"
                    : isToday(day)
                      ? "bg-white/[0.06] text-brutify-gold border border-brutify-gold/20"
                      : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setViewYear(today.getFullYear())
                setViewMonth(today.getMonth())
                selectDay(today.getDate())
              }}
              className="text-[10px] font-body text-brutify-gold/70 hover:text-brutify-gold transition-colors cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false) }}
                className="text-[10px] font-body text-white/30 hover:text-red-400 transition-colors cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
