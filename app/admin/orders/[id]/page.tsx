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
            setError(
              json?.error?.message ?? "No se pudo cargar la orden."
            )
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
        setToast(
          json?.error?.message ?? "No se pudo actualizar el estado."
        )
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-sm tracking-wide text-neutral-200">
          Cargando orden…
        </p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-100 px-6 py-10">
        <p className="text-red-700">{error ?? "Orden no encontrada."}</p>
        <Link
          href="/admin/orders"
          className="mt-4 inline-block text-sm font-medium text-neutral-700 underline"
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

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <p
            className="text-xs font-semibold tracking-[0.25em]"
            style={{ color: BRAND_GOLD }}
          >
            PANEL ADMINISTRADOR
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">
              Orden <span className="font-mono text-lg">{order.id.slice(0, 8)}</span>
            </h1>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← Volver al listado
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Cliente
            </h2>
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="text-neutral-500">Nombre: </span>
                {clientName || "—"}
              </p>
              <p>
                <span className="text-neutral-500">Correo: </span>
                {order.client_email ?? "—"}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Entrega
            </h2>
            <div className="mt-3">{shippingBlock}</div>
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden">
            <header className="border-b border-neutral-100 px-6 py-4">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Productos
              </h2>
            </header>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50/80 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Producto</th>
                    <th className="px-4 py-3 text-left font-semibold">Variante</th>
                    <th className="px-4 py-3 text-right font-semibold">Cant.</th>
                    <th className="px-4 py-3 text-right font-semibold">Precio u.</th>
                    <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items.map((item, idx) => (
                    <tr key={`${item.product_name}-${idx}`}>
                      <td className="px-6 py-3">{item.product_name}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {item.variant_name}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        ${item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-neutral-100 px-6 py-4 text-right">
              <p className="text-lg font-semibold">
                Total: ${order.total.toFixed(2)} MXN
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
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
                <label className="block text-xs font-medium text-neutral-600">
                  Cambiar estado (envío / entrega / cancelación)
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as ManualStatus)
                  }
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
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
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900 disabled:opacity-60"
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
