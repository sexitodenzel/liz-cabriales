"use client"

/* =========================================
   CART MENU
   ========================================= */

import { useMemo } from "react"

type CartMenuProps = {
  isOpen: boolean
  close: () => void
  items?: CartItem[]
}

type CartItem = {
  id: string
  name: string
  price: number
  qty: number
}

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value)
}

export default function CartMenu({ isOpen, close, items }: CartMenuProps) {
  const defaultItems: CartItem[] = useMemo(
    () => [
      { id: "builder-gel", name: "Builder Gel", price: 499, qty: 1 },
      { id: "kit-pro", name: "Kit profesional", price: 1290, qty: 1 },
    ],
    [],
  )

  const resolvedItems = items ?? defaultItems

  const subtotal = useMemo(
    () => resolvedItems.reduce((acc, item) => acc + item.price * item.qty, 0),
    [resolvedItems],
  )

  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-2 pb-10">
      <div className="max-w-[520px] ml-auto pt-2">
          <div
            className={`
            flex items-baseline justify-between gap-6
            transition-all duration-500 ease-out
            ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <h3 className="text-[16px] tracking-[0.02em] text-[var(--foreground)]">Carrito</h3>
            <button
              type="button"
              onClick={close}
              className="text-[12px] tracking-[0.08em] uppercase text-gray-500 hover:text-[#C6A75E] transition-colors"
            >
              Cerrar
            </button>
          </div>

          <div
            className={`
            mt-7 transition-all duration-500 delay-150 ease-out
            ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <ul className="space-y-5">
              {resolvedItems.map((item) => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-black/5 shrink-0" />

                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] text-gray-800 truncate hover:text-[#C6A75E] transition-colors duration-200 cursor-pointer">
                      {item.name}
                    </p>
                    <p className="text-[12px] text-gray-500 mt-1">
                      {item.qty} × {formatMXN(item.price)}
                    </p>
                  </div>

                  <div className="text-[13px] text-gray-700 tabular-nums">
                    {formatMXN(item.price * item.qty)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-7 pt-6 border-t border-black/5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-gray-500">Subtotal</p>
                <p className="text-[14px] text-gray-800 tabular-nums">{formatMXN(subtotal)}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="h-11 rounded-full border border-black/10 text-[13px] tracking-[0.04em] hover:border-[#C6A75E] hover:text-[#C6A75E] transition-colors"
                >
                  Ver carrito
                </button>
                <button
                  type="button"
                  className="h-11 rounded-full bg-[var(--foreground)] text-white text-[13px] tracking-[0.04em] hover:bg-[#C6A75E] transition-colors"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

