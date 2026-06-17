"use client"

import { useEffect, useMemo, useRef, useState, useCallback, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import {
  CFDI_SURCHARGE_PERCENT,
  computeInvoiceSurchargeMxn,
} from "@/lib/constants/cfdi"
import type { CartSnapshot } from "@/lib/supabase/cart"
import { createOrderSchema } from "@/lib/validations/orders"
import type { DeliveryType } from "@/types"
import { useCart } from "@/app/components/cart/CartContext"
import { createClient } from "@/lib/supabase/client"
import type { CartItem } from "@/lib/cart"
import FreeShippingBar from "@/app/components/cart/FreeShippingBar"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type OrderCreateData = { order_id: string; total: number }
type PaymentData = { payment_url: string; payment_id: string }
type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }
type Props = { initialCart: CartSnapshot }

type Suggestion = {
  id: string
  name: string
  slug: string
  base_price: number
  images: string[] | null
  brand: string | null
  categories: { name: string } | null
  product_variants: { id: string; price: number; stock: number; is_active: boolean }[]
}

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

// ─── Pantalla 1: Revisión de orden ───────────────────────────────────────────

type ReviewProps = {
  initialCart: CartSnapshot
  suggestions: Suggestion[]
  addedIds: Set<string>
  onAddSuggestion: (s: Suggestion) => void
  onContinue: () => void
  onOpenCart: () => void
}

