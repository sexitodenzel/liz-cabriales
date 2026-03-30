"use client"

import { X, Search } from "lucide-react"

type FilterSidebarProps = {
  categories: { id: string; name: string; slug: string }[]
  brands: string[]
  selectedCategory: string | null
  selectedBrands: string[]
  search: string
  onCategoryChange: (slug: string | null) => void
  onBrandsChange: (brands: string[]) => void
  onSearchChange: (value: string) => void
  onClearAll: () => void
}

export default function FilterSidebar({
  categories,
  brands,
  selectedCategory,
  selectedBrands,
  search,
  onCategoryChange,
  onBrandsChange,
  onSearchChange,
  onClearAll,
}: FilterSidebarProps) {
  const hasActiveFilters =
    Boolean(selectedCategory) ||
    selectedBrands.length > 0 ||
    search.trim().length > 0

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  return (
    <aside className="space-y-8 rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-[#0a0a0a]">
      <div className="space-y-3">
        <label
          htmlFor="store-search"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500"
        >
          <Search className="h-4 w-4" />
          Buscar
        </label>
        <input
          id="store-search"
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar producto..."
          className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm outline-none transition-colors focus:border-[#C9A84C]"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Categorías
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "border-[#C9A84C] bg-[#C9A84C] text-[#0a0a0a]"
                : "border-neutral-200 bg-white text-neutral-700 hover:border-[#C9A84C]"
            }`}
          >
            Todas
          </button>
          {categories.map((category) => {
            const isActive = selectedCategory === category.slug
            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  onCategoryChange(isActive ? null : category.slug)
                }
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-[#C9A84C] bg-[#C9A84C] text-[#0a0a0a]"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-[#C9A84C]"
                }`}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Marcas
        </p>
        <div className="space-y-2">
          {brands.map((brand) => {
            const checked = selectedBrands.includes(brand)
            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-left text-sm hover:border-[#C9A84C]"
              >
                <span className="text-neutral-800">{brand}</span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-[4px] border text-[10px] ${
                    checked
                      ? "border-[#C9A84C] bg-[#C9A84C] text-[#0a0a0a]"
                      : "border-neutral-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            )
          })}
          {brands.length === 0 && (
            <p className="text-xs text-neutral-400">
              Aún no hay marcas configuradas.
            </p>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-[#C9A84C]"
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </button>
      )}
    </aside>
  )
}

