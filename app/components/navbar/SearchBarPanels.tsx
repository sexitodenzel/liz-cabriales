"use client"

import Link from "next/link"

import { getSearchDestination } from "@/lib/search-navigation"

export type NavbarCategory = {
  id: string
  name: string
  slug: string
}

export type SearchSuggestionProduct = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
}

export type TopSearchChip = {
  id: string
  label: string
  href: string
}

export type SearchSuggestionBrand = {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  href: string
}

export type SearchSuggestionCategory = {
  id: string
  label: string
  href: string
  isSubcategory: boolean
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

type DesktopCategoriesDropdownProps = {
  open: boolean
  categories: NavbarCategory[]
  loading: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function DesktopCategoriesDropdown({
  open,
  categories,
  loading,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: DesktopCategoriesDropdownProps) {
  return (
    <div
      className={`
        absolute left-0 top-full z-50 min-w-[220px] pt-1
        transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
        ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2"
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="menu"
    >
      <div className="max-h-[320px] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 shadow-xl">
        <div className="py-1">
          <Link
            href="/tienda"
            onClick={onClose}
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-[#C6A75E]"
          >
            Ver todo
          </Link>
          {loading ? (
            <p className="px-3 py-2 text-sm text-neutral-500">Cargando...</p>
          ) : categories.length === 0 ? (
            <p className="px-3 py-2 text-sm text-neutral-500">Sin categorías</p>
          ) : (
            categories.map((category) => (
              <Link
                key={category.id}
                href={`/tienda?categoria=${category.slug}`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-[#C6A75E]"
              >
                {category.name}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

type SearchSuggestionsContentProps = {
  query: string
  products: SearchSuggestionProduct[]
  brands?: SearchSuggestionBrand[]
  categories?: SearchSuggestionCategory[]
  loading: boolean
  onClose: () => void
  variant?: "desktop" | "mobile"
}

export function SearchSuggestionsContent({
  query,
  products,
  brands = [],
  categories = [],
  loading,
  onClose,
  variant = "desktop",
}: SearchSuggestionsContentProps) {
  const trimmed = query.trim()
  const hasProducts = products.length > 0
  const hasBrands = brands.length > 0
  const hasCategories = categories.length > 0
  const hasAny = hasProducts || hasBrands || hasCategories
  const searchHref = getSearchDestination(trimmed)

  const isMobile = variant === "mobile"

  const sectionHeadingClass = isMobile
    ? "mb-4 text-[20px] font-semibold tracking-tight text-neutral-900"
    : "mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500"

  const chipClass =
    "inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-800 transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E]"

  return (
    <div className={isMobile ? "pb-8 pt-5" : "px-4 py-4"}>
      {loading && !hasAny ? (
        <p className={isMobile ? "py-6 text-sm text-neutral-500" : "px-2 py-3 text-sm text-neutral-500"}>
          Buscando...
        </p>
      ) : hasAny ? (
        <>
          {hasCategories && (
            <section className={isMobile ? "mb-7" : "mb-5"}>
              <h3 className={sectionHeadingClass}>Categorías</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={c.href}
                    onClick={onClose}
                    className={chipClass}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasBrands && (
            <section className={isMobile ? "mb-7" : "mb-5"}>
              <h3 className={sectionHeadingClass}>Marcas</h3>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Link
                    key={b.id}
                    href={b.href}
                    onClick={onClose}
                    className={chipClass}
                  >
                    {b.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logoUrl}
                        alt=""
                        className="h-4 w-4 rounded-full object-cover"
                      />
                    ) : null}
                    {b.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {hasProducts ? (
            <>
              <h3 className={sectionHeadingClass}>Productos</h3>
          <div
            className={
              isMobile
                ? "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-5"
                : "grid grid-cols-2 gap-3"
            }
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/tienda/${product.slug}`}
                onClick={onClose}
                className={isMobile ? "flex flex-col" : "group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"}
              >
                <div
                  className={
                    isMobile
                      ? "aspect-square w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 sm:aspect-[4/5]"
                      : "aspect-square w-full overflow-hidden bg-neutral-100"
                  }
                >
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className={
                        isMobile
                          ? "h-full w-full object-cover"
                          : "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      }
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                      LC
                    </div>
                  )}
                </div>
                <div className={isMobile ? "mt-2 flex flex-1 flex-col" : "px-2.5 py-2"}>
                  <p
                    className={
                      isMobile
                        ? "line-clamp-2 flex-1 text-[12px] font-light leading-snug text-[#1a1a1a]"
                        : "line-clamp-2 text-[12px] font-medium text-neutral-900"
                    }
                  >
                    {isMobile ? (
                      <span className="underline decoration-neutral-700 decoration-[1px] underline-offset-[4px]">
                        {product.name}
                      </span>
                    ) : (
                      product.name
                    )}
                  </p>
                  <p
                    className={
                      isMobile
                        ? "mt-1 text-[12px] font-light text-[#C6A75E]"
                        : "mt-0.5 text-[12px] text-[#C6A75E]"
                    }
                  >
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
            </>
          ) : null}

          <div className={isMobile ? "mt-7 flex justify-center" : "mt-4 flex justify-center"}>
            <Link
              href={searchHref}
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#1a1a1a]"
            >
              Ver todos los resultados
            </Link>
          </div>
        </>
      ) : (
        <p className={isMobile ? "py-6 text-sm text-neutral-500" : "px-2 py-3 text-sm text-neutral-500"}>
          Sin resultados para &quot;{trimmed}&quot;
        </p>
      )}
    </div>
  )
}

