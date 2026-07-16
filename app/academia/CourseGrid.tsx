"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import SmoothImage from "@/app/components/shared/SmoothImage"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight, CalendarDays, LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import Breadcrumb, { type BreadcrumbItem } from "@/components/shared/Breadcrumb"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import CourseFilterPanel from "./CourseFilterPanel"
import CourseCalendar, {
  CalendarMonthControls,
  initialMonthCursor,
  shiftMonthCursor,
  todayMonthCursor,
  type MonthCursor,
} from "./CourseCalendar"
import { COURSE_EVENT_TYPES, EVENT_TYPE_LABEL, normalizeEventType } from "./event-types"
import { useCourseViewMode, type CourseViewMode } from "./useCourseViewMode"
import {
  storeGoldHoverGlow,
  storeIconButtonClassName,
  storeToolbarIconClassName,
} from "@/app/tienda/components/store-button-styles"
import { EASE_OUT } from "@/lib/ease"
import type { CourseWithStats, InstructorRow } from "@/lib/supabase/courses"
import type { CourseEventType, CourseLevel } from "@/types"

type Props = {
  courses: CourseWithStats[]
  breadcrumbItems?: BreadcrumbItem[]
}

function cardDescription(course: {
  short_description?: string | null
  description: string
}): string {
  return course.short_description?.trim() || course.description
}

const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

// Slug de la URL (?nivel=) → etiqueta usada por el estado de filtro.
const NIVEL_SLUG_TO_LABEL: Record<string, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  abierto: "Abierto",
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

/** Todas las personas del curso (principal + maestros + organizadores), sin repetir. */
function coursePeople(course: CourseWithStats): InstructorRow[] {
  const all = [
    ...(course.instructor ? [course.instructor] : []),
    ...course.co_instructors,
    ...course.co_organizers,
  ]
  const seen = new Set<string>()
  return all.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
}

/** Fila de bolitas apiladas + nombres, compartida entre grid y lista. */
function PeopleAvatars({
  people,
  variant,
}: {
  people: InstructorRow[]
  variant: "grid" | "list"
}) {
  if (people.length === 0) return null
  const dim = variant === "list" ? "h-5 w-5" : "h-[18px] w-[18px]"
  const fs = variant === "list" ? "text-[9px]" : "text-[8px]"
  const fallbackCls =
    variant === "list"
      ? "bg-[#c6a75e]/80 text-white"
      : "bg-[#c6a75e]/25 text-[#8a6d26]"
  const MAX = 4
  const shown = people.slice(0, MAX)
  const extra = people.length - shown.length
  const label =
    people.length === 1
      ? people[0].name
      : people.map((p) => p.name).join(", ")

  return (
    <div
      className={`flex items-center gap-2 ${
        variant === "list"
          ? "text-[10px] font-medium uppercase tracking-[0.1em] text-[#6b6b6b]"
          : "text-[11px] text-[#6b6b6b]"
      }`}
    >
      <div className="flex shrink-0 items-center">
        {shown.map((p, i) => (
          <span
            key={p.id}
            className={`relative ${dim} shrink-0 overflow-hidden rounded-full ring-2 ring-white ${
              i > 0 ? "-ml-1" : ""
            }`}
            title={p.name}
          >
            {p.photo_url ? (
              <SmoothImage
                src={p.photo_url}
                alt={p.name}
                fill
                className="object-cover"
                sizes={variant === "list" ? "20px" : "18px"}
              />
            ) : (
              <span
                className={`flex h-full w-full items-center justify-center ${fs} font-semibold ${fallbackCls}`}
              >
                {initials(p.name)}
              </span>
            )}
          </span>
        ))}
        {extra > 0 && (
          <span
            className={`relative -ml-1 flex ${dim} shrink-0 items-center justify-center rounded-full ring-2 ring-white ${fs} font-semibold ${fallbackCls}`}
          >
            +{extra}
          </span>
        )}
      </div>
      <span className="truncate">{label}</span>
    </div>
  )
}

function isCoursePast(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(y, m - 1, d) < today
}

// Icons
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6a75e"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

function ChevSmLeft() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevSmRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ── Card with its own slide state ─────────────────────────────────────────

