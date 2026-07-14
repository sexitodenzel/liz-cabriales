"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import Breadcrumb, { type BreadcrumbItem } from "@/components/shared/Breadcrumb"
import ImageLightbox from "@/app/components/shared/ImageLightbox"
import CourseFilterPanel from "./CourseFilterPanel"
import { useCourseViewMode, type CourseViewMode } from "./useCourseViewMode"
import type { CourseWithStats } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

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
function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c"
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
    <span className="ml-auto text-[12.5px] text-[#6b6b6b] transition-colors group-hover:text-[#8a6d26]">
      Ver detalle
    </span>
  ) : isFull && course.allow_online_registration ? (
    <span className="ml-auto text-[12px] font-semibold text-red-600">Lleno</span>
  ) : course.show_price_public ? (
    <span className="ml-auto font-semibold text-[#8a6d26]">
      {formatPrice(course.price)}
    </span>
  ) : (
    <span className="ml-auto text-[12.5px] text-[#6b6b6b] transition-colors group-hover:text-[#8a6d26]">
      Ver detalle
    </span>
  )

  // ── Variante LISTA (fila horizontal, como /tienda) ──────────────────────
  if (layout === "list") {
    const cover = slideImages[0]
    return (
      <Link
        href={`/academia/${course.id}`}
        className="group flex cursor-pointer gap-4 overflow-hidden rounded-xl border border-[#f0f0f0] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] sm:gap-5 sm:p-4"
      >
        <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-lg bg-[#eee] sm:w-44 md:w-52">
          {cover ? (
            <Image
              src={cover}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 128px, (max-width: 1024px) 176px, 208px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-[#9a9a9a]">
              Sin imagen
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45" />
          <span className="absolute left-2 top-2 rounded-full border border-white/10 bg-[#141414]/60 px-2.5 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
            {LEVEL_LABEL[course.level]}
          </span>
          <div className="absolute bottom-2 left-2 flex items-baseline gap-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
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
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-1">
          {course.instructor && (
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#6b6b6b]">
              {course.instructor.photo_url ? (
                <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={course.instructor.photo_url}
                    alt={course.instructor.name}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/80 text-[9px] font-semibold text-white">
                  {initials(course.instructor.name)}
                </span>
              )}
              <span className="truncate">{course.instructor.name}</span>
            </div>
          )}
          <h2
            className="line-clamp-2 text-[17px] font-medium leading-snug text-[#1a1a1a] sm:text-[19px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {course.title}
          </h2>
          <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6b6b6b]">
            {cardDescription(course)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[#3a3a3a]">
            <PinIcon />
            <span className="truncate">{course.location}</span>
            {metaNode}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <>
    <Link
      href={`/academia/${course.id}`}
      className="group flex h-full cursor-pointer flex-col"
    >
      {/* Image / Slider */}
      <div className="relative aspect-[9/10] overflow-hidden rounded-xl bg-[#eee]">
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

        {course.instructor && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#6b6b6b]">
            {course.instructor.photo_url ? (
              <div className="relative h-[18px] w-[18px] shrink-0 overflow-hidden rounded-full">
                <Image
                  src={course.instructor.photo_url}
                  alt={course.instructor.name}
                  fill
                  className="object-cover"
                  sizes="18px"
                />
              </div>
            ) : (
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#c9a84c]/25 text-[8px] font-semibold text-[#8a6d26]">
                {initials(course.instructor.name)}
              </span>
            )}
            <span className="truncate">{course.instructor.name}</span>
          </div>
        )}

        {/* Fila inferior anclada al fondo: ubicación ↔ precio */}
        <div className="mt-auto flex items-center gap-2 pt-3 text-[12.5px] text-[#3a3a3a]">
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
  const [query, setQuery] = useState("")
  const [level, setLevel] = useState("Todos")
  const [sort, setSort] = useState<SortOption>("Eventos programados")
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)

  const activeFilterCount =
    (level !== "Todos" ? 1 : 0) +
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
    setLevel("Todos")
    setPage(1)
  }

  function clearAll() {
    setQuery("")
    setLevel("Todos")
    setSort("Eventos programados")
    setPage(1)
  }

  return (
    <>
      {/* ── Hero (flujo normal, scrollea) ──────────────────────────── */}
      <div className="mb-3 flex items-baseline gap-4">
        <h1
          className="text-[34px] font-medium leading-none tracking-tight text-[#c9a84c] sm:text-[44px]"
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

      <p className="mb-5 max-w-[560px] text-sm text-[#6b6b6b]">
        <span className="mr-3 inline-block h-px w-7 bg-[#c9a84c] align-middle" />
        Talleres presenciales con educadoras certificadas. Cupos reducidos, práctica con modelo y diploma al egreso.
      </p>

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
        <div className="flex items-center justify-between gap-4">
          {breadcrumbItems && breadcrumbItems.length > 0 ? (
            <Breadcrumb items={breadcrumbItems} className="mb-0" />
          ) : (
            <span />
          )}

          <div className="flex shrink-0 items-center gap-3">
            {/* Toggle grid / lista */}
            <div
              className="inline-flex items-center rounded-full border border-[#ececec] p-0.5"
              role="group"
              aria-label="Cambiar vista de eventos"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Vista en cuadrícula"
                aria-pressed={viewMode === "grid"}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#6b6b6b] hover:text-[#8a6d26]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label="Vista en lista"
                aria-pressed={viewMode === "list"}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  viewMode === "list"
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#6b6b6b] hover:text-[#8a6d26]"
                }`}
              >
                <List className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>

            {/* Filtrar → Drawer (orden, búsqueda y nivel) */}
            <button
              type="button"
              onClick={() => setFilterDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filterDrawerOpen}
              className={`inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-[13px] tracking-wide transition-colors ${
                activeFilterCount > 0
                  ? "border-[#c9a84c] text-[#8a6d26]"
                  : "border-[#ececec] text-[#3a3a3a] hover:border-[#c9a84c]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
              Filtrar
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c9a84c] px-1 text-[10px] font-bold text-[#0a0a0a]">
                  {activeFilterCount}
                </span>
              )}
            </button>
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
        search={query}
        onSearchChange={(value) => { setQuery(value); setPage(1) }}
        onClearAll={clearAll}
      />

      {/* ── Grid / Lista ───────────────────────────────────────────── */}
      {pageList.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[#6b6b6b]">
          No encontramos eventos para esa búsqueda.
        </div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-4">
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

      {/* ── Pagination ─────────────────────────────────────────────── */}
      <div className="mt-12 flex justify-center gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="grid h-9 min-w-[36px] place-items-center rounded-full border border-[#ececec] bg-white px-2.5 text-[13px] text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#8a6d26] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`grid h-9 min-w-[36px] place-items-center rounded-full border px-2.5 text-[13px] transition-all ${
              page === i + 1
                ? "border-[#c9a84c] bg-[#c9a84c] text-[#0a0a0a]"
                : "border-[#ececec] bg-white text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#8a6d26]"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="grid h-9 min-w-[36px] place-items-center rounded-full border border-[#ececec] bg-white px-2.5 text-[13px] text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#8a6d26] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </>
  )
}
