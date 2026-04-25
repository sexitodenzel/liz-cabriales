import Link from "next/link"

import { createClient } from "@/lib/supabase/server"
import {
  getCourseById,
  getUserRegistrations,
} from "@/lib/supabase/courses"
import { getMinDeposit } from "@/lib/utils"
import type { CourseLevel } from "@/types"

import RegisterCourseButton from "./RegisterCourseButton"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

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

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

export default async function CursoDetallePage({ params }: Props) {
  const { id } = await params
  const result = await getCourseById(id)

  if (!result.data || !result.data.is_published) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-16 text-[#0a0a0a]">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="text-2xl font-semibold">Curso no disponible</h1>
          <p className="mt-3 text-sm text-neutral-600">
            El curso que buscas no existe o ya no está publicado.
          </p>
          <Link
            href="/cursos"
            className="mt-6 inline-flex rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
          >
            Ver cursos disponibles
          </Link>
        </div>
      </main>
    )
  }

  const course = result.data
  const minDeposit = getMinDeposit(course.price)
  const isFull = course.spots_remaining <= 0

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let alreadyRegistered = false
  let pendingRegistrationId: string | null = null
  if (user) {
    const regs = await getUserRegistrations(user.id)
    if (regs.data) {
      for (const r of regs.data) {
        if (r.course_id === course.id) {
          if (r.status === "paid") {
            alreadyRegistered = true
            break
          }
          if (r.status === "pending" && !pendingRegistrationId) {
            pendingRegistrationId = r.id
          }
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <Link
          href="/cursos"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65] hover:text-[#C9A84C]"
        >
          ← Volver a cursos
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[28px] border border-[#e8e1d3] bg-neutral-100">
              {course.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={course.cover_image}
                  alt={course.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-wider text-neutral-400">
                  Sin imagen
                </div>
              )}
              <div className="absolute right-4 top-4 flex gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
                  {LEVEL_LABEL[course.level]}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-semibold sm:text-4xl">
                {course.title}
              </h1>
              {course.instructor && (
                <p className="mt-2 text-sm text-neutral-600">
                  Imparte{" "}
                  <span className="font-semibold text-[#0a0a0a]">
                    {course.instructor.name}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Fecha
                </p>
                <p className="mt-1 text-sm font-semibold capitalize">
                  {formatDate(course.start_date)}
                </p>
                {course.end_date && course.end_date !== course.start_date && (
                  <p className="text-xs text-neutral-600">
                    Hasta {formatDate(course.end_date)}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Hora de inicio
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatTimeLabel(course.start_time)}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Ubicación
                </p>
                <p className="mt-1 text-sm font-semibold">{course.location}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#e8e1d3] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
                Descripción
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">
                {course.description}
              </p>
            </div>

            {course.instructor && course.instructor.bio && (
              <div className="mt-6 rounded-[24px] border border-[#e8e1d3] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
                  Instructora
                </p>
                <div className="mt-4 flex items-start gap-4">
                  {course.instructor.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.instructor.photo_url}
                      alt={course.instructor.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-neutral-100" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{course.instructor.name}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-neutral-700">
                      {course.instructor.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
                Precio por persona
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {formatPrice(course.price)}
              </p>

              <div className="mt-4 rounded-2xl border border-[#e8d7a4] bg-[#fdf8ea] p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9b7a1f]">
                  ¡{course.confirmed_count} personas ya se inscribieron!
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {isFull
                    ? "Curso lleno"
                    : `${course.spots_remaining} ${
                        course.spots_remaining === 1 ? "lugar" : "lugares"
                      } de ${course.capacity} disponibles`}
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm text-neutral-700">
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-[#fcfbf8] px-4 py-3">
                  <span>Apartado mínimo</span>
                  <span className="font-semibold">
                    {formatPrice(minDeposit)}
                  </span>
                </div>
                <p className="text-xs leading-5 text-neutral-500">
                  Puedes reservar tu lugar con el apartado mínimo o pagar el
                  curso completo. El saldo restante se liquida antes del curso.
                  <br />
                  <span className="font-semibold text-neutral-700">
                    Política: sin reembolsos.
                  </span>
                </p>
              </div>

              <div className="mt-6">
                {alreadyRegistered ? (
                  <div className="rounded-full bg-emerald-50 px-5 py-3 text-center text-sm font-semibold text-emerald-700">
                    Ya estás inscrito en este curso
                  </div>
                ) : isFull ? (
                  <div className="rounded-full bg-red-50 px-5 py-3 text-center text-sm font-semibold text-red-700">
                    Curso lleno
                  </div>
                ) : (
                  <RegisterCourseButton
                    courseId={course.id}
                    fullPrice={course.price}
                    minDeposit={minDeposit}
                    isAuthenticated={Boolean(user)}
                    pendingRegistrationId={pendingRegistrationId}
                  />
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
