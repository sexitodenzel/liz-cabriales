"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import type { TiendaCategory } from "../menuData"
import { categorySlugsOf } from "../menuData"
import SmoothImage from "@/app/components/shared/SmoothImage"

type CategoryProduct = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
  originalPrice: number
  discountPercent: number
}

// Calienta la caché del navegador para las imágenes del showcase: con
// `images.unoptimized` next/image pide la URL cruda, así que precargarla aquí
// hace que la <img> aparezca al instante al pasar el mouse. Se deduplica para
// no relanzar descargas.
const warmedImages = new Set<string>()
function warmImages(products: CategoryProduct[]) {
  if (typeof window === "undefined") return
  for (const product of products) {
    const url = product.image
    if (!url || warmedImages.has(url)) continue
    warmedImages.add(url)
    const img = new window.Image()
    img.src = url
  }
}

type TiendaMegaMenuProps = {
  isOpen: boolean
  categories: TiendaCategory[]
  sectionHref: string
  sectionLabel: string
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export default function TiendaMegaMenu({
  isOpen,
  categories,
  sectionHref,
  sectionLabel,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: TiendaMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  // Cache de productos destacados por slug de categoría (evita re-fetch al
  // volver a pasar el mouse por la misma categoría).
  const [productsBySlug, setProductsBySlug] = useState<
    Record<string, CategoryProduct[]>
  >({})
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null)
  // Espejo de la caché para leerla dentro del prefetch sin volverlo a disparar.
  const productsRef = useRef(productsBySlug)
  productsRef.current = productsBySlug
  // El prefetch corre una sola vez por apertura del menú.
  const prefetchStartedRef = useRef(false)

  // Categoría por defecto: la primera que tenga subcategorías (para que el
  // panel derecho nunca abra vacío). Si ninguna tiene, la primera de la lista.
  const defaultSlug = useMemo(() => {
    const withSubs = categories.find((c) => c.subcategories.length > 0)
    return (withSubs ?? categories[0])?.slug ?? null
  }, [categories])

  const activeCat = useMemo(() => {
    const match = categories.find((c) => c.slug === activeSlug)
    if (match) return match
    return categories.find((c) => c.slug === defaultSlug) ?? null
  }, [categories, activeSlug, defaultSlug])

  useEffect(() => {
    if (!isOpen) {
      // No reseteamos contentVisible: el fade del contenedor oculta todo como
      // una unidad y evita el parpadeo al saltar entre tabs del navbar.
      return
    }
    setContentVisible(false)
    setActiveSlug(defaultSlug)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen, defaultSlug])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Prefetch: al abrir el menú, traer en paralelo los productos de todas las
  // categorías reales (aún no cacheadas) y calentar sus imágenes. Así al pasar
  // el mouse por una categoría el showcase ya está listo, sin lag de red.
  useEffect(() => {
    if (!isOpen) {
      prefetchStartedRef.current = false
      return
    }
    if (prefetchStartedRef.current) return
    prefetchStartedRef.current = true

    const targets = categories
      .filter((c) => c.href.includes("categoria=") && !productsRef.current[c.slug])
      .map((c) => ({ key: c.slug, param: categorySlugsOf(c).join(",") }))
    if (targets.length === 0) return

    let cancelled = false
    void Promise.all(
      targets.map(async ({ key, param }) => {
        try {
          const res = await fetch(
            `/api/products/by-category?categoria=${encodeURIComponent(param)}`
          )
          if (!res.ok || cancelled) return
          const json = (await res.json()) as { data?: CategoryProduct[] }
          if (cancelled) return
          const list = Array.isArray(json.data) ? json.data : []
          setProductsBySlug((prev) => (prev[key] ? prev : { ...prev, [key]: list }))
          warmImages(list)
        } catch {
          /* ignore */
        }
      })
    )
    return () => {
      cancelled = true
    }
  }, [isOpen, categories])

  // Solo las categorías reales de la tienda traen productos (href con
  // `categoria=`); las virtuales (cursos, etc.) no consultan.
  const wantsProducts = activeCat?.href.includes("categoria=") ?? false
  const activeCatSlug = activeCat?.slug ?? null
  const activeCatParam = activeCat ? categorySlugsOf(activeCat).join(",") : null

  useEffect(() => {
    if (!isOpen || !activeCatSlug || !activeCatParam || !wantsProducts) return
    if (productsBySlug[activeCatSlug]) return
    let cancelled = false
    setLoadingSlug(activeCatSlug)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/by-category?categoria=${encodeURIComponent(activeCatParam)}`
        )
        if (!res.ok) return
        const json = (await res.json()) as { data?: CategoryProduct[] }
        if (cancelled) return
        const list = Array.isArray(json.data) ? json.data : []
        setProductsBySlug((prev) => ({
          ...prev,
          [activeCatSlug]: list,
        }))
        warmImages(list)
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) {
          setLoadingSlug((cur) => (cur === activeCatSlug ? null : cur))
        }
      }
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, activeCatSlug, activeCatParam, wantsProducts, productsBySlug])

  const visibleSubs = activeCat?.subcategories ?? []

  const products = activeCatSlug ? productsBySlug[activeCatSlug] : undefined
  const productsLoading = wantsProducts && loadingSlug === activeCatSlug
  const showShowcase =
    wantsProducts && (productsLoading || (products?.length ?? 0) > 0)

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        bg-ivory border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div
        className={`
          site-container flex gap-0 py-6
          transition-opacity duration-300 ease-out
          ${contentVisible ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* ===== Columna izquierda: todas las categorías ===== */}
        <div className="w-60 shrink-0 border-r border-neutral-200 pr-6 lg:w-64">
          <Link
            href={sectionHref}
            onClick={onClose}
            onMouseEnter={() => setActiveSlug(defaultSlug)}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e] transition-opacity hover:opacity-80"
          >
            Ver {sectionLabel}
          </Link>

          <ul className="-ml-3">
            {categories.map((cat) => {
              const isActive = cat.slug === activeCat?.slug
              return (
                <li key={cat.slug}>
                  <Link
                    href={cat.href}
                    onClick={onClose}
                    onMouseEnter={() => setActiveSlug(cat.slug)}
                    onFocus={() => setActiveSlug(cat.slug)}
                    className={`
                      block rounded-md px-3 py-1 text-[13px] font-medium tracking-wide transition-colors
                      ${isActive
                        ? "bg-neutral-100 text-[#c6a75e]"
                        : "text-[#1a1a1a] hover:text-[#c6a75e]"
                      }
                    `}
                  >
                    {cat.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* ===== Panel derecho: subcategorías + productos destacados ===== */}
        <div className="relative min-h-[300px] flex-1 pl-8 lg:pl-12">
          {activeCat && (
            <div key={activeCat.slug} className="lc-mega-panel-in flex gap-10">
              {/* Subcategorías */}
              <div className="min-w-0 flex-1">
                <Link
                  href={activeCat.href}
                  onClick={onClose}
                  className="mb-6 inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c6a75e] transition-opacity hover:opacity-80"
                >
                  Ver todo en {activeCat.label}
                </Link>

                {visibleSubs.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-x-10 gap-y-3 lg:grid-cols-3">
                    {visibleSubs.map((sub) => (
                      <li key={sub.label}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className="block py-1 text-[14px] text-neutral-700 transition-colors hover:text-[#c6a75e] line-clamp-1"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="max-w-sm text-[14px] leading-relaxed text-neutral-500">
                    Explora todos los productos de{" "}
                    <span className="text-neutral-700">{activeCat.label}</span>.
                  </p>
                )}
              </div>

              {/* Showcase de productos destacados (2×2). Para toda categoría
                  real de la tienda el espacio se reserva siempre —aunque aún
                  no tenga productos— para que la distribución no cambie entre
                  categorías. Los productos aparecerán aquí cuando existan. */}
              {showShowcase ? (
                <div className="grid w-[320px] shrink-0 grid-cols-2 gap-x-4 gap-y-6 border-l border-neutral-200 pl-10">
                  {productsLoading && !products
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))
                    : (products ?? []).map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onClose={onClose}
                        />
                      ))}
                </div>
              ) : wantsProducts ? (
                <div className="w-[320px] shrink-0" aria-hidden />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onClose,
}: {
  product: CategoryProduct
  onClose: () => void
}) {
  return (
    <Link
      href={`/tienda/${product.slug}`}
      onClick={onClose}
      className="group block w-full"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-neutral-100">
        {product.image ? (
          <SmoothImage
            src={product.image}
            alt={product.name}
            fill
            sizes="150px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        {product.discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[#c6a75e] px-2 py-0.5 text-[10px] font-semibold text-white">
            -{product.discountPercent}%
          </span>
        )}
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#1a1a1a] transition-colors group-hover:text-[#c6a75e] line-clamp-2">
        {product.name}
      </p>
      <p className="mt-0.5 flex items-baseline gap-1.5 text-[12px]">
        <span className="font-medium text-neutral-800">
          {priceFormatter.format(product.price)}
        </span>
        {product.discountPercent > 0 && (
          <span className="text-[11px] text-neutral-400 line-through">
            {priceFormatter.format(product.originalPrice)}
          </span>
        )}
      </p>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="w-full">
      <div className="aspect-[4/5] w-full animate-pulse rounded-md bg-neutral-100" />
      <div className="mt-2 h-3 w-4/5 animate-pulse rounded-sm bg-neutral-100" />
      <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded-sm bg-neutral-100" />
    </div>
  )
}
