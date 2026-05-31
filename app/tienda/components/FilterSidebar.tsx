"use client"

import { X, Search } from "lucide-react"

type FilterSidebarProps = {
  categories: { id: string; name: string; slug: string }[]
  brands: string[]
  categoryCounts?: Record<string, number>
  brandCounts?: Record<string, number>
  selectedCategory: string | null
  selectedBrands: string[]
  search: string
  priceMin: number | null
  priceMax: number | null
  priceBounds: { min: number; max: number }
  onCategoryChange: (slug: string | null) => void
  onBrandsChange: (brands: string[]) => void
  onSearchChange: (value: string) => void
  onPriceChange: (min: number | null, max: number | null) => void
  onClearAll: () => void
}

export default function FilterSidebar({
  categories,
  brands,
  categoryCounts = {},
  brandCounts = {},
  selectedCategory,
  selectedBrands,
  search,
  priceMin,
  priceMax,
  priceBounds,
  onCategoryChange,
  onBrandsChange,
  onSearchChange,
  onPriceChange,
  onClearAll,
}: FilterSidebarProps) {
  const parseInput = (value: string): number | null => {
    if (value.trim() === "") return null
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }
  const hasActiveFilters =
    Boolean(selectedCategory) ||
    selectedBrands.length > 0 ||
    search.trim().length > 0 ||
    priceMin !== null ||
    priceMax !== null

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
        <div className="relative">
          <input
            id="store-search"
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-full border border-neutral-200 px-4 py-2 pr-9 text-sm outline-none transition-colors focus:border-[#C9A84C]"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
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
            const count = categoryCounts[category.slug]
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
                {typeof count === "number" && (
                  <span
                    className={
                      isActive ? "ml-1 text-[#0a0a0a]/60" : "ml-1 text-neutral-400"
                    }
                  >
                    {count}
                  </span>
                )}
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
            const count = brandCounts[brand]
            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-[#C9A84C] ${
                  checked ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-neutral-200"
                }`}
              >
                <span className="flex items-center gap-1.5 text-neutral-800">
                  {brand}
                  {typeof count === "number" && (
                    <span className="text-neutral-400">({count})</span>
                  )}
                </span>
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

      {priceBounds.max > priceBounds.min && (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            Precio
          </p>

          <PriceRangeSlider
            bounds={priceBounds}
            valueMin={priceMin}
            valueMax={priceMax}
            onChange={onPriceChange}
          />

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceMin ?? ""}
                onChange={(event) =>
                  onPriceChange(parseInput(event.target.value), priceMax)
                }
                placeholder={String(priceBounds.min)}
                className="w-full rounded-full border border-neutral-200 py-2 pl-6 pr-3 text-sm outline-none transition-colors focus:border-[#C9A84C]"
              />
            </div>
            <span className="text-neutral-300">–</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceMax ?? ""}
                onChange={(event) =>
                  onPriceChange(priceMin, parseInput(event.target.value))
                }
                placeholder={String(priceBounds.max)}
                className="w-full rounded-full border border-neutral-200 py-2 pl-6 pr-3 text-sm outline-none transition-colors focus:border-[#C9A84C]"
              />
            </div>
          </div>
        </div>
      )}

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

function PriceRangeSlider({
  bounds,
  valueMin,
  valueMax,
  onChange,
}: {
  bounds: { min: number; max: number }
  valueMin: number | null
  valueMax: number | null
  onChange: (min: number | null, max: number | null) => void
}) {
  const span = bounds.max - bounds.min

  const effMin = Math.min(
    Math.max(valueMin ?? bounds.min, bounds.min),
    bounds.max
  )
  const effMax = Math.max(
    Math.min(valueMax ?? bounds.max, bounds.max),
    bounds.min
  )

  const leftPct = ((effMin - bounds.min) / span) * 100
  const rightPct = ((effMax - bounds.min) / span) * 100

  const handleMin = (raw: number) => {
    const clamped = Math.min(raw, effMax)
    onChange(clamped <= bounds.min ? null : clamped, valueMax)
  }

  const handleMax = (raw: number) => {
    const clamped = Math.max(raw, effMin)
    onChange(valueMin, clamped >= bounds.max ? null : clamped)
  }

  return (
    <div className="px-1">
      <div className="price-range">
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#C9A84C]"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={effMin}
          onChange={(event) => handleMin(Number(event.target.value))}
          aria-label="Precio mínimo"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={effMax}
          onChange={(event) => handleMax(Number(event.target.value))}
          aria-label="Precio máximo"
        />
      </div>
    </div>
  )
}

