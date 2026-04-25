"use client"

import { useState } from "react"

type Props = {
  appointmentId: string
}

export default function RetryAppointmentPaymentButton({
  appointmentId,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/payments/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(
          json?.error?.message ?? "No se pudo iniciar el pago"
        )
        return
      }
      if (json.data.payment_url) {
        window.location.href = json.data.payment_url
      } else {
        setError("MercadoPago no devolvió una URL de pago")
      }
    } catch {
      setError("Error de red al reintentar el pago")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Procesando…" : "Reintentar pago"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
