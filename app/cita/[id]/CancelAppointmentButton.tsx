"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  appointmentId: string
  date: string
  startTime: string
}

export default function CancelAppointmentButton({
  appointmentId,
  date,
  startTime,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCancel = (() => {
    const [y, m, d] = date.split("-").map(Number)
    const [hh, mi] = startTime.slice(0, 5).split(":").map(Number)
    const apptDate = new Date(y, m - 1, d, hh, mi, 0)
    return apptDate.getTime() - Date.now() >= 24 * 60 * 60 * 1000
  })()

  const handleCancel = async () => {
    if (!canCancel) {
      setError(
        "Las cancelaciones requieren al menos 24 horas de anticipación."
      )
      return
    }
    const confirmed = window.confirm(
      "¿Seguro que deseas cancelar tu cita? No habrá reembolso."
    )
    if (!confirmed) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(
          json?.error?.message ?? "No se pudo cancelar la cita"
        )
        return
      }
      router.refresh()
    } catch {
      setError("Error de red al cancelar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading || !canCancel}
        className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Cancelando…" : "Cancelar cita"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      {!canCancel && (
        <p className="mt-2 text-xs text-neutral-500">
          No se puede cancelar con menos de 24 horas de anticipación.
        </p>
      )}
    </div>
  )
}
