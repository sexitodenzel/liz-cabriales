"use client"

import { useEffect, useMemo, useState } from "react"

import type {
  AdminAppointmentRow,
  ProfessionalRow,
} from "@/lib/supabase/appointments"

type Props = {
  appointment: AdminAppointmentRow
  professionals: ProfessionalRow[]
  onClose: () => void
  onRescheduled: () => void
}

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

function formatTimeLabel(hhmmss: string): string {
  const [hh, mm] = hhmmss.slice(0, 5).split(":").map(Number)
  const ampm = hh >= 12 ? "p.m." : "a.m."
  const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`
}

export default function RescheduleAppointmentModal({
  appointment,
  professionals,
  onClose,
  onRescheduled,
}: Props) {
  const [date, setDate] = useState<string>(appointment.date)
  const [professionalId, setProfessionalId] = useState<string>(
    appointment.professional_id
  )
  const [startTime, setStartTime] = useState<string>("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duration = useMemo(
    () => appointment.services.reduce((sum, s) => sum + s.duration_min, 0),
    [appointment.services]
  )

  useEffect(() => {
    const fetchSlots = async () => {
      if (!date || !professionalId || duration === 0) {
        setSlots([])
        return
      }
      setLoadingSlots(true)
      try {
        const qs = new URLSearchParams({
          date,
          professional_id: professionalId,
          duration_min: String(duration),
        })
        const res = await fetch(
          `/api/appointments/availability?${qs.toString()}`
        )
        const json = await res.json()
        if (res.ok && !json.error) {
          const availableSlots: Slot[] = json.data.slots ?? []
          // Incluir el slot actual (aunque esté ocupado por esta misma cita)
          // si coincide con la fecha/profesional original.
          const includesCurrent =
            date === appointment.date &&
            professionalId === appointment.professional_id

          const extra: Slot[] =
            includesCurrent &&
            !availableSlots.some(
              (s) => s.start_time === appointment.start_time
            )
              ? [
                  {
                    start_time: appointment.start_time,
                    end_time: appointment.end_time,
                    professional_id: appointment.professional_id,
                  },
                ]
              : []

          const merged = [...availableSlots, ...extra].sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
          )
          setSlots(merged)
        } else {
          setSlots([])
        }
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [
    date,
    professionalId,
    duration,
    appointment.date,
    appointment.professional_id,
    appointment.start_time,
    appointment.end_time,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!startTime) {
      setError("Selecciona una hora disponible")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointment.id}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            start_time: startTime,
            professional_id:
              professionalId !== appointment.professional_id
                ? professionalId
                : undefined,
          }),
        }
      )
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo reprogramar la cita")
        return
      }
      onRescheduled()
    } catch {
      setError("Error de red al reprogramar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reprogramar cita</h2>
            <p className="text-xs text-neutral-500">
              Duración total: {duration} min · Total:{" "}
              <span className="font-semibold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                  minimumFractionDigits: 0,
                }).format(appointment.total)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
          <p className="font-semibold">Horario actual</p>
          <p>
            {appointment.date} · {formatTimeLabel(appointment.start_time)} →{" "}
            {formatTimeLabel(appointment.end_time)}
          </p>
          <p className="text-neutral-500">
            Profesional: {appointment.professional_name ?? "—"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                Nueva fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  setStartTime("")
                }}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600">
                Profesional
              </label>
              <select
                value={professionalId}
                onChange={(e) => {
                  setProfessionalId(e.target.value)
                  setStartTime("")
                }}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Nueva hora
            </label>
            {loadingSlots ? (
              <p className="mt-1 text-sm text-neutral-500">Cargando…</p>
            ) : slots.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-500">
                Sin horarios disponibles.
              </p>
            ) : (
              <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => {
                  const active = startTime === slot.start_time
                  const isCurrent =
                    slot.start_time === appointment.start_time &&
                    date === appointment.date &&
                    professionalId === appointment.professional_id
                  return (
                    <button
                      key={`${slot.start_time}-${slot.professional_id}`}
                      type="button"
                      onClick={() => setStartTime(slot.start_time)}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        active
                          ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                          : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
                      }`}
                    >
                      {formatTimeLabel(slot.start_time)}
                      {isCurrent && (
                        <span className="block text-[9px] text-neutral-500">
                          actual
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Guardando…" : "Reprogramar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
