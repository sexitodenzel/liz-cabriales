"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PackageOpen } from "lucide-react"

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
}

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<FiltersState>(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFilters.categorySlug, initialFilters.brands, initialFilters.search])

  const updateUrl = (next: FiltersState) => {
    const params = new URLSearchParams(searchParams.toString())

    if (next.categorySlug) {
      params.set("categoria", next.categorySlug)
    } else {
      params.delete("categoria")
    }

    if (next.brands.length > 0) {
      params.set("marca", next.brands.join(","))
    } else {
      params.delete("marca")
    }

    if (next.search.trim().length > 0) {
      params.set("search", next.search.trim())
    } else {
      params.delete("search")
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const handleCategoryChange = (slug: string | null) => {
    const next = { ...filters, categorySlug: slug }
    setFilters(next)
    updateUrl(next)
  }

  const handleBrandsChange = (brandsList: string[]) => {
    const next = { ...filters, brands: brandsList }
    setFilters(next)
    updateUrl(next)
  }

  const handleSearchChange = (value: string) => {
    const next = { ...filters, search: value }
    setFilters(next)
    updateUrl(next)
  }

  const handleClearAll = () => {
    const cleared: FiltersState = { categorySlug: null, brands: [], search: "" }
    setFilters(cleared)
    updateUrl(cleared)
  }

  const hasActiveFilters =
    Boolean(filters.categorySlug) ||
    filters.brands.length > 0 ||
    filters.search.trim().length > 0

  const isEmpty = products.length === 0

  const brandsForSidebar = useMemo(
    () => brands.sort((a, b) => a.localeCompare(b, "es")),
    [brands]
  )

  return (
    <div className="grid gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <FilterSidebar
          categories={categories}
          brands={brandsForSidebar}
          selectedCategory={filters.categorySlug}
          selectedBrands={filters.brands}
          search={filters.search}
          onCategoryChange={handleCategoryChange}
          onBrandsChange={handleBrandsChange}
          onSearchChange={handleSearchChange}
          onClearAll={handleClearAll}
        />
      </div>

      <div className="md:hidden">
        {/* Filtros compactos en mobile: por ahora se muestran inline encima del grid */}
        <FilterSidebar
          categories={categories}
          brands={brandsForSidebar}
          selectedCategory={filters.categorySlug}
          selectedBrands={filters.brands}
          search={filters.search}
          onCategoryChange={handleCategoryChange}
          onBrandsChange={handleBrandsChange}
          onSearchChange={handleSearchChange}
          onClearAll={handleClearAll}
        />
      </div>

      <section className="space-y-6">
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
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

