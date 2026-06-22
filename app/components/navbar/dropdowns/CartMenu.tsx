"use client"

/* =========================================
   CART MENU
   ========================================= */

import { useState, useEffect, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react"

import { useCart } from "@/app/components/cart/CartContext"
import {
  cartItemThumbClassName,
  cartItemThumbImageClassName,
  cartItemThumbLinkClassName,
} from "@/app/components/cart/cart-item-styles"
import { createClient } from "@/lib/supabase/client"
import { CartItem } from "@/lib/cart"
import FreeShippingBar from "@/app/components/cart/FreeShippingBar"

function formatMXN(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value)
}

type Suggestion = {
  id: string
  name: string
  slug: string
  base_price: number
  images: string[] | null
  brand: string | null
  categories: { name: string } | null
  product_variants: { id: string; price: number; stock: number; is_active: boolean }[]
}

type SuggestionCardProps = {
  suggestion: Suggestion
  category: string | null
  priceLabel: string
  canAdd: boolean
  onAdd: () => Promise<void>
  onOpen: () => void
}

function SuggestionCard({
  suggestion,
  category,
  priceLabel,
  canAdd,
  onAdd,
  onOpen,
}: SuggestionCardProps) {
  const images = suggestion.images ?? []
  const hasMultiple = images.length > 1
  const [imgIndex, setImgIndex] = useState(0)
  const [leavingImage, setLeavingImage] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next")
  const currentImage = images[imgIndex] ?? null
  const slideDurationMs = 240

  useEffect(() => {
    if (!leavingImage) return
    const timeoutId = window.setTimeout(() => setLeavingImage(null), slideDurationMs)
    return () => window.clearTimeout(timeoutId)
  }, [leavingImage, slideDurationMs])

  const goPrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasMultiple) return
    if (currentImage) setLeavingImage(currentImage)
    setSlideDirection("prev")
    setImgIndex((i) => (i - 1 + images.length) % images.length)
  }

  const goNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!hasMultiple) return
    if (currentImage) setLeavingImage(currentImage)
    setSlideDirection("next")
    setImgIndex((i) => (i + 1) % images.length)
  }

  return (
    <div className="w-36 shrink-0 flex flex-col">
      <div className="relative">
        <Link href={`/tienda/${suggestion.slug}`} onClick={onOpen}>
          <div className="relative h-28 w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
            {currentImage ? (
              <>
                {leavingImage ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      animation: `${slideDirection === "next" ? "cartSuggestionSlideOutLeft" : "cartSuggestionSlideOutRight"} ${slideDurationMs}ms ease`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={leavingImage}
                      alt={suggestion.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div
                  className="absolute inset-0"
                  style={
                    leavingImage
                      ? {
                          animation: `${slideDirection === "next" ? "cartSuggestionSlideInRight" : "cartSuggestionSlideInLeft"} ${slideDurationMs}ms ease`,
                        }
                      : undefined
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt={suggestion.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                {suggestion.brand ?? "LC"}
              </div>
            )}
          </div>
        </Link>

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Imagen anterior"
              onClick={goPrev}
              className="absolute left-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-black/75 transition-colors hover:text-black"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Imagen siguiente"
              onClick={goNext}
              className="absolute right-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-black/75 transition-colors hover:text-black"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-2 flex flex-1 flex-col">
        {category ? (
          <p className="text-[9px] uppercase tracking-[0.12em] text-neutral-500">
            {category}
          </p>
        ) : null}
        <p className="mt-0.5 line-clamp-2 flex-1 text-[11px] font-medium leading-snug text-[#1a1a1a]">
          {suggestion.name}
        </p>
      </div>

      <p className="mt-1 text-[11px] font-semibold text-[#C6A75E]">{priceLabel}</p>
      <button
        type="button"
        onClick={() => void onAdd()}
        disabled={!canAdd}
        className="mt-2 w-full rounded-full border border-neutral-300 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        Agregar
      </button>

      <style jsx>{`
        @keyframes cartSuggestionSlideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes cartSuggestionSlideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes cartSuggestionSlideOutLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        @keyframes cartSuggestionSlideOutRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  )
}

export default function CartMenu() {
  const { items, itemCount, subtotal, isLoading, updateQuantity, removeItem, isCartOpen, closeCart, addItem } =
    useCart()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

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

  const cartSlugStrRef = useRef("")
  cartSlugStrRef.current = useMemo(
    () => items.map((i) => i.productSlug).filter(Boolean).join(","),
    [items],
  )

  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (!isCartOpen) return

    document.body.classList.add("cart-scroll-locked")

    return () => {
      document.body.classList.remove("cart-scroll-locked")
    }
  }, [isCartOpen])

  useEffect(() => {
    if (!isCartOpen) {
      hasFetchedRef.current = false
      return
    }

    if (isEmpty || hasFetchedRef.current) return

    hasFetchedRef.current = true

    const cartSlugs = cartSlugStrRef.current.split(",").filter(Boolean)
    const supabase = createClient()

    supabase
      .from("products")
      .select(
        "id, name, slug, base_price, images, brand, categories(name), product_variants(id, price, stock, is_active)",
      )
      .is("deleted_at", null)
      .eq("is_active", true)
      .limit(40)
      .then(({ data }) => {
        if (!data) return
        const filtered = (data as unknown as Suggestion[])
          .filter(
            (p) =>
              Boolean(p.images?.[0]) &&
              !cartSlugs.includes(p.slug) &&
              p.product_variants?.some((v) => v.is_active && v.stock > 0),
          )
          .slice(0, 6)
        setSuggestions(filtered)
      })
  }, [isCartOpen, isEmpty])

  if (!mounted) return null

  return createPortal(
    <>
    {/* Backdrop — bloquea interacciones táctiles fuera del panel */}
    <div
      className={`fixed inset-x-0 bottom-0 top-[var(--navbar-actual-h)] z-[72] touch-none md:top-0 ${
        isCartOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      onClick={closeCart}
      aria-hidden
    />

    <div
      className={`fixed right-0 bottom-0 top-[var(--navbar-actual-h)] z-[73] flex w-2/3 min-h-0 flex-col overflow-hidden bg-white shadow-xl transition-opacity duration-700 ease-in-out md:top-0 md:h-screen md:w-[380px] ${
        isCartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Header — FIJO */}
      <div className="flex flex-shrink-0 items-center justify-between p-4">
        <h3 className="text-[15px] font-semibold text-[#1a1a1a]">
          Bolsa ({itemCount} {itemCount === 1 ? "artículo" : "artículos"})
        </h3>
        <button
          type="button"
          onClick={closeCart}
          aria-label="Cerrar carrito"
          className="flex items-center justify-center rounded-full p-1 text-neutral-400 transition-colors hover:text-[#1a1a1a]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Items + sugerencias — SCROLLEABLE (sin scrollbar visible, igual que el drawer) */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        {!mounted || isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2].map((n) => (
              <div key={n} className="flex gap-3">
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-neutral-100" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
              <ShoppingBag className="h-7 w-7 text-neutral-300" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-neutral-600">
                Tu bolsa está vacía
              </p>
              <p className="mt-1 text-[12px] text-neutral-400">
                Agrega productos para comenzar
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul>
              {[...resolvedItems].reverse().map((item) => (
                <li
                  key={item.id}
                  className="relative flex gap-3 p-4 after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-neutral-200 after:content-[''] last:after:hidden"
                >
                  <Link
                    href={item.productSlug ? `/tienda/${item.productSlug}` : "/tienda"}
                    onClick={closeCart}
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
                      onClick={closeCart}
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
                          onClick={() =>
                            updateQuantity(item.id, Math.max(1, item.qty - 1))
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-colors hover:bg-neutral-100"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[12px] font-medium tabular-nums text-[#1a1a1a]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[14px] transition-colors hover:bg-neutral-100"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between self-start">
                    <p className="text-[13px] font-semibold tabular-nums text-[#C6A75E]">
                      {formatMXN(item.price * item.qty)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[10px] uppercase tracking-[0.12em] text-[#1a1a1a] underline underline-offset-2 transition-colors hover:text-red-400"
                    >
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* También te puede gustar */}
            {suggestions.length > 0 && (
              <div className="p-4">
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1a1a1a]">
                  También te puede gustar
                </p>
                <div className="cart-scroll flex gap-3 overflow-x-auto pb-2">
                  {suggestions.map((s) => {
                    const firstVariant = s.product_variants?.find(
                      (v) => v.is_active && v.stock > 0,
                    )
                    const price = firstVariant?.price ?? s.base_price
                    const category =
                      s.categories && typeof s.categories === "object" && "name" in s.categories
                        ? (s.categories as { name: string }).name
                        : null

                    const handleAdd = async () => {
                      if (!firstVariant) return
                      const cartItem: CartItem = {
                        productId: s.id,
                        productSlug: s.slug,
                        variantId: firstVariant.id,
                        quantity: 1,
                        price: firstVariant.price,
                        name: s.name,
                        brand: s.brand,
                        image: s.images?.[0] ?? null,
                      }
                      await addItem(cartItem)
                    }

                    return (
                      <SuggestionCard
                        key={s.id}
                        suggestion={s}
                        category={category}
                        priceLabel={formatMXN(price)}
                        canAdd={Boolean(firstVariant)}
                        onAdd={handleAdd}
                        onOpen={closeCart}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer — FIJO */}
      <div className="flex-shrink-0 bg-[#fafafa] p-4">
        {!isEmpty && <FreeShippingBar amount={subtotal} />}
        <div className="flex items-center justify-between">
          <p className="text-[14px] font-semibold text-[#1a1a1a]">Subtotal:</p>
          <p className="text-[14px] font-semibold tabular-nums text-[#C6A75E]">
            {formatMXN(subtotal)}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400">
          Envío y costos calculados al finalizar compra
        </p>

        <div className="mt-3">
          {isEmpty ? (
            <Link
              href="/tienda"
              onClick={closeCart}
              className="inline-flex h-9 w-full items-center justify-center rounded-full bg-[#c2c2c2] text-[11px] uppercase tracking-[0.08em] text-[#1a1a1a] transition-colors hover:bg-neutral-400"
            >
              Seguir explorando
            </Link>
          ) : (
            <>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="inline-flex h-9 w-full items-center justify-center rounded-full bg-black text-[11px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900"
              >
                Finalizar compra
              </Link>
              <Link
                href="/carrito"
                onClick={closeCart}
                className="mt-3 block w-full text-center text-[11px] uppercase tracking-[0.08em] text-[#1a1a1a] underline underline-offset-2 transition-colors hover:text-[#C6A75E]"
              >
                Ver bolsa
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
    </>,
    document.body,
  )
}