type EmptyStatePanelProps = {
  topSearches: TopSearchChip[]
  bestSellers: SearchSuggestionProduct[]
  loading: boolean
  onClose: () => void
  variant?: "desktop" | "mobile"
}

export function EmptyStatePanel({
  topSearches,
  bestSellers,
  loading,
  onClose,
  variant = "desktop",
}: EmptyStatePanelProps) {
  const hasTop = topSearches.length > 0
  const hasBest = bestSellers.length > 0

  if (loading && !hasTop && !hasBest) {
    return (
      <div className="py-6 text-sm text-neutral-500">Cargando...</div>
    )
  }

  if (!hasTop && !hasBest) {
    return (
      <div className="py-6 text-sm text-neutral-500">
        Escribe para buscar productos o colecciones.
      </div>
    )
  }

  if (variant === "mobile") {
    const visibleTop = topSearches.slice(0, 12)
    const visibleBest = bestSellers.slice(0, 8)

    return (
      <div className="space-y-7 pb-8 pt-5">
        {hasTop && (
          <section>
            <h3 className="mb-4 text-[20px] font-semibold tracking-tight text-neutral-900">
              Más buscados
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {visibleTop.map((chip) => (
                <Link
                  key={chip.id}
                  href={chip.href}
                  onClick={onClose}
                  className="truncate text-[14px] text-neutral-800 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-[#C6A75E] hover:decoration-[#C6A75E]"
                  title={chip.label}
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {hasBest && (
          <section>
            <h3 className="mb-4 text-[20px] font-semibold tracking-tight text-neutral-900">
              Best Sellers
            </h3>
            <div className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto overscroll-x-contain px-5 pb-2 snap-x snap-mandatory md:gap-5">
              {visibleBest.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  onClick={onClose}
                  className="flex shrink-0 snap-start flex-col basis-[46%] sm:basis-[31%] md:basis-[23%] lg:basis-[19%]"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50 sm:aspect-[4/5]">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                        LC
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-1 flex-col">
                    <p className="line-clamp-2 flex-1 text-[12px] font-light leading-snug text-[#1a1a1a]">
                      <span className="underline decoration-neutral-700 decoration-[1px] underline-offset-[4px]">
                        {product.name}
                      </span>
                    </p>
                    <p className="mt-1 text-[12px] font-light text-[#C6A75E]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 py-4">
      {hasTop && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Más buscados
          </h3>
          <div className="flex flex-wrap gap-2">
            {topSearches.map((chip) => (
              <Link
                key={chip.id}
                href={chip.href}
                onClick={onClose}
                className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[13px] text-neutral-700 transition-colors hover:border-[#C6A75E] hover:bg-[#fdf8ec] hover:text-[#A8893A]"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {hasBest && (
        <section>
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Best Sellers
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {bestSellers.map((product) => (
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                onClick={onClose}
                className="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden bg-neutral-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-neutral-400">
                      LC
                    </div>
                  )}
                </div>
                <div className="px-2.5 py-2">
                  <p className="line-clamp-2 text-[12px] font-medium text-neutral-900">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#C6A75E]">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type DesktopSearchSuggestionsProps = {
  open: boolean
  query: string
  products: SearchSuggestionProduct[]
  brands?: SearchSuggestionBrand[]
  categories?: SearchSuggestionCategory[]
  loading: boolean
  onClose: () => void
  topSearches?: TopSearchChip[]
  bestSellers?: SearchSuggestionProduct[]
  emptyLoading?: boolean
}

export function DesktopSearchSuggestions({
  open,
  query,
  products,
  brands = [],
  categories = [],
  loading,
  onClose,
  topSearches = [],
  bestSellers = [],
  emptyLoading = false,
}: DesktopSearchSuggestionsProps) {
  const trimmed = query.trim()
  const isEmpty = trimmed.length < 2

  return (
    <div
      className={`
        absolute left-0 top-full z-50 w-full
        transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]
        ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-2"
        }
      `}
    >
      <div className="overflow-hidden rounded-b-xl border border-t-0 border-neutral-200 bg-white shadow-xl">
        {isEmpty ? (
          <EmptyStatePanel
            topSearches={topSearches}
            bestSellers={bestSellers}
            loading={emptyLoading}
            onClose={onClose}
          />
        ) : (
          <SearchSuggestionsContent
            query={query}
            products={products}
            brands={brands}
            categories={categories}
            loading={loading}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
