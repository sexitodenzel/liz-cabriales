"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { applyDiscount, hasDiscount } from "@/lib/tienda/discount"
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "@/app/components/ui/icons"

/* Tabs con productos comprables debajo (estilo Westman Atelier): se compra
   desde la landing sin navegar toda la tienda. Genérico — lo usan tanto la
   sección de categorías como la de destacados (ofertas/nuevos/best sellers). */

export type ShopperProduct = {
  id: string
  slug: string
  name: string
  brand: string | null
  base_price: number
  discount_percent: number
  image: string | null
}

export type ShopperTab = {
  id: string
  name: string
  /** Enlace del "Ver todo" de esa pestaña. */
  href: string
  products: ShopperProduct[]
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0 })
}

function ProductCard({ product }: { product: ShopperProduct }) {
  const discounted = hasDiscount(product.discount_percent)

  return (
    <Link
      href={`/tienda/${product.slug}`}
      className="group block w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-[240px] lg:w-[calc((100%-72px)/4)] lg:max-w-none"
      aria-label={`${product.name}${product.brand ? ` — ${product.brand}` : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(20,20,20,0.06)]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 68vw, (max-width: 1024px) 240px, 25vw"
            className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-ivory" />
        )}
        {discounted && (
          <span className="absolute left-3 top-3 rounded-full bg-gold-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            -{product.discount_percent}%
          </span>
        )}
      </div>

      <div className="pt-4">
        {product.brand && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
            {product.brand}
          </p>
        )}
        <h3 className="min-h-[2.7em] overflow-hidden text-[15px] font-medium leading-[1.35] tracking-[-0.005em] text-ink transition-colors duration-300 group-hover:text-gold [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
          {product.name}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-1.5 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {discounted ? (
            <>
              <span>{formatPrice(applyDiscount(product.base_price, product.discount_percent))}</span>
              <span className="text-[11px] font-normal text-ink-soft/60 line-through">
                {formatPrice(product.base_price)}
              </span>
            </>
          ) : (
            formatPrice(product.base_price)
          )}
        </p>
      </div>
    </Link>
  )
}

export default function TabbedShopper({
  tabs,
  centerTabs = false,
}: {
  tabs: ShopperTab[]
  /** Centra la fila de pestañas (útil cuando son pocas, ej. destacados). */
  centerTabs?: boolean
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "")
  const scrollerRef = useRef<HTMLDivElement>(null)

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]
  if (!active) return null

  const selectTab = (id: string) => {
    setActiveId(id)
    scrollerRef.current?.scrollTo({ left: 0 })
  }

  const scrollByViewport = (dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Categorías de la tienda"
        className={`-mx-[var(--site-px)] mb-8 flex overflow-x-auto border-b border-line px-[var(--site-px)] scrollbar-hide md:mx-0 md:px-0 ${
          centerTabs ? "justify-center gap-5 sm:gap-8" : "gap-7"
        }`}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => selectTab(tab.id)}
              className={`-mb-px shrink-0 cursor-pointer whitespace-nowrap border-b-2 pb-3 text-[12px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300 ${
                isActive
                  ? "border-gold-soft text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Productos de la pestaña activa */}
      <div
        key={active.id}
        ref={scrollerRef}
        className="animate-fade-up -mx-[var(--site-px)] flex snap-x gap-4 overflow-x-auto px-[var(--site-px)] pb-2 scrollbar-hide md:mx-0 md:px-0 lg:gap-6"
      >
        {active.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* CTA + flechas */}
      <div className="mt-6 flex items-center justify-between gap-6">
        <Link
          href={active.href}
          className="group inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-ink"
        >
          Ver todo {active.name}
          <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
            <ArrowRightIcon />
          </span>
        </Link>

        {active.products.length > 4 && (
          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() => scrollByViewport(-1)}
              aria-label="Anterior"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gold-soft text-gold transition-all duration-[220ms] hover:bg-gold-soft hover:text-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollByViewport(1)}
              aria-label="Siguiente"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-gold-soft text-gold transition-all duration-[220ms] hover:bg-gold-soft hover:text-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
