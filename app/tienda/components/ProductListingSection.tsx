"use client"

import { useMemo, useState } from "react"
import { PackageOpen } from "lucide-react"

import type { ProductWithCategory } from "@/lib/supabase/products"
import ProductCard from "./ProductCard"
import ProductFilterSortBar, {
  type SortOptionItem,
} from "./ProductFilterSortBar"
import { useProductViewMode } from "./useProductViewMode"

type SortOption =
  | "destacados"
  | "nombre-asc"
  | "nombre-desc"
  | "precio-asc"
  | "precio-desc"

const SORT_OPTIONS: SortOptionItem[] = [
  { value: "destacados", label: "Destacados" },
  { value: "nombre-asc", label: "Nombre: A-Z" },
  { value: "nombre-desc", label: "Nombre: Z-A" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
]

type ProductListingSectionProps = {
  products: ProductWithCategory[]
  emptyMessage?: string
}

function sortProducts(products: ProductWithCategory[], sort: SortOption) {
  return [...products].sort((a, b) => {
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
}

export default function ProductListingSection({
  products,
  emptyMessage = "No hay productos para mostrar.",
}: ProductListingSectionProps) {
  const [sort, setSort] = useState<SortOption>("destacados")
  const { viewMode, setViewMode } = useProductViewMode()

  const sortedProducts = useMemo(
    () => sortProducts(products, sort),
    [products, sort]
  )

  if (products.length === 0) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-10 text-center">
        <PackageOpen className="mb-4 h-10 w-10 text-neutral-300" />
        <p className="text-sm font-medium text-[#0a0a0a]">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductFilterSortBar
        sort={sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={(value) => setSort(value as SortOption)}
        showFilter={false}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4"
            : "flex flex-col"
        }
      >
        {sortedProducts.map((product) => (
          <ProductCard key={product.id} product={product} layout={viewMode} />
        ))}
      </div>
    </div>
  )
}
