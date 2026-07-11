"use client"

import Image from "next/image"
import Link from "next/link"
import type { CourseWithStats } from "@/lib/supabase/courses"
import SectionCarousel from "./SectionCarousel"

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
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
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
                <div className="absolute left-3 top-3 rounded-md border border-white/10 bg-[#141414]/60 px-2 py-1 text-center shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-md">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-[#e2c06f] [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                    {month}
                  </p>
                  <p className="text-sm font-semibold leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">{day}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <h3 className="line-clamp-2 min-h-[2lh] text-sm font-semibold leading-snug text-[#0a0a0a]">
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
                <div>
                  {course.show_price_public ? (
                    <span className="text-sm font-semibold text-[#C9A84C]">
                      {formatPrice(course.price)}
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">Ver detalle</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
    </SectionCarousel>
  )
}
