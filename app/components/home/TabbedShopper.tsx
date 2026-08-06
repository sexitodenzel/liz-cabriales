"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, ShoppingBag } from "lucide-react"

import { applyDiscount, hasDiscount } from "@/lib/tienda/discount"
import type { ProductVariant } from "@/lib/supabase/products"
import { ChevronLeftIcon, ChevronRightIcon } from "@/app/components/ui/icons"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"
import AddToCartButton from "@/app/tienda/components/AddToCartButton"
import NotifyWhenAvailable from "@/app/tienda/components/NotifyWhenAvailable"
import { storeIconButtonClassName } from "@/app/tienda/components/store-button-styles"

/* Tabs con productos comprables debajo (estilo Westman Atelier): se compra
   desde la landing sin navegar toda la tienda. Genérico — lo usan tanto la
   sección de categorías como la de destacados (ofertas/nuevos/best sellers).

   Layout tomado del SectionCarousel de la página de producto: header con
   pestañas a la izquierda + flechas ‹ › a la derecha (visibles también en
   móvil, con estado activo/inactivo), y el rail SIN sangrado a los bordes —
   las cards arrancan alineadas bajo las pestañas, con el margen del sitio. */

export type ShopperProduct = {
  id: string
  slug: string
  name: string
  brand: string | null
  base_price: number
  discount_percent: number
  image: string | null
  /** Presentaciones para que el botón de bolsa funcione igual que en tienda. */
  variants: ProductVariant[]
}

