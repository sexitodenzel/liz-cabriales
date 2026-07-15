"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useCart } from "@/app/components/cart/CartContext"
import { setOrderRetryContext } from "@/lib/order-retry-context"
import type { OrderForDisplay } from "@/lib/supabase/orders"

type Props = {
  orderId: string
  order?: OrderForDisplay
  className?: string
  buttonClassName?: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

type PaymentData = {
  payment_url: string
  payment_id: string
}

export default function RetryPaymentButton({
  orderId,
  order,
  className,
  buttonClassName,
}: Props) {
  const router = useRouter()
  const { clearCart, addItem } = useCart()
  const [isLoading, setIsLoading] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null)

  async function repopulateCartFromOrder(source: OrderForDisplay) {
    await clearCart()
    for (const item of source.items) {
      const name =
        item.variant_name && item.variant_name !== item.product_name
          ? `${item.product_name} - ${item.variant_name}`
          : item.product_name

      await addItem({
        productId: item.product_id,
        productSlug: item.product_slug,
        variantId: item.variant_id,
        quantity: item.quantity,
        price: item.unit_price,
        name,
        brand: item.product_brand,
        image: item.product_image,
      })
    }
  }

  const handleRetry = async () => {
    setIsLoading(true)
    setRetryError(null)
    setBlockedUrl(null)

    try {
      const response = await fetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })

      const json = (await response.json()) as ApiResponse<PaymentData>

      if (!response.ok || !json.data) {
        if (json.error?.code === "VALIDATION_ERROR") {
          if (order) {
            try {
              await repopulateCartFromOrder(order)
            } catch {
              setRetryError(
                "No pudimos copiar los productos a la bolsa. Intenta agregarlos manualmente."
              )
              return
            }
            setOrderRetryContext(order.id)
            router.push(`/carrito?from=order&orderId=${order.id}`)
            return
          }
          router.push("/carrito")
          return
        }
        setRetryError(
          json.error?.message ??
            "No se pudo reintentar el pago. Intenta de nuevo."
        )
        return
      }

      const newTab = window.open(json.data.payment_url, "_blank")
      if (!newTab) {
        setBlockedUrl(json.data.payment_url)
        setRetryError("Tu navegador bloqueó la nueva ventana. Abre el enlace de abajo.")
      }
    } catch {
      setRetryError("Error de conexión. Verifica tu internet e intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleRetry}
        disabled={isLoading}
        className={
          buttonClassName ??
          "inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {isLoading ? "Procesando..." : "Reintentar pago"}
      </button>

      {retryError && (
        <p className="rounded border border-[#e7b8b8] bg-[#fff2f2] px-3 py-2 text-xs text-[#8a2f2f]">
          {retryError}
        </p>
      )}

      {blockedUrl && (
        <a
          href={blockedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#C9A84C] underline"
        >
          Abrir pago manualmente
        </a>
      )}
    </div>
  )
}
