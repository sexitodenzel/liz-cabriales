import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getAppointmentForUser } from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

import CancelAppointmentButton from "./CancelAppointmentButton"

type Props = {
  params: Promise<{ id: string }>
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

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function statusBadge(status: AppointmentStatus) {
  const map: Record<
    AppointmentStatus,
    { label: string; className: string }
  > = {
    pending: {
      label: "Pendiente de pago",
      className: "bg-yellow-100 text-yellow-800",
    },
    paid: { label: "Pagada", className: "bg-green-100 text-green-800" },
    completed: {
      label: "Completada",
      className: "bg-purple-100 text-purple-800",
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

export default async function CitaPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getAppointmentForUser(id, user.id)

  if (!result.data) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Mi cita
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Cita no encontrada</h1>
          <p className="mt-3 text-sm text-neutral-600">
            No pudimos encontrar esta cita o no tienes acceso a ella.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/citas"
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Agendar una cita
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const appointment = result.data
  const isSuccess = status === "success"
  const isPending = status === "pending"

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[1060px] px-6 py-10">
        {isSuccess && (
          <div className="mb-8 rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
              Pago confirmado
            </p>
            <h1 className="mt-2 text-2xl font-semibold">
              ¡Tu cita fue reservada!
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Recibimos tu pago correctamente. Te esperamos en la fecha y hora
              indicadas.
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
              Estamos esperando la confirmación de tu pago.
            </p>
          </div>
        )}

        {!isSuccess && !isPending && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
              Detalle de cita
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Mi cita</h1>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
              Servicios
            </p>
            <ul className="mt-5 space-y-3">
              {appointment.services.map((s) => (
                <li
                  key={s.service_id}
                  className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold">{s.service_name}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {s.duration_min} min
                    </p>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(s.unit_price)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Profesional
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {appointment.professional_name ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  Fecha y hora
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatDate(appointment.date)}
                </p>
                <p className="text-sm text-neutral-700">
                  {formatTimeLabel(appointment.start_time)} –{" "}
                  {formatTimeLabel(appointment.end_time)}
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
              Resumen
            </p>
            <dl className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-2 text-sm">
                <dt className="text-neutral-600">ID de cita</dt>
                <dd className="max-w-[140px] break-all text-right text-xs font-medium">
                  {appointment.id}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-neutral-600">Estado</dt>
                <dd>{statusBadge(appointment.status)}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-5 py-4 text-white">
              <span className="text-sm font-medium uppercase tracking-[0.18em]">
                Total
              </span>
              <span className="text-lg font-semibold">
                {formatPrice(appointment.total)}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {(appointment.status === "pending" ||
                appointment.status === "paid") && (
                <CancelAppointmentButton
                  appointmentId={appointment.id}
                  date={appointment.date}
                  startTime={appointment.start_time}
                />
              )}
              <Link
                href="/citas"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
              >
                Volver a citas
              </Link>
            </div>

            <p className="mt-4 text-xs text-neutral-500">
              Política: Las cancelaciones deben realizarse con al menos 24 horas
              de anticipación y no son reembolsables.
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