export type ShopperTab = {
  id: string
  name: string
  /** Enlace del "Ver todo" de esa pestaña. */
  href: string
  products: ShopperProduct[]
  /** Etiqueta fija a mostrar en cada producto (ej. "Nuevo", "Best seller"). */
  badge?: string
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0 })
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function ProductCard({
  product,
  badge,
  index,
}: {
  product: ShopperProduct
  badge?: string
  /** Posición en el rail; alimenta el stagger del reveal (~70ms por card). */
  index: number
}) {
  const { toggle, has, hydrated: wishlistHydrated } = useWishlist()
  const wishlisted = wishlistHydrated && has(product.slug)
  const discounted = hasDiscount(product.discount_percent)
  const brand = product.brand ?? "Sin marca"

  const activeVariants = product.variants.filter((v) => v.is_active)
  const hasMultipleVariants = activeVariants.length > 1
  const isOutOfStock =
    activeVariants.length === 0 || activeVariants.every((v) => v.stock <= 0)
  const singleVariant = activeVariants.length === 1 ? activeVariants[0] : null

  const iconClass = "h-4 w-4 sm:h-[18px] sm:w-[18px]"

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(product.slug)
  }

  // Corazón (favoritos) + bolsa (agregar), misma lógica que la card de tienda.
  const heartButton = (
    <button
      type="button"
      onClick={handleWishlistToggle}
      aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={storeIconButtonClassName}
    >
      <Heart
        className={`${iconClass} transition-colors${
          wishlisted ? " fill-neutral-900 text-neutral-900" : ""
        }`}
      />
    </button>
  )

  const bagButton = hasMultipleVariants ? (
    <Link
      href={`/tienda/${product.slug}`}
      className={storeIconButtonClassName}
      onClick={(e) => e.stopPropagation()}
      aria-label="Elegir presentación"
    >
      <ShoppingBag className={iconClass} strokeWidth={1.75} />
    </Link>
  ) : isOutOfStock && singleVariant ? (
    <NotifyWhenAvailable
      productId={product.id}
      productSlug={product.slug}
      productName={product.name}
      variantId={singleVariant.id}
      outOfStock
      className={storeIconButtonClassName}
      iconOnly
      label="Avísame disponibilidad"
    />
  ) : (
    <AddToCartButton
      productId={product.id}
      productSlug={product.slug}
      productName={product.name}
      brand={product.brand ?? null}
      image={product.image}
      basePrice={product.base_price}
      discountPercent={product.discount_percent}
      variants={product.variants}
      variant="icon"
    />
  )

  const priceBlock = discounted ? (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <p className="text-sm font-semibold text-[#c6a75e] sm:text-base">
        {formatPrice(applyDiscount(product.base_price, product.discount_percent))}
      </p>
      <p className="text-[11px] text-neutral-400 line-through sm:text-xs">
        {formatPrice(product.base_price)}
      </p>
      <span className="rounded-full bg-[#c6a75e] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
        {product.discount_percent}% OFF
      </span>
    </div>
  ) : (
    <p className="text-sm font-semibold text-[#c6a75e] sm:text-base">
      {formatPrice(product.base_price)}
    </p>
  )

  return (
    <div
      className="lc-card group block w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-[240px] lg:w-[calc((100%-72px)/4)] lg:max-w-none"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <Link
        href={`/tienda/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(20,20,20,0.06)]"
        aria-label={`${product.name}${product.brand ? ` — ${product.brand}` : ""}`}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 68vw, (max-width: 1024px) 240px, 25vw"
            className="lc-card-img object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-ivory" />
        )}
        {badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm">
            {badge}
          </span>
        ) : discounted ? (
          <span className="absolute left-3 top-3 rounded-full bg-gold-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
            {product.discount_percent}% OFF
          </span>
        ) : null}
      </Link>

      <div className="pt-3">
        <h3 className="line-clamp-2 text-xs font-medium leading-snug text-[#0a0a0a] sm:text-sm">
          <Link href={`/tienda/${product.slug}`} className="hover:text-[#a8862f]">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-500 sm:text-xs sm:tracking-[0.18em]">
          {brand}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="min-w-0">{priceBlock}</div>
          <div className="flex shrink-0 items-center gap-1.5">
            {heartButton}
            {bagButton}
          </div>
        </div>
      </div>
    </div>
  )
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right"
  disabled: boolean
  onClick: () => void
}) {
  const Icon = dir === "left" ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Anterior" : "Siguiente"}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 cursor-pointer items-center justify-center bg-transparent text-ink transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

export default function TabbedShopper({
  tabs,
  title,
  showArrows = true,
}: {
  tabs: ShopperTab[]
  /** Título editorial a la izquierda, con las pestañas a la derecha (estilo OPI). */
  title?: string
  /** Flechas del carrusel de productos (‹ ›). Default: visibles. */
  showArrows?: boolean
}) {
  const router = useRouter()
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const tablistRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [underline, setUnderline] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  })

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]

  // Reveal escalonado: dispara una sola vez cuando la sección entra al
  // viewport. Si ya está visible al montar, IntersectionObserver la marca de
  // inmediato; el timeout es el fallback por si el observer no dispara.
  useEffect(() => {
    if (revealed) return
    const el = sectionRef.current
    if (!el) return

    if (prefersReducedMotion()) {
      setRevealed(true)
      return
    }

    const fallback = window.setTimeout(() => setRevealed(true), 1600)
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true)
        }
      },
      { threshold: 0.12 }
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [revealed])

  // Subrayado dorado deslizante: mide el tab activo y recalcula en resize.
  useEffect(() => {
    const measure = () => {
      const btn = tabRefs.current.get(active?.id ?? "")
      if (!btn) return
      setUnderline({ left: btn.offsetLeft, width: btn.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [active?.id, tabs])

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    const onScroll = () => updateScrollState()
    el.addEventListener("scroll", onScroll, { passive: true })
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", onScroll)
      ro.disconnect()
    }
  }, [updateScrollState, active?.id])

  if (!active) return null

  // 1er click: activa la pestaña (muestra sus productos). 2º click sobre la
  // pestaña YA activa: navega a la búsqueda filtrada de esa categoría (su
  // href). Igual en móvil y desktop. Un doble click cae aquí también: el 2º
  // click encuentra la pestaña ya activa y navega.
  const selectTab = (id: string) => {
    if (id === activeId) {
      const tab = tabs.find((t) => t.id === id)
      if (tab) router.push(tab.href)
      return
    }
    setActiveId(id)
    scrollerRef.current?.scrollTo({
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  const scrollByViewport = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({
      left: dir * el.clientWidth * 0.82,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })
  }

  return (
    <div ref={sectionRef}>
      {/* Header estilo OPI "Shop the Products": título editorial a la izquierda
          y las pestañas + flechas a la derecha en la misma fila. Sin título, se
          mantiene el layout clásico (pestañas a la izquierda, flechas a la
          derecha) para la sección de categorías. */}
      <div
        className={`mb-8 flex gap-y-5 ${
          title
            ? "flex-col gap-x-24 md:flex-row md:items-end md:justify-between lg:gap-x-40"
            : "items-end justify-between gap-x-8"
        }`}
      >
        {title && (
          <h2 className="shrink-0 text-[15px] font-semibold uppercase tracking-[0.14em] text-[#1a1a1a] lg:text-[17px] lg:tracking-[0.16em]">
            {title}
          </h2>
        )}

        <div
          className={`flex min-w-0 items-end gap-4 ${
            title ? "md:justify-end" : "flex-1 justify-between"
          }`}
        >
          <div
            ref={tablistRef}
            role="tablist"
            aria-label="Categorías de la tienda"
            className="relative flex min-w-0 gap-7 overflow-x-auto scrollbar-hide"
          >
            {tabs.map((tab) => {
              const isActive = tab.id === active.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(tab.id, el)
                    else tabRefs.current.delete(tab.id)
                  }}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectTab(tab.id)}
                  className={`shrink-0 cursor-pointer whitespace-nowrap pb-2 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200 ${
                    isActive ? "text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {tab.name}
                </button>
              )
            })}

            {/* Subrayado dorado que se desliza hacia el tab activo. */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 h-[2px] bg-gold-soft transition-[left,width] duration-[320ms] ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
              style={{ left: underline.left, width: underline.width }}
            />
          </div>

          {showArrows && (
            <div className="flex shrink-0 gap-1.5 pb-1">
              <ArrowButton
                dir="left"
                disabled={!canScrollLeft}
                onClick={() => scrollByViewport(-1)}
              />
              <ArrowButton
                dir="right"
                disabled={!canScrollRight}
                onClick={() => scrollByViewport(1)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Rail SIN sangrado: las cards arrancan bajo las pestañas, con el
          margen del sitio (nada pegado a la orilla). */}
      <div
        key={active.id}
        ref={scrollerRef}
        className={`lc-shopper-track flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide lg:gap-6 ${
          revealed ? "is-revealed" : ""
        }`}
      >
        {active.products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            badge={active.badge}
            index={i}
          />
        ))}
      </div>
    </div>
  )
}
