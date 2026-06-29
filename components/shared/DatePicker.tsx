"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

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

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  min?: string
  max?: string
  placeholder?: string
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

function formatDisplayDate(value: string): string {
  const date = parseDateString(value)
  if (!date) return ""
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function isOutOfRange(dateStr: string, min?: string, max?: string): boolean {
  if (min && dateStr < min) return true
  if (max && dateStr > max) return true
  return false
}

type CalendarCell = {
  date: Date
  dateStr: string
  inMonth: boolean
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

export default function DatePicker({
  id,
  value,
  onChange,
  className = "",
  disabled = false,
  min,
  max,
  placeholder = "Seleccionar fecha",
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const rootRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})

  const selected = parseDateString(value)
  const today = useMemo(() => new Date(), [])
  const todayStr = toDateString(today)

  const [viewYear, setViewYear] = useState(
    () => selected?.getFullYear() ?? today.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    () => selected?.getMonth() ?? today.getMonth()
  )

  useEffect(() => {
    if (!open || !rootRef.current) return

    const updatePosition = () => {
      const rect = rootRef.current!.getBoundingClientRect()
      const width = Math.min(320, window.innerWidth - 16)
      let left = rect.left
      if (left + width > window.innerWidth - 8) {
        left = window.innerWidth - width - 8
      }
      setPopoverStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: Math.max(8, left),
        width,
        zIndex: 9999,
      })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!value) return
    const parsed = parseDateString(value)
    if (!parsed) return
    setViewYear(parsed.getFullYear())
    setViewMonth(parsed.getMonth())
  }, [value])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const monthLabel = `${MONTH_NAMES[viewMonth].toUpperCase()} ${viewYear}`

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const handleSelect = (dateStr: string) => {
    if (isOutOfRange(dateStr, min, max)) return
    onChange(dateStr)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-[#111] outline-none transition-colors hover:border-[#c9a84c]/60 focus:border-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "text-[#111]" : "text-neutral-400"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#c9a84c]" aria-hidden />
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Seleccionar fecha"
          style={popoverStyle}
          className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-[0_12px_40px_-8px_rgba(17,17,17,0.18)]"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-[family-name:var(--font-playfair),serif] text-base tracking-wide text-[#c9a84c]">
                {monthLabel}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:border-[#c9a84c] hover:bg-[rgba(201,168,76,0.12)] hover:text-[#111]"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600 transition-colors hover:border-[#c9a84c] hover:bg-[rgba(201,168,76,0.12)] hover:text-[#111]"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-3 pt-3">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {DAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[10px] font-semibold tracking-[0.14em] text-neutral-500"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 pb-3">
              {cells.map((cell) => {
                const isSelected = value === cell.dateStr
                const isToday = cell.dateStr === todayStr
                const outOfRange = isOutOfRange(cell.dateStr, min, max)

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    disabled={outOfRange}
                    onClick={() => handleSelect(cell.dateStr)}
                    className={`relative flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors duration-200 ${
                      outOfRange
                        ? "cursor-not-allowed text-neutral-300"
                        : isSelected
                          ? "bg-[#c9a84c] font-semibold text-[#111] shadow-sm"
                          : isToday
                            ? "border border-[#c9a84c] font-medium text-[#c9a84c]"
                            : cell.inMonth
                              ? "text-[#111] hover:bg-[rgba(201,168,76,0.18)]"
                              : "text-neutral-300 hover:bg-[rgba(201,168,76,0.12)]"
                    }`}
                  >
                    {cell.date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 transition-colors hover:text-[#111]"
            >
              Borrar selección
            </button>
            <button
              type="button"
              onClick={() => {
                if (isOutOfRange(todayStr, min, max)) return
                onChange(todayStr)
                setViewYear(today.getFullYear())
                setViewMonth(today.getMonth())
                setOpen(false)
              }}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c9a84c] transition-colors hover:text-[#a8893a]"
            >
              Ir a hoy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
