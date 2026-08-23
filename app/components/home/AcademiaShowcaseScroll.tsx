"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

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
      className="group flex w-[46vw] shrink-0 snap-start flex-col sm:w-[300px] lg:w-[320px]"
    >
      {/* Foto. En desktop va un punto más alta que 3/4: es de ahí de donde sale
          el alto del panel de la izquierda, que se estira a la fila. Crecerlo
          con un min-h en el panel habría dejado el hueco dentro de las cards. */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-neutral-100 lg:aspect-[7/10]">
        {cover ? (
          <SmoothImage
            src={cover}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 46vw, 320px"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
            loading={eager ? undefined : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-neutral-400">
            Sin imagen
          </div>
        )}
      </div>

      {/* Texto debajo de la foto, en el espacio blanco. flex-auto + mt-auto:
          la columna se come el alto sobrante de la fila y manda el botón hasta
          abajo, así los "Descubrir" de todas las cards quedan en la misma línea
          y el panel cierra a la misma altura que ellos. */}
      <div className="flex flex-auto flex-col pt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
          {cardEyebrow(course)}
        </p>
        <h3 className="text-[14px] font-semibold leading-[1.25] tracking-[-0.01em] text-ink sm:text-[18px]">
          {course.title}
        </h3>
        {/* El pt es el aire mínimo contra el título; el mt-auto se queda con lo
            que sobre. */}
        <div className="mt-auto pt-4">
          <span className="flex w-full items-center justify-center rounded-full border border-ink/25 px-2 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white sm:px-4 sm:text-[11px]">
            Descubrir
          </span>
        </div>
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
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, clientWidth, scrollWidth } = el
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

  // Los dos bordes se difuminan cuando hay riel de ese lado y vuelven a filo
  // recto al tocar el extremo. El izquierdo no existía: al scrollear, la card
  // quedaba cortada a cuchillo contra el borde de la pantalla mientras el otro
  // lado sí se desvanecía, y esa asimetría era lo que se veía roto.
  return (
    <div className="mx-auto max-w-[var(--site-max-w)] py-12 md:py-16 lg:px-[var(--site-px)]">
      {/* Móvil: el panel es un bloque propio arriba y el carrusel va debajo — la
          separación la hace la estructura, no una animación. Desktop: los dos
          son columnas de la misma fila, así que el panel queda quieto a la
          izquierda y solo desfila el riel (es como lo resuelve OPI).
          El riel va sin snap: los tirones del snap-proximity se sentían raros
          con cards de este ancho. */}
      <div className="lg:flex lg:items-stretch lg:gap-3">
        <div className="px-[var(--site-px)] lg:flex lg:shrink-0 lg:px-0">
          <AcademiaShowcaseIntro count={courses.length} coverImage={coverImage} />
        </div>

        {/* Fade con overlays, no mask-image: el mask recorta un riel de fotos
            en cada frame de scroll y en GPU baja se siente a tirones. */}
        <div className="relative min-w-0 lg:flex-1">
          <div
            ref={scrollerRef}
            className="scrollbar-hide mt-4 flex snap-x snap-proximity items-stretch gap-2 overflow-x-auto overscroll-x-contain pb-1 pl-[var(--site-px)] pr-[var(--site-px)] [scroll-padding-inline:var(--site-px)] sm:mt-6 sm:gap-3 lg:mt-0 lg:px-0 lg:[scroll-padding-inline:0px]"
          >
            {courses.map((course, i) => (
              <CourseCard key={course.id} course={course} eager={i < 2} />
            ))}
          </div>
          {!atStart ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-ivory to-transparent lg:block"
            />
          ) : null}
          {!atEnd ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-ivory to-transparent lg:block"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
