"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import type { AdminOrderDetail } from "@/lib/supabase/adminOrders"
import type { OrderStatus } from "@/types"
import { toast } from "@/app/components/ui/motion/toast-provider"
import { AnimatedBadge } from "@/app/components/ui/motion/animated-badge"

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
  /** Nombre del cliente, para que la confirmación diga a quién se le cobra. */
  customerName?: string | null
  onSuccess: (quote: {
    paymentUrl: string
    shipping_amount_final: number
    carrier: string | null
    tracking_number: string | null
  }) => void
}

/**
 * Umbral para marcar un importe como sospechoso.
 *
 * El error realista no es equivocarse por poco: es el cero de más ($1,500 en vez
 * de $150). Por eso el aviso es un tope absoluto y no una comparación contra el
 * total del pedido — cobrar $200 de envío por un producto de $10 es normal, y
 * usar esa proporción llenaría la pantalla de alertas falsas hasta que nadie las
 * lea.
 */
const SHIPPING_AMOUNT_WARN_THRESHOLD = 1000

function ShippingQuoteForm({
  orderId,
  customerName,
  onSuccess,
}: ShippingQuoteFormProps) {
  const [amount, setAmount] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [guideNotes, setGuideNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /**
   * Importe ya validado, esperando confirmación. El cobro no se manda hasta que
   * alguien lo lea en grande: una vez enviado, el link queda pagable y no se
   * puede desactivar.
   */
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)

  function handleReview(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto de envío válido.")
      return
    }

    setPendingAmount(parsedAmount)
  }

  async function handleConfirm() {
    const parsedAmount = pendingAmount
    if (parsedAmount === null) return
    setError(null)

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
        const message = json?.error?.message ?? "Error al registrar el cobro de envío."
        setError(message)
        toast.error(message)
        return
      }

      toast.success("Cobro de envío registrado")
      onSuccess({
        paymentUrl: json.data.payment_url,
        shipping_amount_final: parsedAmount,
        carrier: carrier || null,
        tracking_number: trackingNumber || null,
      })
    } catch {
      const message = "Error de red. Intenta de nuevo."
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (pendingAmount !== null) {
    const looksHigh = pendingAmount >= SHIPPING_AMOUNT_WARN_THRESHOLD
    return (
      <div className="mt-4 rounded-xl border border-[#ececec] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9a9a9a]">
          Revisa antes de enviar
        </p>

        <p className="mt-3 text-3xl font-semibold tracking-tight text-[#1a1a1a]">
          ${pendingAmount.toFixed(2)}{" "}
          <span className="text-base font-normal text-[#6b6b6b]">MXN</span>
        </p>
        <p className="mt-1 text-sm text-[#6b6b6b]">
          Es lo que se le va a cobrar de envío
          {customerName ? ` a ${customerName}` : ""}.
        </p>

        {carrier || trackingNumber ? (
          <div className="mt-4 space-y-1 border-t border-[#ececec] pt-3 text-sm text-[#6b6b6b]">
            {carrier ? (
              <p>
                Paquetería: <strong className="text-[#1a1a1a]">{carrier}</strong>
              </p>
            ) : null}
            {trackingNumber ? (
              <p>
                Guía: <strong className="text-[#1a1a1a]">{trackingNumber}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        {looksHigh ? (
          <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 p-3 text-sm">
            <p className="font-semibold text-red-800">
              Ese monto es más alto de lo normal para un envío
            </p>
            <p className="mt-1 text-red-700">
              Revisa que no se te haya ido un cero de más. ¿Querías poner $
              {(pendingAmount / 10).toFixed(2)}?
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-[#9a9a9a]">
          En cuanto lo envíes, el link de pago queda activo y no se puede
          desactivar. Si el monto está mal, tendrás que cotizar de nuevo y
          avisarle al cliente que ignore el correo anterior.
        </p>

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333] disabled:opacity-60"
          >
            {submitting ? "Enviando cobro…" : "Sí, enviar el cobro"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingAmount(null)
              setError(null)
            }}
            disabled={submitting}
            className="rounded-lg border border-[#ececec] px-5 py-2.5 text-sm font-medium text-[#1a1a1a] transition-colors hover:bg-[#f5f5f5] disabled:opacity-60"
          >
            Corregir
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleReview} className="mt-4 space-y-4">
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
        className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-60"
      >
        Revisar cobro de envío
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
  /**
   * Formulario de corrección abierto. Con una cotización ya hecha, el caso
   * normal es no tocar nada: el formulario vive detrás de un enlace para que la
   * pantalla se lea de un vistazo en vez de pedir que la esquives.
   */
  const [showRequote, setShowRequote] = useState(false)
  const [issuingInvoice, setIssuingInvoice] = useState(false)
  const [invoiceIssued, setInvoiceIssued] = useState(false)
  const [reconciling, setReconciling] = useState(false)

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

  async function handleIssueInvoice() {
    if (!id || !order) return
    setIssuingInvoice(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/invoice-issue`, { method: "POST" })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo emitir la factura.")
        return
      }
      setInvoiceIssued(true)
      setOrder((prev) => prev ? { ...prev, invoice_status: "issued", invoice_issued_at: new Date().toISOString() } : prev)
      toast.success("Factura emitida")
    } catch {
      toast.error("Error de red al emitir la factura.")
    } finally {
      setIssuingInvoice(false)
    }
  }

  async function handleReconcilePayment() {
    if (!id || !order) return
    setReconciling(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/reconcile-payment`, {
        method: "POST",
      })
      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(
          json?.error?.message ?? "No se pudo verificar el pago en MercadoPago."
        )
        return
      }

      if (json.data.credited) {
        setOrder((prev) => (prev ? { ...prev, status: "paid" } : prev))
        toast.success(json.data.message)
      } else {
        toast.info(json.data.message)
      }
    } catch {
      toast.error("Error de red al verificar el pago.")
    } finally {
      setReconciling(false)
    }
  }

  async function saveStatus(status: ManualStatus) {
    if (!id || !order) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(json?.error?.message ?? "No se pudo actualizar el estado.")
        return
      }

      setOrder((prev) =>
        prev ? { ...prev, status } : prev
      )
      toast.success("Estado actualizado correctamente.")
    } catch {
      toast.error("Error de red al guardar.")
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
          className="mt-4 inline-block text-sm font-medium text-[#8a6d26] underline"
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
    order.delivery_type !== "pickup" ? (
      <div className="space-y-1 text-sm text-neutral-700">
        {order.delivery_type === "local_delivery" && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#a8862f]">
            Entrega a domicilio (local) · el cliente paga el envío al repartidor
          </p>
        )}
        <p>{order.shipping_address ?? "—"}</p>
        <p>
          {[order.shipping_city, order.shipping_state].filter(Boolean).join(", ") ||
            "—"}
        </p>
      </div>
    ) : (
      <p className="text-sm text-neutral-700">Retiro en local</p>
    )

  // Se puede cotizar mientras el envío no esté pagado, no solo la primera vez.
  // Antes el formulario desaparecía en cuanto se cotizaba una vez: un error de
  // dedo en el importe, la paquetería o la guía dejaba la orden atorada y solo
  // se podía arreglar tocando la base de datos a mano.
  const shippingQuotePending =
    order.status === "awaiting_shipping_payment" &&
    order.shipping_payment_status === "pending"

  const showShippingQuoteForm =
    order.delivery_type === "shipping" &&
    (order.status === "paid" || shippingQuotePending)

  // Solo tiene sentido reconciliar una orden que no se acreditó: pendiente, o
  // cancelada por el cron de limpieza aunque el cliente sí haya pagado.
  const showReconcile =
    order.status === "pending" || order.status === "cancelled"

  const showShippingInfo =
    order.delivery_type === "shipping" &&
    order.status !== "paid" &&
    order.status !== "pending" &&
    order.status !== "cancelled"

  // Prevención: mientras falte cobrar el envío (orden de envío en estado paid),
  // solo se puede "Cancelar" — se ocultan "Enviado"/"Entregado" para que no se
  // pueda marcar como despachada saltándose el cobro de envío.
  const availableStatuses: readonly ManualStatus[] = showShippingQuoteForm
    ? (["cancelled"] as const)
    : MANUAL_STATUSES
  const effectiveStatus: ManualStatus = availableStatuses.includes(selectedStatus)
    ? selectedStatus
    : availableStatuses[0]

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#8a6d26]">
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
              <p>
                <span className="text-[#6b6b6b]">WhatsApp: </span>
                {order.client_phone ? (
                  <a
                    href={`https://wa.me/52${order.client_phone.replace(/\D/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#1a1a1a] underline underline-offset-2 transition-colors hover:text-[#8a6d26]"
                  >
                    {order.client_phone}
                  </a>
                ) : (
                  "—"
                )}
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
                        className="text-[#8a6d26] underline"
                      >
                        Ver link MP
                      </a>
                    </p>
                  )}
                </div>
              )}

              {showShippingQuoteForm &&
                (() => {
                  const quoteForm = (
                    <ShippingQuoteForm
                      orderId={id}
                      customerName={clientName || null}
                      onSuccess={(quote) => {
                        setShowRequote(false)
                        setOrder((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: "awaiting_shipping_payment",
                                shipping_payment_status: "pending",
                                shipping_payment_url: quote.paymentUrl,
                                shipping_amount_final: quote.shipping_amount_final,
                                carrier: quote.carrier,
                                tracking_number: quote.tracking_number,
                              }
                            : prev
                        )
                      }}
                    />
                  )

                  // Primera cotización: no hay nada que leer todavía, así que el
                  // formulario va abierto.
                  if (!shippingQuotePending) {
                    return (
                      <>
                        <p className="mt-3 text-sm text-[#6b6b6b]">
                          Ingresa el costo del envío. Se generará un link de pago
                          de MercadoPago y se le avisará al cliente por{" "}
                          <strong>WhatsApp y correo</strong> para que lo cubra.
                        </p>
                        {quoteForm}
                      </>
                    )
                  }

                  // Ya cotizado: lo normal es no tocar nada.
                  if (!showRequote) {
                    return (
                      <button
                        type="button"
                        onClick={() => setShowRequote(true)}
                        className="mt-4 text-sm font-medium text-[#1a1a1a] underline underline-offset-4 transition-colors hover:text-[#6b6b6b]"
                      >
                        Corregir cotización
                      </button>
                    )
                  }

                  return (
                    <div className="mt-4 border-t border-[#ececec] pt-4">
                      <p className="text-sm text-[#6b6b6b]">
                        Se generará un link nuevo y se le avisará otra vez al
                        cliente. El link anterior sigue funcionando en
                        MercadoPago: si paga ese, el cobro se rechaza por no
                        cubrir el importe nuevo, así que avísale que use el
                        correo más reciente.
                      </p>
                      {quoteForm}
                      <button
                        type="button"
                        onClick={() => setShowRequote(false)}
                        className="mt-3 text-sm font-medium text-[#6b6b6b] underline underline-offset-4 transition-colors hover:text-[#1a1a1a]"
                      >
                        Cancelar
                      </button>
                    </div>
                  )
                })()}
            </section>
          )}

          {/* ── Sección facturación ── */}
          {order.requires_invoice && (
            <section className="rounded-2xl border border-[#ececec] bg-white p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
                Facturación CFDI
              </h2>

              <div className="mt-3 space-y-2 text-sm">
                <p>
                  <span className="text-[#6b6b6b]">RFC: </span>
                  <span className="font-mono font-medium">{order.rfc ?? "—"}</span>
                </p>
                <p>
                  <span className="text-[#6b6b6b]">Razón social: </span>
                  <span className="font-medium">{order.razon_social ?? "—"}</span>
                </p>
                <p>
                  <span className="text-[#6b6b6b]">Correo factura: </span>
                  <span className="font-medium">{order.invoice_email ?? order.client_email ?? "—"}</span>
                </p>
                <p>
                  <span className="text-[#6b6b6b]">Estado factura: </span>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    order.invoice_status === "issued"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                      : "border-orange-200 bg-orange-100 text-orange-800"
                  }`}>
                    {order.invoice_status === "issued" ? "Emitida" : "Pendiente"}
                  </span>
                </p>
                {order.invoice_issued_at && (
                  <p>
                    <span className="text-[#6b6b6b]">Emitida el: </span>
                    <span className="font-medium">
                      {new Date(order.invoice_issued_at).toLocaleString("es-MX", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </p>
                )}
              </div>

              {/* Documentos */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                {order.constancia_signed_url ? (
                  <a
                    href={order.constancia_signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ececec] bg-[#fafafa] px-4 py-2 text-xs font-medium text-[#1a1a1a] hover:bg-neutral-100 transition-colors"
                  >
                    📄 Ver constancia fiscal
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-lg border border-[#ececec] bg-[#fafafa] px-4 py-2 text-xs text-[#9b9b9b]">
                    ⏳ Constancia fiscal no subida
                  </span>
                )}

                {order.ticket_signed_url ? (
                  <a
                    href={order.ticket_signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ececec] bg-[#fafafa] px-4 py-2 text-xs font-medium text-[#1a1a1a] hover:bg-neutral-100 transition-colors"
                  >
                    🧾 Ver ticket de pago
                  </a>
                ) : (
                  <span className="inline-flex items-center rounded-lg border border-[#ececec] bg-[#fafafa] px-4 py-2 text-xs text-[#9b9b9b]">
                    ⏳ Ticket de pago no subido
                  </span>
                )}
              </div>

              {/* Botón emitir */}
              {order.invoice_status !== "issued" && !invoiceIssued && (
                <div className="mt-5">
                  <p className="mb-2 text-xs text-[#6b6b6b]">
                    Al emitir la factura, el cliente recibirá un correo de confirmación.
                  </p>
                  <button
                    type="button"
                    onClick={handleIssueInvoice}
                    disabled={issuingInvoice}
                    className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-60"
                  >
                    {issuingInvoice ? "Procesando…" : "Marcar factura como emitida"}
                  </button>
                </div>
              )}

              {(order.invoice_status === "issued" || invoiceIssued) && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  Factura marcada como emitida. Se notificó al cliente por correo.
                </div>
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
            {/* El envío se cobra aparte, así que `orders.total` son solo los
                productos. Mostrarlo a secas como "Total" hacía creer que el
                cliente pagaba $10 cuando en realidad va a pagar $10 + envío. */}
            <div className="border-t border-[#ececec] px-6 py-4">
              <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b6b6b]">Productos</span>
                  <span className="font-medium">
                    ${order.total.toFixed(2)} MXN
                  </span>
                </div>

                {order.shipping_amount_final != null && (
                  <div className="flex justify-between">
                    <span className="text-[#6b6b6b]">
                      Envío
                      {order.shipping_payment_status === "paid"
                        ? " (pagado)"
                        : " (por cobrar)"}
                    </span>
                    <span className="font-medium">
                      ${order.shipping_amount_final.toFixed(2)} MXN
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t border-[#ececec] pt-2 text-lg font-semibold text-[#1a1a1a]">
                  <span>Total</span>
                  <span>
                    $
                    {(
                      order.total + (order.shipping_amount_final ?? 0)
                    ).toFixed(2)}{" "}
                    MXN
                  </span>
                </div>
              </div>
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

            {showReconcile && (
              <div className="mt-4 rounded-xl border border-[#ececec] bg-neutral-100 p-4">
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  ¿El cliente dice que ya pagó?
                </p>
                <p className="mt-1 text-sm text-neutral-700">
                  Esto le pregunta a MercadoPago si hay un pago aprobado para
                  esta orden. Si lo hay, la orden pasa a pagada y se envían los
                  correos de confirmación. Si no lo hay, no cambia nada.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReconcilePayment}
                    disabled={reconciling}
                    className="rounded-lg border border-[#1a1a1a] px-4 py-2 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white disabled:opacity-60"
                  >
                    Verificar pago en MercadoPago
                  </button>
                  {reconciling && (
                    <AnimatedBadge status="loading" size="md">
                      Consultando
                    </AnimatedBadge>
                  )}
                </div>
              </div>
            )}

            {showShippingQuoteForm && (
              <p className="mt-4 border-l-2 border-amber-400 pl-3 text-sm text-[#6b6b6b]">
                Falta cobrar el envío. Cóbralo arriba, en{" "}
                <em>Guía y envío</em>, y espera a que el cliente pague. Si marcas
                la orden como <strong>Enviado</strong> antes, ya no vas a poder
                generar ese cobro.
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#6b6b6b]">
                  Cambiar estado (envío / entrega / cancelación)
                </label>
                <select
                  value={effectiveStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ManualStatus)
                  }
                  className="rounded-lg border border-[#ececec] bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a84c] transition-colors"
                >
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>
                      {manualStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => saveStatus(effectiveStatus)}
                disabled={saving}
                className="rounded-lg bg-[#1a1a1a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#333] transition-colors disabled:opacity-60"
              >
                Guardar cambio de estado
              </button>
              {saving && (
                <AnimatedBadge status="loading" size="md">
                  Guardando
                </AnimatedBadge>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
