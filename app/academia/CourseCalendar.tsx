"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { CourseWithStats } from "@/lib/supabase/courses"
import {
  storeGoldHoverGlow,
  storeToolbarIconClassName,
} from "@/app/tienda/components/store-button-styles"
import {
  EVENT_TYPE_COLOR,
  EVENT_TYPE_LABEL,
  normalizeEventType,
  type CourseEventType,
} from "./event-types"

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]
const MONTHS_SHORT = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

export type MonthCursor = { y: number; m: number }

/** Clave YYYY-MM-DD estable a partir de año/mes(0-idx)/día. */
function dayKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/** Parseo manual de "YYYY-MM-DD" para evitar corrimientos por zona horaria. */
function parseYmd(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split("-").map(Number)
  return { y, m: m - 1, d }
}

function todayKey(): string {
  const t = new Date()
  return dayKey(t.getFullYear(), t.getMonth(), t.getDate())
}

/** Offset lunes-primero: getDay() 0=Dom..6=Sáb → 0=Lun..6=Dom. */
function mondayOffset(y: number, m: number): number {
  return (new Date(y, m, 1).getDay() + 6) % 7
}

function ChevLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
function ChevRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6a75e"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden>
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

/** Mes inicial: el del próximo evento futuro; si no hay, el mes actual. */
export function initialMonthCursor(courses: CourseWithStats[]): MonthCursor {
  const tk = todayKey()
  const upcoming = courses
    .map((c) => c.start_date?.slice(0, 10))
    .filter((d): d is string => Boolean(d) && d >= tk)
    .sort()[0]
  const ref = upcoming ? parseYmd(upcoming) : parseYmd(tk)
  return { y: ref.y, m: ref.m }
}

export function shiftMonthCursor(prev: MonthCursor, delta: number): MonthCursor {
  const next = new Date(prev.y, prev.m + delta, 1)
  return { y: next.getFullYear(), m: next.getMonth() }
}

export function todayMonthCursor(): MonthCursor {
  const t = parseYmd(todayKey())
  return { y: t.y, m: t.m }
}

/** Controles Hoy / prev / next — mismo lenguaje visual que el toggle grid/lista. */
export function CalendarMonthControls({
  onToday,
  onPrev,
  onNext,
  className = "",
}: {
  onToday: () => void
  onPrev: () => void
  onNext: () => void
  className?: string
}) {
  const idle = `text-neutral-500 ${storeGoldHoverGlow}`
  return (
    <div
      className={`inline-flex items-center rounded-full border border-neutral-200 p-0.5 ${className}`}
      role="group"
      aria-label="Navegar mes del calendario"
    >
      <button
        type="button"
        onClick={onToday}
        className={`${storeToolbarIconClassName} h-7 min-w-[2.25rem] px-2.5 text-[11px] font-medium tracking-wide ${idle}`}
      >
        Hoy
      </button>
      <button
        type="button"
        onClick={onPrev}
        aria-label="Mes anterior"
        className={`${storeToolbarIconClassName} ${idle}`}
      >
        <ChevLeft />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Mes siguiente"
        className={`${storeToolbarIconClassName} ${idle}`}
      >
        <ChevRight />
      </button>
    </div>
  )
}

type EventEntry = { course: CourseWithStats; type: CourseEventType }

type CourseCalendarProps = {
  courses: CourseWithStats[]
  cursor: MonthCursor
  onCursorChange: (next: MonthCursor) => void
}

