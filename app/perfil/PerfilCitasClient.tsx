"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { appointmentAllowsClientCancel } from "@/lib/appointmentCancelPolicy"
import type { AppointmentRecord } from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

type Props = {
  initialAppointments: AppointmentRecord[]
}

function formatTime(hhmmss: string): string {
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

export default function PerfilCitasClient({ initialAppointments }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initialAppointments)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function cancel(id: string) {
    setError(null)
    setBusyId(id)
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "PATCH",
      })
      const json = (await res.json()) as {
        data: { ok: boolean } | null
        error: { message: string } | null
      }
      if (!res.ok || !json.data) {
        setError(json.error?.message ?? "No se pudo cancelar la cita.")
        return
      }
      setItems((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "cancelled" as const } : a
        )
      )
      router.refresh()
    } catch {
      setError("Error de red al cancelar.")
    } finally {
      setBusyId(null)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No tienes citas registradas. Reserva en{" "}
        <a href="/citas" className="font-medium text-[#9b7a1f] underline">
          Servicios
        </a>
        .
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
        {items.map((a) => {
          const canCancel = appointmentAllowsClientCancel(a)
          const servicesLabel = a.services.map((s) => s.service_name).join(", ")
          return (
            <li
              key={a.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {new Date(a.date + "T12:00:00").toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  {formatTime(a.start_time)} — {servicesLabel}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Profesional: {a.professional_name ?? "—"}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusClass(a.status)}`}
                >
                  {statusLabel(a.status)}
                </span>
                {canCancel && (
                  <button
                    type="button"
                    disabled={busyId === a.id}
                    onClick={() => void cancel(a.id)}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                  >
                    {busyId === a.id ? "Cancelando…" : "Cancelar cita"}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-neutral-500">
        Puedes cancelar con al menos 24 horas de anticipación respecto al inicio
        de la cita.
      </p>
    </div>
  )
}
