"use client"

import { useEffect, useMemo, useRef, useState, useCallback, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Clock, MapPin, Package, Store, Truck } from "lucide-react"

import Breadcrumb from "@/components/shared/Breadcrumb"
import RelatedProductsCarousel from "@/app/tienda/components/RelatedProductsCarousel"
import { getOrderRetryContext } from "@/lib/order-retry-context"

import {
  CFDI_SURCHARGE_PERCENT,
  computeInvoiceSurchargeMxn,
} from "@/lib/constants/cfdi"
import { FREE_SHIPPING_THRESHOLD_MXN } from "@/lib/constants/shipping"
import {
  LOCAL_DELIVERY_CITIES,
  LOCAL_DELIVERY_ZONES_LABEL,
  PICKUP_LOCATION_ADDRESS,
  PICKUP_LOCATION_HOURS,
  PICKUP_LOCATION_NAME,
  PICKUP_MAPS_URL,
  PICKUP_READY_NOTE,
} from "@/lib/constants/contact"
import type { CartSnapshot } from "@/lib/supabase/cart"
import type { ProductWithCategory } from "@/lib/supabase/products"
import { createOrderSchema } from "@/lib/validations/orders"
import type { DeliveryType } from "@/types"
import { useCart } from "@/app/components/cart/CartContext"
import { createClient } from "@/lib/supabase/client"
import FreeShippingBar from "@/app/components/cart/FreeShippingBar"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type OrderCreateData = { order_id: string; total: number }
type PaymentData = { payment_url: string; payment_id: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }
type Props = { initialCart: CartSnapshot; relatedProducts: ProductWithCategory[] }

const CHECKOUT_FORM_ID = "checkout-form"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

function getCheckoutErrorMessage(code?: string, fallback?: string): string {
  if (code === "CART_EMPTY") return "Tu carrito esta vacio. Agrega productos antes de continuar."
  if (code === "OUT_OF_STOCK") return "Uno o mas productos ya no tienen stock suficiente."
  if (code === "UNAUTHORIZED") return "Tu sesion ya no es valida. Inicia sesion de nuevo."
  if (code === "VALIDATION_ERROR") return "Revisa los campos marcados en rojo."
  if (code === "PAYMENT_ERROR") return "No se pudo conectar con MercadoPago. Intenta de nuevo."
  return fallback ?? "Ocurrio un error inesperado. Intenta de nuevo."
}

// ─── Datos de envío ───────────────────────────────────────────────────────────

type ShippingProps = {
  initialCart: CartSnapshot
  requiresInvoice: boolean
  invoiceSurcharge: number
  orderTotal: number
  // form state
  deliveryType: DeliveryType
  setDeliveryType: (v: DeliveryType) => void
  nombreCompleto: string; setNombreCompleto: (v: string) => void
  calleNumero: string; setCalleNumero: (v: string) => void
  colonia: string; setColonia: (v: string) => void
  cp: string; setCp: (v: string) => void
  municipio: string; setMunicipio: (v: string) => void
  ciudad: string; setCiudad: (v: string) => void
  estado: string; setEstado: (v: string) => void
  telefono: string; setTelefono: (v: string) => void
  entreCalles: string; setEntreCalles: (v: string) => void
  referencia: string; setReferencia: (v: string) => void
  setRequiresInvoice: (v: boolean) => void
  rfc: string; setRfc: (v: string) => void
  razonSocial: string; setRazonSocial: (v: string) => void
  invoiceEmail: string; setInvoiceEmail: (v: string) => void
  constanciaFile: File | null; setConstanciaFile: (v: File | null) => void
  profileHasPhone: boolean | null
  cpLookupState: "idle" | "loading" | "found" | "notfound"
  clearFieldError: (field: string) => void
  isSubmitting: boolean
  submitLabel: string
  fieldErrors: Record<string, string>
  errorMessage: string | null
  errorCode: string | null
  createdOrder: OrderCreateData | null
  paymentError: string | null
  isRetryingPayment: boolean
  autoFilled: boolean
  paymentUrl: string | null
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onRetryPayment: () => void
  onCancelPendingOrder: () => void
  errorRef: React.RefObject<HTMLDivElement | null>
}

