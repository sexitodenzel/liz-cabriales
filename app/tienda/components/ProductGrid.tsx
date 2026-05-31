"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { PackageOpen, SlidersHorizontal, X } from "lucide-react"

import type {
  Category,
  ProductWithCategory,
} from "@/lib/supabase/products"
import FilterSidebar from "./FilterSidebar"
import ProductCard from "./ProductCard"

type FiltersState = {
  categorySlug: string | null
  brands: string[]
  search: string
  priceMin: number | null
  priceMax: number | null
}

type SortOption =
  | "destacados"
  | "nombre-asc"
  | "nombre-desc"
  | "precio-asc"
  | "precio-desc"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "destacados", label: "Destacados" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
]

type ProductGridProps = {
  products: ProductWithCategory[]
  categories: Category[]
  brands: string[]
  initialFilters: FiltersState
}

export default function ProductGrid({
  products,
  categories,
  brands,
  initialFilters,
}: ProductGridProps) {
  const pathname = usePathname()

  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [sort, setSort] = useState<SortOption>("destacados")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    setFilters(initialFilters)
  }, [
    initialFilters.categorySlug,
    initialFilters.brands,
    initialFilters.search,
    initialFilters.priceMin,
    initialFilters.priceMax,
  ])

  // Mantiene la URL sincronizada (enlaces compartibles / back-forward) sin
  // disparar un refetch del servidor: el filtrado ya ocurre en el cliente.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams()
    if (filters.categorySlug) params.set("categoria", filters.categorySlug)
    if (filters.brands.length > 0) params.set("marca", filters.brands.join(","))
    if (filters.search.trim().length > 0)
      params.set("search", filters.search.trim())
    if (filters.priceMin !== null) params.set("precio_min", String(filters.priceMin))
    if (filters.priceMax !== null) params.set("precio_max", String(filters.priceMax))

    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl)
    }
  }, [filters, pathname])

  const handleCategoryChange = (slug: string | null) => {
    setFilters((prev) => ({ ...prev, categorySlug: slug }))
  }

  const handleBrandsChange = (brandsList: string[]) => {
    setFilters((prev) => ({ ...prev, brands: brandsList }))
  }

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }))
  }

  const handlePriceChange = (
    priceMin: number | null,
    priceMax: number | null
  ) => {
    setFilters((prev) => ({ ...prev, priceMin, priceMax }))
  }

  const handleClearAll = () => {
    setFilters({
      categorySlug: null,
      brands: [],
      search: "",
      priceMin: null,
      priceMax: null,
    })
  }

  const hasActiveFilters =
    Boolean(filters.categorySlug) ||
    filters.brands.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null

  const activeFilterCount =
    (filters.categorySlug ? 1 : 0) +
    filters.brands.length +
    (filters.search.trim().length > 0 ? 1 : 0) +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0)

  const brandsForSidebar = useMemo(
    () => [...brands].sort((a, b) => a.localeCompare(b, "es")),
    [brands]
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      const slug = product.category?.slug
      if (slug) counts[slug] = (counts[slug] ?? 0) + 1
    }
    return counts
  }, [products])

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      if (product.brand) counts[product.brand] = (counts[product.brand] ?? 0) + 1
    }
    return counts
  }, [products])

  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    let min = Infinity
    let max = -Infinity
    for (const product of products) {
      if (product.base_price < min) min = product.base_price
      if (product.base_price > max) max = product.base_price
    }
    return { min: Math.floor(min), max: Math.ceil(max) }
  }, [products])

  const filteredProducts = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    let result = products.filter((product) => {
      if (
        filters.categorySlug &&
        product.category?.slug !== filters.categorySlug
      ) {
        return false
      }
      if (
        filters.brands.length > 0 &&
        !(product.brand && filters.brands.includes(product.brand))
      ) {
        return false
      }
      if (filters.priceMin !== null && product.base_price < filters.priceMin) {
        return false
      }
      if (filters.priceMax !== null && product.base_price > filters.priceMax) {
        return false
      }
      if (query) {
        const haystack = `${product.name} ${product.brand ?? ""} ${
          product.category?.name ?? ""
        }`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "nombre-asc":
          return a.name.localeCompare(b.name, "es")
        case "nombre-desc":
          return b.name.localeCompare(a.name, "es")
        case "precio-asc":
          return a.base_price - b.base_price
        case "precio-desc":
          return b.base_price - a.base_price
        case "destacados":
        default:
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
          return a.name.localeCompare(b.name, "es")
      }
    })

    return result
  }, [products, filters, sort])

  const isEmpty = filteredProducts.length === 0

  const categoryName = filters.categorySlug
    ? (categories.find((category) => category.slug === filters.categorySlug)
        ?.name ?? null)
    : null

  const formatPriceShort = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  const priceChipLabel = (() => {
    if (filters.priceMin !== null && filters.priceMax !== null) {
      return `${formatPriceShort(filters.priceMin)} – ${formatPriceShort(
        filters.priceMax
      )}`
    }
    if (filters.priceMin !== null) {
      return `Desde ${formatPriceShort(filters.priceMin)}`
    }
    if (filters.priceMax !== null) {
      return `Hasta ${formatPriceShort(filters.priceMax)}`
    }
    return null
  })()

  const sidebar = (
    <FilterSidebar
      categories={categories}
      brands={brandsForSidebar}
      categoryCounts={categoryCounts}
      brandCounts={brandCounts}
      selectedCategory={filters.categorySlug}
      selectedBrands={filters.brands}
      search={filters.search}
      priceMin={filters.priceMin}
      priceMax={filters.priceMax}
      priceBounds={priceBounds}
      onCategoryChange={handleCategoryChange}
      onBrandsChange={handleBrandsChange}
      onSearchChange={handleSearchChange}
      onPriceChange={handlePriceChange}
      onClearAll={handleClearAll}
    />
  )

  return (
    <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden md:block">{sidebar}</div>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-[#C9A84C] md:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-bold text-[#0a0a0a]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <p className="text-sm text-neutral-500">
              {hasActiveFilters ? (
                <>
                  <span className="font-semibold text-[#0a0a0a]">
                    {filteredProducts.length}
                  </span>{" "}
                  de {products.length} productos
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#0a0a0a]">
                    {products.length}
                  </span>{" "}
                  productos
                </>
              )}
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="hidden sm:inline">Ordenar por</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 outline-none transition-colors focus:border-[#C9A84C]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.search.trim().length > 0 && (
              <FilterChip
                label={`“${filters.search.trim()}”`}
                onRemove={() => handleSearchChange("")}
              />
            )}
            {categoryName && (
              <FilterChip
                label={categoryName}
                onRemove={() => handleCategoryChange(null)}
              />
            )}
            {filters.brands.map((brand) => (
              <FilterChip
                key={brand}
                label={brand}
                onRemove={() =>
                  handleBrandsChange(filters.brands.filter((b) => b !== brand))
                }
              />
            ))}
            {priceChipLabel && (
              <FilterChip
                label={priceChipLabel}
                onRemove={() => handlePriceChange(null, null)}
              />
            )}
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-medium text-[#a8862f] transition-colors hover:text-[#C9A84C] hover:underline"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {isEmpty ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
            <PackageOpen className="mb-4 h-10 w-10 text-neutral-300" />
            <p className="text-sm font-medium text-[#0a0a0a]">
              No encontramos productos con esos filtros.
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Ajusta la búsqueda o limpia los filtros para ver todo el catálogo.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-4 rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-[#C9A84C]"
              >
                Ver todo
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <p className="text-sm font-semibold text-[#0a0a0a]">Filtros</p>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-neutral-500 hover:text-neutral-800"
                aria-label="Cerrar filtros"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{sidebar}</div>
            <div className="border-t border-neutral-200 p-4">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-full bg-[#111] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#C9A84C]"
              >
                Ver {filteredProducts.length} productos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C] bg-[#C9A84C]/10 py-1 pl-3 pr-1.5 text-xs font-medium text-[#a8862f]">
      <span className="max-w-[160px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-[#a8862f] transition-colors hover:bg-[#C9A84C]/20 hover:text-[#0a0a0a]"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
