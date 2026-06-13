"use client"

import { useState } from "react"
import { X, Search, ChevronDown } from "lucide-react"

type FilterSidebarProps = {
  categories: { id: string; name: string; slug: string }[]
  brands: string[]
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

  const [categoriesOpen, setCategoriesOpen] = useState(Boolean(selectedCategory))

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  return (
    <aside className="space-y-8 text-sm text-neutral-200">
      <div className="space-y-3">
        <label
          htmlFor="store-search"
          className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400"
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
            className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 pr-9 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-colors focus:border-[#C9A84C]"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className="gold-clear-btn absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setCategoriesOpen((o) => !o)}
          className="flex w-full items-center justify-between py-1 text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <span>
            Categorías
            {selectedCategory && (
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#C9A84C] align-middle" />
            )}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${categoriesOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${categoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="space-y-1 pt-3">
              <button
                type="button"
                onClick={() => onCategoryChange(null)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  selectedCategory === null
                    ? "bg-[#C9A84C]/10 font-semibold text-[#a8862f]"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                }`}
              >
                <span>Todas</span>
                {selectedCategory === null && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                )}
              </button>
              {categories.map((category) => {
                const isActive = selectedCategory === category.slug
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onCategoryChange(isActive ? null : category.slug)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-[#C9A84C]/10 font-semibold text-[#a8862f]"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                    }`}
                  >
                    <span>{category.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C]" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
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
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-[#C9A84C] ${
                  checked ? "border-[#C9A84C] bg-[#C9A84C]/5" : "border-white/10"
                }`}
              >
                <span className="text-neutral-200">
                  {brand}
                </span>
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-[4px] border text-[10px] ${
                    checked
                      ? "border-[#C9A84C] bg-[#C9A84C] text-[#0a0a0a]"
                      : "border-white/20 bg-white/5 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            )
          })}
          {brands.length === 0 && (
            <p className="text-xs text-neutral-500">
              Aún no hay marcas configuradas.
            </p>
          )}
        </div>
      </div>

      {priceBounds.max > priceBounds.min && (
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
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
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-6 pr-3 text-sm text-neutral-100 outline-none transition-colors focus:border-[#C9A84C]"
              />
            </div>
            <span className="text-neutral-600">–</span>
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
                className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-6 pr-3 text-sm text-neutral-100 outline-none transition-colors focus:border-[#C9A84C]"
              />
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-[#C9A84C] hover:text-neutral-200"
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
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-white/15" />
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

