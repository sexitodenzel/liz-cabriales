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
      className="group flex w-[74vw] shrink-0 snap-start flex-col sm:w-[300px] lg:w-[320px]"
    >
      {/* Foto */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-neutral-100">
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
      </div>

      {/* Texto debajo de la foto, en el espacio blanco */}
      <div className="pt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
          {cardEyebrow(course)}
        </p>
        <h3 className="text-[17px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink sm:text-[18px]">
          {course.title}
        </h3>
        <span className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
          <span className="relative">
            Descubrir
            <span
              className="absolute -bottom-0.5 left-0 h-px w-full bg-ink/30 transition-colors duration-300 group-hover:bg-ink"
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
  coverImage = "",
}: {
  courses: CourseWithStats[]
  coverImage?: string
}) {
  const reducedMotion = useReducedMotion()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 2)

    // Animación de "ocultar a la izquierda": la card de portada se despide con
    // parallax (sale un poco más rápido) + fade + leve encogido conforme el riel
    // scrollea sobre su propio ancho. Con reduced-motion sale con el scroll normal.
    const intro = introRef.current
    if (intro) {
      if (reducedMotion) {
        intro.style.transform = ""
        intro.style.opacity = ""
      } else {
        const p = Math.min(1, Math.max(0, scrollLeft / (intro.offsetWidth || 1)))
        intro.style.transform = `translate3d(${(-p * 64).toFixed(1)}px,0,0) scale(${(1 - p * 0.06).toFixed(3)})`
        intro.style.opacity = (1 - p * 0.85).toFixed(3)
      }
    }
  }, [reducedMotion])

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

  // La intro ahora scrollea CON el riel, pero se despide con una animación de
  // "ocultar a la izquierda" (parallax + fade, ver measure()).
  // Borde derecho: fade cuando hay más (bleed Dior); desaparece al llegar al final.
  const fadeRight = atEnd ? "0px" : "clamp(48px, 6vw, 96px)"
  const maskImage = `linear-gradient(to right, #000 0px, #000 calc(100% - ${fadeRight}), transparent 100%)`

  return (
    <div className="mx-auto max-w-[var(--site-max-w)] py-16 md:py-24">
      {/* Riel horizontal: la intro es el primer ítem y scrollea con las cards. */}
      <div
        ref={scrollerRef}
        className="scrollbar-hide flex snap-x snap-proximity items-start gap-4 overflow-x-auto overscroll-x-contain pb-1 pl-[var(--site-px)] pr-[var(--site-px)] [scroll-padding-inline-end:var(--site-px)] sm:gap-6"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          transition: "mask-image 450ms ease, -webkit-mask-image 450ms ease",
        }}
      >
        {/* Card de portada: se oculta a la izquierda con parallax al scrollear. */}
        <div ref={introRef} className="shrink-0 snap-start will-change-transform">
          <AcademiaShowcaseIntro count={courses.length} coverImage={coverImage} />
        </div>

        {courses.map((course, i) => (
          <CourseCard key={course.id} course={course} eager={i < 2} />
        ))}
      </div>

    </div>
  )
}
