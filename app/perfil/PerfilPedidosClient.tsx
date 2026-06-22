"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { useCart } from "@/app/components/cart/CartContext"
import DigitalTicket from "@/app/components/orders/DigitalTicket"
import type { OrderForDisplay } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/types"
import { formatMoney, orderStatusBadgeClassName, orderStatusClass, orderStatusLabel } from "./account-utils"
import TicketUpload from "../orden/[id]/TicketUpload"
import RetryPaymentButton from "../orden/[id]/error/RetryPaymentButton"

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  )
}

function isSuccessfulOrder(status: OrderStatus): boolean {
  return (
    status === "paid" ||
    status === "awaiting_shipping_payment" ||
    status === "shipping_paid" ||
    status === "shipped" ||
    status === "delivered"
  )
}

const ticketActionLinkClassName =
  "cursor-pointer bg-transparent p-0 text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-900 underline underline-offset-[3px] transition-colors hover:text-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-50"

const ticketActionLinkMutedClassName =
  "cursor-pointer text-[10px] font-normal uppercase tracking-[0.14em] text-neutral-500 underline underline-offset-[3px] transition-colors hover:text-[#C9A84C]"

function TicketOrderActions({ order }: { order: OrderForDisplay }) {
  const { addItem, openCart } = useCart()
  const [isReordering, setIsReordering] = useState(false)

  const canRetry = order.status === "pending" || order.status === "cancelled"
  const canReorder = isSuccessfulOrder(order.status as OrderStatus)
  const reorderLabel =
    order.items.length === 1
      ? "Volver a comprar el mismo producto"
      : "Volver a comprar estos productos"

  async function handleReorder() {
    if (isReordering) return
    setIsReordering(true)
    try {
      for (const item of order.items) {
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
      openCart()
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="my-3 border-t border-dashed border-neutral-300"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <Link href={`/orden/${order.id}`} className={ticketActionLinkClassName}>
          Ver ticket completo
        </Link>
        {canRetry && (
          <RetryPaymentButton
            orderId={order.id}
            order={order}
            className="items-center text-center"
            buttonClassName={ticketActionLinkClassName}
          />
        )}
        {canReorder && (
          <button
            type="button"
            onClick={() => void handleReorder()}
            disabled={isReordering}
            className={ticketActionLinkClassName}
          >
            {isReordering ? "Agregando..." : reorderLabel}
          </button>
        )}
        <Link href="/tienda" className={ticketActionLinkMutedClassName}>
          Seguir explorando
        </Link>
      </div>
    </>
  )
}

const PANEL_DURATION_MS = 300
const PANEL_EASING = "ease-[cubic-bezier(.16,1,.3,1)]"

function AnimatedOrderDetail({
  isOpen,
  order,
}: {
  isOpen: boolean
  order: OrderForDisplay
}) {
  const [mounted, setMounted] = useState(isOpen)
  const [visible, setVisible] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)
    const timer = window.setTimeout(() => setMounted(false), PANEL_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  if (!mounted) return null

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ${PANEL_EASING} ${
        visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="min-h-0 overflow-hidden">
        <div
          className={`transition-all duration-300 ${PANEL_EASING} ${
            visible
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0"
          }`}
        >
          <OrderDetail order={order} />
        </div>
      </div>
    </div>
  )
}

function OrderDetail({ order }: { order: OrderForDisplay }) {
  const awaitingShipping = order.status === "awaiting_shipping_payment"

  return (
    <div className="mt-2 mb-4 p-4 sm:p-6">
      {/* Banner de accion requerida: pagar envio */}
      {awaitingShipping && (
        <div className="mb-5 rounded-lg border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">
            Accion requerida
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#0a0a0a]">
            Falta pagar el envio para liberar tu pedido
          </h3>
          {order.shipping_amount_final != null && (
            <p className="mt-2 text-xl font-bold text-[#0a0a0a]">
              {formatMoney(order.shipping_amount_final)}{" "}
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
              Pagar envio con MercadoPago
            </a>
          )}
        </div>
      )}

      {/* Seccion de factura */}
      {order.requires_invoice && (
        <div className="mb-5">
          {order.invoice_status === "issued" ? (
            <div className="rounded-lg border border-[#b8d9b8] bg-[#f0faf0] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2d7a2d]">
                Factura emitida
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Tu factura CFDI fue procesada.
                {order.invoice_issued_at && (
                  <>
                    {" "}
                    Emitida el{" "}
                    {new Date(order.invoice_issued_at).toLocaleDateString(
                      "es-MX",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                    .
                  </>
                )}
              </p>
            </div>
          ) : order.ticket_photo_url ? (
            <div className="rounded-lg border border-[#d9c58a] bg-[#fff8e7] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
                Factura en proceso
              </p>
              <p className="mt-1 text-sm text-neutral-700">
                Recibimos tu comprobante de pago. Estamos procesando tu factura
                CFDI.
              </p>
            </div>
          ) : (
            <TicketUpload orderId={order.id} />
          )}
        </div>
      )}

      {/* Ticket digital */}
      <DigitalTicket
        order={order}
        size="small"
        footer={<TicketOrderActions order={order} />}
      />
    </div>
  )
}

export default function PerfilPedidosClient({
  orders,
}: {
  orders: OrderForDisplay[]
}) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul className="divide-y divide-neutral-300">
      {orders.map((order) => {
        const open = openId === order.id
        return (
          <li key={order.id} className="first:pt-0">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : order.id)}
              aria-expanded={open}
              className="flex w-full flex-wrap items-center justify-between gap-3 py-4 text-left"
            >
              <div>
                <p className="text-sm text-neutral-600">
                  {new Date(order.created_at).toLocaleString("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-900">
                  {formatMoney(order.total)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`${orderStatusBadgeClassName} ${orderStatusClass(
                    order.status as OrderStatus
                  )}`}
                >
                  {orderStatusLabel(order.status as OrderStatus)}
                </span>
                <ChevronIcon open={open} />
              </div>
            </button>

            <AnimatedOrderDetail isOpen={open} order={order} />
          </li>
        )
      })}
    </ul>
  )
}
