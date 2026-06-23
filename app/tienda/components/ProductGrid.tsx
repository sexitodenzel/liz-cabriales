"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { PackageOpen } from "lucide-react"

import {
  ABRASIVITY_LEVELS,
  getAbrasivityLevel,
  type AbrasivityValue,
} from "@/lib/constants/abrasivity"
import type { HomeBrandItem } from "@/lib/supabase/cache"
import type { CourseWithStats } from "@/lib/supabase/courses"
import type { ServiceRow } from "@/lib/supabase/appointments"
import type {
  Category,
  ProductWithCategory,
} from "@/lib/supabase/products"
import { pickRelatedProductsForFilters } from "@/lib/tienda/related-products"
import { normalizeSearchText, tokenizeSearchQuery } from "@/lib/search-text"
import { applyDiscount, hasDiscount } from "@/lib/tienda/discount"
import BrandHeaderInfo from "./BrandHeaderInfo"
import MobileFilterSheet from "./MobileFilterSheet"
import ProductCard from "./ProductCard"
import ProductFilterSortBar from "./ProductFilterSortBar"
import StoreDiscoverySections from "./StoreDiscoverySections"
import { useProductViewMode } from "./useProductViewMode"
import { useCart } from "@/app/components/cart/CartContext"

type FiltersState = {
  categorySlugs: string[]
  brands: string[]
  abrasivities: AbrasivityValue[]
  search: string
  priceMin: number | null
  priceMax: number | null
  onSale: boolean
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
  brandsWithLogo?: HomeBrandItem[]
  initialFilters: FiltersState
  upcomingCourses: CourseWithStats[]
  activeServices: ServiceRow[]
}

