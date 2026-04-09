"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import type { AdminOrderSummary } from "@/lib/supabase/adminOrders"
import type { OrderStatus } from "@/types"

const BRAND_GOLD = "#C9A84C"

const STATUS_FILTER_OPTIONS: {
  value: "all" | OrderStatus
  label: string
}[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
]

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

function deliveryLabel(type: string): string {
  return type === "shipping" ? "Envío" : "Retiro en local"
}

function AdminOrdersList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<AdminOrderSummary[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = 25
  const statusParam = (searchParams.get("status") ?? "all") as
    | "all"
    | OrderStatus

  const statusFilter = STATUS_FILTER_OPTIONS.some((o) => o.value === statusParam)
    ? statusParam
    : "all"

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
      })
      const res = await fetch(`/api/admin/orders?${qs.toString()}`, {
        headers: { "Content-Type": "application/json" },
      })

      if (res.status === 401 || res.status === 403) {
        router.replace("/login")
        return
      }

      const json = await res.json()

      if (!res.ok || json.error) {
        setError(
          json?.error?.message ?? "No se pudieron cargar las órdenes."
        )
        return
      }

      setOrders(json.data.orders ?? [])
      setTotal(json.data.total ?? 0)
    } catch {
      setError("Error de red al cargar las órdenes.")
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, router])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1
  const rangeEnd = Math.min(page * limit, total)

  const paginationLabel = useMemo(() => {
    if (total === 0) return "0 de 0 órdenes"
    return `${rangeStart}–${rangeEnd} de ${total} órdenes`
  }, [total, rangeStart, rangeEnd])

  function setStatus(next: "all" | OrderStatus) {
    const qs = new URLSearchParams(searchParams.toString())
    qs.set("status", next)
    qs.set("page", "1")
    router.push(`/admin/orders?${qs.toString()}`)
  }

  function goPrev() {
    if (page <= 1) return
    const qs = new URLSearchParams(searchParams.toString())
    qs.set("page", String(page - 1))
    router.push(`/admin/orders?${qs.toString()}`)
  }

  function goNext() {
    if (page >= totalPages) return
    const qs = new URLSearchParams(searchParams.toString())
    qs.set("page", String(page + 1))
    router.push(`/admin/orders?${qs.toString()}`)
  }

  if (loading && orders.length === 0 && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <p className="text-sm tracking-wide text-neutral-200">
          Cargando órdenes…
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-semibold tracking-[0.25em]"
              style={{ color: BRAND_GOLD }}
            >
              PANEL ADMINISTRADOR
            </p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              Órdenes
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-neutral-600">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatus(e.target.value as "all" | OrderStatus)
              }
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Link
              href="/admin"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← Volver al panel
            </Link>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50/80 text-xs uppercase tracking-[0.16em] text-neutral-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Entrega</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-neutral-500"
                    >
                      No hay órdenes con estos criterios.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        router.push(`/admin/orders/${order.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          router.push(`/admin/orders/${order.id}`)
                        }
                      }}
                      className="cursor-pointer hover:bg-neutral-50/80"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-neutral-800">
                        {order.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-4 text-neutral-800">
                        {order.client_email ?? "—"}
                      </td>
                      <td className="px-4 py-4 font-medium">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeClass(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-neutral-700">
                        {deliveryLabel(order.delivery_type)}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {new Date(order.created_at).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600">{paginationLabel}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm text-neutral-500">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                onClick={goNext}
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <p className="text-sm tracking-wide text-neutral-200">
            Cargando órdenes…
          </p>
        </div>
      }
    >
      <AdminOrdersList />
    </Suspense>
  )
}
