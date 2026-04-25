import Link from "next/link"
import { redirect } from "next/navigation"

import PerfilCitasClient from "./PerfilCitasClient"
import { listAppointmentsForUser } from "@/lib/supabase/appointments"
import { getUserRegistrations } from "@/lib/supabase/courses"
import { getUserOrdersSummaries } from "@/lib/supabase/orders"
import { createClient } from "@/lib/supabase/server"
import type { OrderStatus, RegistrationStatus } from "@/types"

export const dynamic = "force-dynamic"

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function orderStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }
  return map[status] ?? status
}

function orderStatusClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 border-amber-200"
    case "paid":
      return "bg-blue-100 text-blue-900 border-blue-200"
    case "shipped":
      return "bg-violet-100 text-violet-900 border-violet-200"
    case "delivered":
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    case "cancelled":
      return "bg-red-100 text-red-900 border-red-200"
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200"
  }
}

function registrationStatusLabel(status: RegistrationStatus): string {
  const map = {
    pending: "Pendiente de pago",
    paid: "Pagada",
    cancelled: "Cancelada",
  } as const
  return map[status] ?? status
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .single()

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Cliente"
  const email = profile?.email ?? user.email ?? ""

  const [ordersRes, apptsRes, regsRes] = await Promise.all([
    getUserOrdersSummaries(user.id),
    listAppointmentsForUser(user.id),
    getUserRegistrations(user.id),
  ])

  const orders = ordersRes.data ?? []
  const appointments = apptsRes.data ?? []
  const registrations = regsRes.data ?? []

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[900px] px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
          Tu cuenta
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mi perfil</h1>

        <section className="mt-10 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">
            Datos del usuario
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Nombre
              </dt>
              <dd className="mt-1 text-neutral-900">{displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Correo
              </dt>
              <dd className="mt-1 text-neutral-900">{email}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">Mis pedidos</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">
              Aún no tienes pedidos. Explora la{" "}
              <Link href="/tienda" className="font-medium text-[#9b7a1f] underline">
                tienda
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                >
                  <div>
                    <p className="text-sm text-neutral-600">
                      {new Date(o.created_at).toLocaleString("es-MX", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-base font-semibold text-neutral-900">
                      {formatMoney(o.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${orderStatusClass(o.status)}`}
                    >
                      {orderStatusLabel(o.status)}
                    </span>
                    <Link
                      href={`/orden/${o.id}`}
                      className="text-sm font-medium text-[#9b7a1f] underline-offset-2 hover:underline"
                    >
                      Ver orden
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">Mis citas</h2>
          <div className="mt-4">
            <PerfilCitasClient initialAppointments={appointments} />
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-neutral-900">Mis cursos</h2>
          {registrations.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">
              No tienes inscripciones. Consulta los{" "}
              <Link href="/cursos" className="font-medium text-[#9b7a1f] underline">
                cursos disponibles
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-200">
              {registrations.map((r) => {
                const title = r.course?.title ?? "Curso"
                const paid =
                  r.payment_amount != null
                    ? r.payment_amount
                    : r.course
                      ? r.course.price * r.attendees
                      : null
                return (
                  <li key={r.id} className="py-4 first:pt-0">
                    <p className="font-semibold text-neutral-900">{title}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Inscripción:{" "}
                      {new Date(r.created_at).toLocaleDateString("es-MX", {
                        dateStyle: "medium",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      Monto:{" "}
                      {paid != null ? formatMoney(paid) : "—"}{" "}
                      <span
                        className={`ml-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          r.status === "paid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : r.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-900"
                              : "border-neutral-200 bg-neutral-50 text-neutral-700"
                        }`}
                      >
                        {registrationStatusLabel(r.status)}
                      </span>
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