function ShippingStep(p: ShippingProps) {
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false)
  // Returns input class — red only when field has error AND user hasn't touched it yet
  const inp = (field?: string) =>
    `w-full border px-3 py-2.5 text-[13px] text-[#1a1a1a] outline-none transition-colors placeholder:text-neutral-400 focus:border-[#c9a84c] ${
      field && p.fieldErrors[field] ? "border-red-300 bg-red-50" : "border-neutral-200 bg-white"
    }`

  // Wrap setter to clear the field error when user starts typing
  function bind(
    field: string,
    setter: (v: string) => void
  ): (v: string) => void {
    return (v) => {
      setter(v)
      if (p.fieldErrors[field]) p.clearFieldError(field)
    }
  }

  const totalItems = p.initialCart.items.reduce((s, i) => s + i.quantity, 0)
  const isPaymentStep = Boolean(p.createdOrder && (p.paymentUrl || p.paymentError))
  const previewItems = [...p.initialCart.items].reverse().slice(0, 2)
  const isLocalDelivery = p.deliveryType === "local_delivery"
  // "Local" agrupa retiro en tienda y envío a domicilio local (mismo grupo de tabs).
  const isLocalMode = p.deliveryType === "pickup" || p.deliveryType === "local_delivery"
  const shippingIsFree =
    p.deliveryType === "pickup" ||
    p.initialCart.total >= FREE_SHIPPING_THRESHOLD_MXN
  const shippingPending = p.deliveryType === "shipping" && !shippingIsFree

  const summaryHeader = (
    <div className="shrink-0 pb-3.5">
      <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">Tu pedido</p>
      <p className="mt-0.5 text-[15px] font-semibold text-[#1a1a1a]">
        {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
      </p>
    </div>
  )

  const summaryList = (
    <ul className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
      {[...p.initialCart.items].reverse().map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-3 border-b border-neutral-200 py-3 first:pt-0">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug text-[#1a1a1a]">{item.name}</p>
            {item.variantName && item.variantName !== item.name && (
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-neutral-400">
                {item.variantName}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Cantidad: {item.quantity}
            </p>
          </div>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#1a1a1a]">
            {formatMXN(item.price * item.quantity)}
          </p>
        </li>
      ))}
    </ul>
  )

  const summaryTotals = (
    <div className="shrink-0 border-t border-neutral-200 pt-4">
      {p.deliveryType === "shipping" && <FreeShippingBar amount={p.initialCart.total} />}
      {!shippingPending && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-neutral-500">Subtotal</p>
          <p className="text-[13px] font-medium tabular-nums text-[#1a1a1a]">{formatMXN(p.initialCart.total)}</p>
        </div>
      )}
      {p.requiresInvoice && p.invoiceSurcharge > 0 && (
        <div className={`flex items-center justify-between ${shippingPending ? "" : "mt-1"}`}>
          <p className="text-[12px] text-neutral-500">Cargo CFDI ({CFDI_SURCHARGE_PERCENT}%)</p>
          <p className="text-[12px] tabular-nums text-[#1a1a1a]">{formatMXN(p.invoiceSurcharge)}</p>
        </div>
      )}
      <div className={`flex items-center justify-between ${shippingPending || p.requiresInvoice ? "mt-1" : ""}`}>
        <p className="text-[12px] text-neutral-500">Envío</p>
        {p.deliveryType === "pickup" ? (
          <p className="text-[12px] font-medium text-[#1a1a1a]">Retiro en local</p>
        ) : isLocalDelivery ? (
          <p className="text-[12px] font-medium text-[#1a1a1a]">Pagas al repartidor</p>
        ) : shippingIsFree ? (
          <p className="text-[12px] font-semibold text-[#c9a84c]">Gratis</p>
        ) : (
          <p className="text-[12px] text-neutral-500">Por cotizar</p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
        <p className="text-[14px] font-semibold text-[#1a1a1a]">
          {shippingPending ? "Pagas hoy" : "Total"}
        </p>
        <p className="text-[14px] font-semibold tabular-nums text-[#c9a84c]">{formatMXN(p.orderTotal)}</p>
      </div>
      {shippingPending && (
        <p className="mt-2 text-[11px] leading-[1.5] text-neutral-500">
          El envío se cotiza y cobra por separado después de confirmar tu pago.
        </p>
      )}
      {isLocalDelivery && (
        <p className="mt-2 text-[11px] leading-[1.5] text-neutral-500">
          Te compartimos por WhatsApp el número del repartidor; el costo del envío lo
          pagas directamente a él al recibir tu pedido.
        </p>
      )}
    </div>
  )

  const mobileExpandedSummary = (
    <>
      <ul className="space-y-2">
        {[...p.initialCart.items].reverse().map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-[12px]">
            <p className="min-w-0 truncate text-[#1a1a1a]">
              {item.quantity}× {item.name}
            </p>
            <p className="shrink-0 tabular-nums text-neutral-600">
              {formatMXN(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3">
        {p.deliveryType === "shipping" && <FreeShippingBar amount={p.initialCart.total} />}
        {p.requiresInvoice && p.invoiceSurcharge > 0 && (
          <div className="flex items-center justify-between text-[12px]">
            <p className="text-neutral-500">CFDI ({CFDI_SURCHARGE_PERCENT}%)</p>
            <p className="tabular-nums text-neutral-600">{formatMXN(p.invoiceSurcharge)}</p>
          </div>
        )}
        <div className="flex items-center justify-between text-[12px]">
          <p className="text-neutral-500">Envío</p>
          {p.deliveryType === "pickup" ? (
            <p className="font-medium text-[#1a1a1a]">Retiro en local</p>
          ) : isLocalDelivery ? (
            <p className="font-medium text-[#1a1a1a]">Pagas al repartidor</p>
          ) : shippingIsFree ? (
            <p className="font-medium text-[#c9a84c]">Gratis</p>
          ) : (
            <p className="text-neutral-500">Por cotizar</p>
          )}
        </div>
        {shippingPending && (
          <p className="text-[11px] leading-[1.5] text-neutral-500">
            El envío se cotiza y cobra por separado.
          </p>
        )}
        {isLocalDelivery && (
          <p className="text-[11px] leading-[1.5] text-neutral-500">
            El repartidor cobra el envío al entregar; te pasamos su WhatsApp.
          </p>
        )}
      </div>
    </>
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">

      {/* ── Resumen — sidebar en desktop ── */}
      <aside className="hidden w-full min-w-0 shrink-0 flex-col bg-[#fafafa] p-4 lg:order-2 lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-8rem)] lg:w-[380px]">
        {summaryHeader}
        {summaryList}
        {summaryTotals}
        {!p.createdOrder && (
          <div className="mt-4 shrink-0">
            <button
              type="submit"
              form={CHECKOUT_FORM_ID}
              disabled={p.isSubmitting}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {p.isSubmitting ? p.submitLabel : "Continuar al pago"}
            </button>
          </div>
        )}
      </aside>

      {/* ── Formulario ── */}
      <section className="order-first min-w-0 lg:order-1">

        {/* Estado: pago con error */}
        {p.createdOrder && p.paymentError ? (
          <div className="py-4 lg:py-5">
            <div className="border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">Error de pago</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">No se pudo abrir MercadoPago</p>
              <p className="mt-1 text-[12px] text-neutral-500">{p.paymentError}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-neutral-400">ID de orden</p>
              <p className="mt-0.5 break-all text-[12px] font-medium text-[#1a1a1a]">{p.createdOrder.order_id}</p>
            </div>
            <div className="mt-4 flex w-full flex-col gap-2">
              <button
                type="button"
                onClick={p.onRetryPayment}
                disabled={p.isRetryingPayment}
                className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {p.isRetryingPayment ? "Procesando..." : "Reintentar pago"}
              </button>
              <button
                type="button"
                onClick={p.onCancelPendingOrder}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
              >
                Cancelar y volver
              </button>
            </div>
          </div>
        ) : p.createdOrder && p.paymentUrl ? (
          <div className="py-4 lg:py-5">
            <div className="border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-amber-700">Pago en proceso</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">
                Completa tu pago en la nueva pestaña
              </p>
              <p className="mt-1 text-[12px] text-neutral-600">
                Abrimos MercadoPago en otra pestaña. Cuando termines, cerramos la orden automáticamente.
                Si no la viste, haz click en &ldquo;Abrir pago&rdquo;.
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-neutral-400">ID de orden</p>
              <p className="mt-0.5 break-all text-[12px] font-medium text-[#1a1a1a]">{p.createdOrder.order_id}</p>
            </div>
            <div className="mt-4 flex w-full flex-col gap-2">
              <a
                href={p.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800"
              >
                Abrir pago
              </a>
              <button
                type="button"
                onClick={p.onCancelPendingOrder}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
              >
                Cancelar y editar pedido
              </button>
            </div>
          </div>
        ) : (
          <form id={CHECKOUT_FORM_ID} onSubmit={p.onSubmit}>

            {/* Tipo de entrega */}
            <div className="border-b border-neutral-200 px-0 py-4 lg:px-0">
              {/* Nivel 1 — Envío nacional o Local (Tampico / Cd. Madero / Altamira) */}
              <div
                className="flex rounded-xl bg-neutral-100 p-1"
                role="radiogroup"
                aria-label="Elige envío nacional o entrega local"
              >
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-all ${
                    p.deliveryType === "shipping"
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "bg-transparent text-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_mode"
                    value="shipping"
                    checked={p.deliveryType === "shipping"}
                    onChange={() => p.setDeliveryType("shipping")}
                    className="sr-only"
                  />
                  <Package className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>Envío nacional</span>
                </label>
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[13px] font-medium transition-all ${
                    isLocalMode
                      ? "bg-white text-[#1a1a1a] shadow-sm"
                      : "bg-transparent text-neutral-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_mode"
                    value="local"
                    checked={isLocalMode}
                    onChange={() => { if (!isLocalMode) p.setDeliveryType("pickup") }}
                    className="sr-only"
                  />
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span>Local</span>
                </label>
              </div>

              {isLocalMode && (
                <div className="mt-3">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-neutral-500">
                    Solo {LOCAL_DELIVERY_ZONES_LABEL}
                  </p>

                  {/* Nivel 2 — Recoger en tienda o Envío a domicilio local */}
                  <div
                    className="flex rounded-xl bg-neutral-100 p-1"
                    role="radiogroup"
                    aria-label="Elige recoger en tienda o envío a domicilio local"
                  >
                    <label
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-[12px] font-medium transition-all ${
                        p.deliveryType === "pickup"
                          ? "bg-white text-[#1a1a1a] shadow-sm"
                          : "bg-transparent text-neutral-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_type"
                        value="pickup"
                        checked={p.deliveryType === "pickup"}
                        onChange={() => p.setDeliveryType("pickup")}
                        className="sr-only"
                      />
                      <Store className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span>Recoger en tienda</span>
                    </label>
                    <label
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-1 py-2.5 text-[12px] font-medium transition-all ${
                        p.deliveryType === "local_delivery"
                          ? "bg-white text-[#1a1a1a] shadow-sm"
                          : "bg-transparent text-neutral-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery_type"
                        value="local_delivery"
                        checked={p.deliveryType === "local_delivery"}
                        onChange={() => p.setDeliveryType("local_delivery")}
                        className="sr-only"
                      />
                      <Truck className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span>Envío a domicilio</span>
                    </label>
                  </div>

                  {p.deliveryType === "local_delivery" && (
                    <div className="mt-3 rounded-xl border border-[#e6dcc0] bg-[#fbf7ec] p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-semibold text-[#1a1a1a]">
                          Entrega a domicilio con repartidor
                        </p>
                        <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#a8862f]">
                          Local
                        </p>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600">
                        Solo para clientes en {LOCAL_DELIVERY_ZONES_LABEL}. Hoy pagas
                        únicamente tus productos; el costo del envío lo pagas directamente
                        al repartidor al recibir tu pedido. Te compartimos su número por
                        WhatsApp.
                      </p>
                    </div>
                  )}

                  {p.deliveryType === "pickup" && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[12px] text-neutral-500">Recoge en nuestro local</p>
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-semibold text-[#1a1a1a]">{PICKUP_LOCATION_NAME}</p>
                          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#c9a84c]">
                            Gratis
                          </p>
                        </div>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-600">
                          {PICKUP_LOCATION_ADDRESS}
                        </p>
                        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-neutral-500">
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                          <span>
                            {PICKUP_READY_NOTE}
                            <span className="mt-0.5 block">{PICKUP_LOCATION_HOURS}</span>
                          </span>
                        </p>
                        <a
                          href={PICKUP_MAPS_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#1a1a1a] underline underline-offset-2 transition-colors hover:text-neutral-600"
                        >
                          <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                          Ver en mapa
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Datos para guías */}
            {p.deliveryType === "shipping" && (
              <div className="border-b border-neutral-200 px-0 py-4 lg:px-0">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Datos para emitir guías
                  </p>
                  {p.autoFilled && (
                    <p className="text-[11px] text-neutral-500 underline">Datos de tu perfil precargados</p>
                  )}
                </div>
                <div className="space-y-3">

                  <div>
                    <label htmlFor="chk-nombre" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">1. Nombre completo</label>
                    <input id="chk-nombre" type="text" value={p.nombreCompleto} onChange={(e) => bind("nombre_completo", p.setNombreCompleto)(e.target.value)} className={inp("nombre_completo")} placeholder="Nombre y apellidos" />
                    {p.fieldErrors.nombre_completo && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.nombre_completo}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-calle" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">2. Calle y número de casa</label>
                    <input id="chk-calle" type="text" value={p.calleNumero} onChange={(e) => bind("calle_numero", p.setCalleNumero)(e.target.value)} className={inp("calle_numero")} placeholder="Calle 5 de Mayo #123 Int. 4" />
                    {p.fieldErrors.calle_numero && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.calle_numero}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="chk-colonia" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">3. Colonia</label>
                      <input id="chk-colonia" type="text" value={p.colonia} onChange={(e) => bind("colonia", p.setColonia)(e.target.value)} className={inp("colonia")} placeholder="Nombre de la colonia" />
                      {p.fieldErrors.colonia && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.colonia}</p>}
                    </div>
                    <div>
                      <label htmlFor="chk-cp" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">4. C.P.</label>
                      <input
                        id="chk-cp" type="text" inputMode="numeric" maxLength={5}
                        value={p.cp}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 5)
                          bind("cp", p.setCp)(v)
                        }}
                        className={inp("cp")} placeholder="89000"
                      />
                      {p.cpLookupState === "loading" && (
                        <p className="mt-1 text-[11px] text-neutral-400">Buscando C.P.…</p>
                      )}
                      {p.cpLookupState === "found" && (
                        <p className="mt-1 text-[11px] text-neutral-500 underline">Datos autocompletados</p>
                      )}
                      {p.cpLookupState === "notfound" && (
                        <p className="mt-1 text-[11px] text-neutral-400">C.P. no encontrado — llena los campos manualmente</p>
                      )}
                      {p.fieldErrors.cp && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.cp}</p>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="chk-municipio" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">5. Municipio</label>
                      <input id="chk-municipio" type="text" value={p.municipio} onChange={(e) => bind("municipio", p.setMunicipio)(e.target.value)} className={inp("municipio")} placeholder="Municipio" />
                      {p.fieldErrors.municipio && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.municipio}</p>}
                    </div>
                    <div>
                      <label htmlFor="chk-ciudad" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">6. Ciudad</label>
                      <input id="chk-ciudad" type="text" value={p.ciudad} onChange={(e) => bind("ciudad", p.setCiudad)(e.target.value)} className={inp("ciudad")} placeholder="Ciudad" />
                      {p.fieldErrors.ciudad && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.ciudad}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chk-estado" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">7. Estado</label>
                    <input id="chk-estado" type="text" value={p.estado} onChange={(e) => bind("estado", p.setEstado)(e.target.value)} className={inp("estado")} placeholder="Tamaulipas" />
                    {p.fieldErrors.estado && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.estado}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-telefono" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">8. Teléfono</label>
                    <input
                      id="chk-telefono" type="tel" inputMode="numeric" maxLength={10}
                      value={p.telefono}
                      onChange={(e) => bind("telefono", p.setTelefono)(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={inp("telefono")} placeholder="10 dígitos"
                    />
                    {p.profileHasPhone === false && !p.telefono && (
                      <p className="mt-1 text-[11px] text-amber-600">No tienes teléfono en tu perfil — ingrésalo aquí.</p>
                    )}
                    {p.fieldErrors.telefono && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.telefono}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-entre-calles" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">
                      9. Entre qué calles se encuentra tu casa <span className="font-normal text-neutral-400">(obligatorio)</span>
                    </label>
                    <input id="chk-entre-calles" type="text" value={p.entreCalles} onChange={(e) => bind("entre_calles", p.setEntreCalles)(e.target.value)} className={inp("entre_calles")} placeholder="Entre Allende y Altamira" />
                    {p.fieldErrors.entre_calles && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.entre_calles}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-referencia" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">
                      10. Referencia del domicilio <span className="font-normal text-neutral-400">(obligatorio)</span>
                    </label>
                    <textarea
                      id="chk-referencia"
                      value={p.referencia}
                      onChange={(e) => bind("referencia", p.setReferencia)(e.target.value)}
                      rows={2}
                      className={inp("referencia")}
                      placeholder="Casa color azul con portón negro, frente a la farmacia"
                    />
                    {p.fieldErrors.referencia && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.referencia}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* Datos para entrega local */}
            {p.deliveryType === "local_delivery" && (
              <div className="border-b border-neutral-200 px-0 py-4 lg:px-0">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Datos para tu entrega local
                  </p>
                  {p.autoFilled && (
                    <p className="text-[11px] text-neutral-500 underline">Datos de tu perfil precargados</p>
                  )}
                </div>
                <div className="space-y-3">

                  <div>
                    <label htmlFor="chk-local-nombre" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">1. Nombre completo</label>
                    <input id="chk-local-nombre" type="text" value={p.nombreCompleto} onChange={(e) => bind("nombre_completo", p.setNombreCompleto)(e.target.value)} className={inp("nombre_completo")} placeholder="Nombre y apellidos" />
                    {p.fieldErrors.nombre_completo && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.nombre_completo}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-local-tel" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">2. Teléfono / WhatsApp</label>
                    <input
                      id="chk-local-tel" type="tel" inputMode="numeric" maxLength={10}
                      value={p.telefono}
                      onChange={(e) => bind("telefono", p.setTelefono)(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className={inp("telefono")} placeholder="10 dígitos"
                    />
                    {p.fieldErrors.telefono && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.telefono}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-local-calle" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">3. Calle y número de casa</label>
                    <input id="chk-local-calle" type="text" value={p.calleNumero} onChange={(e) => bind("calle_numero", p.setCalleNumero)(e.target.value)} className={inp("calle_numero")} placeholder="Calle 5 de Mayo #123 Int. 4" />
                    {p.fieldErrors.calle_numero && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.calle_numero}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="chk-local-colonia" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">4. Colonia</label>
                      <input id="chk-local-colonia" type="text" value={p.colonia} onChange={(e) => bind("colonia", p.setColonia)(e.target.value)} className={inp("colonia")} placeholder="Nombre de la colonia" />
                      {p.fieldErrors.colonia && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.colonia}</p>}
                    </div>
                    <div>
                      <label htmlFor="chk-local-ciudad" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">5. Ciudad</label>
                      <select
                        id="chk-local-ciudad"
                        value={LOCAL_DELIVERY_CITIES.includes(p.ciudad as (typeof LOCAL_DELIVERY_CITIES)[number]) ? p.ciudad : ""}
                        onChange={(e) => bind("ciudad", p.setCiudad)(e.target.value)}
                        className={inp("ciudad")}
                      >
                        <option value="" disabled>Selecciona tu ciudad</option>
                        {LOCAL_DELIVERY_CITIES.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {p.fieldErrors.ciudad && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.ciudad}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="chk-local-entre" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">
                      6. Entre qué calles <span className="font-normal text-neutral-400">(opcional)</span>
                    </label>
                    <input id="chk-local-entre" type="text" value={p.entreCalles} onChange={(e) => bind("entre_calles", p.setEntreCalles)(e.target.value)} className={inp("entre_calles")} placeholder="Entre Allende y Altamira" />
                    {p.fieldErrors.entre_calles && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.entre_calles}</p>}
                  </div>

                  <div>
                    <label htmlFor="chk-local-ref" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">
                      7. Referencia del domicilio <span className="font-normal text-neutral-400">(obligatorio)</span>
                    </label>
                    <textarea
                      id="chk-local-ref"
                      value={p.referencia}
                      onChange={(e) => bind("referencia", p.setReferencia)(e.target.value)}
                      rows={2}
                      className={inp("referencia")}
                      placeholder="Casa color azul con portón negro, frente a la farmacia"
                    />
                    {p.fieldErrors.referencia && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.referencia}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* Factura */}
            <div className="border-b border-neutral-200 px-0 py-4 lg:px-0">
              <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-neutral-500">Facturación</p>
              <label className="flex cursor-pointer items-start gap-3 border border-neutral-200 p-3.5 transition-colors has-[:checked]:border-[#c9a84c] has-[:checked]:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={p.requiresInvoice}
                  onChange={(e) => {
                    p.setRequiresInvoice(e.target.checked)
                    if (!e.target.checked) { p.setRfc(""); p.setRazonSocial(""); p.setInvoiceEmail(""); p.setConstanciaFile(null) }
                  }}
                  className="mt-0.5 h-4 w-4 accent-[#c9a84c]"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-[#1a1a1a]">Requiero factura (CFDI)</span>
                  <span className="mt-0.5 block text-[11px] text-neutral-500">Cargo adicional del {CFDI_SURCHARGE_PERCENT}% sobre el subtotal.</span>
                </span>
              </label>
              {p.requiresInvoice && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="chk-rfc" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">RFC</label>
                    <input id="chk-rfc" type="text" value={p.rfc} onChange={(e) => p.setRfc(e.target.value.slice(0, 13).toUpperCase())} maxLength={13} className={`${inp("rfc")} uppercase`} placeholder="XAXX010101000" />
                    {p.fieldErrors.rfc && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.rfc}</p>}
                  </div>
                  <div>
                    <label htmlFor="chk-razon-social" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">Razón social</label>
                    <input id="chk-razon-social" type="text" value={p.razonSocial} onChange={(e) => p.setRazonSocial(e.target.value)} className={inp("razon_social")} placeholder="Nombre o denominación fiscal" />
                    {p.fieldErrors.razon_social && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.razon_social}</p>}
                  </div>
                  <div>
                    <label htmlFor="chk-invoice-email" className="mb-1 block text-[12px] font-medium text-[#1a1a1a]">Correo para recibir la factura</label>
                    <input id="chk-invoice-email" type="email" value={p.invoiceEmail} onChange={(e) => p.setInvoiceEmail(e.target.value)} className={inp("invoice_email")} placeholder="correo@empresa.com" />
                    {p.fieldErrors.invoice_email && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.invoice_email}</p>}
                  </div>
                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">Constancia de situación fiscal <span className="text-neutral-400 font-normal">(opcional)</span></p>
                    <p className="mb-2 text-[11px] text-neutral-400">PDF, JPG o PNG · máx. 10 MB. Puedes subirla ahora o después.</p>
                    {p.constanciaFile ? (
                      <div className="flex items-center justify-between border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{p.constanciaFile.name}</p>
                        <button type="button" onClick={() => p.setConstanciaFile(null)} className="ml-2 shrink-0 text-[11px] text-neutral-400 hover:text-[#1a1a1a]">Quitar</button>
                      </div>
                    ) : (
                      <label className="flex w-full cursor-pointer items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 py-3 text-[12px] text-neutral-500 transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]">
                        Seleccionar archivo
                        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => p.setConstanciaFile(e.target.files?.[0] ?? null)} />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error general */}
            {p.errorMessage && (
              <div ref={p.errorRef} className="my-4 border border-red-100 bg-red-50 px-4 py-3">
                <p className="text-[12px] font-semibold text-[#1a1a1a]">
                  {p.errorCode === "OUT_OF_STOCK" ? "Stock insuficiente"
                    : p.errorCode === "UNAUTHORIZED" ? "Sesión expirada"
                    : p.errorCode === "CART_EMPTY" ? "Carrito vacío"
                    : p.errorCode === "VALIDATION_ERROR" ? "Faltan datos o hay errores en el formulario"
                    : "No se pudo crear la orden"}
                </p>
                {p.errorCode === "VALIDATION_ERROR" && Object.values(p.fieldErrors).length > 0 ? (
                  <ul className="mt-1.5 space-y-0.5">
                    {Object.values(p.fieldErrors).map((msg, i) => (
                      <li key={i} className="text-[11px] text-red-600">· {msg}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-0.5 text-[12px] text-neutral-500">{p.errorMessage}</p>
                )}
              </div>
            )}

          </form>
        )}
      </section>

      {/* ── Resumen comprimido — abajo en móvil ── */}
      {!isPaymentStep && (
        <div className="order-last bg-[#fafafa] p-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3"
            aria-expanded={mobileSummaryOpen}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-9 w-[52px] shrink-0">
                {previewItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="absolute top-0 h-9 w-9 overflow-hidden rounded-md border-2 border-white bg-neutral-100"
                    style={{ left: `${index * 14}px`, zIndex: previewItems.length - index }}
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-neutral-400">
                        {item.brand?.slice(0, 2) ?? "LC"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[14px] font-semibold text-[#1a1a1a]">Total</p>
                <p className="text-[12px] text-neutral-500">
                  {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                MXN
              </span>
              <span className="text-[16px] font-semibold tabular-nums text-[#1a1a1a]">
                {formatMXN(p.orderTotal)}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-neutral-400 transition-transform ${mobileSummaryOpen ? "rotate-180" : ""}`}
              />
            </div>
          </button>

          {mobileSummaryOpen && (
            <div className="mt-3 border-t border-neutral-200 pt-3">
              {mobileExpandedSummary}
            </div>
          )}

          <div className="mt-3 w-full">
            <button
              type="submit"
              form={CHECKOUT_FORM_ID}
              disabled={p.isSubmitting}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {p.isSubmitting ? p.submitLabel : "Continuar al pago"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CheckoutClient({ initialCart, relatedProducts }: Props) {
  const hasAutoFilledRef = useRef(false)
  const { itemCount, isLoading: isCartLoading } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryFromOrderId =
    searchParams.get("from") === "order" ? searchParams.get("orderId") : null
  const [storedOrderId, setStoredOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!queryFromOrderId) {
      setStoredOrderId(getOrderRetryContext())
    }
  }, [queryFromOrderId])

  const fromOrderId = queryFromOrderId ?? storedOrderId
  const breadcrumbItems = fromOrderId
    ? [
        { label: "Inicio", href: "/" },
        { label: "Mi cuenta", href: "/perfil" },
        { label: "Pedidos", href: "/perfil/pedidos" },
        { label: "Mi pedido", href: `/orden/${fromOrderId}` },
        {
          label: "Carrito",
          href: `/carrito?from=order&orderId=${fromOrderId}`,
        },
        { label: "Checkout" },
      ]
    : [
        { label: "Inicio", href: "/" },
        { label: "Carrito", href: "/carrito" },
        { label: "Checkout" },
      ]

  // Datos del formulario (persisten entre pasos)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("shipping")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [calleNumero, setCalleNumero] = useState("")
  const [colonia, setColonia] = useState("")
  const [cp, setCp] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [estado, setEstado] = useState("")
  const [telefono, setTelefono] = useState("")
  const [entreCalles, setEntreCalles] = useState("")
  const [referencia, setReferencia] = useState("")
  const [requiresInvoice, setRequiresInvoice] = useState(false)
  const [rfc, setRfc] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [invoiceEmail, setInvoiceEmail] = useState("")
  const [constanciaFile, setConstanciaFile] = useState<File | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitLabel, setSubmitLabel] = useState("Continuar al pago")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<OrderCreateData | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)
  const [profileHasPhone, setProfileHasPhone] = useState<boolean | null>(null)
  const [cpLookupState, setCpLookupState] = useState<"idle" | "loading" | "found" | "notfound">("idle")
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Si el carrito queda vacío (p. ej. el usuario borra el último producto desde
  // la bolsa), sacarlo del flujo de checkout y mandarlo al carrito vacío.
  // No redirigir mientras la bolsa está cargando ni durante el paso de pago,
  // ya que ahí el carrito se vacía al confirmar la orden.
  useEffect(() => {
    if (isCartLoading) return
    if (createdOrder) return
    if (itemCount === 0) {
      router.replace("/carrito")
    }
  }, [isCartLoading, itemCount, createdOrder, router])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  // CP auto-complete: debounce 500ms, fill ciudad/estado/municipio if empty
  useEffect(() => {
    if (cp.length !== 5) { setCpLookupState("idle"); return }
    setCpLookupState("loading")
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/postal-code?cp=${cp}`)
        const json = await res.json() as { data: { ciudad: string; estado: string; municipio: string } | null; error: string | null }
        if (!res.ok || !json.data) { setCpLookupState("notfound"); return }
        if (!ciudad) { setCiudad(json.data.ciudad); clearFieldError("ciudad") }
        if (!estado) { setEstado(json.data.estado); clearFieldError("estado") }
        if (!municipio) { setMunicipio(json.data.municipio); clearFieldError("municipio") }
        clearFieldError("cp")
        setCpLookupState("found")
      } catch { setCpLookupState("notfound") }
    }, 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cp])

  const invoiceSurcharge = useMemo(
    () => (requiresInvoice ? computeInvoiceSurchargeMxn(initialCart.total) : 0),
    [requiresInvoice, initialCart.total]
  )
  const orderTotal = useMemo(
    () => initialCart.total + invoiceSurcharge,
    [initialCart.total, invoiceSurcharge]
  )

  // Pre-fill invoiceEmail from session on mount
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setInvoiceEmail(user.email)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // MercadoPago opens in a new tab (window.open in callPaymentEndpoint), so
  // this page never gets navigated away from. No bfcache mitigation needed.

  // Auto-fill address data on mount (only once)
  useEffect(() => {
    if (hasAutoFilledRef.current) return
    hasAutoFilledRef.current = true
    handleAutoFill()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function callPaymentEndpoint(orderId: string): Promise<boolean> {
    setSubmitLabel("Abriendo MercadoPago...")
    const res = await fetch("/api/payments/mercadopago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    })
    const json = (await res.json()) as ApiResponse<PaymentData>
    if (!res.ok || !json.data) {
      setPaymentError(getCheckoutErrorMessage(json.error?.code, json.error?.message))
      return false
    }
    setPaymentUrl(json.data.payment_url)
    // Open MercadoPago in a new tab. Note: when "noopener" is used, window.open
    // returns null per the HTML spec — we can't reliably detect blocked popups
    // that way. Skip the noopener flag so we can detect the block; MP is a
    // trusted destination so tabnabbing risk is low. If the popup is blocked,
    // newTab will be null/undefined.
    const newTab = window.open(json.data.payment_url, "_blank")
    if (!newTab) {
      setPaymentError(
        "Tu navegador bloqueó la nueva ventana. Usa el botón 'Abrir pago' o permite ventanas emergentes para este sitio."
      )
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    setErrorCode(null)
    setPaymentError(null)
    setFieldErrors({})

    const payload = {
      delivery_type: deliveryType,
      nombre_completo: nombreCompleto,
      calle_numero: calleNumero,
      colonia,
      cp,
      municipio,
      ciudad,
      estado,
      telefono,
      entre_calles: entreCalles,
      referencia,
      requires_invoice: requiresInvoice,
      ...(requiresInvoice ? {
        rfc: rfc.trim(),
        razon_social: razonSocial.trim(),
        invoice_email: invoiceEmail.trim() || undefined,
      } : {}),
    }

    const parsed = createOrderSchema.safeParse(payload)
    if (!parsed.success) {
      const errs: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = String(issue.path[0] ?? "")
        if (path && !errs[path]) errs[path] = issue.message
      }
      setFieldErrors(errs)
      setErrorCode("VALIDATION_ERROR")
      setErrorMessage(getCheckoutErrorMessage("VALIDATION_ERROR"))
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>(".border-red-300")
        first?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
      return
    }

    setIsSubmitting(true)
    setSubmitLabel("Creando orden...")
    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const orderJson = (await orderRes.json()) as ApiResponse<OrderCreateData>
      if (!orderRes.ok || !orderJson.data) {
        setErrorCode(orderJson.error?.code ?? "UNKNOWN")
        setErrorMessage(getCheckoutErrorMessage(orderJson.error?.code, orderJson.error?.message))
        setTimeout(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50)
        return
      }
      setCreatedOrder(orderJson.data)

      // Guardar datos de envío en el perfil para futuros pedidos (no bloquea)
      if (deliveryType === "shipping") {
        createClient().auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          createClient().from("users").update({
            address:      calleNumero || null,
            state:        estado || null,
            city:         ciudad || null,
            colonia:      colonia || null,
            cp:           cp || null,
            municipio:    municipio || null,
            entre_calles: entreCalles || null,
            referencia:   referencia || null,
            phone:        telefono || null,
          }).eq("id", user.id).then(() => {})
        })
      } else if (deliveryType === "local_delivery" && telefono) {
        // En entrega local no guardamos la dirección como predeterminada, pero sí
        // el teléfono/WhatsApp para que el admin pueda contactar al cliente.
        createClient().auth.getUser().then(({ data: { user } }) => {
          if (!user) return
          createClient().from("users").update({ phone: telefono }).eq("id", user.id).then(() => {})
        })
      }

      // Upload constancia fiscal if provided (non-blocking — failures logged only)
      if (requiresInvoice && constanciaFile) {
        setSubmitLabel("Subiendo constancia...")
        const fd = new FormData()
        fd.append("file", constanciaFile)
        await fetch(`/api/orders/${orderJson.data.order_id}/invoice-upload`, {
          method: "POST",
          body: fd,
        }).catch((err) => console.error("[checkout] constancia upload error:", err))
      }

      // El carrito se vacía solo cuando el webhook confirma el pago aprobado
      // (clearCartForUser en el handler de MercadoPago). Si vaciamos aquí,
      // el usuario pierde su carrito al volver atrás sin haber pagado.
      await callPaymentEndpoint(orderJson.data.order_id)
    } catch {
      setErrorCode("UNKNOWN")
      setErrorMessage(getCheckoutErrorMessage())
    } finally {
      setIsSubmitting(false)
      setSubmitLabel("Continuar al pago")
    }
  }

  const handleAutoFill = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name, phone, address, state, city, colonia, cp, municipio, entre_calles, referencia")
      .eq("id", user.id)
      .single()

    if (!profile) return

    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
    if (fullName) setNombreCompleto(fullName)

    setProfileHasPhone(Boolean(profile.phone))
    if (profile.phone) {
      const digits = String(profile.phone).replace(/^\+52/, "").replace(/\D/g, "")
      setTelefono(digits)
    }
    if (profile.address)      setCalleNumero(String(profile.address))
    if (profile.state)        setEstado(String(profile.state))
    if (profile.city)         setCiudad(String(profile.city))
    if (profile.colonia)      setColonia(String(profile.colonia))
    if (profile.cp)           setCp(String(profile.cp))
    if (profile.municipio)    setMunicipio(String(profile.municipio))
    if (profile.entre_calles) setEntreCalles(String(profile.entre_calles))
    if (profile.referencia)   setReferencia(String(profile.referencia))

    setAutoFilled(true)
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

  const handleCancelPendingOrder = async () => {
    if (!createdOrder) return
    // Cancel the pending order on the server so it doesn't pile up
    try {
      await fetch(`/api/orders/${createdOrder.order_id}/cancel`, { method: "POST" })
    } catch {
      // Cancellation is best-effort. /checkout entry will catch it anyway.
    }
    setCreatedOrder(null)
    setPaymentUrl(null)
    setPaymentError(null)
  }

  const isPaymentStep = Boolean(createdOrder && (paymentUrl || paymentError))

  const shippingProps = {
    initialCart,
    requiresInvoice,
    invoiceSurcharge,
    orderTotal,
    deliveryType, setDeliveryType,
    nombreCompleto, setNombreCompleto,
    calleNumero, setCalleNumero,
    colonia, setColonia,
    cp, setCp,
    municipio, setMunicipio,
    ciudad, setCiudad,
    estado, setEstado,
    telefono, setTelefono,
    entreCalles, setEntreCalles,
    referencia, setReferencia,
    setRequiresInvoice,
    rfc, setRfc,
    razonSocial, setRazonSocial,
    invoiceEmail, setInvoiceEmail,
    constanciaFile, setConstanciaFile,
    profileHasPhone,
    cpLookupState,
    clearFieldError,
    isSubmitting, submitLabel,
    fieldErrors,
    errorMessage, errorCode,
    createdOrder,
    paymentError, isRetryingPayment,
    autoFilled,
    paymentUrl,
    onSubmit: handleSubmit,
    onRetryPayment: handleRetryPayment,
    onCancelPendingOrder: handleCancelPendingOrder,
    errorRef,
  } as const

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <h1 className="sr-only">Checkout</h1>
      <div className="site-container pt-5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="site-container pt-6">
        <nav className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
          <span
            className={`flex items-center gap-1.5 ${
              isPaymentStep ? "text-neutral-400" : "font-semibold text-[#1a1a1a]"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center text-[10px] font-bold ${
                isPaymentStep
                  ? "bg-neutral-200 text-neutral-500"
                  : "bg-black text-white"
              }`}
            >
              1
            </span>
            Datos de envío y facturación
          </span>
          <span className="text-neutral-300">›</span>
          <span
            className={`flex items-center gap-1.5 ${
              isPaymentStep ? "font-semibold text-[#1a1a1a]" : "text-neutral-400"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center text-[10px] font-bold ${
                isPaymentStep
                  ? "bg-black text-white"
                  : "bg-neutral-200 text-neutral-500"
              }`}
            >
              2
            </span>
            Pago (MercadoPago)
          </span>
        </nav>
      </div>

      <div className="site-container pb-12">
        <ShippingStep {...shippingProps} />
      </div>

      {relatedProducts.length > 0 && (
        <div className="site-container pb-16">
          <RelatedProductsCarousel products={relatedProducts} />
        </div>
      )}
    </main>
  )
}
