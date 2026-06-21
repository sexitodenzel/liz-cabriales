"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import Link from "next/link"

import type { Product } from "@/lib/supabase/products"

const GAP = 24

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-[18px] h-[18px]"
    >
      <polyline points="15 6 9 12 15 18" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="w-[18px] h-[18px]"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

function ArrowRight({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  )
}

function useVisibleCount() {
  const get = () => {
    if (typeof window === "undefined") return 4
    const w = window.innerWidth
    if (w <= 520) return 1
    if (w <= 768) return 2
    if (w <= 900) return 3
    return 4
  }
  // SSR and the client's first paint must both use 4; reading window in useState(get)
  // breaks hydration because get() differs between server and client.
  const [n, setN] = useState(4)
  useEffect(() => {
    setN(get())
    const onResize = () => setN(get())
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])
  return n
}

function formatPrice(n: number) {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0 })
}

function ProductCard({
  product,
  cardStyle,
}: {
  product: Product
  cardStyle: React.CSSProperties
}) {
  const image = product.images?.[0] ?? null

  return (
    <article
      style={cardStyle}
      className="group min-w-0 cursor-pointer shrink-0"
      aria-label={`${product.name}${product.brand ? ` — ${product.brand}` : ""}`}
    >
      <div className="relative w-full overflow-hidden rounded-[4px] bg-[#f3f3f3] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_rgba(20,20,20,0.06)] aspect-[4/5]">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 520px) 78vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-[800ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[#f0ede8]" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[rgba(17,17,17,0.00)] via-[rgba(17,17,17,0.00)] to-[rgba(17,17,17,0.55)] opacity-0 transition-opacity duration-[320ms] group-hover:opacity-100">
          <Link
            href={`/tienda/${product.slug}`}
            className="inline-flex translate-y-2 items-center gap-2 rounded-full border-none bg-white px-[22px] py-[13px] text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-[0_8px_22px_rgba(0,0,0,0.18)] transition-[transform,background-color,color] duration-[320ms] [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] group-hover:translate-y-0 hover:bg-[#c9a84c] hover:text-white"
            tabIndex={-1}
          >
            Conocer más
            <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="px-1 pt-[18px]">
        {product.brand && (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a8862f]">
            {product.brand}
          </p>
        )}
        <h3 className="mb-0 min-h-[2.7em] overflow-hidden text-[16px] font-medium leading-[1.35] tracking-[-0.005em] text-black [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]">
          {product.name}
        </h3>
        <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-[#ececec] pt-3">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-black">
            {formatPrice(product.base_price)}
            <span className="ml-1 text-[10px] font-medium tracking-[0.15em] text-[#8a8a8a]">
              MXN
            </span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f] transition-[gap] duration-[220ms] group-hover:gap-2.5">
            Ver
            <ArrowRight className="w-[11px] h-[11px]" />
          </span>
        </div>
      </div>
    </article>
  )
}

export default function NuevosLanzamientosCarousel({
  products,
}: {
  products: Product[]
}) {
  const visible = useVisibleCount()
  const total = products.length
  const maxIndex = Math.max(0, total - visible)
  const [index, setIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const [headerInView, setHeaderInView] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeaderInView(true); io.disconnect() } },
      { threshold: 0.08 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex))
  }, [maxIndex])

  const viewportRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)

  useEffect(() => {
    if (!viewportRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setTrackWidth(e.contentRect.width)
    })
    ro.observe(viewportRef.current)
    return () => ro.disconnect()
  }, [])

  const slideWidth = useMemo(() => {
    if (!trackWidth) return 0
    return (trackWidth - GAP * (visible - 1)) / visible
  }, [trackWidth, visible])

  const cardStyle: React.CSSProperties = slideWidth
    ? { flex: `0 0 ${slideWidth}px` }
    : { flex: `0 0 calc((100% - ${GAP * (visible - 1)}px) / ${visible})` }

  const offset = index * (slideWidth + GAP)
  const pageCount = maxIndex + 1

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(
    () => setIndex((i) => Math.min(maxIndex, i + 1)),
    [maxIndex]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goPrev, goNext])

  const touch = useRef({ x: 0, active: false })
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, active: true }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current.active) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touch.current.active = false
  }

  const arrowBase =
    "flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#c9a84c] bg-transparent text-[#a8862f] transition-all duration-[220ms] [transition-timing-function:cubic-bezier(0.2,0.7,0.2,1)] hover:not-disabled:bg-[#c9a84c] hover:not-disabled:text-white hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_8px_20px_rgba(201,168,76,0.28)] active:not-disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30 disabled:border-[#d9d9d9] disabled:text-[#b5b5b5]"

  return (
    <section
      ref={sectionRef}
      className="site-container pt-6 pb-16 max-[720px]:pt-6 max-[720px]:pb-12"
      aria-labelledby="nuevos-lanzamientos-title"
    >
      <header className="mb-12">
        <div
          className={`max-w-[720px] transition-all duration-700 ease-out ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          <h2
            id="nuevos-lanzamientos-title"
            className="mb-[18px] mt-3.5 font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-black"
          >
            Nuevos{" "}
            <em className="font-medium italic text-[#a8862f]">
              Lanzamientos
            </em>
          </h2>
          <div
            className="mb-[18px] h-0.5 w-16 rounded-sm bg-[#c9a84c]"
            aria-hidden
          />
          <p className="max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
            Descubre los últimos productos de nuestras marcas aliadas —
            selección curada para elevar cada servicio en tu mesa de trabajo.
          </p>
        </div>
      </header>

      <div
        className="overflow-hidden"
        ref={viewportRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex gap-6 py-2 will-change-transform"
          style={{
            transform: `translate3d(${-offset}px, 0, 0)`,
            transition: "transform 620ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} cardStyle={cardStyle} />
          ))}
        </div>
      </div>

      <div className="mt-11 flex items-center justify-between gap-6">
        <div
          className="flex items-center gap-2.5"
          role="tablist"
          aria-label="Paginación del carrusel"
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              role="tab"
              className={`h-2 cursor-pointer rounded-full border-none p-0 transition-all duration-[280ms] ${
                i === index
                  ? "w-7 bg-[#c9a84c]"
                  : "w-2 bg-[#e5e5e5] hover:bg-[#d4d4d4]"
              }`}
              onClick={() => setIndex(i)}
              aria-label={`Ir a la página ${i + 1}`}
              aria-selected={i === index}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            className={arrowBase}
            onClick={goPrev}
            disabled={index === 0}
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>
          <button
            className={arrowBase}
            onClick={goNext}
            disabled={index >= maxIndex}
            aria-label="Siguiente"
          >
            <ChevronRight />
          </button>
          <p
            className="ml-1 font-[family-name:var(--font-playfair),serif] text-[14px] italic tracking-[0.02em] text-black"
            aria-live="polite"
          >
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <span className="mx-1.5 text-black">/</span>
            <span className="text-black">
              {String(pageCount).padStart(2, "0")}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
