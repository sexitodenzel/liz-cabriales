"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  AdminAppointmentRow,
  ProfessionalRow,
  ServiceRow,
} from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

import Breadcrumb from "@/components/shared/Breadcrumb"
import NewAppointmentModal from "./components/NewAppointmentModal"
import BlockSlotModal from "./components/BlockSlotModal"
import RescheduleAppointmentModal from "./components/RescheduleAppointmentModal"
import CourseDaysPanel from "./components/CourseDaysPanel"

const BRAND_GOLD = "#C9A84C"

type Props = {
  professionals: ProfessionalRow[]
  services: ServiceRow[]
}

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${dd}`
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

function statusLabel(status: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    pending: "Pendiente",
    paid: "Pagada",
    completed: "Completada",
    cancelled: "Cancelada",
  }
  return map[status] ?? status
}

function statusClass(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-neutral-200 text-neutral-800 border-neutral-300"
    case "paid":
      return "bg-blue-100 text-blue-900 border-blue-200"
    case "completed":
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    case "cancelled":
      return "bg-red-100 text-red-900 border-red-200"
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200"
  }
}

export default function AdminAppointmentsClient({
  professionals,
  services,
}: Props) {
  const [date, setDate] = useState<string>(todayString())
  const [professionalId, setProfessionalId] = useState<string>("all")
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AdminAppointmentRow | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ date })
      if (professionalId !== "all") {
        qs.set("professional_id", professionalId)
      }
      const res = await fetch(`/api/admin/appointments?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudieron cargar las citas")
        setAppointments([])
        return
      }
      setAppointments(json.data.appointments ?? [])
    } catch {
      setError("Error de red al cargar citas")
    } finally {
      setLoading(false)
    }
  }, [date, professionalId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancel = async (id: string) => {
    const ok = window.confirm("¿Cancelar esta cita?")
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/appointments/${id}/cancel`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        window.alert(json?.error?.message ?? "No se pudo cancelar la cita")
        return
      }
      fetchData()
    } catch {
      window.alert("Error de red al cancelar")
    }
  }

  const visibleAppointments = useMemo(
    () =>
      appointments.filter((a) =>
        professionalId === "all" ? true : a.professional_id === professionalId
      ),
    [appointments, professionalId]
  )

  const totalDay = useMemo(
    () =>
      visibleAppointments
        .filter((a) => a.status !== "cancelled")
        .reduce((sum, a) => sum + a.total, 0),
    [visibleAppointments]
  )

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-10">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Mi Perfil", href: "/perfil" },
            { label: "Panel de administrador", href: "/admin" },
            { label: "Agenda" },
          ]}
        />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-[#c9a84c]">
              PANEL ADMINISTRADOR
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1a1a1a]">Agenda</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBlockModal(true)}
              className="rounded-lg border border-[#ececec] bg-white px-4 py-2 text-sm font-medium text-[#3a3a3a] hover:border-[#c9a84c] hover:text-[#a8893a] transition-colors"
            >
              Bloquear horario
            </button>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors"
            >
              Nueva cita manual
            </button>
            <Link
              href="/admin"
              className="text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-[#ececec] bg-white p-4">
          <div>
            <label
              htmlFor="date"
              className="block text-xs font-medium text-[#6b6b6b]"
            >
              Fecha
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
            />
          </div>
          <div>
            <label
              htmlFor="professional"
              className="block text-xs font-medium text-[#6b6b6b]"
            >
              Profesional
            </label>
            <select
              id="professional"
              value={professionalId}
              onChange={(e) => setProfessionalId(e.target.value)}
              className="mt-1 rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
            >
              <option value="all">Todos</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-[#6b6b6b]">
            Total del día:{" "}
            <span className="font-semibold text-[#1a1a1a]">
              {formatPrice(totalDay)}
            </span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#fafafa] text-xs uppercase tracking-[0.16em] text-[#6b6b6b]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Hora</th>
                  <th className="px-4 py-3 font-semibold">Profesional</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Servicios</th>
                  <th className="px-4 py-3 font-semibold">Duración</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-[#6b6b6b]"
                    >
                      Cargando…
                    </td>
                  </tr>
                ) : visibleAppointments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-10 text-center text-[#6b6b6b]"
                    >
                      No hay citas para este día.
                    </td>
                  </tr>
                ) : (
                  visibleAppointments.map((a) => {
                    const duration = a.services.reduce(
                      (sum, s) => sum + s.duration_min,
                      0
                    )
                    const clientName =
                      [a.client_first_name, a.client_last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      a.client_email ||
                      "—"
                    return (
                      <tr key={a.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                          {formatTimeLabel(a.start_time)}
                          <span className="block text-[10px] text-[#6b6b6b]">
                            hasta {formatTimeLabel(a.end_time)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#3a3a3a]">
                          {a.professional_name ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#3a3a3a]">
                          <div>{clientName}</div>
                          {a.client_email && (
                            <div className="text-[11px] text-[#6b6b6b]">
                              {a.client_email}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#3a3a3a]">
                          {a.services.map((s) => s.service_name).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-[#3a3a3a]">
                          {duration} min
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                          {formatPrice(a.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusClass(a.status)}`}
                          >
                            {statusLabel(a.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {(a.status === "paid" ||
                              a.status === "pending") && (
                              <button
                                type="button"
                                onClick={() => setRescheduleTarget(a)}
                                className="rounded-md border border-[#e8dcb0] bg-[#f5efdc] px-3 py-1 text-xs font-semibold text-[#a8893a] hover:bg-[#e8dcb0] transition-colors"
                              >
                                Reprogramar
                              </button>
                            )}
                            {a.status !== "cancelled" &&
                              a.status !== "completed" && (
                                <button
                                  type="button"
                                  onClick={() => handleCancel(a.id)}
                                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                                >
                                  Cancelar
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CourseDaysPanel />
      </div>

      {showNewModal && (
        <NewAppointmentModal
          professionals={professionals}
          services={services}
          defaultDate={date}
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false)
            fetchData()
          }}
        />
      )}

      {showBlockModal && (
        <BlockSlotModal
          professionals={professionals}
          defaultDate={date}
          onClose={() => setShowBlockModal(false)}
          onCreated={() => {
            setShowBlockModal(false)
            fetchData()
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleAppointmentModal
          appointment={rescheduleTarget}
          professionals={professionals}
          onClose={() => setRescheduleTarget(null)}
          onRescheduled={() => {
            setRescheduleTarget(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
