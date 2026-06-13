"use client"

/* =========================================
   CART MENU
   ========================================= */

import { useMemo } from "react"
import Link from "next/link"
import { X, ShoppingBag } from "lucide-react"

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

  const isEmpty = resolvedItems.length === 0

  return (
    <div
      style={{ top: "calc(var(--navbar-actual-h) - 1px)" }}
      className={`fixed right-0 bottom-0 z-[73] flex w-2/3 flex-col border-l border-white/10 bg-[#0a0a0a] shadow-xl transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] md:w-[380px] ${
        isCartOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
    >
      {/* Header — FIJO */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 p-4">
        <button
          type="button"
          onClick={closeCart}
          aria-label="Cerrar carrito"
          className="flex items-center justify-center rounded-full p-1 text-neutral-500 transition-colors hover:text-[#C6A75E]"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="text-[16px] tracking-[0.02em] text-neutral-100">
          Carrito
        </h3>
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
                className="flex min-w-0 flex-1 gap-3 rounded-xl transition-colors hover:bg-white/5"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-800">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-500">
                      {item.brand ?? "LC"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-neutral-200">
                    {item.name}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[#C6A75E]">
                    Ver producto
                  </p>
                </div>
              </Link>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="text-[13px] tabular-nums text-neutral-200">
                  {formatMXN(item.price * item.qty)}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.id, Math.max(1, item.qty - 1))
                    }
                    className="h-5 w-5 rounded-full border border-white/20 text-center leading-5 transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
                  >
                    -
                  </button>
                  <span className="tabular-nums">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.qty + 1)}
                    className="h-5 w-5 rounded-full border border-white/20 text-center leading-5 transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 transition-colors hover:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
          {isEmpty && (
            <li className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <ShoppingBag className="h-7 w-7 text-neutral-600" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-neutral-400">Tu carrito está vacío</p>
                <p className="mt-1 text-[12px] text-neutral-600">Agrega productos para comenzar</p>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Footer — FIJO */}
      <div className="flex-shrink-0 border-t border-white/10 p-4">
        {!isEmpty && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-neutral-400">Subtotal</p>
            <p className="text-[14px] text-neutral-100 tabular-nums">
              {formatMXN(subtotal)}
            </p>
          </div>
        )}

        <div className={`${isEmpty ? "mt-0" : "mt-6"} grid gap-3 ${isEmpty ? "grid-cols-1" : "grid-cols-2"}`}>
          {isEmpty ? (
            <Link
              href="/tienda"
              onClick={closeCart}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#C6A75E] text-[13px] tracking-[0.04em] text-white transition-colors hover:bg-[#b8963f]"
            >
              Seguir comprando
            </Link>
          ) : (
            <>
              <Link
                href="/carrito"
                onClick={closeCart}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 text-[13px] tracking-[0.04em] text-neutral-300 transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"
              >
                Ver carrito
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#C6A75E] text-[13px] tracking-[0.04em] text-white transition-colors hover:bg-[#b8963f]"
              >
                Checkout
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