function CourseCard({
  course,
  layout = "grid",
}: {
  course: CourseWithStats
  layout?: CourseViewMode
}) {
  const [slideIdx, setSlideIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const { day, month } = parseDateBadge(course.start_date)
  const past = isCoursePast(course.start_date)
  const isFull = course.show_capacity_public
    ? course.public_spots_remaining <= 0
    : course.spots_remaining <= 0

  const slideImages =
    course.images.length > 0
      ? course.images.map((img) => img.image_url)
      : course.cover_image
        ? [course.cover_image]
        : []

  const n = slideImages.length

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSlideIdx((i) => (i - 1 + n) % n)
  }
  function next(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setSlideIdx((i) => (i + 1) % n)
  }
  function dot(e: React.MouseEvent, i: number) {
    e.preventDefault()
    e.stopPropagation()
    setSlideIdx(i)
  }
  function openLightbox(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLightboxOpen(true)
  }

  // Nodo de precio/estado compartido entre grid y lista.
  const metaNode = past ? (
    <span aria-label="Ver detalle" className={`ml-auto ${storeIconButtonClassName}`}>
      <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  ) : isFull && course.allow_online_registration ? (
    <span className="ml-auto text-[12px] font-semibold text-red-600">Lleno</span>
  ) : course.show_price_public ? (
    <span className="ml-auto font-semibold text-[#8a6d26]">
      {formatPrice(course.price)}
    </span>
  ) : (
    <span aria-label="Ver detalle" className={`ml-auto ${storeIconButtonClassName}`}>
      <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </span>
  )

  // Chips dorados: tipo especial + diploma + highlights (grid y lista).
  const eventType = normalizeEventType(course.event_type)
  const chipsNode =
    eventType !== "curso" ||
    course.diploma_included ||
    (course.highlights && course.highlights.length > 0) ? (
      <div className="flex flex-wrap gap-1.5">
        {eventType !== "curso" && (
          <span className="rounded-full border border-[#dcc98a] bg-[#f3ead0] px-2.5 py-[3px] text-[10.5px] font-semibold tracking-[0.02em] text-[#7a5f21]">
            {EVENT_TYPE_LABEL[eventType]}
          </span>
        )}
        {course.diploma_included && (
          <span className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-2.5 py-[3px] text-[10.5px] font-medium tracking-[0.03em] text-[#c6a75e]">
            Diploma incluido
          </span>
        )}
        {course.highlights?.slice(0, 3).map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-2.5 py-[3px] text-[10.5px] font-medium tracking-[0.03em] text-[#c6a75e]"
          >
            {chip}
          </span>
        ))}
      </div>
    ) : null

  // ── Variante LISTA (fila editorial, sin cards) ─────────────────────────
  if (layout === "list") {
    const cover = slideImages[0]
    return (
      <>
        <Link
          href={`/academia/${course.id}`}
          className="group flex cursor-pointer gap-4 py-5 sm:gap-6 sm:py-6"
        >
          <div className="relative aspect-[3/4] w-32 shrink-0 overflow-hidden rounded-xl bg-[#eee] sm:w-40 md:w-48">
            {cover ? (
              <SmoothImage
                src={cover}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 128px, (max-width: 1024px) 160px, 192px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-[#9a9a9a]">
                Sin imagen
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45" />
            <span className="pointer-events-none absolute left-2 top-2 z-20 rounded-full border border-white/10 bg-[#141414]/60 px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
              {LEVEL_LABEL[course.level]}
            </span>
            <div className="pointer-events-none absolute bottom-2 left-2 z-20 flex items-baseline gap-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
              <span
                className="text-[18px] font-semibold leading-none"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {day}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e2c06f]">
                {month}
              </span>
            </div>
            {/* Zoom: abre lightbox sin navegar al curso (igual que cuadrícula). */}
            {slideImages.length > 0 && (
              <button
                type="button"
                onClick={openLightbox}
                aria-label="Ampliar imagen"
                className="absolute inset-0 z-10 cursor-zoom-in"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5 sm:py-1">
            <div className="flex flex-col gap-2">
              <h2
                className="line-clamp-2 text-[17px] font-medium leading-snug text-[#1a1a1a] transition-colors group-hover:text-[#8a6d26] sm:text-[19px]"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                {course.title}
              </h2>
              <p className="line-clamp-3 max-w-xl text-[13px] leading-relaxed text-[#6b6b6b]">
                {cardDescription(course)}
              </p>
              {chipsNode}
            </div>
            <div className="flex flex-col gap-2">
              <PeopleAvatars people={coursePeople(course)} variant="list" />
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#3a3a3a]">
                <PinIcon />
                <span className="truncate">{course.location}</span>
                {metaNode}
              </div>
            </div>
          </div>
        </Link>

        {lightboxOpen && slideImages.length > 0 && (
          <ImageLightbox
            images={slideImages}
            startIndex={0}
            alt={course.title}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
    <Link
      href={`/academia/${course.id}`}
      className="group flex h-full cursor-pointer flex-col"
    >
      {/* Image / Slider */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#eee]">
        {slideImages.length > 0 ? (
          <>
            {slideImages.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={i === 0 ? course.title : `${course.title} foto ${i + 1}`}
                fill
                className={`object-cover transition-opacity duration-400 ${
                  i === slideIdx
                    ? "opacity-100"
                    : "opacity-0"
                } ${n === 1 ? "transition-transform group-hover:scale-[1.03]" : ""}`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ))}

            {n > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Foto anterior"
                  className="absolute left-2 top-1/2 z-20 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ChevSmLeft />
                </button>
                <button
                  onClick={next}
                  aria-label="Siguiente foto"
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <ChevSmRight />
                </button>

                <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1">
                  {slideImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => dot(e, i)}
                      aria-label={`Foto ${i + 1}`}
                      className={`rounded-full transition-all duration-200 ${
                        i === slideIdx
                          ? "h-1.5 w-4 bg-white"
                          : "h-1.5 w-1.5 bg-white/55"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-[#9a9a9a]">
            Sin imagen
          </div>
        )}

        {/* Chip de nivel (+ Realizado) */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-[#141414]/55 px-2.5 py-[4px] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e2c06f] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
            {LEVEL_LABEL[course.level]}
          </span>
          {past && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#141414]/55 px-2.5 py-[4px] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
              <span className="h-[4px] w-[4px] rounded-full bg-[#d8b866]" />
              Realizado
            </span>
          )}
        </div>

        {/* Badge de fecha (compacto) */}
        <div className="absolute right-3 top-3 z-10 flex items-baseline gap-1 rounded-full bg-[#141414]/55 px-2.5 py-[5px] text-white backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          <span
            className="text-[14px] font-semibold leading-none"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {day}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f]">
            {month}
          </span>
        </div>

        {/* Zona de zoom: cubre la imagen (bajo flechas/dots z-20). Abre el
            lightbox sin navegar al curso. */}
        {slideImages.length > 0 && (
          <button
            type="button"
            onClick={openLightbox}
            aria-label="Ampliar imagen"
            className="absolute inset-0 z-10 cursor-zoom-in"
          />
        )}
      </div>

      {/* Card body (plano, alineado al borde de la imagen) */}
      <div className="flex flex-1 flex-col pt-3">
        {/* min-h reserva 2 líneas para que descripción/instructor arranquen a
            la misma altura aunque el título sea de 1 o 2 líneas. */}
        <h2
          className="line-clamp-2 min-h-[2.75em] text-[17px] font-medium leading-snug text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {course.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#6b6b6b]">
          {cardDescription(course)}
        </p>

        {/* Chips dorados: tipo especial + diploma + highlights */}
        {chipsNode && <div className="mt-2.5">{chipsNode}</div>}

        {/* Grupo de personas del curso, anclado al fondo para que las bolitas
            queden a la misma altura entre tarjetas aunque cambien los chips. */}
        <div className="mt-auto pt-3">
          <PeopleAvatars people={coursePeople(course)} variant="grid" />
        </div>

        {/* Fila inferior: ubicación ↔ precio */}
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-[#3a3a3a]">
          <span className="flex min-w-0 items-center gap-1.5">
            <PinIcon />
            <span className="truncate">{course.location}</span>
          </span>
          {metaNode}
        </div>
      </div>
    </Link>

    {lightboxOpen && slideImages.length > 0 && (
      <ImageLightbox
        images={slideImages}
        startIndex={slideIdx}
        alt={course.title}
        onClose={() => setLightboxOpen(false)}
      />
    )}
    </>
  )
}

// ── Main grid ──────────────────────────────────────────────────────────────

export default function CourseGrid({ courses, breadcrumbItems }: Props) {
  const { viewMode, setViewMode } = useCourseViewMode()
  const reducedMotion = useReducedMotion()
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Todos")
  const [type, setType] = useState("Todos")
  const [sort, setSort] = useState<SortOption>("Eventos programados")
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [calCursor, setCalCursor] = useState<MonthCursor>(() =>
    initialMonthCursor(courses)
  )

  // Filtros iniciales desde la URL (enlaces del megamenú de academia). Se leen
  // tras montar para no romper la hidratación (mismo patrón que useCourseViewMode).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const vista = params.get("vista")
    if (vista === "calendario") setViewMode("calendar")
    else if (vista === "lista") setViewMode("list")
    if (params.get("sort") === "pasados") setSort("Eventos pasados")
    const nivel = params.get("nivel")
    if (nivel && NIVEL_SLUG_TO_LABEL[nivel]) setLevel(NIVEL_SLUG_TO_LABEL[nivel])
    const tipo = params.get("tipo")
    if (tipo && COURSE_EVENT_TYPES.includes(tipo as CourseEventType)) {
      setType(EVENT_TYPE_LABEL[tipo as CourseEventType])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeFilterCount =
    (level !== "Todos" ? 1 : 0) +
    (type !== "Todos" ? 1 : 0) +
    (query.trim() ? 1 : 0) +
    (sort !== "Eventos programados" ? 1 : 0)

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

  const typePills = useMemo(() => {
    const counts: Record<string, number> = { Todos: scopeList.length }
    scopeList.forEach((c) => {
      const lbl = EVENT_TYPE_LABEL[normalizeEventType(c.event_type)]
      counts[lbl] = (counts[lbl] ?? 0) + 1
    })
    return ["Todos", ...COURSE_EVENT_TYPES.map((t) => EVENT_TYPE_LABEL[t])]
      .filter((l) => l === "Todos" || (counts[l] ?? 0) > 0)
      .map((l) => ({ name: l, n: counts[l] ?? 0 }))
  }, [scopeList])

  const filtered = useMemo(() => {
    let list = scopeList.slice()
    if (level !== "Todos") {
      list = list.filter((c) => LEVEL_LABEL[c.level] === level)
    }
    if (type !== "Todos") {
      list = list.filter(
        (c) => EVENT_TYPE_LABEL[normalizeEventType(c.event_type)] === type
      )
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
  }, [scopeList, level, type, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const pageList = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function handleSort(s: SortOption) {
    setSort(s)
    setLevel("Todos")
    setType("Todos")
    setPage(1)
  }

  function clearAll() {
    setQuery("")
    setLevel("Todos")
    setType("Todos")
    setSort("Eventos programados")
    setPage(1)
  }

  return (
    <>
      {/* ── Barra de control sticky (receta de /tienda) ────────────
          top ESTÁTICO + .navbar-follow-collapse: la barra viaja en la MISMA
          transition de transform que el navbar (GPU), así que no puede
          despegarse de él. `--site-chrome-bottom` no sirve aquí: solo se
          re-mide en eventos de scroll, y el colapso es un transform de 480ms
          que sigue corriendo cuando la rueda ya paró — la barra quedaba
          congelada a media transición con las cards asomándose por la
          rendija. El strip que el transform revela bajo la barra es ivory
          sobre ivory (main bg-ivory), invisible. */}
      {/* El escudo anti-rendija (::before ivory de 20px sobre el borde
          superior, para desfases de 1-2 frames entre las transitions de navbar
          y barra) viene del CSS global de [data-nav-collapse-guard]. */}
      <div
        data-nav-collapse-guard
        className="navbar-follow-collapse sticky top-[var(--navbar-actual-h)] z-20 -mx-[var(--site-px)] mb-6 bg-ivory px-[var(--site-px)] py-2"
      >
        {/* Todo a la altura del breadcrumb: breadcrumb + toggle vista + Filtrar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {breadcrumbItems && breadcrumbItems.length > 0 ? (
            <Breadcrumb items={breadcrumbItems} className="mb-0 min-w-0" />
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Filtrar → Drawer. Mismo pill que Hoy/flechas; ícono a la derecha. */}
            <AnimatePresence initial={false}>
              {viewMode !== "calendar" && (
                <motion.div
                  key="filtrar"
                  initial={reducedMotion ? false : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, x: 6 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="inline-flex items-center rounded-full border border-neutral-200 p-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setFilterDrawerOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={filterDrawerOpen}
                    className={`${storeToolbarIconClassName} h-7 w-auto gap-1.5 px-2.5 text-[11px] font-medium tracking-wide ${
                      activeFilterCount > 0 || filterDrawerOpen
                        ? "bg-[#0a0a0a] text-white"
                        : `text-neutral-500 ${storeGoldHoverGlow}`
                    }`}
                  >
                    Filtrar
                    <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                    {activeFilterCount > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0a0a0a]">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hoy/←/→ en sticky (móvil y desktop) junto al toggle de vista */}
            {viewMode === "calendar" && (
              <CalendarMonthControls
                onToday={() => setCalCursor(todayMonthCursor())}
                onPrev={() => setCalCursor((c) => shiftMonthCursor(c, -1))}
                onNext={() => setCalCursor((c) => shiftMonthCursor(c, 1))}
              />
            )}

            {/* Toggle grid / lista / calendario */}
            <div
              className="inline-flex items-center rounded-full border border-neutral-200 p-0.5"
              role="group"
              aria-label="Cambiar vista de eventos"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Vista en cuadrícula"
                aria-pressed={viewMode === "grid"}
                className={`${storeToolbarIconClassName} ${
                  viewMode === "grid"
                    ? "bg-[#0a0a0a] text-white"
                    : `text-neutral-500 ${storeGoldHoverGlow}`
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Vista en lista"
                aria-pressed={viewMode === "list"}
                className={`${storeToolbarIconClassName} ${
                  viewMode === "list"
                    ? "bg-[#0a0a0a] text-white"
                    : `text-neutral-500 ${storeGoldHoverGlow}`
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                aria-label="Vista de calendario"
                aria-pressed={viewMode === "calendar"}
                className={`${storeToolbarIconClassName} ${
                  viewMode === "calendar"
                    ? "bg-[#0a0a0a] text-white"
                    : `text-neutral-500 ${storeGoldHoverGlow}`
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel de filtros (receta de /tienda: drawer 380px en PC) ─── */}
      <CourseFilterPanel
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        sortOptions={SORT_OPTIONS}
        sort={sort}
        onSortChange={(value) => handleSort(value as SortOption)}
        levelPills={levelPills}
        level={level}
        onLevelChange={(name) => { setLevel(name); setPage(1) }}
        typePills={typePills}
        type={type}
        onTypeChange={(name) => { setType(name); setPage(1) }}
        search={query}
        onSearchChange={(value) => { setQuery(value); setPage(1) }}
        onClearAll={clearAll}
      />

      {/* ── Calendario / Grid / Lista (crossfade como lc-page-enter) ─ */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={viewMode}
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: EASE_OUT }}
        >
          {viewMode === "calendar" ? (
            <CourseCalendar
              courses={courses}
              cursor={calCursor}
              onCursorChange={setCalCursor}
            />
          ) : (
            <>
              {pageList.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-[#6b6b6b]">
                  No encontramos eventos para esa búsqueda.
                </div>
              ) : viewMode === "list" ? (
                <div className="flex flex-col divide-y divide-[#e8e4dc]">
                  {pageList.map((course) => (
                    <CourseCard key={course.id} course={course} layout="list" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pageList.map((course) => (
                    <CourseCard key={course.id} course={course} layout="grid" />
                  ))}
                </div>
              )}

              {/* ── Pagination ─────────────────────────────────────────── */}
              <div className="mt-12 flex items-center justify-center gap-1.5">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  aria-label="Página anterior"
                  className={`${storeToolbarIconClassName} text-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 ${storeGoldHoverGlow}`}
                >
                  <ChevSmLeft />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setPage(i + 1)}
                    aria-label={`Página ${i + 1}`}
                    aria-current={page === i + 1 ? "page" : undefined}
                    className={`${storeToolbarIconClassName} min-w-[28px] text-[13px] ${
                      page === i + 1
                        ? "bg-[#0a0a0a] text-white"
                        : `text-neutral-500 ${storeGoldHoverGlow}`
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  aria-label="Página siguiente"
                  className={`${storeToolbarIconClassName} text-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 ${storeGoldHoverGlow}`}
                >
                  <ChevSmRight />
                </button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
