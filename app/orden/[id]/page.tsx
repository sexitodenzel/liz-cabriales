import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getOrderWithItemsForUser } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/types"

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
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
  }

  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-purple-100 text-purple-800",
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
        <div className="mx-auto max-w-[720px]">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
          >
            <ChevronLeft className="h-3 w-3" /> Volver al inicio
          </Link>
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
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
        </div>
      </main>
    )
  }

  const order = result.data
  const isSuccess = status === "success"
  const isPending = status === "pending"

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#0a0a0a]">
      <div className="mx-auto max-w-[1060px] px-6 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
        >
          <ChevronLeft className="h-3 w-3" /> Volver al inicio
        </Link>
        {/* Banner de estado */}
        {isSuccess && (
          <div className="mb-8 rounded-[24px] border border-[#b8d9b8] bg-[#f0faf0] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
              Pago confirmado
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              ¡Tu pago fue aprobado!
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Recibimos tu pago correctamente. Pronto prepararemos tu pedido y
              te contactaremos para coordinar la entrega.
            </p>
          </div>
        )}

        {isPending && (
          <div className="mb-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
              Pago en proceso
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[#0a0a0a]">
              Tu pago está siendo procesado
            </h1>
            <p className="mt-2 text-sm text-neutral-700">
              Estamos esperando la confirmación de tu pago. En cuanto se
              complete, actualizaremos el estado de tu orden.
            </p>
          </div>
        )}

        {!isSuccess && !isPending && (
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b8b65]">
              Detalle de orden
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Mi orden</h1>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Lista de productos */}
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

          {/* Resumen lateral */}
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
            </dl>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0a0a0a] px-5 py-4 text-white">
              <span className="text-sm font-medium uppercase tracking-[0.18em]">
                Total
              </span>
              <span className="text-lg font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-full bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#b8962f]"
              >
                Seguir comprando
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
