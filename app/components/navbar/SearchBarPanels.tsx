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

export type SearchSuggestionCategory = {
  id: string
  name: string
  slug: string
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
      <div className="max-h-[320px] overflow-y-auto rounded-xl border border-white/10 bg-[#141414] p-1 shadow-lg shadow-black/40">
        <CategoriesDropdownContent
          categories={categories}
          loading={loading}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

type CategoriesDropdownContentProps = {
  categories: NavbarCategory[]
  loading: boolean
  onClose: () => void
}

export function CategoriesDropdownContent({
  categories,
  loading,
  onClose,
}: CategoriesDropdownContentProps) {
  return (
    <div className="py-1">
      <Link
        href="/tienda"
        onClick={onClose}
        className="block rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-[#C6A75E]"
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
            className="block rounded-lg px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-[#C6A75E]"
          >
            {category.name}
          </Link>
        ))
      )}
    </div>
  )
}

type SearchSuggestionsContentProps = {
  query: string
  products: SearchSuggestionProduct[]
  categories: SearchSuggestionCategory[]
  loading: boolean
  activeTab: "productos" | "colecciones"
  onTabChange: (tab: "productos" | "colecciones") => void
  onClose: () => void
}

export function SearchSuggestionsContent({
  query,
  products,
  categories,
  loading,
  activeTab,
  onTabChange,
  onClose,
}: SearchSuggestionsContentProps) {
  const trimmed = query.trim()

  const hasProducts = products.length > 0
  const hasCategories = categories.length > 0
  const effectiveTab =
    activeTab === "productos" && !hasProducts && hasCategories
      ? "colecciones"
      : activeTab === "colecciones" && !hasCategories && hasProducts
        ? "productos"
        : activeTab

  const searchHref = getSearchDestination(trimmed)

  return (
    <div className="py-2">
      <div className="flex border-b border-white/10">
        <button
          type="button"
          onClick={() => onTabChange("productos")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            effectiveTab === "productos"
              ? "border-b-2 border-[#C6A75E] text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Productos
        </button>
        <button
          type="button"
          onClick={() => onTabChange("colecciones")}
          className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
            effectiveTab === "colecciones"
              ? "border-b-2 border-[#C6A75E] text-neutral-100"
              : "text-neutral-500 hover:text-neutral-300"
          }`}
        >
          Colecciones
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto p-2">
        {loading ? (
          <p className="px-3 py-3 text-sm text-neutral-500">Buscando...</p>
        ) : effectiveTab === "productos" ? (
          hasProducts ? (
            products.map((product) => (
              <Link
                key={product.id}
                href={searchHref}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-500">
                      LC
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-200">
                    {product.name}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-neutral-500">
              Sin productos para &quot;{trimmed}&quot;
            </p>
          )
        ) : hasCategories ? (
          categories.map((category) => (
            <Link
              key={category.id}
              href={searchHref}
              onClick={onClose}
              className="block rounded-lg px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-[#C6A75E]"
            >
              {category.name}
            </Link>
          ))
        ) : (
          <p className="px-3 py-3 text-sm text-neutral-500">
            Sin colecciones para &quot;{trimmed}&quot;
          </p>
        )}
      </div>
    </div>
  )
}

type DesktopSearchSuggestionsProps = {
  open: boolean
  query: string
  products: SearchSuggestionProduct[]
  categories: SearchSuggestionCategory[]
  loading: boolean
  activeTab: "productos" | "colecciones"
  onTabChange: (tab: "productos" | "colecciones") => void
  onClose: () => void
}

export function DesktopSearchSuggestions({
  open,
  query,
  products,
  categories,
  loading,
  activeTab,
  onTabChange,
  onClose,
}: DesktopSearchSuggestionsProps) {
  if (query.trim().length < 2) return null

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
      <div className="overflow-hidden rounded-b-xl border border-t-0 border-white/10 bg-[#141414] shadow-lg shadow-black/40">
        <SearchSuggestionsContent
          query={query}
          products={products}
          categories={categories}
          loading={loading}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

type MobileCategoriesDropdownProps = {
  open: boolean
  categories: NavbarCategory[]
  loading: boolean
  onClose: () => void
}

export function MobileCategoriesDropdown({
  open,
  categories,
  loading,
  onClose,
}: MobileCategoriesDropdownProps) {
  if (!open) return null

  return (
    <div
      className="absolute left-0 top-full -mt-2 z-[73] w-full overflow-hidden rounded-b-xl border border-t-0 border-white/10 bg-[#141414] shadow-lg shadow-black/40"
      role="menu"
    >
      <div className="max-h-[300px] overflow-y-auto p-2">
        {loading ? (
          <p className="px-3 py-3 text-sm text-neutral-500">Cargando...</p>
        ) : categories.length === 0 ? (
          <p className="px-3 py-3 text-sm text-neutral-500">Sin categorías</p>
        ) : (
          <>
            <Link
              href="/tienda"
              onClick={onClose}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-[#C6A75E]"
            >
              Ver todo
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/tienda?categoria=${category.slug}`}
                onClick={onClose}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm text-neutral-400 transition-colors hover:bg-white/5 hover:text-[#C6A75E]"
              >
                {category.name}
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

type MobileSearchSuggestionsProps = {
  open: boolean
  query: string
  products: SearchSuggestionProduct[]
  categories: SearchSuggestionCategory[]
  loading: boolean
  activeTab: "productos" | "colecciones"
  onTabChange: (tab: "productos" | "colecciones") => void
  onClose: () => void
}

export function MobileSearchSuggestions({
  open,
  query,
  products,
  categories,
  loading,
  activeTab,
  onTabChange,
  onClose,
}: MobileSearchSuggestionsProps) {
  if (!open || query.trim().length < 2) return null

  return (
    <div className="absolute left-0 top-full -mt-2 z-[70] w-full overflow-hidden rounded-b-xl border border-t-0 border-white/10 bg-[#141414] shadow-lg shadow-black/40">
      <SearchSuggestionsContent
        query={query}
        products={products}
        categories={categories}
        loading={loading}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onClose={onClose}
      />
    </div>
  )
}
