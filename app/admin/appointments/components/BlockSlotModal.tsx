"use client"

import { useMemo, useState } from "react"

import type { ProfessionalRow } from "@/lib/supabase/appointments"
import {
  buildStudioTimeOptions,
  formatStudioTimeLabel,
} from "@/lib/appointments/studio-hours"
import DatePicker from "@/components/shared/DatePicker"
import { toast } from "@/app/components/ui/motion/toast-provider"

type BlockMode = "hours" | "days"

type Props = {
  professionals: ProfessionalRow[]
  defaultDate: string
  defaultProfessionalId?: string
  onClose: () => void
  onCreated: () => void
}

export default function BlockSlotModal({
  professionals,
  defaultDate,
  defaultProfessionalId,
  onClose,
  onCreated,
}: Props) {
  const timeOptions = useMemo(
    () => buildStudioTimeOptions().filter((option) => option.value !== "24:00"),
    []
  )
  const [mode, setMode] = useState<BlockMode>("hours")
  const [professionalId, setProfessionalId] = useState<string>(
    defaultProfessionalId ?? ""
  )
  const [date, setDate] = useState<string>(defaultDate)
  const [startTime, setStartTime] = useState<string>("09:00")
  const [endTime, setEndTime] = useState<string>("19:00")
  const [startDate, setStartDate] = useState<string>(defaultDate)
  const [endDate, setEndDate] = useState<string>(defaultDate)
  const [reason, setReason] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lockedProfessional = defaultProfessionalId
    ? professionals.find((p) => p.id === defaultProfessionalId)
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!professionalId) {
      setError("Selecciona un profesional")
      return
    }
    if (mode === "hours" && startTime >= endTime) {
      setError("La hora de fin debe ser posterior a la hora de inicio")
      return
    }
    if (mode === "days" && startDate > endDate) {
      setError("La fecha final debe ser posterior o igual a la inicial")
      return
    }
    setSubmitting(true)
    try {
      const body =
        mode === "hours"
          ? {
              mode: "hours" as const,
              professional_id: professionalId,
              date,
              start_time: startTime,
              end_time: endTime,
              reason: reason.trim() || null,
            }
          : {
              mode: "days" as const,
              professional_id: professionalId,
              start_date: startDate,
              end_date: endDate,
              reason: reason.trim() || null,
            }

      const res = await fetch("/api/admin/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo bloquear el horario")
        return
      }
      toast.success(
        mode === "days"
          ? `Se bloquearon ${json.data?.days_blocked ?? 0} día(s)`
          : "Horario bloqueado"
      )
      onCreated()
    } catch {
      toast.error("Error de red al bloquear horario")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold">Bloquear horario</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Profesional
            </label>
            {lockedProfessional ? (
              <p className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-[#111]">
                {lockedProfessional.name}
              </p>
            ) : (
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
              >
                <option value="">Selecciona…</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                mode === "hours"
                  ? "bg-[#111] text-white"
                  : "border border-neutral-200 text-[#111] hover:border-[#c9a84c]"
              }`}
            >
              Bloquear horas
            </button>
            <button
              type="button"
              onClick={() => setMode("days")}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                mode === "days"
                  ? "bg-[#111] text-white"
                  : "border border-neutral-200 text-[#111] hover:border-[#c9a84c]"
              }`}
            >
              Bloquear días
            </button>
          </div>

          {mode === "hours" ? (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Fecha
                </label>
                <DatePicker value={date} onChange={setDate} className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600">
                    De
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    {timeOptions.map((option) => (
                      <option key={`start-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600">
                    Hasta
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
                  >
                    {timeOptions.map((option) => (
                      <option key={`end-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  De
                </label>
                <DatePicker
                  value={startDate}
                  onChange={setStartDate}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Hasta
                </label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-600">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="Vacaciones, comida, etc."
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {mode === "hours" && (
            <p className="text-xs text-neutral-500">
              Vista previa: se bloqueará de {formatStudioTimeLabel(startTime)} a{" "}
              {formatStudioTimeLabel(endTime)}.
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
              {submitting ? "Guardando…" : "Bloquear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
