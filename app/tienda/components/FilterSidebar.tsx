"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Search, ChevronDown } from "lucide-react"
import { tiendaCategories } from "@/app/components/navbar/menuData"
import PriceRangeSlider from "./PriceRangeSlider"

type Theme = "dark" | "light"

type FilterSidebarProps = {
  categories: { id: string; name: string; slug: string }[]
  brands: string[]
  brandCounts?: Record<string, number>
  selectedCategories: string[]
  selectedBrands: string[]
  search: string
  priceMin: number | null
  priceMax: number | null
  priceBounds: { min: number; max: number }
  defaultExpanded?: boolean
  theme?: Theme
  onCategoriesChange: (slugs: string[]) => void
  onBrandsChange: (brands: string[]) => void
  onSearchChange: (value: string) => void
  onPriceChange: (min: number | null, max: number | null) => void
  onClearAll: () => void
}

export default function FilterSidebar({
  categories,
  brands,
  brandCounts = {},
  selectedCategories,
  selectedBrands,
  search,
  priceMin,
  priceMax,
  priceBounds,
  defaultExpanded = false,
  theme = "dark",
  onCategoriesChange,
  onBrandsChange,
  onSearchChange,
  onPriceChange,
  onClearAll,
}: FilterSidebarProps) {
  const d = theme === "dark"

  const parseInput = (value: string): number | null => {
    if (value.trim() === "") return null
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    search.trim().length > 0 ||
    priceMin !== null ||
    priceMax !== null

  const [categoriesOpen, setCategoriesOpen] = useState(defaultExpanded || selectedCategories.length > 0)
  const [brandsOpen, setBrandsOpen] = useState(defaultExpanded || selectedBrands.length > 0)

  const toggleCategory = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter((s) => s !== slug))
    } else {
      onCategoriesChange([...selectedCategories, slug])
    }
  }

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  // Color tokens by theme
  const t = {
    base:        d ? "text-neutral-200"  : "text-neutral-800",
    muted:       d ? "text-neutral-400"  : "text-neutral-500",
    mutedHover:  d ? "hover:text-neutral-200" : "hover:text-neutral-900",
    border:      d ? "border-white/10"   : "border-neutral-200",
    borderHover: d ? "hover:border-[#c6a75e]" : "hover:border-[#c6a75e]",
    rowActive:   "border-[#c6a75e] bg-[#c6a75e]/5",
    rowInactive: d ? "border-white/10"   : "border-neutral-200",
    chkActive:   "border-[#c6a75e] bg-[#c6a75e] text-[#0a0a0a]",
    chkInactive: d ? "border-white/20 bg-white/5 text-transparent" : "border-neutral-300 bg-transparent text-transparent",
    searchBg:    d ? "border-white/10 bg-white/5 text-neutral-100 placeholder:text-neutral-500 focus:border-[#c6a75e]"
                   : "border-neutral-200 bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#c6a75e]",
    inputBg:     d ? "border-white/10 bg-white/5 text-neutral-100 focus:border-[#c6a75e]"
                   : "border-neutral-200 bg-white text-neutral-800 focus:border-[#c6a75e]",
    sliderTrack: d ? "bg-white/15" : "bg-neutral-200",
    clearBtn:    d ? "border-white/10 text-neutral-400 hover:border-[#c6a75e] hover:text-neutral-200"
                   : "border-neutral-200 text-neutral-500 hover:border-[#c6a75e] hover:text-neutral-800",
    sublink:     d ? "text-neutral-400 hover:text-[#c6a75e]" : "text-neutral-400 hover:text-[#c6a75e]",
    subBorder:   d ? "border-white/10" : "border-neutral-200",
    clearSearch: d ? "" : "text-neutral-400",
  }

  return (
    <aside className={`space-y-8 text-sm ${t.base}`}>
      {/* Búsqueda */}
      <div className="space-y-3">
        <label
          htmlFor="store-search"
          className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] ${t.muted}`}
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
            className={`w-full rounded-full border px-4 py-2 pr-9 text-sm outline-none transition-colors ${t.searchBg}`}
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar búsqueda"
              className={`gold-clear-btn absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full p-0.5 ${t.clearSearch}`}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categorías */}
      <div>
        <button
          type="button"
          onClick={() => setCategoriesOpen((o) => !o)}
          className={`flex w-full items-center justify-between py-1 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${t.muted} ${t.mutedHover}`}
        >
          <span>
            Categorías
            {selectedCategories.length > 0 && (
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#c6a75e] align-middle" />
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
            <div className="space-y-2 pt-3">
              <button
                type="button"
                onClick={() => onCategoriesChange([])}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${t.borderHover} ${
                  selectedCategories.length === 0 ? t.rowActive : t.rowInactive
                }`}
              >
                <span className={t.base}>Todas</span>
                <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px] ${
                  selectedCategories.length === 0 ? t.chkActive : t.chkInactive
                }`}>✓</span>
              </button>

              {categories.map((category) => {
                const isActive = selectedCategories.includes(category.slug)
                const tiendaCat = tiendaCategories.find((tc) => tc.slug === category.slug)
                return (
                  <div key={category.id}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.slug)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${t.borderHover} ${
                        isActive ? t.rowActive : t.rowInactive
                      }`}
                    >
                      <span className={t.base}>{category.name}</span>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px] ${
                        isActive ? t.chkActive : t.chkInactive
                      }`}>✓</span>
                    </button>
                    {isActive && tiendaCat && tiendaCat.subcategories.length > 0 && (
                      <div className={`mt-1 ml-3 space-y-0.5 border-l pl-3 ${t.subBorder}`}>
                        {tiendaCat.subcategories.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className={`block py-1.5 text-xs transition-colors ${t.sublink}`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Marcas */}
      <div>
        <button
          type="button"
          onClick={() => setBrandsOpen((o) => !o)}
          className={`flex w-full items-center justify-between py-1 text-xs font-medium uppercase tracking-[0.2em] transition-colors ${t.muted} ${t.mutedHover}`}
        >
          <span>
            Marcas
            {selectedBrands.length > 0 && (
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#c6a75e] align-middle" />
            )}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${brandsOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${brandsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="space-y-2 pt-3">
              {brands.map((brand) => {
                const checked = selectedBrands.includes(brand)
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${t.borderHover} ${
                      checked ? t.rowActive : t.rowInactive
                    }`}
                  >
                    <span className={t.base}>{brand}</span>
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px] ${
                      checked ? t.chkActive : t.chkInactive
                    }`}>✓</span>
                  </button>
                )
              })}
              {brands.length === 0 && (
                <p className={`text-xs ${t.muted}`}>Aún no hay marcas configuradas.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Precio */}
      {priceBounds.max > priceBounds.min && (
        <div className="space-y-4">
          <p className={`text-xs font-medium uppercase tracking-[0.2em] ${t.muted}`}>
            Precio
          </p>

          <PriceRangeSlider
            bounds={priceBounds}
            valueMin={priceMin}
            valueMax={priceMax}
            trackClass={t.sliderTrack}
            onChange={onPriceChange}
          />

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs ${t.muted}`}>$</span>
              <input
                type="number"
                inputMode="numeric"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceMin ?? ""}
                onChange={(event) => onPriceChange(parseInput(event.target.value), priceMax)}
                placeholder={String(priceBounds.min)}
                className={`w-full rounded-full border py-2 pl-6 pr-3 text-sm outline-none transition-colors ${t.inputBg}`}
              />
            </div>
            <span className={t.muted}>–</span>
            <div className="relative flex-1">
              <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs ${t.muted}`}>$</span>
              <input
                type="number"
                inputMode="numeric"
                min={priceBounds.min}
                max={priceBounds.max}
                value={priceMax ?? ""}
                onChange={(event) => onPriceChange(priceMin, parseInput(event.target.value))}
                placeholder={String(priceBounds.max)}
                className={`w-full rounded-full border py-2 pl-6 pr-3 text-sm outline-none transition-colors ${t.inputBg}`}
              />
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className={`flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${t.clearBtn}`}
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </button>
      )}
    </aside>
  )
}
