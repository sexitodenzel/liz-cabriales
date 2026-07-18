/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { TiendaCategory } from "../menuData"
import SmoothImage from "@/app/components/shared/SmoothImage"
import type { CourseLevel } from "@/types"

type AcademiaCourse = {
  id: string
  title: string
  cover: string | null
  start_date: string
  level: CourseLevel
}

type AcademiaMegaMenuProps = {
  isOpen: boolean
  categories: TiendaCategory[]
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
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

function parseDateBadge(dateStr: string): { day: number; month: string } {
  const [, m, d] = dateStr.split("-").map(Number)
  return { day: d, month: MONTHS_SHORT[m - 1] }
}

// Precalienta la caché del navegador para los flyers (mismo patrón que el
// showcase de la tienda): con `images.unoptimized` next/image pide la URL
// cruda, así aparece al instante al abrir el menú.
const warmedImages = new Set<string>()
function warmImages(courses: AcademiaCourse[]) {
  if (typeof window === "undefined") return
  for (const course of courses) {
    const url = course.cover
    if (!url || warmedImages.has(url)) continue
    warmedImages.add(url)
    const img = new window.Image()
    img.src = url
  }
}

export default function AcademiaMegaMenu({
  isOpen,
  categories,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: AcademiaMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [courses, setCourses] = useState<AcademiaCourse[] | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setContentVisible(false)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Precarga los 2 próximos cursos AL MONTAR (no al abrir): el megamenú está
  // siempre montado, así que traer los datos y calentar las portadas aquí hace
  // que los flyers ya estén en caché del navegador antes del primer hover.
  useEffect(() => {
    let cancelled = false
    void fetch("/api/navbar/academia-courses")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: AcademiaCourse[] } | null) => {
        if (cancelled) return
        const list = Array.isArray(json?.data) ? json!.data! : []
        setCourses(list)
        warmImages(list)
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        bg-ivory border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div
        className={`
          site-container flex gap-0 pt-6 pb-8 min-h-[360px]
          transition-opacity duration-300 ease-out
          ${contentVisible ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* ===== Columnas: taxonomía real de la academia ===== */}
        <div className="min-w-0 flex-1 pr-8 lg:pr-12">
          <Link
            href="/academia"
            onClick={onClose}
            className="mb-6 flex w-fit items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e] transition-opacity hover:opacity-80"
          >
            Ver academia
          </Link>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-3">
            {categories.map((cat, idx) => (
              <div
                key={cat.slug}
                className={`
                  transition-opacity duration-300 ease-out
                  ${contentVisible ? "opacity-100" : "opacity-0"}
                `}
                style={{ transitionDelay: `${idx * 30}ms` }}
              >
                <Link
                  href={cat.href}
                  onClick={onClose}
                  className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a] transition-colors hover:text-[#c6a75e]"
                >
                  {cat.label}
                </Link>
                <ul className="space-y-2">
                  {cat.subcategories.map((sub) => (
                    <li key={sub.label}>
                      <Link
                        href={sub.href}
                        onClick={onClose}
                        className="block text-[14px] text-neutral-700 transition-colors hover:text-[#c6a75e] line-clamp-1"
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Panel derecho: 2 próximos cursos (flyer) ===== */}
        <div className="w-[340px] shrink-0 border-l border-neutral-200 pl-10">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Próximos eventos
          </p>
          <div className="grid grid-cols-2 gap-4">
            {courses === null
              ? Array.from({ length: 2 }).map((_, i) => <FlyerSkeleton key={i} />)
              : courses.map((course) => (
                  <FlyerCard key={course.id} course={course} onClose={onClose} />
                ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlyerCard({
  course,
  onClose,
}: {
  course: AcademiaCourse
  onClose: () => void
}) {
  const { day, month } = parseDateBadge(course.start_date)
  return (
    <Link
      href={`/academia/${course.id}`}
      onClick={onClose}
      className="group block w-full"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-neutral-100">
        {course.cover ? (
          <SmoothImage
            src={course.cover}
            alt={course.title}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-neutral-400">
            Sin imagen
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45" />

        {/* Chip de nivel */}
        <span className="absolute left-2 top-2 rounded-full bg-[#141414]/55 px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e2c06f] backdrop-blur-md">
          {LEVEL_LABEL[course.level]}
        </span>

        {/* Badge de fecha */}
        <span className="absolute bottom-2 left-2 flex items-baseline gap-1 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
          <span
            className="text-[16px] font-semibold leading-none"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {day}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e2c06f]">
            {month}
          </span>
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#1a1a1a] transition-colors group-hover:text-[#c6a75e] line-clamp-2">
        {course.title}
      </p>
    </Link>
  )
}

function FlyerSkeleton() {
  return (
    <div className="w-full">
      <div className="aspect-[4/5] w-full animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded-sm bg-neutral-100" />
    </div>
  )
}
