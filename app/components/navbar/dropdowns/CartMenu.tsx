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
        brand: item.brand,
        image: item.image,
        productSlug: item.productSlug ?? null,
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
      className="fixed right-0 top-[var(--navbar-h)] bottom-0 z-40 flex w-[380px] flex-col border-l border-black/5 bg-white shadow-xl"
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
            <li key={item.id} className="flex items-start gap-3">
              <Link
                href={
                  item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"
                }
                onClick={closeCart}
                className="flex min-w-0 flex-1 gap-3 rounded-xl transition-colors hover:bg-neutral-50"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/5 bg-gradient-to-br from-gray-100 to-gray-200">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-400">
                      {item.brand ?? "LC"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-gray-800">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[#a8862f]">
                    Ver producto
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="text-[13px] tabular-nums text-gray-700">
                  {formatMXN(item.price * item.qty)}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
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
                    className="text-[11px] uppercase tracking-[0.12em] text-gray-400 hover:text-red-500"
                  >
                    Quitar
                  </button>
                </div>
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
