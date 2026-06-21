"use client"

import { useEffect, useState } from "react"
import { ChevronDown, LayoutGrid, List, X } from "lucide-react"
import { useCart } from "@/app/components/cart/CartContext"
import type {
  ABRASIVITY_LEVELS as AbrasivityLevels,
  AbrasivityValue,
} from "@/lib/constants/abrasivity"
import PriceRangeSlider from "./PriceRangeSlider"
import MobileSortSheet from "./MobileSortSheet"
import type { ProductViewMode } from "./useProductViewMode"

type AbrasivityLevel = (typeof AbrasivityLevels)[number]

export type SortOptionItem = {
  value: string
  label: string
}

type CategoryItem = {
  id: string
  name: string
  slug: string
}

type DesktopFilters = {
  categories: CategoryItem[]
  brands: string[]
  abrasivityLevels: readonly AbrasivityLevel[]
  categoryCounts: Record<string, number>
  brandCounts: Record<string, number>
  abrasivityCounts: Record<AbrasivityValue, number>
  selectedCategories: string[]
  selectedBrands: string[]
  selectedAbrasivities: AbrasivityValue[]
  priceMin: number | null
  priceMax: number | null
  priceBounds: { min: number; max: number }
  onCategoriesChange: (slugs: string[]) => void
  onBrandsChange: (brands: string[]) => void
  onAbrasivitiesChange: (values: AbrasivityValue[]) => void
  onPriceChange: (min: number | null, max: number | null) => void
}

type ActiveFilterChip = {
  id: string
  label: string
  onRemove: () => void
}

type ProductFilterSortBarProps = {
  sort: string
  sortOptions: SortOptionItem[]
  onSortChange: (value: string) => void
  onFilterClick?: () => void
  onClearFilters?: () => void
  showFilter?: boolean
  activeFilterCount?: number
  activeChips?: ActiveFilterChip[]
  desktopFilters?: DesktopFilters
  viewMode?: ProductViewMode
  onViewModeChange?: (mode: ProductViewMode) => void
}

type OpenPanel = "categories" | "brands" | "abrasivity" | "price" | "sort" | null