export default function CourseCalendar({
  courses,
  cursor,
  onCursorChange,
}: CourseCalendarProps) {
  // Índice fecha → eventos, y tipos presentes (para la leyenda).
  const { byDay, typesPresent } = useMemo(() => {
    const map = new Map<string, EventEntry[]>()
    const types = new Set<CourseEventType>()
    for (const course of courses) {
      if (!course.start_date) continue
      const type = normalizeEventType(course.event_type)
      types.add(type)
      const key = course.start_date.slice(0, 10)
      const list = map.get(key) ?? []
      list.push({ course, type })
      map.set(key, list)
    }
    return { byDay: map, typesPresent: types }
  }, [courses])

  const { y, m } = cursor
  const tk = todayKey()

  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const offset = mondayOffset(y, m)
  const trailing = (7 - ((offset + daysInMonth) % 7)) % 7
  // Celdas (inmutable): huecos iniciales + días del mes + huecos finales.
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ...Array.from({ length: trailing }, () => null),
  ]

  // Días con eventos del mes visible (para la agenda móvil).
  const monthAgenda: { day: number; key: string; entries: EventEntry[] }[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dayKey(y, m, d)
    const entries = byDay.get(key)
    if (entries && entries.length > 0) monthAgenda.push({ day: d, key, entries })
  }

  const legendTypes = (Object.keys(EVENT_TYPE_LABEL) as CourseEventType[]).filter(
    (t) => typesPresent.has(t)
  )

  return (
    <div className="flex w-full flex-col gap-3">
      {/* Mes actual anunciado solo para lectores de pantalla; nav en sticky */}
      <h2 className="sr-only">
        {MONTHS[m]} {y}
      </h2>

      {/* ── Rejilla mensual (desde md) ───────────────────────────────── */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-l border-t border-[#ececec]">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="border-b border-r border-[#ececec] bg-[#f7f7f7] py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8a8a]"
            >
              {wd}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[56px] border-b border-r border-[#ececec] bg-[#fafafa]"
                />
              )
            }
            const key = dayKey(y, m, day)
            const entries = byDay.get(key) ?? []
            const isToday = key === tk
            return (
              <div
                key={key}
                className="min-h-[56px] border-b border-r border-[#ececec] bg-white p-1"
              >
                <div className="mb-0.5 flex justify-end">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${
                      isToday
                        ? "bg-[#1a1a1a] text-white"
                        : "text-[#6b6b6b]"
                    }`}
                  >
                    {day}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {entries.map(({ course, type }) => {
                    const color = EVENT_TYPE_COLOR[type]
                    return (
                      <Link
                        key={course.id}
                        href={`/academia/${course.id}`}
                        title={`${EVENT_TYPE_LABEL[type]} · ${course.title}`}
                        className={`flex items-center gap-1 rounded border px-1 py-0.5 text-[10px] font-medium leading-tight transition-colors hover:opacity-80 ${color.chip}`}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: color.dot }}
                        />
                        <span className="truncate">{course.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Agenda (móvil) ───────────────────────────────────────────── */}
      <div className="md:hidden">
        {monthAgenda.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-[#ececec] bg-white text-[13px] text-[#6b6b6b]">
            No hay eventos en {MONTHS[m]}.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {monthAgenda.map(({ day, key, entries }) => {
              const isToday = key === tk
              return (
                <div key={key} className="flex gap-3">
                  <div className="flex w-10 shrink-0 flex-col items-end pt-3">
                    <span
                      className={`w-full text-right text-[18px] font-semibold leading-none tabular-nums ${
                        isToday ? "text-[#1a1a1a]" : "text-[#3a3a3a]"
                      }`}
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {day}
                    </span>
                    <span
                      className={`mt-0.5 w-full text-right text-[9px] font-semibold uppercase tracking-[0.12em] ${
                        isToday ? "text-[#8a6d26]" : "text-[#9a9a9a]"
                      }`}
                    >
                      {WEEKDAYS[(new Date(y, m, day).getDay() + 6) % 7]}
                    </span>
                    <span className="mt-0.5 w-full text-right text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9a9a9a]">
                      {MONTHS_SHORT[m]}
                    </span>
                    {isToday && (
                      <span className="mt-1 h-0.5 w-3.5 rounded-full bg-[#c9a84c]" aria-hidden />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    {entries.map(({ course, type }) => {
                      const color = EVENT_TYPE_COLOR[type]
                      return (
                        <Link
                          key={course.id}
                          href={`/academia/${course.id}`}
                          className="flex flex-col gap-1 rounded-xl border border-[#f0f0f0] bg-white px-3 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-colors hover:border-[#1a1a1a]"
                        >
                          <span
                            className="line-clamp-2 min-h-[2.7em] text-[14px] font-medium leading-snug text-[#1a1a1a]"
                            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                          >
                            {course.title}
                          </span>
                          <div className="flex items-center gap-2 text-[12.5px] text-[#3a3a3a]">
                            <span className="flex min-w-0 flex-1 items-center gap-1.5">
                              <PinIcon />
                              <span className="truncate">{course.location}</span>
                            </span>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${color.chip}`}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: color.dot }}
                              />
                              {EVENT_TYPE_LABEL[type]}
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Leyenda ──────────────────────────────────────────────────── */}
      {legendTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-[#ececec] pt-3">
          {legendTypes.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] text-[#6b6b6b]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: EVENT_TYPE_COLOR[t].dot }}
              />
              {EVENT_TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
