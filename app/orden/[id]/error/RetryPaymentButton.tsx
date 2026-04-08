"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  orderId: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

type PaymentData = {
  payment_url: string
  payment_id: string
}

export default function RetryPaymentButton({ orderId }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const handleRetry = async () => {
    setIsLoading(true)
    setRetryError(null)

    try {
      const response = await fetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })

      const json = (await response.json()) as ApiResponse<PaymentData>

      if (!response.ok || !json.data) {
        if (json.error?.code === "VALIDATION_ERROR") {
          // La orden ya no es elegible para pago (cancelada), redirigir al carrito
          router.push("/carrito")
          return
        }
        setRetryError(
          json.error?.message ??
            "No se pudo reintentar el pago. Intenta de nuevo."
        )
        return
      }

      // Redirigir a MercadoPago
      window.location.href = json.data.payment_url
    } catch {
      setRetryError("Error de conexión. Verifica tu internet e intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleRetry}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Procesando..." : "Reintentar pago"}
      </button>

      {retryError && (
        <p className="rounded-2xl border border-[#e7b8b8] bg-[#fff2f2] px-4 py-3 text-sm text-[#8a2f2f]">
          {retryError}
        </p>
      )}
    </div>
  )
}
