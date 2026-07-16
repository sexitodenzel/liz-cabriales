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
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)

  const amount = mode === "full" ? fullPrice : minDeposit

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    setBlockedUrl(null)
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
    <div className="space-y-3">
      {canDeposit && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("deposit")}
            className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
              mode === "deposit"
                ? "border-[#c6a75e] bg-[#fdf8ea] font-semibold"
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
                ? "border-[#c6a75e] bg-[#fdf8ea] font-semibold"
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
        className="inline-flex items-center justify-center rounded-full bg-[#c6a75e] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Procesando…" : `Reintentar pago ${formatPrice(amount)}`}
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
