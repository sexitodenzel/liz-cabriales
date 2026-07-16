"use client"

import Link from "next/link"
import { useState } from "react"

import { useCart } from "@/app/components/cart/CartContext"
import RetryPaymentButton from "@/app/orden/[id]/error/RetryPaymentButton"
import type { OrderForDisplay } from "@/lib/supabase/orders"
import type { OrderStatus } from "@/types"

import { OrderQuestionTrigger } from "./OrderQuestionModal"

const ticketActionLinkClassName =
  "cursor-pointer bg-transparent p-0 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900 underline underline-offset-[4px] transition-colors hover:text-[#c6a75e] disabled:cursor-not-allowed disabled:opacity-50"

const ticketActionLinkMutedClassName =
  "cursor-pointer text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500 underline underline-offset-[4px] transition-colors hover:text-[#c6a75e]"

function isSuccessfulOrder(status: OrderStatus): boolean {
  return (
    status === "paid" ||
    status === "awaiting_shipping_payment" ||
    status === "shipping_paid" ||
    status === "shipped" ||
    status === "delivered"
  )
}

export default function OrderActionsProminent({
  order,
}: {
  order: OrderForDisplay
}) {
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
        className="my-5 border-t border-dashed border-neutral-300"
      />
      <div className="flex flex-col items-center gap-3 text-center">
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
            {isReordering ? "Agregando…" : reorderLabel}
          </button>
        )}

        <OrderQuestionTrigger
          order={order}
          className={ticketActionLinkClassName}
          label="¿Dudas? Escríbele a Liz"
        />

        <Link href="/tienda" className={ticketActionLinkMutedClassName}>
          Seguir explorando
        </Link>
      </div>
    </>
  )
}