export default function ProductGrid({
  products,
  categories,
  brands,
  brandsWithLogo = [],
  initialFilters,
  upcomingCourses,
  activeServices,
}: ProductGridProps) {
  const pathname = usePathname()

  const [filters, setFilters] = useState<FiltersState>(initialFilters)
  const [sort, setSort] = useState<SortOption>("destacados")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const { viewMode, setViewMode } = useProductViewMode()
  const { isCartOpen } = useCart()

  useEffect(() => {
    if (isCartOpen) setMobileFiltersOpen(false)
  }, [isCartOpen])

  useEffect(() => {
    setFilters(initialFilters)
  }, [
    initialFilters.categorySlugs,
    initialFilters.brands,
    initialFilters.abrasivities,
    initialFilters.search,
    initialFilters.priceMin,
    initialFilters.priceMax,
    initialFilters.onSale,
  ])

  // Mantiene la URL sincronizada (enlaces compartibles / back-forward) sin
  // disparar un refetch del servidor: el filtrado ya ocurre en el cliente.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams()
    if (filters.categorySlugs.length > 0) params.set("categoria", filters.categorySlugs.join(","))
    if (filters.brands.length > 0) params.set("marca", filters.brands.join(","))
    if (filters.abrasivities.length > 0)
      params.set("abrasividad", filters.abrasivities.join(","))
    if (filters.search.trim().length > 0)
      params.set("search", filters.search.trim())
    if (filters.priceMin !== null) params.set("precio_min", String(filters.priceMin))
    if (filters.priceMax !== null) params.set("precio_max", String(filters.priceMax))
    if (filters.onSale) params.set("ofertas", "1")

    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl)
    }
  }, [filters, pathname])

  const handleCategoriesChange = (slugs: string[]) => {
    setFilters((prev) => ({ ...prev, categorySlugs: slugs }))
  }

  const handleBrandsChange = (brandsList: string[]) => {
    setFilters((prev) => ({ ...prev, brands: brandsList }))
  }

  const handleAbrasivitiesChange = (values: AbrasivityValue[]) => {
    setFilters((prev) => ({ ...prev, abrasivities: values }))
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

  const handleOnSaleChange = (value: boolean) => {
    setFilters((prev) => ({ ...prev, onSale: value }))
  }

  const handleClearAll = () => {
    setFilters({
      categorySlugs: [],
      brands: [],
      abrasivities: [],
      search: "",
      priceMin: null,
      priceMax: null,
      onSale: false,
    })
  }

  const hasProductsOnSale = useMemo(
    () => products.some((p) => hasDiscount(p.discount_percent)),
    [products]
  )

  const hasActiveFilters =
    filters.categorySlugs.length > 0 ||
    filters.brands.length > 0 ||
    filters.abrasivities.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.onSale

  const activeFilterCount =
    filters.categorySlugs.length +
    filters.brands.length +
    filters.abrasivities.length +
    (filters.search.trim().length > 0 ? 1 : 0) +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0) +
    (filters.onSale ? 1 : 0)

  const brandsForSidebar = useMemo(() => {
    const fromProducts = Array.from(
      new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))
    )
    const merged = Array.from(new Set([...fromProducts, ...brands]))
    return merged.sort((a, b) => a.localeCompare(b, "es"))
  }, [products, brands])

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      if (product.brand) counts[product.brand] = (counts[product.brand] ?? 0) + 1
    }
    return counts
  }, [products])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const product of products) {
      if (product.category?.slug) {
        counts[product.category.slug] = (counts[product.category.slug] ?? 0) + 1
      }
    }
    return counts
  }, [products])

  const abrasivityCounts = useMemo(() => {
    const counts: Record<AbrasivityValue, number> = {
      "extra-suave": 0,
      suave: 0,
      media: 0,
      fuerte: 0,
    }
    for (const product of products) {
      if (product.abrasivity) counts[product.abrasivity] += 1
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
    const searchTokens = tokenizeSearchQuery(filters.search.trim())
    let result = products.filter((product) => {
      if (
        filters.categorySlugs.length > 0 &&
        !(product.category?.slug && filters.categorySlugs.includes(product.category.slug))
      ) {
        return false
      }
      if (
        filters.brands.length > 0 &&
        !(product.brand && filters.brands.includes(product.brand))
      ) {
        return false
      }
      if (
        filters.abrasivities.length > 0 &&
        !(product.abrasivity && filters.abrasivities.includes(product.abrasivity))
      ) {
        return false
      }
      const effectivePrice = applyDiscount(
        product.base_price,
        product.discount_percent
      )
      if (filters.priceMin !== null && effectivePrice < filters.priceMin) {
        return false
      }
      if (filters.priceMax !== null && effectivePrice > filters.priceMax) {
        return false
      }
      if (filters.onSale && !hasDiscount(product.discount_percent)) {
        return false
      }
      if (searchTokens.length > 0) {
        const haystack = normalizeSearchText(
          `${product.name} ${product.brand ?? ""} ${product.category?.name ?? ""} ${
            product.category?.slug ?? ""
          } ${product.slug ?? ""}`
        )
        if (!searchTokens.every((token) => haystack.includes(token))) {
          return false
        }
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
          return (
            applyDiscount(a.base_price, a.discount_percent) -
            applyDiscount(b.base_price, b.discount_percent)
          )
        case "precio-desc":
          return (
            applyDiscount(b.base_price, b.discount_percent) -
            applyDiscount(a.base_price, a.discount_percent)
          )
        case "destacados":
        default:
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
          return a.name.localeCompare(b.name, "es")
      }
    })

    return result
  }, [products, filters, sort])

  const filteredProductIds = useMemo(
    () => new Set(filteredProducts.map((p) => p.id)),
    [filteredProducts]
  )

  const relatedProducts = useMemo(() => {
    if (!hasActiveFilters) return []
    return pickRelatedProductsForFilters({
      products,
      categories,
      categorySlugs: filters.categorySlugs,
      brands: filters.brands,
      excludeIds: filteredProductIds,
    })
  }, [
    hasActiveFilters,
    products,
    categories,
    filters.categorySlugs,
    filters.brands,
    filteredProductIds,
  ])

  const isEmpty = filteredProducts.length === 0

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

  const activeChips = [
    ...(filters.search.trim().length > 0
      ? [
          {
            id: `search-${filters.search.trim()}`,
            label: filters.search.trim(),
            onRemove: () => handleSearchChange(""),
          },
        ]
      : []),
    ...filters.categorySlugs.map((slug) => {
      const name = categories.find((c) => c.slug === slug)?.name ?? slug
      return {
        id: `category-${slug}`,
        label: name,
        onRemove: () =>
          handleCategoriesChange(filters.categorySlugs.filter((s) => s !== slug)),
      }
    }),
    ...filters.brands.map((brand) => ({
      id: `brand-${brand}`,
      label: brand,
      onRemove: () => handleBrandsChange(filters.brands.filter((b) => b !== brand)),
    })),
    ...filters.abrasivities.map((value) => {
      const level = getAbrasivityLevel(value)
      return {
        id: `abrasivity-${value}`,
        label: level ? `${level.label} (${level.tape})` : value,
        onRemove: () =>
          handleAbrasivitiesChange(
            filters.abrasivities.filter((v) => v !== value)
          ),
      }
    }),
    ...(priceChipLabel
      ? [
          {
            id: "price",
            label: priceChipLabel,
            onRemove: () => handlePriceChange(null, null),
          },
        ]
      : []),
    ...(filters.onSale
      ? [
          {
            id: "on-sale",
            label: "En oferta",
            onRemove: () => handleOnSaleChange(false),
          },
        ]
      : []),
  ]

  const singleSelectedBrand = useMemo(() => {
    if (filters.brands.length !== 1) return null
    return (
      brandsWithLogo.find((b) => b.name === filters.brands[0]) ?? null
    )
  }, [filters.brands, brandsWithLogo])

  const singleSelectedBrandCount = useMemo(() => {
    if (!singleSelectedBrand) return 0
    return brandCounts[singleSelectedBrand.name] ?? 0
  }, [singleSelectedBrand, brandCounts])

  return (
    <div>
      {singleSelectedBrand ? (
        <BrandHeaderInfo
          brand={singleSelectedBrand}
          productCount={singleSelectedBrandCount}
        />
      ) : null}
      <ProductFilterSortBar
        sort={sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(value) => setSort(value as SortOption)}
        onFilterClick={() => setMobileFiltersOpen(true)}
        onClearFilters={handleClearAll}
        showFilter
        activeFilterCount={activeFilterCount}
        activeChips={activeChips}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        desktopFilters={{
          categories,
          brands: brandsForSidebar,
          abrasivityLevels: ABRASIVITY_LEVELS,
          categoryCounts,
          brandCounts,
          abrasivityCounts,
          selectedCategories: filters.categorySlugs,
          selectedBrands: filters.brands,
          selectedAbrasivities: filters.abrasivities,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          priceBounds,
          onSale: filters.onSale,
          showOnSale: hasProductsOnSale,
          onOnSaleChange: handleOnSaleChange,
          onCategoriesChange: handleCategoriesChange,
          onBrandsChange: handleBrandsChange,
          onAbrasivitiesChange: handleAbrasivitiesChange,
          onPriceChange: handlePriceChange,
        }}
      />

      <div className="space-y-6">
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
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3"
                : "flex flex-col"
            }
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                layout={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <StoreDiscoverySections
          relatedProducts={relatedProducts}
          courses={upcomingCourses}
          services={activeServices}
        />
      )}

      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        categories={categories}
        brands={brandsForSidebar}
        abrasivityLevels={ABRASIVITY_LEVELS}
        abrasivityCounts={abrasivityCounts}
        selectedCategories={filters.categorySlugs}
        selectedBrands={filters.brands}
        selectedAbrasivities={filters.abrasivities}
        search={filters.search}
        priceMin={filters.priceMin}
        priceMax={filters.priceMax}
        priceBounds={priceBounds}
        activeChips={activeChips}
        onSale={filters.onSale}
        showOnSale={hasProductsOnSale}
        onOnSaleChange={handleOnSaleChange}
        onCategoriesChange={handleCategoriesChange}
        onBrandsChange={handleBrandsChange}
        onAbrasivitiesChange={handleAbrasivitiesChange}
        onSearchChange={handleSearchChange}
        onPriceChange={handlePriceChange}
        onClearAll={handleClearAll}
      />
    </div>
  )
}
