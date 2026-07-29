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

const SEARCH_PRODUCT_PRICE_CLASS =
  "text-[14px] font-semibold text-[#c6a75e] sm:text-[15px]"

const SEARCH_SUGGESTION_LINKS = [
  { label: "Tienda", href: "/tienda" },
  { label: "Academia", href: "/academia" },
  { label: "Servicios", href: "/servicios" },
  { label: "Conócenos", href: "/sobre-liz" },
] as const

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
            className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-[#c6a75e]"
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
                className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-[#c6a75e]"
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
  variant?: "desktop" | "mobile" | "desktop-compact" | "desktop-dropdown"
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

  if (variant === "desktop-compact") {
    const compactHeading =
      "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
    const compactLink =
      "text-[14px] text-neutral-900 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-[#c6a75e] hover:decoration-[#c6a75e]"

    if (loading && !hasAny) {
      return <p className="py-6 text-sm text-neutral-500">Buscando...</p>
    }

    if (!hasAny) {
      return (
        <p className="py-6 text-sm text-neutral-500">
          Sin resultados para &quot;{trimmed}&quot;
        </p>
      )
    }

    return (
      <div className="pb-6 pt-2">
        {hasCategories && (
          <section className="mb-6">
            <h3 className={compactHeading}>Categorías</h3>
            <ul className="flex flex-col gap-2.5">
              {categories.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={c.href} onClick={onClose} className={compactLink}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasBrands && (
          <section className="mb-6">
            <h3 className={compactHeading}>Marcas</h3>
            <ul className="flex flex-col gap-2.5">
              {brands.slice(0, 8).map((b) => (
                <li key={b.id}>
                  <Link href={b.href} onClick={onClose} className={compactLink}>
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {hasProducts && (
          <section className="mb-6">
            <h3 className={compactHeading}>Productos</h3>
            <ul className="flex flex-col gap-2.5">
              {products.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tienda/${p.slug}`}
                    onClick={onClose}
                    className={compactLink}
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href={searchHref}
          onClick={onClose}
          className="inline-flex text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-[#c6a75e] hover:decoration-[#c6a75e]"
        >
          Ver todos los resultados
        </Link>
      </div>
    )
  }

  if (variant === "desktop-dropdown") {
    const dropdownHeading =
      "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"
    const dropdownChip =
      "inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-800 transition-colors hover:border-[#c6a75e] hover:text-[#c6a75e]"

    if (loading && !hasAny) {
      return null
    }

    if (!hasAny) {
      return (
        <p className="py-2 text-sm text-neutral-500">
          Sin resultados para &quot;{trimmed}&quot;
        </p>
      )
    }

    return (
      <div className="space-y-5">
        {hasCategories && (
          <section>
            <h3 className={dropdownHeading}>Categorías</h3>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((c) => (
                <Link key={c.id} href={c.href} onClick={onClose} className={dropdownChip}>
                  {c.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {hasBrands && (
          <section>
            <h3 className={dropdownHeading}>Marcas</h3>
            <div className="flex flex-wrap gap-2">
              {brands.slice(0, 8).map((b) => (
                <Link key={b.id} href={b.href} onClick={onClose} className={dropdownChip}>
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

        {hasProducts && (
          <section>
            <h3 className={dropdownHeading}>Resultados de búsqueda</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  onClick={onClose}
                  className="group flex w-[140px] shrink-0 flex-col"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                        LC
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-[11px] font-light leading-snug text-[#1a1a1a] transition-colors group-hover:text-[#c6a75e]">
                    {product.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <Link
          href={searchHref}
          onClick={onClose}
          className="inline-flex text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-[#c6a75e] hover:decoration-[#c6a75e]"
        >
          Ver todos los resultados
        </Link>
      </div>
    )
  }

  const isMobile = variant === "mobile"

  const sectionHeadingClass = isMobile
    ? "mb-4 text-[20px] font-semibold tracking-tight text-neutral-900"
    : "mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500"

  const chipClass =
    "inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-800 transition-colors hover:border-[#c6a75e] hover:text-[#c6a75e]"

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
                  <p className={isMobile ? `mt-1 ${SEARCH_PRODUCT_PRICE_CLASS}` : `mt-0.5 ${SEARCH_PRODUCT_PRICE_CLASS}`}>
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
  topSearches?: TopSearchChip[]
  bestSellers?: SearchSuggestionProduct[]
  loading?: boolean
  onClose: () => void
  variant?: "desktop" | "mobile" | "desktop-compact" | "desktop-dropdown"
}

export function EmptyStatePanel({
  onClose,
  variant = "desktop",
}: EmptyStatePanelProps) {
  const isMobile = variant === "mobile"

  const wrapperClass =
    variant === "mobile"
      ? "pb-8 pt-5"
      : variant === "desktop-compact"
        ? "pb-6"
        : variant === "desktop-dropdown"
          ? ""
          : "px-4 py-4"

  const headingClass = isMobile
    ? "mb-4 text-[20px] font-semibold tracking-tight text-neutral-900"
    : "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"

  const linkClass = `w-fit ${
    isMobile ? "text-[15px]" : "text-[13px]"
  } text-neutral-800 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-[#c6a75e] hover:decoration-[#c6a75e]`

  return (
    <div className={wrapperClass}>
      <section>
        <h3 className={headingClass}>Sugerencias</h3>
        <div className={`flex flex-col ${isMobile ? "gap-2.5" : "gap-1.5"}`}>
          {SEARCH_SUGGESTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={linkClass}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
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
