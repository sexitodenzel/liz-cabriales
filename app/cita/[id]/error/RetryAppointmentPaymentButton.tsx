"use client"

import { useState } from "react"

type Props = {
  appointmentId: string
  label?: string
}

export default function RetryAppointmentPaymentButton({
  appointmentId,
  label = "Reintentar pago",
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    setBlockedUrl(null)
    try {
      const res = await fetch("/api/payments/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo iniciar el pago")
        return
      }
      const url = json.data?.payment_url as string | undefined
      if (!url) {
        setError("MercadoPago no devolvió una URL de pago")
        return
      }
      const newTab = window.open(url, "_blank")
      if (!newTab) {
        setBlockedUrl(url)
        setError("Tu navegador bloqueó la nueva ventana. Abre el enlace de abajo.")
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
        className="inline-flex items-center justify-center rounded-full bg-[#c6a75e] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Procesando…" : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
      {blockedUrl && (
        <a
          href={blockedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-[#c6a75e] underline"
        >
          Abrir pago manualmente
        </a>
      )}
    </div>
  )
}
