"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { CourseWithStats } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

type Props = {
  courses: CourseWithStats[]
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
]

const SORT_OPTIONS = ["Eventos programados", "Eventos pasados"] as const
type SortOption = typeof SORT_OPTIONS[number]
const PER_PAGE = 8

function parseDateBadge(dateStr: string): { day: number; month: string } {
  const [, m, d] = dateStr.split("-").map(Number)
  return { day: d, month: MONTHS_SHORT[m - 1] }
}

function formatPrice(value: number): string {
  return "$ " + value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((s) => s[0]).join("")
}

function isCoursePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

// Icons
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function ChevDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="ml-1 flex-shrink-0">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function CourseGrid({ courses }: Props) {
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Todos")
  const [sort, setSort] = useState<SortOption>("Eventos programados")
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)

  const scopeList = useMemo(() => {
    return sort === "Eventos pasados"
      ? courses.filter((c) => isCoursePast(c.start_date))
      : courses.filter((c) => !isCoursePast(c.start_date))
  }, [courses, sort])

  const levelPills = useMemo(() => {
    const counts: Record<string, number> = { Todos: scopeList.length }
    scopeList.forEach((c) => {
      const lbl = LEVEL_LABEL[c.level]
      counts[lbl] = (counts[lbl] ?? 0) + 1
    })
    return ["Todos", "Principiante", "Intermedio", "Avanzado", "Abierto"]
      .filter((l) => l === "Todos" || (counts[l] ?? 0) > 0)
      .map((l) => ({ name: l, n: counts[l] ?? 0 }))
  }, [scopeList])

  const filtered = useMemo(() => {
    let list = scopeList.slice()
    if (level !== "Todos") {
      list = list.filter((c) => LEVEL_LABEL[c.level] === level)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.instructor?.name ?? "").toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q)
      )
    }
    if (sort === "Eventos pasados") {
      list.sort((a, b) => b.start_date.localeCompare(a.start_date))
    }
    return list
  }, [scopeList, level, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageList = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function handleSort(s: SortOption) {
    setSort(s)
    setSortOpen(false)
    setLevel("Todos")
    setPage(1)
  }

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-2 flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-baseline gap-4">
          <h1
            className="text-[44px] font-medium leading-none tracking-tight text-[#c9a84c]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Eventos
          </h1>
          <span
            className="text-lg italic text-[#6b6b6b]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            temporada 2026
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-[18px] py-[10px] text-[13px] tracking-wide text-[#3a3a3a] transition-colors hover:border-[#c9a84c]"
            >
              {sort}
              <ChevDown />
            </button>
            {sortOpen && (
              <div className="absolute left-0 top-[calc(100%+6px)] z-10 min-w-full rounded-[10px] border border-[#ececec] bg-white p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.10)]">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSort(s)}
                    className={`w-full rounded-md px-3 py-2.5 text-left text-[13px] transition-colors ${
                      sort === s
                        ? "bg-[#f5efdc] text-[#a8893a]"
                        : "text-[#3a3a3a] hover:bg-[#fafafa]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-4 text-[#6b6b6b]">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Buscar un evento..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              className="w-[280px] rounded-full border border-[#ececec] bg-white py-[10px] pl-[42px] pr-[18px] text-[13px] text-[#1a1a1a] outline-none placeholder:text-[#9a9a9a] transition-all focus:border-[#c9a84c] focus:shadow-[0_0_0_3px_#f5efdc]"
            />
          </div>
        </div>
      </div>

      {/* ── Tagline ────────────────────────────────────────────────── */}
      <p className="mb-8 mt-1 max-w-[560px] text-sm text-[#6b6b6b]">
        <span className="mr-3 inline-block h-px w-7 bg-[#c9a84c] align-middle" />
        Talleres presenciales con educadoras certificadas. Cupos reducidos, práctica con modelo y diploma al egreso.
      </p>

      {/* ── Level pills ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {levelPills.map((l) => (
          <button
            key={l.name}
            onClick={() => { setLevel(l.name); setPage(1) }}
            className={`rounded-full border px-4 py-2 text-[12.5px] tracking-wide transition-all ${
              level === l.name
                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                : "border-[#ececec] bg-white text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a]"
            }`}
          >
            {l.name}
            <span className="ml-2 text-[11px] opacity-60">{l.n}</span>
          </button>
        ))}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────── */}
      {pageList.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[#6b6b6b]">
          No encontramos eventos para esa búsqueda.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageList.map((course) => {
            const { day, month } = parseDateBadge(course.start_date)
            const past = isCoursePast(course.start_date)
            const isFull = course.spots_remaining <= 0

            return (
              <Link
                key={course.id}
                href={`/academia/${course.id}`}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-[#f0f0f0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
              >
                {/* Image */}
                <div className="relative aspect-[4/2.6] overflow-hidden bg-[#eee]">
                  {course.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-[#9a9a9a]">
                      Sin imagen
                    </div>
                  )}

                  {/* Bottom gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />

                  {/* Level tag */}
                  <span className="absolute left-4 top-4 rounded-[4px] bg-white/90 px-2.5 py-[5px] text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3a3a3a] backdrop-blur-sm">
                    {LEVEL_LABEL[course.level]}
                  </span>

                  {/* Past badge */}
                  {past && (
                    <span className="absolute left-4 top-[42px] rounded-full bg-[#1a1a1a]/85 px-2.5 py-[5px] text-[10px] font-semibold uppercase tracking-wide text-[#c9a84c]">
                      Realizado
                    </span>
                  )}

                  {/* Date badge */}
                  <div className="absolute right-3.5 top-3.5 flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full border-[1.5px] border-[#c9a84c] bg-white text-center shadow-[0_4px_12px_rgba(0,0,0,0.10)]">
                    <span
                      className="text-[22px] font-semibold leading-none text-[#1a1a1a]"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      {day}
                    </span>
                    <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a8893a]">
                      {month}
                    </span>
                  </div>

                  {/* Instructor strip */}
                  {course.instructor && (
                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 text-white">
                      {course.instructor.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={course.instructor.photo_url}
                          alt={course.instructor.name}
                          className="h-[34px] w-[34px] rounded-full border-[1.5px] border-white object-cover"
                        />
                      ) : (
                        <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] border-white bg-[#c9a84c]/80 text-xs font-semibold">
                          {initials(course.instructor.name)}
                        </div>
                      )}
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-[0.06em] drop-shadow-sm">
                          {course.instructor.name}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.12em] opacity-85">
                          Instructora
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col gap-2.5 px-5 py-[18px]">
                  <h3
                    className="text-[19px] font-medium leading-snug text-[#1a1a1a]"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                  >
                    {course.title}
                  </h3>
                  <p className="line-clamp-3 flex-1 text-[13px] leading-relaxed text-[#6b6b6b]">
                    {course.description}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 border-t border-[#ececec] pt-3 text-[12.5px] text-[#3a3a3a]">
                    <PinIcon />
                    <span className="truncate">{course.location}</span>
                    {past ? (
                      <span className="ml-auto text-[12.5px] text-[#6b6b6b]">
                        Ver detalle →
                      </span>
                    ) : isFull ? (
                      <span className="ml-auto text-[12px] font-semibold text-red-600">
                        Lleno
                      </span>
                    ) : (
                      <span className="ml-auto font-semibold text-[#a8893a]">
                        {formatPrice(course.price)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────── */}
      <div className="mt-12 flex justify-center gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="grid h-9 min-w-[36px] place-items-center rounded-full border border-[#ececec] bg-white px-2.5 text-[13px] text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`grid h-9 min-w-[36px] place-items-center rounded-full border px-2.5 text-[13px] transition-all ${
              page === i + 1
                ? "border-[#c9a84c] bg-[#c9a84c] text-white"
                : "border-[#ececec] bg-white text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a]"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="grid h-9 min-w-[36px] place-items-center rounded-full border border-[#ececec] bg-white px-2.5 text-[13px] text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </>
  )
}
