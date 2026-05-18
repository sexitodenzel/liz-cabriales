"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import type { AdminOrderDetail } from "@/lib/supabase/adminOrders"
import type { OrderStatus } from "@/types"

const BRAND_GOLD = "#C9A84C"

const MANUAL_STATUSES = ["shipped", "delivered", "cancelled"] as const
type ManualStatus = (typeof MANUAL_STATUSES)[number]

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-neutral-200 text-neutral-800 border-neutral-300"
    case "paid":
      return "bg-blue-100 text-blue-900 border-blue-200"
    case "awaiting_shipping_payment":
      return "bg-orange-100 text-orange-900 border-orange-200"
    case "shipping_paid":
      return "bg-violet-100 text-violet-900 border-violet-200"
    case "shipped":
      return "bg-amber-100 text-amber-900 border-amber-200"
    case "delivered":
      return "bg-emerald-100 text-emerald-900 border-emerald-200"
    case "cancelled":
      return "bg-red-100 text-red-900 border-red-200"
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200"
  }
}

function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: "Pendiente",
    paid: "Pagado",
    awaiting_shipping_payment: "Esperando pago de envío",
    shipping_paid: "Envío pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }
  return map[status] ?? status
}

function manualStatusLabel(status: ManualStatus): string {
  const map: Record<ManualStatus, string> = {
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }
  return map[status]
}

function shippingPaymentStatusLabel(s: string): string {
  const map: Record<string, string> = {
    not_required: "No requerido",
    pending: "Pendiente de pago",
    paid: "Pagado",
    waived: "Condonado",
  }
  return map[s] ?? s
}

// ─── Sección de guía y envío ──────────────────────────────────────────────────

type ShippingQuoteFormProps = {
  orderId: string
  onSuccess: (paymentUrl: string) => void
}

