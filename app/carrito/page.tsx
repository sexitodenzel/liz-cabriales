"use client"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { useCart } from "@/app/components/cart/CartContext"

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const FREE_SHIPPING_THRESHOLD = 999
const SHIPPING_COST = 150

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart()

  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  )
  const hasFreeShipping = remainingForFreeShipping === 0
  const shippingPrice = hasFreeShipping ? 0 : SHIPPING_COST
  const total = subtotal + shippingPrice

  const progress =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 100
      : Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  const isEmpty = items.length === 0

  return (
    <main className="min-h-screen bg-white text-[#0a0a0a]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-10 lg:flex-row">
        {/* Columna izquierda */}
        <section className="flex-1 space-y-6">
          <Link
            href="/tienda"
            className="mb-4 inline-flex items-center gap-2 text-xs text-neutral-500 transition-colors hover:text-black"
          >
            <ChevronLeft className="h-3 w-3" /> Seguir comprando
          </Link>
          <header className="space-y-2">
            <h1 className="text-xl font-semibold tracking-[0.12em] text-[#0a0a0a]">
              CARRITO{" "}
              <span className="text-sm text-neutral-500">
                ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})
              </span>
            </h1>
          </header>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-neutral-700">
                Envío gratis a partir de {formatPrice(FREE_SHIPPING_THRESHOLD)}
              </span>
              <span className="text-neutral-500">
                {hasFreeShipping
                  ? "¡Ya tienes envío gratis!"
                  : `Agrega ${formatPrice(remainingForFreeShipping)} más`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[#C9A84C]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isEmpty ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
              <p className="text-sm font-medium text-[#0a0a0a]">
                Tu carrito está vacío.
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Descubre los productos profesionales de Liz Cabriales.
              </p>
              <Link
                href="/tienda"
                className="mt-4 rounded-full bg-[#0a0a0a] px-6 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
              >
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                        {item.brand ?? "LC"}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                          {item.brand ?? "Sin marca"}
                        </p>
                        <p className="text-sm font-medium text-[#0a0a0a]">
                          {item.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeItem(item.variantId)}
                        className="text-xs text-neutral-400 hover:text-red-500"
                        aria-label="Quitar del carrito"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <button
                          type="button"
                          onClick={() =>
                            void updateQuantity(
                              item.variantId,
                              Math.max(1, item.quantity - 1)
                            )
                          }
                          className="h-7 w-7 rounded-full border border-neutral-300 text-center leading-7"
                        >
                          -
                        </button>
                        <span className="w-6 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void updateQuantity(
                              item.variantId,
                              item.quantity + 1
                            )
                          }
                          className="h-7 w-7 rounded-full border border-neutral-300 text-center leading-7"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-[#0a0a0a]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Columna derecha */}
        <aside className="w-full space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 lg:w-[360px] lg:self-start lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold tracking-[0.16em] text-neutral-600">
            RESUMEN DEL PEDIDO
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span className="font-medium text-[#0a0a0a]">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Envío</span>
              <span className="font-medium text-[#0a0a0a]">
                {hasFreeShipping
                  ? "Gratis"
                  : `${formatPrice(SHIPPING_COST)} MXN`}
              </span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-neutral-200 pt-3 text-sm font-semibold text-[#0a0a0a]">
            <span>Total</span>
            <span className="text-lg">{formatPrice(total)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
          >
            PROCEDER AL PAGO
          </Link>

          <div className="space-y-1 text-xs text-neutral-500">
            <p>
              O{" "}
              <Link
                href="/tienda"
                className="font-medium text-[#0a0a0a] underline-offset-2 hover:underline"
              >
                continúa comprando
              </Link>
              .
            </p>
            <p className="text-[11px] text-neutral-500">
              Pago 100% seguro con los principales proveedores.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}

