"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react"

import { EASE_OUT, SPRING_PANEL } from "@/lib/ease"

const DAY_LABELS = ["DO.", "LU.", "MA.", "MI.", "JU.", "VI.", "SÁ."] as const

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const

const FLOAT_OFFSETS = [
  { x: -48, y: -56, rotate: -14 },
  { x: 52, y: -48, rotate: 12 },
  { x: -44, y: 52, rotate: 10 },
  { x: 48, y: 44, rotate: -16 },
  { x: 0, y: -64, rotate: 8 },
  { x: -56, y: 0, rotate: -8 },
  { x: 56, y: 0, rotate: 6 },
] as const

type CalendarCell = {
  date: Date
  dateStr: string
  inMonth: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  value: string | null
  onChange: (dateStr: string) => void
  availableDates: Set<string>
  minBookableDate: string
  maxBookableDate: string
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function parseDateString(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function buildMonthGrid(viewYear: number, viewMonth: number): CalendarCell[] {
  const first = new Date(viewYear, viewMonth, 1)
  const startOffset = first.getDay()
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset)
  const cells: CalendarCell[] = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    )
    cells.push({
      date,
      dateStr: toDateString(date),
      inMonth: date.getMonth() === viewMonth,
    })
  }

  return cells
}

function getCellOffset(index: number) {
  return FLOAT_OFFSETS[index % FLOAT_OFFSETS.length]
}

export default function FullCalendarModal({
  open,
  onClose,
  value,
  onChange,
  availableDates,
  minBookableDate,
  maxBookableDate,
}: Props) {
  const reduceMotion = useReducedMotion()
  const today = useMemo(() => new Date(), [])
  const todayStr = toDateString(today)
  const selected = value ? parseDateString(value) : null

  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? today.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    () => selected?.getMonth() ?? today.getMonth()
  )

  useEffect(() => {
    if (!open) return
    if (value) {
      const parsed = parseDateString(value)
      if (parsed) {
        setViewYear(parsed.getFullYear())
        setViewMonth(parsed.getMonth())
      }
    } else {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
    }
  }, [open, value, today])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`

  const minBookable = parseDateString(minBookableDate)
  const maxBookable = parseDateString(maxBookableDate)

  const canGoPrevMonth =
    !minBookable ||
    viewYear > minBookable.getFullYear() ||
    (viewYear === minBookable.getFullYear() &&
      viewMonth > minBookable.getMonth())

  const canGoNextMonth =
    !maxBookable ||
    viewYear < maxBookable.getFullYear() ||
    (viewYear === maxBookable.getFullYear() &&
      viewMonth < maxBookable.getMonth())

  const goPrevMonth = () => {
    if (!canGoPrevMonth) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (!canGoNextMonth) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelect = (dateStr: string) => {
    if (!availableDates.has(dateStr)) return
    onChange(dateStr)
  }

  const cellTransition = (index: number) =>
    reduceMotion
      ? { duration: 0 }
      : {
          delay: 0.12 + index * 0.018,
          duration: 0.55,
          ease: EASE_OUT,
        }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
        >
          <motion.button
            type="button"
            aria-label="Cerrar calendario"
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Calendario completo"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_24px_80px_-12px_rgba(17,17,17,0.28)]"
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.82, y: 48, rotateX: 8 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, rotateX: 0 }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.92, y: 24 }
            }
            transition={reduceMotion ? { duration: 0 } : SPRING_PANEL}
            style={{ perspective: 1200 }}
          >
            <motion.div
              className="flex items-center justify-between border-b border-neutral-100 px-5 py-4"
              initial={reduceMotion ? false : { opacity: 0, y: -24, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: 0.08, duration: 0.45, ease: EASE_OUT }
              }
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c9a84c]">
                  Calendario
                </p>
                <p className="font-[family-name:var(--font-playfair),serif] text-2xl text-[#111]">
                  {monthLabel}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  disabled={!canGoPrevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:border-[#c9a84c] hover:bg-[#fdfaf3] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  disabled={!canGoNextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:border-[#c9a84c] hover:bg-[#fdfaf3] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-300 hover:text-[#111]"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>

            <div className="px-4 pb-5 pt-4 sm:px-5">
              <div className="mb-3 grid grid-cols-7 gap-1">
                {DAY_LABELS.map((label, index) => (
                  <motion.div
                    key={label}
                    className="py-1 text-center text-[10px] font-semibold tracking-[0.14em] text-neutral-500"
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: -16, scale: 0.6 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            delay: 0.1 + index * 0.04,
                            duration: 0.4,
                            ease: EASE_OUT,
                          }
                    }
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, index) => {
                  const isSelected = value === cell.dateStr
                  const isToday = cell.dateStr === todayStr
                  const isAvailable = availableDates.has(cell.dateStr)
                  const offset = getCellOffset(index)

                  return (
                    <motion.button
                      key={cell.dateStr}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSelect(cell.dateStr)}
                      className={`relative flex aspect-square w-full items-center justify-center rounded-xl text-sm transition-colors ${
                        !isAvailable
                          ? "cursor-not-allowed text-neutral-300"
                          : isSelected
                            ? "bg-[#111] font-semibold text-white shadow-md"
                            : isToday
                              ? "border border-[#c9a84c] font-medium text-[#c9a84c] hover:bg-[#fdfaf3]"
                              : cell.inMonth
                                ? "text-[#111] hover:bg-[#c9a84c]/15 hover:text-[#111]"
                                : "text-neutral-300 hover:bg-neutral-50"
                      }`}
                      initial={
                        reduceMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.15,
                              x: offset.x,
                              y: offset.y,
                              rotate: offset.rotate,
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        y: 0,
                        rotate: 0,
                      }}
                      transition={cellTransition(index)}
                      whileHover={
                        isAvailable && !reduceMotion
                          ? { scale: 1.06, transition: { duration: 0.15 } }
                          : undefined
                      }
                      whileTap={
                        isAvailable && !reduceMotion
                          ? { scale: 0.94 }
                          : undefined
                      }
                    >
                      {cell.date.getDate()}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <motion.div
              className="flex items-center justify-between border-t border-neutral-100 px-5 py-4"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { delay: 0.55, duration: 0.35, ease: EASE_OUT }
              }
            >
              <p className="text-xs text-neutral-500">
                Hasta 90 días · solo días hábiles con disponibilidad
              </p>
              {availableDates.has(todayStr) && (
                <button
                  type="button"
                  onClick={() => handleSelect(todayStr)}
                  className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c9a84c] transition-colors hover:text-[#a8893a]"
                >
                  Ir a hoy
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
