"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import SmoothImage from "@/app/components/shared/SmoothImage"
import type { CourseWithStats } from "@/lib/supabase/courses"
import SectionCarousel from "./SectionCarousel"
import { storeIconButtonClassName } from "./store-button-styles"

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
  if (courses.length === 0) return null

  return (
    <SectionCarousel title="Cursos y eventos" titleHref="/academia">
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
              className="group flex h-full w-64 flex-none flex-col"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
                {course.cover_image ? (
                  <SmoothImage
                    src={course.cover_image}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-[1.03]"
                    sizes="256px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 text-2xl font-semibold text-neutral-500">
                    LC
                  </div>
                )}

                {/* Chip de nivel (vidrio ahumado, como en /academia) */}
                <span className="absolute left-3 top-3 z-10 rounded-full bg-[#141414]/55 px-2.5 py-[4px] text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e2c06f] backdrop-blur-md [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                  {LEVEL_LABEL[course.level] ?? course.level}
                </span>

                {/* Badge de fecha con acento dorado */}
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
              </div>

              <div className="flex flex-1 flex-col gap-2 pt-2">
                <h3 className="line-clamp-2 min-h-[2lh] text-sm font-semibold leading-snug text-[#0a0a0a]">
                  {course.title}
                </h3>

                {/* Maestro ↔ precio / Ver detalle (misma altura, abajo-derecha) */}
                <div className="mt-auto flex items-center gap-1.5 pt-1">
                  {instructorPhoto ? (
                    <SmoothImage
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
                  <span className="truncate text-[11px] text-neutral-500">{instructorName}</span>
                  {course.show_price_public ? (
                    <span className="ml-auto shrink-0 text-[12px] font-semibold text-[#8a6d26]">
                      {formatPrice(course.price)}
                    </span>
                  ) : (
                    <span aria-label="Ver detalle" className={`ml-auto ${storeIconButtonClassName}`}>
                      <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
    </SectionCarousel>
  )
}
