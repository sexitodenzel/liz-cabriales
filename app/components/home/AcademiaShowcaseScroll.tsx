"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { EVENT_TYPE_LABEL, normalizeEventType } from "@/app/academia/event-types"
import type { CourseWithStats } from "@/lib/supabase/courses"

import AcademiaShowcaseIntro from "./AcademiaShowcaseIntro"

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
]

function coverOf(course: CourseWithStats): string | null {
  return course.images[0]?.image_url ?? course.cover_image ?? null
}

function dateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

function cardEyebrow(course: CourseWithStats): string {
  const type = normalizeEventType(course.event_type)
  if (type !== "curso") return EVENT_TYPE_LABEL[type]
  return dateLabel(course.start_date)
}

function ChevLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

// ── Card ────────────────────────────────────────────────────────────────────

function CourseCard({
  course,
  eager,
}: {
  course: CourseWithStats
  eager?: boolean
}) {
  const cover = coverOf(course)
  return (
    <Link
      href={`/academia/${course.id}`}
      className="group relative block aspect-[3/4] w-[74vw] shrink-0 snap-start overflow-hidden rounded-card bg-neutral-100 sm:w-[300px] lg:w-[320px]"
    >
      {cover ? (
        <SmoothImage
          src={cover}
          alt={course.title}
          fill
          sizes="(max-width: 640px) 74vw, 320px"
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          loading={eager ? undefined : "lazy"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-neutral-400">
          Sin imagen
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent transition-opacity duration-500 group-hover:from-black/80"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e2c06f] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
          {cardEyebrow(course)}
        </p>
        {/* Sans semibold blanco: Playfair sobre foto ruidosa se ve "Times". */}
        <h3 className="text-[18px] font-semibold leading-[1.15] tracking-[-0.01em] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] sm:text-[20px]">
          {course.title}
        </h3>
        <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
          <span className="relative">
            Descubrir
            <span
              className="absolute -bottom-0.5 left-0 h-px w-full bg-white/50 transition-colors duration-300 group-hover:bg-white"
              aria-hidden
            />
          </span>
        </span>
      </div>
    </Link>
  )
}

// ── Riel horizontal con fade a la izquierda ─────────────────────────────────

export default function AcademiaShowcaseScroll({
  courses,
}: {
  courses: CourseWithStats[]
}) {
  const reducedMotion = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    const total = Math.max(1, Math.ceil(scrollWidth / clientWidth))
    setPages(total)
    setPage(Math.min(total, Math.round(scrollLeft / clientWidth) + 1))
    setAtStart(scrollLeft <= 2)
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 2)
  }, [])

  useEffect(() => {
    measure()
    const el = scrollerRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", measure)
    }
  }, [measure])

  function scrollByPage(dir: -1 | 1) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.9,
      behavior: reducedMotion ? "auto" : "smooth",
    })
  }

  // Máscara: el texto y las cards se DESVANECEN al ser empujados a la izquierda
  // conforme scrolleas (solo cuando ya hay algo scrolleado). Borde derecho:
  // corte duro = "hay más" (bleed Dior). En reposo (atStart) sin fade para que
  // el texto arranque nítido alineado al borde del sitio.
  const fadeLeft = atStart ? "0px" : "clamp(64px, 8vw, 120px)"
  const maskImage = `linear-gradient(to right, transparent 0px, #000 ${fadeLeft}, #000 100%)`
  const showControls = pages > 1

  return (
    <div className="mx-auto max-w-[var(--site-max-w)] py-16 md:py-24">
      {/* Riel horizontal: el TEXTO es el primer slide y se empuja a la
          izquierda (ocultándose con el fade) al scrollear. */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide flex snap-x snap-mandatory items-center gap-4 overflow-x-auto pb-1 pl-[var(--site-px)] pr-[var(--site-px)] [scroll-padding-inline-start:var(--site-px)] sm:gap-6"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          transition: "mask-image 450ms ease, -webkit-mask-image 450ms ease",
        }}
      >
        {/* Slide de texto (reveal editorial) */}
        <div className="shrink-0 snap-start pr-2 sm:pr-6 lg:pr-10">
          <div className="w-[78vw] max-w-[440px] sm:w-[360px] lg:w-[400px]">
            <AcademiaShowcaseIntro />
          </div>
        </div>

        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} eager={i < 2} />
        ))}
      </div>

      {showControls && (
        <div className="mt-7 flex items-center justify-end gap-4 pl-[var(--site-px)] pr-[var(--site-px)]">
          <span className="text-[12px] tabular-nums tracking-[0.12em] text-ink-soft">
            {page}/{pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={atStart}
              aria-label="Anterior"
              className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-ink transition-colors duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-neutral-300 disabled:hover:text-ink"
            >
              <ChevLeft />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={atEnd}
              aria-label="Siguiente"
              className="grid h-9 w-9 place-items-center rounded-full border border-neutral-300 text-ink transition-colors duration-200 hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-neutral-300 disabled:hover:text-ink"
            >
              <ChevRight />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
