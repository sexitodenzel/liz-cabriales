"use client"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"

import { useCart } from "@/app/components/cart/CartContext"
import {
  cartItemThumbClassName,
  cartItemThumbImageClassName,
  cartItemThumbLinkClassName,
} from "@/app/components/cart/cart-item-styles"
import FreeShippingBar from "@/app/components/cart/FreeShippingBar"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { getOrderRetryContext } from "@/lib/order-retry-context"

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

export default function CartPage() {
  const { items, itemCount, subtotal, adjustItem, removeItem, removedCount, dismissRemovedNotification } = useCart()
  const searchParams = useSearchParams()
  const queryFromOrderId =
    searchParams.get("from") === "order" ? searchParams.get("orderId") : null
  const [storedOrderId, setStoredOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!queryFromOrderId) {
      setStoredOrderId(getOrderRetryContext())
    }
  }, [queryFromOrderId])

  const fromOrderId = queryFromOrderId ?? storedOrderId

  const breadcrumbItems = fromOrderId
    ? [
        { label: "Inicio", href: "/" },
        { label: "Mi cuenta", href: "/perfil" },
        { label: "Pedidos", href: "/perfil/pedidos" },
        { label: "Mi pedido", href: `/orden/${fromOrderId}` },
        { label: "Carrito" },
      ]
    : [{ label: "Inicio", href: "/" }, { label: "Carrito" }]

  const isEmpty = items.length === 0

  return (
    <main className="min-h-screen bg-white text-[#1a1a1a]">
      <div className="site-container pt-5">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="site-container flex flex-col gap-8 pb-16 lg:flex-row lg:items-start lg:gap-10">
        <section className="min-w-0 flex-1">
          <header className="mb-4">
            <h1 className="text-[15px] font-semibold text-[#1a1a1a]">
              Carrito ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})
            </h1>
          </header>

          {removedCount > 0 && (
            <div className="mb-4 flex items-start justify-between gap-3 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span>
                {removedCount === 1
                  ? "1 producto de tu carrito ya no está disponible y fue eliminado automáticamente."
                  : `${removedCount} productos de tu carrito ya no están disponibles y fueron eliminados automáticamente.`}
              </span>
              <button
                type="button"
                onClick={dismissRemovedNotification}
                aria-label="Cerrar aviso"
                className="shrink-0 text-amber-500 hover:text-amber-800"
              >
                ×
              </button>
            </div>
          )}

          {isEmpty ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center border border-neutral-200 bg-neutral-50">
                <ShoppingBag className="h-7 w-7 text-neutral-300" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-neutral-600">
                  Tu carrito está vacío
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Agrega productos para comenzar
                </p>
              </div>
              <Link
                href="/tienda"
                className="inline-flex h-9 items-center justify-center rounded-full bg-[#c2c2c2] px-6 text-[11px] uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:bg-neutral-400"
              >
                Seguir explorando
              </Link>
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="relative flex gap-3 py-4 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-neutral-200 after:content-[''] last:after:hidden"
                >
                  <Link
                    href={item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"}
                    className={cartItemThumbLinkClassName}
                  >
                    <div className={cartItemThumbClassName}>
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className={cartItemThumbImageClassName}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                          {item.brand ?? "LC"}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    {item.brand && (
                      <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                        {item.brand}
                      </p>
                    )}
                    <Link
                      href={item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"}
                    >
                      <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#1a1a1a] hover:underline">
                        {item.name}
                      </p>
                    </Link>
                    <p className="mt-0.5 text-[12px] tabular-nums text-neutral-500">
                      {formatMXN(item.price)} c/u
                    </p>

                    <div className="mt-3 flex items-center">
                      <div className="flex items-center rounded-full border border-neutral-300">
                        <button
                          type="button"
                          onClick={() => adjustItem(item.variantId, -1)}
                          aria-label="Disminuir cantidad"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-colors hover:bg-neutral-100"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[12px] font-medium tabular-nums text-[#1a1a1a]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustItem(item.variantId, 1)}
                          aria-label="Aumentar cantidad"
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-colors hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between self-start">
                    <p className="text-[13px] font-semibold tabular-nums text-[#c9a84c]">
                      {formatMXN(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void removeItem(item.variantId)}
                      className="text-[10px] uppercase tracking-[0.12em] text-[#1a1a1a] underline underline-offset-2 transition-colors hover:text-red-400"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!isEmpty && (
          <aside className="w-full shrink-0 bg-[#fafafa] p-4 lg:w-[380px] lg:self-start lg:sticky lg:top-24">
            <FreeShippingBar amount={subtotal} />

            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold text-[#1a1a1a]">Subtotal:</p>
              <p className="text-[14px] font-semibold tabular-nums text-[#c9a84c]">
                {formatMXN(subtotal)}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Envío y costos calculados al finalizar compra
            </p>

            <div className="mt-3 space-y-3">
              <Link
                href={
                  fromOrderId
                    ? `/checkout?from=order&orderId=${fromOrderId}`
                    : "/checkout"
                }
                className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900"
              >
                Finalizar compra
              </Link>
              <Link
                href="/tienda"
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-neutral-300 bg-white text-[11px] uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
              >
                Continuar explorando
              </Link>
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}