function ReviewStep({
  initialCart,
  suggestions,
  addedIds,
  onAddSuggestion,
  onContinue,
  onOpenCart,
}: ReviewProps) {
  const totalItems = initialCart.items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">

      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            Revisa tu pedido
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-[#1a1a1a]">
            {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCart}
          className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 underline underline-offset-2 transition-colors hover:text-[#1a1a1a]"
        >
          Editar bolsa
        </button>
      </div>

      {/* Items */}
      <ul>
        {[...initialCart.items].reverse().map((item) => (
          <li key={item.id} className="flex gap-3 border-b border-neutral-100 p-4">
            {/* Imagen */}
            <Link
              href={item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"}
              className="shrink-0 self-start"
            >
              <div className="h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                    {item.brand ?? "LC"}
                  </div>
                )}
              </div>
            </Link>

            {/* Info */}
            <div className="min-w-0 flex-1">
              {item.brand && (
                <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                  {item.brand}
                </p>
              )}
              <Link href={item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"}>
                <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#1a1a1a] hover:underline">
                  {item.name}
                </p>
              </Link>
              {item.variantName && item.variantName !== item.name && (
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-neutral-400">
                  {item.variantName}
                </p>
              )}
              <p className="mt-1 text-[12px] tabular-nums text-neutral-500">
                {item.quantity} × {formatMXN(item.price)}
              </p>
            </div>

            {/* Precio total */}
            <div className="shrink-0 self-start">
              <p className="text-[13px] font-semibold tabular-nums text-[#C6A75E]">
                {formatMXN(item.price * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* También te puede gustar */}
      {suggestions.length > 0 && (
        <div className="border-b border-neutral-100 p-4">
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]">
            También te puede gustar
          </p>
          <div className="cart-scroll flex gap-3 overflow-x-auto pb-2">
            {suggestions.map((s) => {
              const firstVariant = s.product_variants?.find((v) => v.is_active && v.stock > 0)
              const price = firstVariant?.price ?? s.base_price
              const category =
                s.categories && typeof s.categories === "object" && "name" in s.categories
                  ? (s.categories as { name: string }).name
                  : null
              const added = addedIds.has(s.id)

              return (
                <div key={s.id} className="flex w-36 shrink-0 flex-col">
                  <Link href={`/tienda/${s.slug}`}>
                    <div className="h-28 w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {s.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.images[0]}
                          alt={s.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                          {s.brand ?? "LC"}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="mt-2 flex flex-1 flex-col">
                    {category && (
                      <p className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
                        {category}
                      </p>
                    )}
                    <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] font-medium leading-snug text-[#1a1a1a]">
                      {s.name}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-[#C6A75E]">
                    {formatMXN(price)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddSuggestion(s)}
                    disabled={!firstVariant || added}
                    className="mt-2 w-full rounded-full border border-neutral-300 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:border-[#C6A75E] hover:bg-[#C6A75E] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {added ? "Agregado" : "Agregar"}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer: subtotal + CTA */}
      <div className="bg-[#fafafa] px-4 py-4">
        <FreeShippingBar amount={initialCart.total} />
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#1a1a1a]">Subtotal</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#C6A75E]">
            {formatMXN(initialCart.total)}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          Envío y costos calculados al finalizar compra
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800"
          >
            Continuar con la compra
          </button>
        </div>
        <div className="mt-2">
          <Link
            href="/tienda"
            className="inline-flex h-9 w-full items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
          >
            Seguir explorando
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Pantalla 2: Datos de envío ───────────────────────────────────────────────

type ShippingProps = {
  initialCart: CartSnapshot
  requiresInvoice: boolean
  invoiceSurcharge: number
  orderTotal: number
  onBack: () => void
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
  errorRef: React.RefObject<HTMLDivElement>
}

function ShippingStep(p: ShippingProps) {
  // Returns input class — red only when field has error AND user hasn't touched it yet
  const inp = (field?: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-[13px] text-[#1a1a1a] outline-none transition-colors placeholder:text-neutral-400 focus:border-[#C6A75E] ${
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

  return (
    <div className="mx-auto grid max-w-[1080px] gap-4 lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">

      {/* ── Resumen compacto — arriba en móvil, derecha en desktop ── */}
      <aside className="order-first overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:order-2 lg:sticky lg:top-24">
        <div className="border-b border-neutral-100 px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">Tu pedido</p>
          <p className="mt-0.5 text-[15px] font-semibold text-[#1a1a1a]">
            {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
          </p>
        </div>
        <ul>
          {[...p.initialCart.items].reverse().map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-[#1a1a1a]">{item.name}</p>
                {item.variantName && item.variantName !== item.name && (
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-neutral-400">
                    {item.variantName}
                  </p>
                )}
                <p className="mt-0.5 text-[12px] tabular-nums text-neutral-500">
                  {item.quantity} × {formatMXN(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#C6A75E]">
                {formatMXN(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="bg-[#fafafa] px-4 py-4">
          <FreeShippingBar amount={p.initialCart.total} />
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-neutral-500">Subtotal</p>
            <p className="text-[13px] font-medium tabular-nums text-[#1a1a1a]">{formatMXN(p.initialCart.total)}</p>
          </div>
          {p.requiresInvoice && p.invoiceSurcharge > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[12px] text-neutral-500">Cargo CFDI ({CFDI_SURCHARGE_PERCENT}%)</p>
              <p className="text-[12px] tabular-nums text-[#1a1a1a]">{formatMXN(p.invoiceSurcharge)}</p>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-[12px] text-neutral-500">Envío</p>
            {p.initialCart.total >= 2000 ? (
              <p className="text-[12px] font-semibold text-[#C6A75E]">Gratis</p>
            ) : (
              <p className="text-[12px] text-neutral-500">Se define después</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
            <p className="text-[14px] font-semibold text-[#1a1a1a]">Total</p>
            <p className="text-[14px] font-semibold tabular-nums text-[#C6A75E]">{formatMXN(p.orderTotal)}</p>
          </div>
          {p.initialCart.total < 2000 && (
            <p className="mt-2 text-[11px] leading-[1.5] text-neutral-400">
              Enviamos por Estafeta y DHL. El costo se cotiza después de confirmar.
            </p>
          )}
        </div>
      </aside>

      {/* ── Formulario ── */}
      <section className="order-last overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:order-1">

        {/* Cabecera con botón regresar */}
        <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5">
          <button
            type="button"
            onClick={p.onBack}
            className="flex items-center justify-center rounded-full p-1 text-neutral-400 transition-colors hover:text-[#1a1a1a]"
            aria-label="Regresar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">Paso 2 de 2</p>
            <p className="mt-0.5 text-[15px] font-semibold text-[#1a1a1a]">Datos de envío y pago</p>
          </div>
        </div>

        {/* Estado: pago con error */}
        {p.createdOrder && p.paymentError ? (
          <div className="p-5">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">Error de pago</p>
              <p className="mt-1 text-[13px] font-semibold text-[#1a1a1a]">No se pudo abrir MercadoPago</p>
              <p className="mt-1 text-[12px] text-neutral-500">{p.paymentError}</p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-neutral-400">ID de orden</p>
              <p className="mt-0.5 break-all text-[12px] font-medium text-[#1a1a1a]">{p.createdOrder.order_id}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={p.onRetryPayment}
                disabled={p.isRetryingPayment}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {p.isRetryingPayment ? "Procesando..." : "Reintentar pago"}
              </button>
              <button
                type="button"
                onClick={p.onCancelPendingOrder}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
              >
                Cancelar y volver
              </button>
            </div>
          </div>
        ) : p.createdOrder && p.paymentUrl ? (
          <div className="p-5">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
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
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={p.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800"
              >
                Abrir pago
              </a>
              <button
                type="button"
                onClick={p.onCancelPendingOrder}
                className="inline-flex h-9 flex-1 items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
              >
                Cancelar y editar pedido
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={p.onSubmit}>

            {/* Tipo de entrega */}
            <div className="border-b border-neutral-100 px-5 py-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                Método de entrega
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3.5 transition-colors has-[:checked]:border-[#C6A75E] has-[:checked]:bg-neutral-50">
                  <input
                    type="radio" name="delivery_type" value="shipping"
                    checked={p.deliveryType === "shipping"}
                    onChange={() => p.setDeliveryType("shipping")}
                    className="mt-0.5 h-4 w-4 accent-[#C6A75E]"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-[#1a1a1a]">Envío a domicilio</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500">Llena tus datos para la guía.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3.5 transition-colors has-[:checked]:border-[#C6A75E] has-[:checked]:bg-neutral-50">
                  <input
                    type="radio" name="delivery_type" value="pickup"
                    checked={p.deliveryType === "pickup"}
                    onChange={() => p.setDeliveryType("pickup")}
                    className="mt-0.5 h-4 w-4 accent-[#C6A75E]"
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-[#1a1a1a]">Retiro en local</span>
                    <span className="mt-0.5 block text-[11px] text-neutral-500">Sin datos de envío.</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Datos para guías */}
            {p.deliveryType === "shipping" && (
              <div className="border-b border-neutral-100 px-5 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                    Datos para emitir guías
                  </p>
                  {p.autoFilled && (
                    <p className="text-[11px] text-emerald-600">Datos de tu perfil precargados ✓</p>
                  )}
                </div>
                <div className="space-y-3">

                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">1. Nombre completo</p>
                    <input type="text" value={p.nombreCompleto} onChange={(e) => bind("nombre_completo", p.setNombreCompleto)(e.target.value)} className={inp("nombre_completo")} placeholder="Nombre y apellidos" />
                    {p.fieldErrors.nombre_completo && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.nombre_completo}</p>}
                  </div>

                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">2. Calle y número de casa</p>
                    <input type="text" value={p.calleNumero} onChange={(e) => bind("calle_numero", p.setCalleNumero)(e.target.value)} className={inp("calle_numero")} placeholder="Calle 5 de Mayo #123 Int. 4" />
                    {p.fieldErrors.calle_numero && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.calle_numero}</p>}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">3. Colonia</p>
                      <input type="text" value={p.colonia} onChange={(e) => bind("colonia", p.setColonia)(e.target.value)} className={inp("colonia")} placeholder="Nombre de la colonia" />
                      {p.fieldErrors.colonia && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.colonia}</p>}
                    </div>
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">4. C.P.</p>
                      <input
                        type="text" inputMode="numeric" maxLength={5}
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
                        <p className="mt-1 text-[11px] text-emerald-600">✓ Datos autocompletados</p>
                      )}
                      {p.cpLookupState === "notfound" && (
                        <p className="mt-1 text-[11px] text-neutral-400">C.P. no encontrado — llena los campos manualmente</p>
                      )}
                      {p.fieldErrors.cp && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.cp}</p>}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">5. Municipio</p>
                      <input type="text" value={p.municipio} onChange={(e) => bind("municipio", p.setMunicipio)(e.target.value)} className={inp("municipio")} placeholder="Municipio" />
                      {p.fieldErrors.municipio && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.municipio}</p>}
                    </div>
                    <div>
                      <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">6. Ciudad</p>
                      <input type="text" value={p.ciudad} onChange={(e) => bind("ciudad", p.setCiudad)(e.target.value)} className={inp("ciudad")} placeholder="Ciudad" />
                      {p.fieldErrors.ciudad && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.ciudad}</p>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">7. Estado</p>
                    <input type="text" value={p.estado} onChange={(e) => bind("estado", p.setEstado)(e.target.value)} className={inp("estado")} placeholder="Tamaulipas" />
                    {p.fieldErrors.estado && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.estado}</p>}
                  </div>

                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">8. Teléfono</p>
                    <input
                      type="tel" inputMode="numeric" maxLength={10}
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
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">
                      9. Entre qué calles se encuentra tu casa <span className="font-normal text-neutral-400">(obligatorio)</span>
                    </p>
                    <input type="text" value={p.entreCalles} onChange={(e) => bind("entre_calles", p.setEntreCalles)(e.target.value)} className={inp("entre_calles")} placeholder="Entre Allende y Altamira" />
                    {p.fieldErrors.entre_calles && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.entre_calles}</p>}
                  </div>

                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">
                      10. Referencia del domicilio <span className="font-normal text-neutral-400">(obligatorio)</span>
                    </p>
                    <textarea
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
            <div className="border-b border-neutral-100 px-5 py-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-neutral-500">Facturación</p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 p-3.5 transition-colors has-[:checked]:border-[#C6A75E] has-[:checked]:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={p.requiresInvoice}
                  onChange={(e) => {
                    p.setRequiresInvoice(e.target.checked)
                    if (!e.target.checked) { p.setRfc(""); p.setRazonSocial(""); p.setInvoiceEmail(""); p.setConstanciaFile(null) }
                  }}
                  className="mt-0.5 h-4 w-4 accent-[#C6A75E]"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-[#1a1a1a]">Requiero factura (CFDI)</span>
                  <span className="mt-0.5 block text-[11px] text-neutral-500">Cargo adicional del {CFDI_SURCHARGE_PERCENT}% sobre el subtotal.</span>
                </span>
              </label>
              {p.requiresInvoice && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">RFC</p>
                    <input type="text" value={p.rfc} onChange={(e) => p.setRfc(e.target.value.slice(0, 13).toUpperCase())} maxLength={13} className={`${inp("rfc")} uppercase`} placeholder="XAXX010101000" />
                    {p.fieldErrors.rfc && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.rfc}</p>}
                  </div>
                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">Razón social</p>
                    <input type="text" value={p.razonSocial} onChange={(e) => p.setRazonSocial(e.target.value)} className={inp("razon_social")} placeholder="Nombre o denominación fiscal" />
                    {p.fieldErrors.razon_social && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.razon_social}</p>}
                  </div>
                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">Correo para recibir la factura</p>
                    <input type="email" value={p.invoiceEmail} onChange={(e) => p.setInvoiceEmail(e.target.value)} className={inp("invoice_email")} placeholder="correo@empresa.com" />
                    {p.fieldErrors.invoice_email && <p className="mt-1 text-[11px] text-red-500">{p.fieldErrors.invoice_email}</p>}
                  </div>
                  <div>
                    <p className="mb-1 text-[12px] font-medium text-[#1a1a1a]">Constancia de situación fiscal <span className="text-neutral-400 font-normal">(opcional)</span></p>
                    <p className="mb-2 text-[11px] text-neutral-400">PDF, JPG o PNG · máx. 10 MB. Puedes subirla ahora o después.</p>
                    {p.constanciaFile ? (
                      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                        <p className="truncate text-[12px] font-medium text-[#1a1a1a]">{p.constanciaFile.name}</p>
                        <button type="button" onClick={() => p.setConstanciaFile(null)} className="ml-2 shrink-0 text-[11px] text-neutral-400 hover:text-[#1a1a1a]">Quitar</button>
                      </div>
                    ) : (
                      <label className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-3 text-[12px] text-neutral-500 transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]">
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
              <div ref={p.errorRef} className="mx-5 my-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
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

            {/* CTA */}
            <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row">
              <button
                type="submit"
                disabled={p.isSubmitting}
                className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {p.isSubmitting ? p.submitLabel : "Continuar al pago"}
              </button>
              <button
                type="button"
                onClick={p.onBack}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-neutral-300 text-[11px] uppercase tracking-[0.1em] text-[#1a1a1a] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
              >
                Regresar
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CheckoutClient({ initialCart }: Props) {
  const [step, setStep] = useState<"review" | "shipping">("review")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const hasFetchedRef = useRef(false)
  const { addItem, openCart } = useCart()

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
  const hasAutoFilledRef = useRef(false)

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

  // Auto-fill address data when user reaches shipping step (only once)
  useEffect(() => {
    if (step !== "shipping" || hasAutoFilledRef.current) return
    hasAutoFilledRef.current = true
    handleAutoFill()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Fetch sugerencias al montar
  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const cartSlugs = initialCart.items.map((i) => i.productSlug).filter(Boolean)
    const supabase = createClient()

    supabase
      .from("products")
      .select(
        "id, name, slug, base_price, images, brand, categories(name), product_variants(id, price, stock, is_active)"
      )
      .is("deleted_at", null)
      .eq("is_active", true)
      .limit(40)
      .then(({ data }) => {
        if (!data) return
        const filtered = (data as unknown as Suggestion[])
          .filter(
            (s) =>
              Boolean(s.images?.[0]) &&
              !cartSlugs.includes(s.slug) &&
              s.product_variants?.some((v) => v.is_active && v.stock > 0)
          )
          .slice(0, 6)
        setSuggestions(filtered)
      })
  }, [initialCart.items])

  const handleAddSuggestion = async (s: Suggestion) => {
    const firstVariant = s.product_variants?.find((v) => v.is_active && v.stock > 0)
    if (!firstVariant) return

    const cartItem: CartItem = {
      productId: s.id,
      productSlug: s.slug,
      variantId: firstVariant.id,
      quantity: 1,
      price: firstVariant.price,
      name: s.name,
      brand: s.brand,
      image: s.images?.[0] ?? null,
    }

    await addItem(cartItem)
    setAddedIds((prev) => new Set([...prev, s.id]))
  }

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

  return (
    <main className="min-h-screen bg-neutral-50 text-[#1a1a1a]">
      <div className="mx-auto max-w-[1080px] px-4 pt-6 sm:px-6">
        {/* Indicador de paso */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => step === "shipping" && setStep("review")}
            className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              step === "review" ? "font-semibold text-[#1a1a1a]" : "text-neutral-400 hover:text-[#1a1a1a]"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === "review" ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"}`}>1</span>
            Revisa tu pedido
          </button>
          <span className="text-neutral-300">›</span>
          <span className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] ${step === "shipping" ? "font-semibold text-[#1a1a1a]" : "text-neutral-400"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === "shipping" ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"}`}>2</span>
            Datos de envío
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1080px] px-4 pb-12 sm:px-6">
        {step === "review" ? (
          <ReviewStep
            initialCart={initialCart}
            suggestions={suggestions}
            addedIds={addedIds}
            onAddSuggestion={handleAddSuggestion}
            onContinue={() => setStep("shipping")}
            onOpenCart={openCart}
          />
        ) : (
          <ShippingStep
            initialCart={initialCart}
            requiresInvoice={requiresInvoice}
            invoiceSurcharge={invoiceSurcharge}
            orderTotal={orderTotal}
            onBack={() => setStep("review")}
            deliveryType={deliveryType} setDeliveryType={setDeliveryType}
            nombreCompleto={nombreCompleto} setNombreCompleto={setNombreCompleto}
            calleNumero={calleNumero} setCalleNumero={setCalleNumero}
            colonia={colonia} setColonia={setColonia}
            cp={cp} setCp={setCp}
            municipio={municipio} setMunicipio={setMunicipio}
            ciudad={ciudad} setCiudad={setCiudad}
            estado={estado} setEstado={setEstado}
            telefono={telefono} setTelefono={setTelefono}
            entreCalles={entreCalles} setEntreCalles={setEntreCalles}
            referencia={referencia} setReferencia={setReferencia}
            setRequiresInvoice={setRequiresInvoice}
            rfc={rfc} setRfc={setRfc}
            razonSocial={razonSocial} setRazonSocial={setRazonSocial}
            invoiceEmail={invoiceEmail} setInvoiceEmail={setInvoiceEmail}
            constanciaFile={constanciaFile} setConstanciaFile={setConstanciaFile}
            profileHasPhone={profileHasPhone}
            cpLookupState={cpLookupState}
            clearFieldError={clearFieldError}
            isSubmitting={isSubmitting} submitLabel={submitLabel}
            fieldErrors={fieldErrors}
            errorMessage={errorMessage} errorCode={errorCode}
            createdOrder={createdOrder}
            paymentError={paymentError} isRetryingPayment={isRetryingPayment}
            autoFilled={autoFilled}
            paymentUrl={paymentUrl}
            onSubmit={handleSubmit}
            onRetryPayment={handleRetryPayment}
            onCancelPendingOrder={handleCancelPendingOrder}
            errorRef={errorRef}
          />
        )}
      </div>
    </main>
  )
}
