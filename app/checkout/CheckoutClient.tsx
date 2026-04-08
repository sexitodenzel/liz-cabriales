"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"

import type { CartSnapshot } from "@/lib/supabase/cart"
import { createOrderSchema } from "@/lib/validations/orders"
import type { DeliveryType } from "@/types"

type OrderCreateData = {
  order_id: string
  total: number
}

type PaymentData = {
  payment_url: string
  payment_id: string
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

type Props = {
  initialCart: CartSnapshot
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getCheckoutErrorMessage(code?: string, fallback?: string): string {
  if (code === "CART_EMPTY") {
    return "Tu carrito esta vacio. Agrega productos antes de continuar."
  }
  if (code === "OUT_OF_STOCK") {
    return "Uno o mas productos ya no tienen stock suficiente. Revisa tu carrito antes de continuar."
  }
  if (code === "UNAUTHORIZED") {
    return "Tu sesion ya no es valida. Inicia sesion de nuevo para continuar."
  }
  if (code === "VALIDATION_ERROR") {
    return "Revisa tus datos de entrega antes de crear la orden."
  }
  if (code === "PAYMENT_ERROR") {
    return "No se pudo conectar con MercadoPago. Intenta de nuevo en unos momentos."
  }
  return fallback ?? "Ocurrio un error inesperado. Intenta de nuevo."
}

export default function CheckoutClient({ initialCart }: Props) {
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("shipping")
  const [shippingAddress, setShippingAddress] = useState("")
  const [shippingState, setShippingState] = useState("")
  const [shippingCity, setShippingCity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitLabel, setSubmitLabel] = useState("Continuar al pago")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<OrderCreateData | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)

  const totalItems = useMemo(
    () => initialCart.items.reduce((sum, item) => sum + item.quantity, 0),
    [initialCart.items]
  )

  async function callPaymentEndpoint(orderId: string): Promise<boolean> {
    setSubmitLabel("Redirigiendo a MercadoPago...")
    const paymentRes = await fetch("/api/payments/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    })

    const paymentJson = (await paymentRes.json()) as ApiResponse<PaymentData>

    if (!paymentRes.ok || !paymentJson.data) {
      setPaymentError(
        getCheckoutErrorMessage(
          paymentJson.error?.code,
          paymentJson.error?.message
        )
      )
      return false
    }

    window.location.href = paymentJson.data.payment_url
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setErrorCode(null)
    setPaymentError(null)

    const payload = {
      delivery_type: deliveryType,
      shipping_address: shippingAddress,
      shipping_state: shippingState,
      shipping_city: shippingCity,
    }

    const parseResult = createOrderSchema.safeParse(payload)
    if (!parseResult.success) {
      setErrorCode("VALIDATION_ERROR")
      setErrorMessage(
        getCheckoutErrorMessage(
          "VALIDATION_ERROR",
          parseResult.error.issues[0]?.message
        )
      )
      return
    }

    setIsSubmitting(true)
    setSubmitLabel("Creando orden...")

    try {
      // Paso 1: Crear la orden
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseResult.data),
      })

      const orderJson = (await orderRes.json()) as ApiResponse<OrderCreateData>

      if (!orderRes.ok || !orderJson.data) {
        setErrorCode(orderJson.error?.code ?? "UNKNOWN")
        setErrorMessage(
          getCheckoutErrorMessage(orderJson.error?.code, orderJson.error?.message)
        )
        return
      }

      setCreatedOrder(orderJson.data)

      // Paso 2: Llamar al endpoint de pago y redirigir a MercadoPago
      await callPaymentEndpoint(orderJson.data.order_id)
    } catch {
      setErrorCode("UNKNOWN")
      setErrorMessage(getCheckoutErrorMessage())
    } finally {
      setIsSubmitting(false)
      setSubmitLabel("Continuar al pago")
    }
  }

  const handleRetryPayment = async () => {
    if (!createdOrder) return
    setPaymentError(null)
    setIsRetryingPayment(true)
    try {
      await callPaymentEndpoint(createdOrder.order_id)
    } catch {
      setPaymentError(getCheckoutErrorMessage("PAYMENT_ERROR"))
    } finally {
      setIsRetryingPayment(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
            Finalizar compra
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[0.02em]">
            Finaliza tu pedido
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
            Confirma tu tipo de entrega y continua al pago con MercadoPago.
          </p>

          {createdOrder && paymentError ? (
            <div className="mt-8 rounded-[24px] border border-[#e7b8b8] bg-[#fff2f2] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a2f2f]">
                Error al procesar el pago
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0a0a0a]">
                No se pudo redirigir a MercadoPago
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                {paymentError}
              </p>
              <div className="mt-5 rounded-2xl border border-[#e7b8b8] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                  ID de orden (guardado)
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-[#0a0a0a]">
                  {createdOrder.order_id}
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={isRetryingPayment}
                  className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRetryingPayment ? "Procesando..." : "Reintentar pago"}
                </button>
                <Link
                  href="/carrito"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  Volver al carrito
                </Link>
              </div>
            </div>
          ) : createdOrder ? (
            <div className="mt-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
                Orden creada
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0a0a0a]">
                Redirigiendo a MercadoPago...
              </h2>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                Estamos enviandote al portal de pago seguro. Por favor espera.
              </p>
              <div className="mt-5 rounded-2xl border border-[#ead8a2] bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                  ID de orden
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-[#0a0a0a]">
                  {createdOrder.order_id}
                </p>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                    Metodo de entrega
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4 transition-colors has-[:checked]:border-[#C9A84C] has-[:checked]:bg-[#fff8e7]">
                    <input
                      type="radio"
                      name="delivery_type"
                      value="shipping"
                      checked={deliveryType === "shipping"}
                      onChange={() => setDeliveryType("shipping")}
                      className="mt-1 h-4 w-4 accent-[#C9A84C]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#0a0a0a]">
                        Envio a domicilio
                      </span>
                      <span className="mt-1 block text-sm text-neutral-600">
                        Ingresa tu direccion para preparar la entrega.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4 transition-colors has-[:checked]:border-[#C9A84C] has-[:checked]:bg-[#fff8e7]">
                    <input
                      type="radio"
                      name="delivery_type"
                      value="pickup"
                      checked={deliveryType === "pickup"}
                      onChange={() => setDeliveryType("pickup")}
                      className="mt-1 h-4 w-4 accent-[#C9A84C]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-[#0a0a0a]">
                        Retiro en local
                      </span>
                      <span className="mt-1 block text-sm text-neutral-600">
                        Tu orden se crea sin datos de envio.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {deliveryType === "shipping" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Datos de envio
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-neutral-700">
                        Direccion
                      </span>
                      <textarea
                        value={shippingAddress}
                        onChange={(event) => setShippingAddress(event.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none transition-colors focus:border-[#C9A84C]"
                        placeholder="Calle, numero, colonia y referencias"
                      />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Estado
                        </span>
                        <input
                          type="text"
                          value={shippingState}
                          onChange={(event) => setShippingState(event.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none transition-colors focus:border-[#C9A84C]"
                          placeholder="Tamaulipas"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-neutral-700">
                          Ciudad
                        </span>
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(event) => setShippingCity(event.target.value)}
                          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#0a0a0a] outline-none transition-colors focus:border-[#C9A84C]"
                          placeholder="Tampico"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-2xl border border-[#e7b8b8] bg-[#fff2f2] px-4 py-3 text-sm text-[#8a2f2f]">
                  <p className="font-semibold">
                    {errorCode === "OUT_OF_STOCK"
                      ? "Stock insuficiente"
                      : errorCode === "UNAUTHORIZED"
                      ? "Sesion expirada"
                      : errorCode === "CART_EMPTY"
                      ? "Carrito vacio"
                      : "No se pudo crear la orden"}
                  </p>
                  <p className="mt-1">{errorMessage}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? submitLabel : "Continuar al pago"}
                </button>
                <Link
                  href="/carrito"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#C9A84C] hover:text-[#C9A84C]"
                >
                  Volver al carrito
                </Link>
              </div>
            </form>
          )}
        </section>

        <aside className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
            Resumen
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#0a0a0a]">
            {totalItems} {totalItems === 1 ? "articulo" : "articulos"}
          </h2>

          <ul className="mt-6 space-y-4">
            {initialCart.items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0a0a0a]">
                      {item.name}
                    </p>
                    {item.variantName && item.variantName !== item.name && (
                      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-400">
                        {item.variantName}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-neutral-600">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>

                  <p className="text-sm font-semibold text-[#0a0a0a]">
                    {formatPrice(item.quantity * item.price)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span className="font-medium text-[#0a0a0a]">
                {formatPrice(initialCart.total)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>Envio</span>
              <span className="font-medium text-[#0a0a0a]">Se define despues</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-5 py-4 text-white">
            <span className="text-sm font-medium uppercase tracking-[0.18em]">
              Total
            </span>
            <span className="text-lg font-semibold">
              {formatPrice(initialCart.total)}
            </span>
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500">
            El costo de envio sigue en revision. La orden se crea con envio en
            cero por ahora. Seran contactados para coordinar el envio.
          </p>
        </aside>
      </div>
    </main>
  )
}
