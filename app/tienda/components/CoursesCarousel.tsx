"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import type { CourseWithStats } from "@/lib/supabase/courses"

const MONTHS_SHORT = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
]

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
  open: "Abierto",
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

type Props = { courses: CourseWithStats[] }

export default function CoursesCarousel({ courses }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  if (courses.length === 0) return null

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cursos y eventos</h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anterior"
            disabled={!canScrollLeft}
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center bg-transparent text-[#0a0a0a] transition-colors hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            disabled={!canScrollRight}
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center bg-transparent text-[#0a0a0a] transition-colors hover:text-neutral-600 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-6 flex gap-5 overflow-x-auto pb-3"
      >
        {courses.map((course) => {
          const parts = course.start_date.split("-")
          const month = MONTHS_SHORT[(parseInt(parts[1] ?? "1", 10) - 1)] ?? ""
          const day = parseInt(parts[2] ?? "1", 10)
          const instructorName = course.instructor?.name ?? "Instructor"
          const instructorPhoto = course.instructor?.photo_url ?? null
          const initials = instructorName
            .split(" ")
            .slice(0, 2)
            .map((s: string) => s[0])
            .join("")

          return (
            <Link
              key={course.id}
              href={`/academia/${course.id}`}
              className="group w-64 flex-none overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow duration-200 hover:shadow-md"
            >
              <div className="relative h-40 overflow-hidden bg-neutral-100">
                {course.cover_image ? (
                  <Image
                    src={course.cover_image}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="256px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-2xl font-semibold text-neutral-500">
                    LC
                  </div>
                )}
                <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2 py-1 text-center backdrop-blur-sm">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#a8862f]">
                    {month}
                  </p>
                  <p className="text-sm font-semibold leading-none text-[#0a0a0a]">{day}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#0a0a0a]">
                  {course.title}
                </h3>
                <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  {LEVEL_LABEL[course.level] ?? course.level}
                </div>
                <div className="flex items-center gap-1.5">
                  {instructorPhoto ? (
                    <Image
                      src={instructorPhoto}
                      alt={instructorName}
                      width={18}
                      height={18}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-neutral-200 text-[8px] font-semibold text-neutral-500">
                      {initials}
                    </div>
                  )}
                  <span className="text-[11px] text-neutral-500">{instructorName}</span>
                </div>
                <div className="flex items-center justify-between">
                  {course.show_price_public ? (
                    <span className="text-sm font-semibold text-[#C9A84C]">
                      {formatPrice(course.price)}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">Ver detalle</span>
                  )}
                  <span className="text-[11px] font-medium text-[#a8862f] transition-colors group-hover:text-[#C9A84C]">
                    Ver más →
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
