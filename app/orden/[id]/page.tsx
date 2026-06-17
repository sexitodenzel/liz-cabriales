import Link from "next/link"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getOrderWithItemsForUser } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/types"
import Breadcrumb from "@/components/shared/Breadcrumb"
import TicketUpload from "./TicketUpload"
import RetryPaymentButton from "./error/RetryPaymentButton"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function OrderStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    awaiting_shipping_payment: "Pendiente pago de envío",
    shipping_paid: "Envío pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }

  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    awaiting_shipping_payment: "bg-orange-100 text-orange-800",
    shipping_paid: "bg-violet-100 text-violet-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  }

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        colors[status] ?? "bg-neutral-100 text-neutral-800"
      }`}
    >
      {labels[status] ?? status}
    </span>
  )
}

export default async function OrdenPage({ params, searchParams }: Props) {
  const { id } = await params
  const { status } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const result = await getOrderWithItemsForUser(id, user.id)

  if (!result.data) {
    return (
      <main className="min-h-screen bg-[#f8f6f1] px-6 py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Mi orden
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Orden no encontrada</h1>
          <p className="mt-3 text-sm text-neutral-600">
            No pudimos encontrar esta orden o no tienes acceso a ella.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const order = result.data

  // ── Banners de regreso desde MercadoPago ─────────────────────────────────────
  const isProductsSuccess = status === "success"
  const isProductsPending = status === "pending"
  const isProductsFailure = status === "failure"
  const isShippingSuccess = status === "shipping_success"
  const isShippingPending = status === "shipping_pending"
  const isShippingFailure = status === "shipping_failure"

  const awaitingShipping = order.status === "awaiting_shipping_payment"

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[1060px] px-6 py-10">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Tienda", href: "/tienda" },
            { label: "Mi pedido" },
          ]}
        />

        {/* ── Banners de estado ──────────────────────────────────────────────── */}
        {isProductsSuccess && (
          <div className="mb-8 rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
              Pago confirmado
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              ¡Tu pago fue aprobado!
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Recibimos tu pago. Pronto cotizamos el envío y te mandamos el link
              para cubrirlo, o puedes recoger en tienda.
            </p>
          </div>
        )}

        {isProductsPending && (
          <div className="mb-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
              Pago en proceso
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              Tu pago está siendo procesado
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Esperando confirmación. Cuando se apruebe actualizamos tu orden
              automáticamente.
            </p>
          </div>
        )}

        {isProductsFailure && (
          <div className="mb-8 rounded-[24px] border border-[#f5c6c6] bg-[#fff5f5] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b91c1c]">
              Pago no completado
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              Tu pago no fue procesado
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Puedes intentarlo de nuevo. Si el problema persiste, escríbenos
              por WhatsApp.
            </p>
          </div>
        )}

        {isShippingSuccess && (
          <div className="mb-8 rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
              Envío pagado
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              ¡Pago de envío confirmado!
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Ya recibimos tu pago de envío. Estamos preparando tu paquete y en
              cuanto salga te avisamos con el número de guía.
            </p>
          </div>
        )}

        {isShippingPending && (
          <div className="mb-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
              Pago de envío en proceso
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              Procesando tu pago de envío
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              En cuanto se confirme, actualizamos tu orden.
            </p>
          </div>
        )}

        {isShippingFailure && (
          <div className="mb-8 rounded-[24px] border border-[#f5c6c6] bg-[#fff5f5] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#b91c1c]">
              Pago no completado
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              No pudimos procesar el pago del envío
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Puedes intentarlo de nuevo con el botón de abajo. Si el problema
              persiste, escríbenos por WhatsApp.
            </p>
          </div>
        )}

        {!isProductsSuccess && !isProductsPending && !isProductsFailure && !isShippingSuccess &&
         !isShippingPending && !isShippingFailure && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
              Detalle de orden
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Mi pedido</h1>
          </div>
        )}

        {/* ── Botón de reintentar pago si MercadoPago regresó con falla ──────── */}
        {order.status === "pending" && isProductsFailure && (
          <div className="mb-6 flex justify-center">
            <RetryPaymentButton orderId={order.id} />
          </div>
        )}

        {/* ── Banner de acción requerida: pagar envío ────────────────────────── */}
        {awaitingShipping && !isShippingSuccess && !isShippingPending && (
          <div className="mb-6 rounded-[24px] border border-orange-200 bg-orange-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
              Acción requerida
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#0a0a0a]">
              Falta pagar el envío para liberar tu pedido
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              Calculamos el costo de envío de tu pedido. Cúbrelo con MercadoPago
              y salimos a dártelo.
            </p>
            {order.shipping_amount_final != null && (
              <p className="mt-3 text-2xl font-bold text-[#0a0a0a]">
                {formatPrice(order.shipping_amount_final)}{" "}
                <span className="text-sm font-normal text-neutral-500">
                  {order.carrier ? `· ${order.carrier}` : ""}
                </span>
              </p>
            )}
            {order.shipping_payment_url && (
              <a
                href={order.shipping_payment_url}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f]"
              >
                Pagar envío con MercadoPago
              </a>
            )}
          </div>
        )}

        {/* ── Sección de factura ──────────────────────────────────────────────── */}
        {order.requires_invoice && (
          <div className="mb-6">
            {order.invoice_status === "issued" ? (
              <div className="rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
                  Factura emitida
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Tu factura CFDI fue procesada.
                  {order.invoice_issued_at && (
                    <> Emitida el {new Date(order.invoice_issued_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}.</>
                  )}
                </p>
              </div>
            ) : order.ticket_photo_url ? (
              <div className="rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
                  Factura en proceso
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  Recibimos tu comprobante de pago. Estamos procesando tu factura CFDI.
                </p>
              </div>
            ) : (
              <TicketUpload orderId={order.id} />
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Lista de productos ─────────────────────────────────────────────── */}
          <section className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
              Productos
            </p>
            <ul className="mt-5 space-y-4">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-[#fcfbf8] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a0a]">
                        {item.product_name}
                      </p>
                      {item.variant_name &&
                        item.variant_name !== item.product_name && (
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-400">
                            {item.variant_name}
                          </p>
                        )}
                      <p className="mt-2 text-sm text-neutral-600">
                        {item.quantity} x {formatPrice(item.unit_price)}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-[#0a0a0a]">
                      {formatPrice(item.quantity * item.unit_price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Resumen lateral ────────────────────────────────────────────────── */}
          <aside className="rounded-[28px] border border-[#e8e1d3] bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9b8b65]">
              Resumen
            </p>

            <dl className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-2 text-sm">
                <dt className="text-neutral-600">ID de orden</dt>
                <dd className="max-w-[140px] break-all text-right text-xs font-medium text-[#0a0a0a]">
                  {order.id}
                </dd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <dt className="text-neutral-600">Estado</dt>
                <dd>
                  <OrderStatusBadge status={order.status as OrderStatus} />
                </dd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <dt className="text-neutral-600">Entrega</dt>
                <dd className="font-medium text-[#0a0a0a]">
                  {order.delivery_type === "shipping"
                    ? "Envío a domicilio"
                    : "Retiro en local"}
                </dd>
              </div>

              {order.delivery_type === "shipping" && order.shipping_address && (
                <div className="border-t border-neutral-100 pt-3">
                  <dt className="mb-1 text-sm font-medium text-[#0a0a0a]">
                    Dirección de envío
                  </dt>
                  <dd className="text-sm text-neutral-600">
                    {order.shipping_address}
                  </dd>
                  {order.shipping_city && order.shipping_state && (
                    <dd className="text-sm text-neutral-600">
                      {order.shipping_city}, {order.shipping_state}
                    </dd>
                  )}
                </div>
              )}

              {/* Paquetería y guía cuando están disponibles */}
              {(order.carrier || order.tracking_number) && (
                <div className="border-t border-neutral-100 pt-3 space-y-1">
                  {order.carrier && (
                    <div className="flex items-center justify-between text-sm">
                      <dt className="text-neutral-600">Paquetería</dt>
                      <dd className="font-medium text-[#0a0a0a]">{order.carrier}</dd>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="flex items-center justify-between text-sm">
                      <dt className="text-neutral-600">Guía</dt>
                      <dd className="font-mono text-xs font-semibold text-[#0a0a0a]">
                        {order.tracking_number}
                      </dd>
                    </div>
                  )}
                </div>
              )}
            </dl>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-5 py-4 text-white">
              <span className="text-sm font-medium uppercase tracking-[0.18em]">
                Total
              </span>
              <span className="text-lg font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>

            {/* Botón de pago de envío en sidebar (si aplica) */}
            {awaitingShipping && order.shipping_payment_url && !isShippingSuccess && (
              <a
                href={order.shipping_payment_url}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Pagar envío
                {order.shipping_amount_final != null
                  ? ` — ${formatPrice(order.shipping_amount_final)}`
                  : ""}
              </a>
            )}

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f]"
              >
                Seguir explorando
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
