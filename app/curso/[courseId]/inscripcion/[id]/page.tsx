import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient as createServiceClient } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/server"
import { getRegistrationForUser } from "@/lib/supabase/courses"
import type { RegistrationStatus } from "@/types"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ courseId: string; id: string }>
  searchParams: Promise<{ status?: string }>
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

function statusBadge(status: RegistrationStatus) {
  const map: Record<
    RegistrationStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pendiente de pago",
      className: "bg-yellow-100 text-yellow-800",
    },
    paid: {
      label: "Inscripción confirmada",
      className: "bg-green-100 text-green-800",
    },
    cancelled: {
      label: "Cancelada",
      className: "bg-red-100 text-red-800",
    },
  }
  const m = map[status]
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.className}`}
    >
      {m.label}
    </span>
  )
}

async function getLastPaymentAmount(
  registrationId: string
): Promise<number | null> {
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabaseAdmin
    .from("payments")
    .select("amount, status, created_at")
    .eq("course_reg_id", registrationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return Number((data as { amount: number | string }).amount)
}

export default async function InscripcionSuccessPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getRegistrationForUser(id, user.id)

  if (!result.data || !result.data.course) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Inscripción
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            Inscripción no encontrada
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            No pudimos encontrar esta inscripción o no tienes acceso a ella.
          </p>
          <Link
            href="/cursos"
            className="mt-6 inline-flex rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
          >
            Ver cursos
          </Link>
        </div>
      </main>
    )
  }

  const registration = result.data
  if (!registration.course) {
    redirect("/cursos")
  }
  const course = registration.course
  const paidAmount = await getLastPaymentAmount(registration.id)
  const totalCourse = course.price * registration.attendees
  const isDeposit = paidAmount !== null && paidAmount < totalCourse
  const remaining =
    paidAmount !== null ? Math.max(0, totalCourse - paidAmount) : null
  const isSuccess = status === "success"
  const isPending = status === "pending"

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[960px] px-6 py-10">
        {isSuccess && (
          <div className="mb-8 rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
              Pago confirmado
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              ¡Tu lugar está reservado!
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Recibimos tu pago correctamente. Te esperamos el día del curso.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mb-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
              Pago en proceso
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              Tu pago está siendo procesado
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Estamos esperando la confirmación de MercadoPago.
            </p>
          </div>
        )}

        {!isSuccess && !isPending && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
              Detalle de inscripción
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Mi inscripción</h1>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
              Curso
            </p>
            <h2 className="mt-2 text-xl font-semibold">{course.title}</h2>
            {course.instructor && (
              <p className="mt-1 text-sm text-neutral-600">
                Imparte {course.instructor.name}
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
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
              <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Ubicación
                </p>
                <p className="mt-1 text-sm font-semibold">{course.location}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
              Resumen
            </p>
            <dl className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-2 text-sm">
                <dt className="text-neutral-600">Asistentes</dt>
                <dd className="font-semibold">{registration.attendees}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-neutral-600">Estado</dt>
                <dd>{statusBadge(registration.status)}</dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-neutral-600">Precio del curso</dt>
                <dd className="font-semibold">{formatPrice(totalCourse)}</dd>
              </div>
              {paidAmount !== null && (
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-neutral-600">Pagado</dt>
                  <dd className="font-semibold">{formatPrice(paidAmount)}</dd>
                </div>
              )}
              {isDeposit && remaining !== null && remaining > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-neutral-600">Saldo restante</dt>
                  <dd className="font-semibold text-[#9b7a1f]">
                    {formatPrice(remaining)}
                  </dd>
                </div>
              )}
            </dl>

            {isDeposit && remaining !== null && remaining > 0 && (
              <p className="mt-4 rounded-xl border border-[#e8d7a4] bg-[#fdf8ea] px-3 py-2 text-xs leading-5 text-[#7b5f18]">
                Pagaste un apartado. Recuerda liquidar el saldo restante antes
                del inicio del curso.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/cursos"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
              >
                Ver más cursos
              </Link>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Política: sin reembolsos. Si no puedes asistir, el pago no se
              devuelve.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
