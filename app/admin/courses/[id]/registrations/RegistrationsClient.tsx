"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type {
  AdminRegistrationRow,
  CourseWithStats,
} from "@/lib/supabase/courses"

import ManualRegistrationModal from "./components/ManualRegistrationModal"

type Props = {
  course: CourseWithStats
  initialRegistrations: AdminRegistrationRow[]
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function RegistrationsClient({
  course,
  initialRegistrations,
}: Props) {
  const router = useRouter()
  const [registrations, setRegistrations] =
    useState<AdminRegistrationRow[]>(initialRegistrations)
  const [showModal, setShowModal] = useState(false)

  const totalRecaudado = registrations.reduce((acc, r) => {
    if (r.payment_status === "approved" && r.payment_amount != null) {
      return acc + r.payment_amount
    }
    return acc
  }, 0)

  const totalPaidAttendees = registrations.reduce(
    (acc, r) => (r.status === "paid" ? acc + r.attendees : acc),
    0
  )

  const refresh = async () => {
    try {
      const res = await fetch(
        `/api/admin/courses/${course.id}/registrations`
      )
      const json = await res.json()
      if (res.ok && !json.error) {
        setRegistrations(
          (json.data.registrations ?? []) as AdminRegistrationRow[]
        )
      }
    } catch {
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <header className="border-b border-[#ececec] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/courses"
            className="text-sm font-semibold text-[#c9a84c] hover:text-[#a8893a]"
          >
            ← Cursos
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{course.title}</h1>
            <p className="text-xs text-[#6b6b6b]">Inscritos al curso</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors"
        >
          + Agregar alumno manual
        </button>
      </header>

      <main className="p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#ececec] bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-[#6b6b6b]">
              Cupo
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#1a1a1a]">
              {totalPaidAttendees}/{course.capacity}
            </p>
          </div>
          <div className="rounded-xl border border-[#ececec] bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-[#6b6b6b]">
              Inscripciones totales
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#1a1a1a]">
              {registrations.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#ececec] bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-[#6b6b6b]">
              Total recaudado (aprobado)
            </p>
            <p className="mt-1 text-2xl font-semibold text-[#c9a84c]">
              {formatPrice(totalRecaudado)}
            </p>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="rounded-xl border border-[#ececec] bg-[#fafafa] p-10 text-center text-sm text-[#6b6b6b]">
            Aún no hay inscripciones.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#ececec] bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#ececec] text-left text-xs uppercase tracking-wider text-[#6b6b6b] bg-[#fafafa]">
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Asistentes</th>
                  <th className="px-4 py-3">Monto pagado</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Inscrito</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((r) => {
                  const name =
                    [r.client_first_name, r.client_last_name]
                      .filter(Boolean)
                      .join(" ") || "Sin nombre"
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-[#ececec] last:border-b-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-3 font-medium text-[#1a1a1a]">{name}</td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {r.client_email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">{r.attendees}</td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {r.payment_amount != null
                          ? formatPrice(r.payment_amount)
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "paid" ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            Pagada
                          </span>
                        ) : r.status === "pending" ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                            Pendiente
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                            Cancelada
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {r.added_by_admin ? "Manual" : "Web"}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b]">
                        {formatDateTime(r.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <ManualRegistrationModal
          courseId={course.id}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
