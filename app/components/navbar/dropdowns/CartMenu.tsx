"use client"

/* =========================================
   CART MENU
   ========================================= */

import { useMemo } from "react"
import Link from "next/link"

import { useCart } from "@/app/components/cart/CartContext"

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

export default function CartMenu() {
  const { items, subtotal, updateQuantity, removeItem, isCartOpen, closeCart } =
    useCart()

  const resolvedItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.variantId,
        name: item.name,
        price: item.price,
        qty: item.quantity,
      })),
    [items],
  )

  if (!isCartOpen) {
    return null
  }

  return (
    <div
      className="fixed top-[60px] right-0 z-50 flex w-[380px] flex-col bg-white shadow-xl"
      style={{ maxHeight: "calc(100vh - 60px)" }}
    >
      {/* Header — FIJO */}
      <div className="flex flex-shrink-0 items-center justify-between border-b p-4">
        <h3 className="text-[16px] tracking-[0.02em] text-[var(--foreground)]">
          Carrito
        </h3>
        <button
          type="button"
          onClick={closeCart}
          className="text-[12px] tracking-[0.08em] uppercase text-gray-500 transition-colors hover:text-[#C6A75E]"
        >
          Cerrar
        </button>
      </div>

      {/* Items — SCROLLEABLE */}
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-5">
          {resolvedItems.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 rounded-xl border border-black/5 bg-gradient-to-br from-gray-100 to-gray-200" />

              <div className="min-w-0 flex-1">
                <p className="cursor-pointer truncate text-[14px] text-gray-800 transition-colors duration-200 hover:text-[#C6A75E]">
                  {item.name}
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {item.qty} × {formatMXN(item.price)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.qty - 1))
                    }
                    className="h-5 w-5 rounded-full border border-gray-300 text-center leading-5"
                  >
                    -
                  </button>
                  <span className="tabular-nums">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                    className="h-5 w-5 rounded-full border border-gray-300 text-center leading-5"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="ml-2 text-[11px] uppercase tracking-[0.12em] text-gray-400 hover:text-red-500"
                  >
                    Quitar
                  </button>
                </div>
              </div>

              <div className="text-[13px] tabular-nums text-gray-700">
                {formatMXN(item.price * item.qty)}
              </div>
            </li>
          ))}
          {resolvedItems.length === 0 && (
            <li className="py-6 text-center text-[13px] text-gray-500">
              Tu carrito está vacío.
            </li>
          )}
        </ul>
      </div>

      {/* Footer — FIJO */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-gray-500">Subtotal</p>
          <p className="text-[14px] text-gray-800 tabular-nums">
            {formatMXN(subtotal)}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/carrito"
            onClick={closeCart}
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 text-[13px] tracking-[0.04em] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
          >
            Ver carrito
          </Link>
          <Link
            href="/checkout"
            onClick={closeCart}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--foreground)] text-[13px] tracking-[0.04em] text-white transition-colors hover:bg-[#C6A75E]"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  )
}