function parsePriceInput(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function ActiveFilterChipPill({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 py-2 pl-4 pr-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]">
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-[#0a0a0a]"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </span>
  )
}

export default function ProductFilterSortBar({
  sort,
  sortOptions,
  onSortChange,
  onFilterClick,
  onClearFilters,
  showFilter = true,
  activeFilterCount = 0,
  activeChips = [],
  desktopFilters,
  viewMode = "grid",
  onViewModeChange,
}: ProductFilterSortBarProps) {
  const { isCartOpen } = useCart()
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const [sortSheetOpen, setSortSheetOpen] = useState(false)

  const selectedLabel =
    sortOptions.find((option) => option.value === sort)?.label ?? "Destacados"

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  useEffect(() => {
    if (isCartOpen) {
      setOpenPanel(null)
      setSortSheetOpen(false)
    }
  }, [isCartOpen])

  useEffect(() => {
    if (!openPanel) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const clickedInsideDropdown = Boolean(
        target?.closest('[data-store-dropdown-root="true"]')
      )

      if (!clickedInsideDropdown) {
        setOpenPanel(null)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [openPanel])

  const toggleCategory = (slug: string) => {
    if (!desktopFilters) return
    const { selectedCategories, onCategoriesChange } = desktopFilters
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter((s) => s !== slug))
    } else {
      onCategoriesChange([...selectedCategories, slug])
    }
  }

  const toggleBrand = (brand: string) => {
    if (!desktopFilters) return
    const { selectedBrands, onBrandsChange } = desktopFilters
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  const toggleAbrasivity = (value: AbrasivityValue) => {
    if (!desktopFilters) return
    const { selectedAbrasivities, onAbrasivitiesChange } = desktopFilters
    if (selectedAbrasivities.includes(value)) {
      onAbrasivitiesChange(selectedAbrasivities.filter((v) => v !== value))
    } else {
      onAbrasivitiesChange([...selectedAbrasivities, value])
    }
  }

  const visibleAbrasivityLevels = desktopFilters
    ? desktopFilters.abrasivityLevels.filter(
        (level) =>
          (desktopFilters.abrasivityCounts[level.value] ?? 0) > 0 ||
          desktopFilters.selectedAbrasivities.includes(level.value)
      )
    : []

  const hasPriceFilter =
    desktopFilters &&
    (desktopFilters.priceMin !== null || desktopFilters.priceMax !== null)

  const hasActiveChips = activeChips.length > 0

  const handleClearFilters = () => {
    setOpenPanel(null)
    onClearFilters?.()
  }

  return (
    <div
      className={`sticky top-[var(--navbar-actual-h)] z-20 -mx-6 -mt-2 bg-white px-6 py-2.5 transition-opacity duration-200 ${
        isCartOpen ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5 md:gap-8">
          {showFilter && onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a] transition-colors hover:border-[#C9A84C] md:hidden"
            >
              Filtrar por
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-bold text-[#0a0a0a]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          {desktopFilters && (
            <div className="hidden items-center gap-6 md:flex">
              {/* Categorías */}
              <div className="relative" data-store-dropdown-root="true">
                <button
                  type="button"
                  onClick={() => togglePanel("categories")}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    desktopFilters.selectedCategories.length > 0 || openPanel === "categories"
                      ? "text-[#a8862f]"
                      : "text-[#0a0a0a] hover:text-[#a8862f]"
                  }`}
                  aria-expanded={openPanel === "categories"}
                >
                  Categorías
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openPanel === "categories" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openPanel === "categories" && (
                  <div className="absolute left-0 top-full z-50 mt-3 min-w-[240px] max-h-[320px] overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                    {desktopFilters.categories.map((category) => {
                      const isActive = desktopFilters.selectedCategories.includes(category.slug)
                      const count = desktopFilters.categoryCounts[category.slug] ?? 0
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.slug)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 ${
                            isActive ? "font-medium text-[#a8862f]" : "text-neutral-800"
                          }`}
                        >
                          <span>{category.name}</span>
                          <span className="text-xs text-neutral-400">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Marcas */}
              <div className="relative" data-store-dropdown-root="true">
                <button
                  type="button"
                  onClick={() => togglePanel("brands")}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    desktopFilters.selectedBrands.length > 0 || openPanel === "brands"
                      ? "text-[#a8862f]"
                      : "text-[#0a0a0a] hover:text-[#a8862f]"
                  }`}
                  aria-expanded={openPanel === "brands"}
                >
                  Marcas
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      openPanel === "brands" ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openPanel === "brands" && (
                  <div className="absolute left-0 top-full z-50 mt-3 min-w-[240px] max-h-[320px] overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                    {desktopFilters.brands.map((brand) => {
                      const isActive = desktopFilters.selectedBrands.includes(brand)
                      const count = desktopFilters.brandCounts[brand] ?? 0
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleBrand(brand)}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 ${
                            isActive ? "font-medium text-[#a8862f]" : "text-neutral-800"
                          }`}
                        >
                          <span>{brand}</span>
                          <span className="text-xs text-neutral-400">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Abrasividad */}
              {visibleAbrasivityLevels.length > 0 && (
                <div className="relative" data-store-dropdown-root="true">
                  <button
                    type="button"
                    onClick={() => togglePanel("abrasivity")}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      desktopFilters.selectedAbrasivities.length > 0 || openPanel === "abrasivity"
                        ? "text-[#a8862f]"
                        : "text-[#0a0a0a] hover:text-[#a8862f]"
                    }`}
                    aria-expanded={openPanel === "abrasivity"}
                  >
                    Abrasividad
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        openPanel === "abrasivity" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openPanel === "abrasivity" && (
                    <div className="absolute left-0 top-full z-50 mt-3 min-w-[240px] rounded-xl border border-neutral-200 bg-white py-2 shadow-lg">
                      {visibleAbrasivityLevels.map((level) => {
                        const isActive = desktopFilters.selectedAbrasivities.includes(level.value)
                        const count = desktopFilters.abrasivityCounts[level.value] ?? 0
                        return (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => toggleAbrasivity(level.value)}
                            className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 ${
                              isActive ? "font-medium text-[#a8862f]" : "text-neutral-800"
                            }`}
                          >
                            <span className="flex items-center gap-2.5">
                              <span
                                aria-hidden
                                className="inline-block h-3 w-3 rounded-full border border-black/10"
                                style={{ backgroundColor: level.color }}
                              />
                              <span>{level.label}</span>
                              <span className="text-[11px] text-neutral-400">
                                {level.tape}
                              </span>
                            </span>
                            <span className="text-xs text-neutral-400">({count})</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Precio */}
              {desktopFilters.priceBounds.max > desktopFilters.priceBounds.min && (
                <div className="relative" data-store-dropdown-root="true">
                  <button
                    type="button"
                    onClick={() => togglePanel("price")}
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      hasPriceFilter || openPanel === "price"
                        ? "text-[#a8862f]"
                        : "text-[#0a0a0a] hover:text-[#a8862f]"
                    }`}
                    aria-expanded={openPanel === "price"}
                  >
                    Precio
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        openPanel === "price" ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openPanel === "price" && (
                    <div
                      className="absolute left-0 top-full z-50 mt-3 w-[300px] rounded-xl border border-neutral-200 bg-white p-4 shadow-lg"
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <PriceRangeSlider
                        bounds={desktopFilters.priceBounds}
                        valueMin={desktopFilters.priceMin}
                        valueMax={desktopFilters.priceMax}
                        onChange={desktopFilters.onPriceChange}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                            $
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={desktopFilters.priceBounds.min}
                            max={desktopFilters.priceBounds.max}
                            value={desktopFilters.priceMin ?? ""}
                            onChange={(event) => {
                              const parsed = parsePriceInput(event.target.value)
                              const max = desktopFilters.priceMax
                              if (
                                parsed !== null &&
                                max !== null &&
                                parsed > max
                              ) {
                                desktopFilters.onPriceChange(parsed, parsed)
                              } else {
                                desktopFilters.onPriceChange(parsed, max)
                              }
                            }}
                            placeholder={String(desktopFilters.priceBounds.min)}
                            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none transition-colors focus:border-[#C9A84C]"
                          />
                        </div>
                        <span className="text-neutral-500">–</span>
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                            $
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={desktopFilters.priceBounds.min}
                            max={desktopFilters.priceBounds.max}
                            value={desktopFilters.priceMax ?? ""}
                            onChange={(event) => {
                              const parsed = parsePriceInput(event.target.value)
                              const min = desktopFilters.priceMin
                              if (
                                parsed !== null &&
                                min !== null &&
                                parsed < min
                              ) {
                                desktopFilters.onPriceChange(parsed, parsed)
                              } else {
                                desktopFilters.onPriceChange(min, parsed)
                              }
                            }}
                            placeholder={String(desktopFilters.priceBounds.max)}
                            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none transition-colors focus:border-[#C9A84C]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {onViewModeChange && (
            <div
              className="inline-flex items-center rounded-full border border-neutral-200 p-0.5 md:h-[22px] md:p-0"
              role="group"
              aria-label="Cambiar vista de productos"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                aria-label="Vista en cuadrícula"
                aria-pressed={viewMode === "grid"}
                className={`inline-flex h-8 w-8 md:h-[18px] md:w-[18px] items-center justify-center rounded-full transition-colors ${
                  viewMode === "grid"
                    ? "bg-[#0a0a0a] text-white"
                    : "text-neutral-500 hover:text-[#0a0a0a]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 md:h-2.5 md:w-2.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                aria-label="Vista en lista"
                aria-pressed={viewMode === "list"}
                className={`inline-flex h-8 w-8 md:h-[18px] md:w-[18px] items-center justify-center rounded-full transition-colors ${
                  viewMode === "list"
                    ? "bg-[#0a0a0a] text-white"
                    : "text-neutral-500 hover:text-[#0a0a0a]"
                }`}
              >
                <List className="h-3.5 w-3.5 md:h-2.5 md:w-2.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setSortSheetOpen(true)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a] transition-colors hover:text-[#a8862f] md:hidden"
            aria-haspopup="dialog"
          >
            Ordenar por
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <div className="relative hidden md:block" data-store-dropdown-root="true">
            <button
              type="button"
              onClick={() => togglePanel("sort")}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a] transition-colors hover:text-[#a8862f]"
              aria-expanded={openPanel === "sort"}
              aria-haspopup="listbox"
            >
              <span>Ordenar por:</span>
              <span className="font-medium text-neutral-600">
                {selectedLabel}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openPanel === "sort" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openPanel === "sort" && (
              <ul
                role="listbox"
                aria-label="Opciones de orden"
                className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
              >
                {sortOptions.map((option) => {
                  const isSelected = option.value === sort
                  return (
                    <li key={option.value} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          onSortChange(option.value)
                          setOpenPanel(null)
                        }}
                        className={`flex w-full items-center px-4 py-2.5 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-[#C9A84C]/10 font-semibold text-[#a8862f]"
                            : "text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <span className="sr-only">Orden actual: {selectedLabel}</span>
        </div>
      </div>

      {hasActiveChips && (
        <div className="mt-3 hidden flex-wrap items-center gap-3 border-t border-neutral-100 pt-3 md:flex">
          {activeChips.map((chip) => (
            <ActiveFilterChipPill
              key={chip.id}
              label={chip.label}
              onRemove={chip.onRemove}
            />
          ))}
          {onClearFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] font-medium text-[#0a0a0a] underline underline-offset-2 transition-colors hover:text-neutral-600"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      <MobileSortSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        sort={sort}
        sortOptions={sortOptions}
        onSortChange={onSortChange}
      />
    </div>
  )
}
