"use client"

import { useState } from "react"

type Props = {
  registrationId: string
  fullPrice: number
  minDeposit: number
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function RetryCoursePaymentButton({
  registrationId,
  fullPrice,
  minDeposit,
}: Props) {
  const canDeposit = minDeposit > 0 && minDeposit < fullPrice
  const [mode, setMode] = useState<"deposit" | "full">(
    canDeposit ? "deposit" : "full"
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amount = mode === "full" ? fullPrice : minDeposit

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/payments/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          amount,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "No se pudo iniciar el pago")
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
    <div className="space-y-3">
      {canDeposit && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
              mode === "deposit"
                ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                : "border-neutral-200 bg-white"
            }`}
          >
            Apartado {formatPrice(minDeposit)}
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
              mode === "full"
                ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                : "border-neutral-200 bg-white"
            }`}
          >
            Pago completo {formatPrice(fullPrice)}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Procesando…" : `Reintentar pago ${formatPrice(amount)}`}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
