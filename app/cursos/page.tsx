import Link from "next/link"

import { getPublishedCourses } from "@/lib/supabase/courses"
import type { CourseLevel } from "@/types"

type CoursePreview = Awaited<ReturnType<typeof getPublishedCourses>>

export const dynamic = "force-dynamic"

const LEVEL_LABEL: Record<CourseLevel, string> = {
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

function formatDateRange(start: string, end: string | null): string {
  const [ys, ms, ds] = start.split("-").map(Number)
  const startDate = new Date(ys, ms - 1, ds)
  const fmt = (d: Date) =>
    d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  if (!end || end === start) return fmt(startDate)
  const [ye, me, de] = end.split("-").map(Number)
  const endDate = new Date(ye, me - 1, de)
  return `${fmt(startDate)} – ${fmt(endDate)}`
}

function isUpcoming(start: string): boolean {
  const [y, m, d] = start.split("-").map(Number)
  const startDate = new Date(y, m - 1, d)
  const threshold = Date.now() + 7 * 24 * 60 * 60 * 1000
  return startDate.getTime() > threshold
}

export default async function CursosPage() {
  const result: CoursePreview = await getPublishedCourses()

  if (!result.data) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-16 text-[#0a0a0a]">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold">
            No pudimos cargar los cursos
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            Intenta de nuevo más tarde.
          </p>
        </div>
      </main>
    )
  }

  const courses = result.data

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <section className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
            Academia Liz Cabriales
          </p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Cursos presenciales
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Formación profesional en uñas con instructoras especializadas.
            Reserva tu lugar con el apartado mínimo y asegura tu inscripción.
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-200 bg-white p-10 text-center">
            <p className="text-sm text-neutral-600">
              Aún no hay cursos publicados. Vuelve pronto.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isFull = course.spots_remaining <= 0
              const upcoming = isUpcoming(course.start_date)

              return (
                <Link
                  key={course.id}
                  href={`/cursos/${course.id}`}
                  className="group flex flex-col overflow-hidden rounded-[24px] border border-[#e8e1d3] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C9A84C] hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    {course.cover_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.cover_image}
                        alt={course.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-wider text-neutral-400">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-2">
                      {isFull && (
                        <span className="rounded-full bg-red-600/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                          Lleno
                        </span>
                      )}
                      {!isFull && upcoming && (
                        <span className="rounded-full bg-[#C9A84C]/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0a0a0a]">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-700">
                        {LEVEL_LABEL[course.level]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h2 className="text-lg font-semibold leading-tight">
                        {course.title}
                      </h2>
                      {course.instructor && (
                        <p className="mt-1 text-xs text-neutral-500">
                          Imparte {course.instructor.name}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">
                      {formatDateRange(course.start_date, course.end_date)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-lg font-semibold">
                        {formatPrice(course.price)}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {isFull
                          ? "0 lugares"
                          : `${course.spots_remaining} de ${course.capacity} lugares`}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