function ShippingQuoteForm({ orderId, onSuccess }: ShippingQuoteFormProps) {
  const [amount, setAmount] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [guideNotes, setGuideNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto de envío válido.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping-quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_amount_final: parsedAmount,
          ...(carrier ? { carrier } : {}),
          ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
          ...(guideNotes ? { guide_notes: guideNotes } : {}),
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json?.error?.message ?? "Error al registrar el cobro de envío.")
        return
      }

      onSuccess(json.data.payment_url)
    } catch {
      setError("Error de red. Intenta de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#6b6b6b]">
            Monto de envío (MXN) *
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="ej. 150.00"
            className="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[#6b6b6b]">
            Paquetería
          </span>
          <input
            type="text"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="ej. Estafeta, DHL, Redpack"
            className="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[#6b6b6b]">
          Número de guía / tracking
        </span>
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Número de rastreo (opcional si aún no tienes)"
          className="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-[#6b6b6b]">
          Notas internas
        </span>
        <textarea
          rows={2}
          value={guideNotes}
          onChange={(e) => setGuideNotes(e.target.value)}
          placeholder="Notas sobre la guía (opcional)"
          className="w-full rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
        />
      </label>

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors disabled:opacity-60"
      >
        {submitting ? "Enviando cobro…" : "Enviar cobro de envío al cliente"}
      </button>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<AdminOrderDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<ManualStatus>("shipped")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/orders/${id}`, {
          headers: { "Content-Type": "application/json" },
        })

        if (res.status === 401 || res.status === 403) {
          router.replace("/login")
          return
        }

        const json = await res.json()

        if (!res.ok || json.error) {
          if (!cancelled) {
            setError(json?.error?.message ?? "No se pudo cargar la orden.")
          }
          return
        }

        const o = json.data.order as AdminOrderDetail
        if (!cancelled) {
          setOrder(o)
          if (
            o.status === "shipped" ||
            o.status === "delivered" ||
            o.status === "cancelled"
          ) {
            setSelectedStatus(o.status)
          } else {
            setSelectedStatus("shipped")
          }
        }
      } catch {
        if (!cancelled) {
          setError("Error de red al cargar la orden.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id, router])

  async function saveStatus() {
    if (!id || !order) return
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        setToast(json?.error?.message ?? "No se pudo actualizar el estado.")
        return
      }

      setOrder((prev) =>
        prev ? { ...prev, status: selectedStatus } : prev
      )
      setToast("Estado actualizado correctamente.")
    } catch {
      setToast("Error de red al guardar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm tracking-wide text-[#6b6b6b]">
          Cargando orden…
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white px-6 py-10">
        <p className="text-red-700">{error ?? "Orden no encontrada."}</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-block text-sm font-medium text-[#c9a84c] underline"
        >
          Volver a órdenes
        </Link>
      </div>
    )
  }

  const clientName = [order.client_first_name, order.client_last_name]
    .filter(Boolean)
    .join(" ")
    .trim()

  const shippingBlock =
    order.delivery_type === "shipping" ? (
      <div className="space-y-1 text-sm text-neutral-700">
        <p>{order.shipping_address ?? "—"}</p>
        <p>
          {[order.shipping_city, order.shipping_state].filter(Boolean).join(", ") ||
            "—"}
        </p>
      </div>
    ) : (
      <p className="text-sm text-neutral-700">Retiro en local</p>
    )

  const showShippingQuoteForm =
    order.delivery_type === "shipping" && order.status === "paid"

  const showShippingInfo =
    order.delivery_type === "shipping" &&
    order.status !== "paid" &&
    order.status !== "pending" &&
    order.status !== "cancelled"

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#c9a84c]">
            PANEL ADMINISTRADOR
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">
              Orden <span className="font-mono text-lg">{order.id.slice(0, 8)}</span>
            </h1>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-[#6b6b6b] hover:text-[#1a1a1a] transition-colors"
            >
              ← Volver al listado
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-[#ececec] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
              Cliente
            </h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-[#6b6b6b]">Nombre: </span>
                {clientName || "—"}
              </p>
              <p>
                <span className="text-[#6b6b6b]">Correo: </span>
                {order.client_email ?? "—"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ececec] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
              Entrega
            </h2>
            <div className="mt-3">{shippingBlock}</div>
          </section>

          {/* ── Sección guía y envío ── */}
          {(showShippingQuoteForm || showShippingInfo) && (
            <section className="rounded-2xl border border-[#ececec] bg-white p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                Guía y envío
              </h2>

              {showShippingInfo && (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="text-[#6b6b6b]">Estado de pago: </span>
                    <span className="font-medium">
                      {shippingPaymentStatusLabel(order.shipping_payment_status)}
                    </span>
                  </p>
                  {order.shipping_amount_final != null && (
                    <p>
                      <span className="text-[#6b6b6b]">Costo de envío: </span>
                      <span className="font-semibold">
                        ${order.shipping_amount_final.toFixed(2)} MXN
                      </span>
                    </p>
                  )}
                  {order.carrier && (
                    <p>
                      <span className="text-[#6b6b6b]">Paquetería: </span>
                      {order.carrier}
                    </p>
                  )}
                  {order.tracking_number && (
                    <p>
                      <span className="text-[#6b6b6b]">Número de guía: </span>
                      <span className="font-mono">{order.tracking_number}</span>
                    </p>
                  )}
                  {order.guide_notes && (
                    <p>
                      <span className="text-[#6b6b6b]">Notas: </span>
                      {order.guide_notes}
                    </p>
                  )}
                  {order.shipping_payment_url && order.shipping_payment_status === "pending" && (
                    <p>
                      <span className="text-[#6b6b6b]">Link de pago: </span>
                      <a
                        href={order.shipping_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#c9a84c] underline"
                      >
                        Ver link MP
                      </a>
                    </p>
                  )}
                </div>
              )}

              {showShippingQuoteForm && (
                <>
                  <p className="mt-3 text-sm text-neutral-600">
                    Ingresa el costo real del envío. Se creará una preferencia de MercadoPago
                    y se notificará al cliente por WhatsApp.
                  </p>
                  {quoteSuccess ? (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                      <p className="font-semibold text-emerald-800">
                        Cobro de envío enviado correctamente.
                      </p>
                      <p className="mt-1 text-emerald-700 break-all">
                        Link de pago:{" "}
                        <a
                          href={quoteSuccess}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {quoteSuccess}
                        </a>
                      </p>
                    </div>
                  ) : (
                    <ShippingQuoteForm
                      orderId={id}
                      onSuccess={(url) => {
                        setQuoteSuccess(url)
                        setOrder((prev) =>
                          prev
                            ? { ...prev, status: "awaiting_shipping_payment" }
                            : prev
                        )
                      }}
                    />
                  )}
                </>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-[#ececec] bg-white overflow-hidden">
            <header className="border-b border-[#ececec] px-6 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                Productos
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#fafafa] text-xs uppercase tracking-wide text-[#6b6b6b]">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Producto</th>
                    <th className="px-4 py-3 text-left font-semibold">Variante</th>
                    <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                    <th className="px-4 py-3 text-right font-semibold">Precio u.</th>
                    <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececec]">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.product_name}-${idx}`}>
                      <td className="px-6 py-3 text-[#1a1a1a]">{item.product_name}</td>
                      <td className="px-4 py-3 text-[#3a3a3a]">
                        {item.variant_name}
                      </td>
                      <td className="px-4 py-3 text-right text-[#3a3a3a]">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-[#3a3a3a]">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[#1a1a1a]">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[#ececec] px-6 py-4 text-right">
              <p className="text-lg font-semibold text-[#1a1a1a]">
                Total: ${order.total.toFixed(2)} MXN
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[#ececec] bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
              Estado de la orden
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(order.status)}`}
              >
                {statusLabel(order.status)}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#6b6b6b]">
                  Cambiar estado (envío / entrega / cancelación)
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ManualStatus)
                  }
                  className="rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
                >
                  {MANUAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {manualStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={saveStatus}
                disabled={saving}
                className="rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a8893a] transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar cambio de estado"}
              </button>
            </div>
            {toast && (
              <p
                className={`mt-4 text-sm ${
                  toast.includes("correctamente")
                    ? "text-emerald-700"
                    : "text-red-700"
                }`}
              >
                {toast}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
