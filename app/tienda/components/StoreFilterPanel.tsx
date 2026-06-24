"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronDown, X } from "lucide-react"

import { Drawer } from "@/app/components/ui/motion/drawer"
import { tiendaCategories } from "@/app/components/navbar/menuData"

import type {
  ABRASIVITY_LEVELS as AbrasivityLevels,
  AbrasivityValue,
} from "@/lib/constants/abrasivity"
import type { SortOptionItem } from "./ProductFilterSortBar"
import PriceRangeSlider from "./PriceRangeSlider"

type AbrasivityLevel = (typeof AbrasivityLevels)[number]

type CategoryItem = {
  id: string
  name: string
  slug: string
}

export type StoreFilterPanelConfig = {
  categories: CategoryItem[]
  brands: string[]
  abrasivityLevels: readonly AbrasivityLevel[]
  categoryCounts: Record<string, number>
  brandCounts: Record<string, number>
  abrasivityCounts: Record<AbrasivityValue, number>
  selectedCategories: string[]
  selectedBrands: string[]
  selectedAbrasivities: AbrasivityValue[]
  search: string
  priceMin: number | null
  priceMax: number | null
  priceBounds: { min: number; max: number }
  onSale?: boolean
  showOnSale?: boolean
  onOnSaleChange?: (value: boolean) => void
  onCategoriesChange: (slugs: string[]) => void
  onBrandsChange: (brands: string[]) => void
  onAbrasivitiesChange: (values: AbrasivityValue[]) => void
  onSearchChange: (value: string) => void
  onPriceChange: (min: number | null, max: number | null) => void
}

type StoreFilterPanelProps = {
  open: boolean
  onClose: () => void
  sort: string
  sortOptions: SortOptionItem[]
  onSortChange: (value: string) => void
  showFilters?: boolean
  filters?: StoreFilterPanelConfig
  onClearAll?: () => void
}

function parsePriceInput(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-t border-neutral-200 first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] text-left text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors hover:bg-neutral-50 lg:py-[22px] lg:text-[14px]"
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#1a1a1a] transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.16,1,.3,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`px-3 pb-4 transition-opacity duration-300 md:px-4 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function OptionRow({
  label,
  selected,
  onClick,
  count,
}: {
  label: string
  selected: boolean
  onClick: () => void
  count?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 py-2.5 text-left text-[14px] text-[#1a1a1a] transition-colors"
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors ${
          selected
            ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
            : "border-[#1a1a1a] bg-white text-transparent"
        }`}
      >
        <svg
          viewBox="0 0 12 12"
          className="h-2.5 w-2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2.5,6.5 5,9 9.5,3.5" />
        </svg>
      </span>
      <span className={`flex-1 ${selected ? "font-semibold" : "font-normal"}`}>
        {label}
        {count !== undefined && (
          <span className="ml-1.5 font-normal text-[#1a1a1a]">({count})</span>
        )}
      </span>
    </button>
  )
}

export default function StoreFilterPanel({
  open,
  onClose,
  sort,
  sortOptions,
  onSortChange,
  showFilters = true,
  filters,
  onClearAll,
}: StoreFilterPanelProps) {
  const [mounted, setMounted] = useState(false)

  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [abrasivityOpen, setAbrasivityOpen] = useState(false)
  const [priceOpen, setPriceOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    document.body.classList.add("cart-scroll-locked")
    return () => {
      document.body.classList.remove("cart-scroll-locked")
    }
  }, [open])

  useEffect(() => {
    if (!open || !filters) return
    setCategoriesOpen(filters.selectedCategories.length > 0)
    setBrandsOpen(filters.selectedBrands.length > 0)
    setAbrasivityOpen(filters.selectedAbrasivities.length > 0)
    setPriceOpen(
      filters.priceMin !== null ||
        filters.priceMax !== null ||
        Boolean(filters.onSale)
    )
    setSearchOpen(filters.search.trim().length > 0)
  }, [open, filters])

  if (!mounted) return null

  const visibleAbrasivityLevels = filters
    ? filters.abrasivityLevels.filter(
        (level) =>
          (filters.abrasivityCounts[level.value] ?? 0) > 0 ||
          filters.selectedAbrasivities.includes(level.value)
      )
    : []

  const showPriceSection =
    filters &&
    (filters.priceBounds.max > filters.priceBounds.min ||
      (filters.showOnSale && filters.onOnSaleChange))

  const toggleCategory = (slug: string) => {
    if (!filters) return
    const { selectedCategories, onCategoriesChange } = filters
    if (selectedCategories.includes(slug)) {
      onCategoriesChange(selectedCategories.filter((s) => s !== slug))
    } else {
      onCategoriesChange([...selectedCategories, slug])
    }
  }

  const toggleBrand = (brand: string) => {
    if (!filters) return
    const { selectedBrands, onBrandsChange } = filters
    if (selectedBrands.includes(brand)) {
      onBrandsChange(selectedBrands.filter((b) => b !== brand))
    } else {
      onBrandsChange([...selectedBrands, brand])
    }
  }

  const toggleAbrasivity = (value: AbrasivityValue) => {
    if (!filters) return
    const { selectedAbrasivities, onAbrasivitiesChange } = filters
    if (selectedAbrasivities.includes(value)) {
      onAbrasivitiesChange(selectedAbrasivities.filter((v) => v !== value))
    } else {
      onAbrasivitiesChange([...selectedAbrasivities, value])
    }
  }

  const panelInner = (
    <>
      <div className="flex shrink-0 items-center justify-between pl-3 pr-3 md:pl-4 md:pr-5 py-[18px] lg:py-[22px]">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a] lg:text-[14px]">
            Filtrar
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar filtros"
            className="flex items-center justify-center rounded-full p-1 text-neutral-400 transition-colors hover:text-[#1a1a1a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {showFilters && filters && (
            <>
              <AccordionSection
                title="Categorías"
                open={categoriesOpen}
                onToggle={() => setCategoriesOpen((v) => !v)}
              >
                {filters.categories.map((category) => {
                  const isActive = filters.selectedCategories.includes(
                    category.slug
                  )
                  const tiendaCat = tiendaCategories.find(
                    (tc) => tc.slug === category.slug
                  )
                  return (
                    <div key={category.id}>
                      <OptionRow
                        label={category.name}
                        selected={isActive}
                        count={filters.categoryCounts[category.slug] ?? 0}
                        onClick={() => toggleCategory(category.slug)}
                      />
                      {tiendaCat && tiendaCat.subcategories.length > 0 && (
                        <div className="ml-7 space-y-0.5 border-l border-neutral-200 pl-3">
                          {tiendaCat.subcategories.map((sub) => (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={onClose}
                              className="block py-2 text-xs text-neutral-500 transition-colors hover:text-[#a8862f]"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </AccordionSection>

              <AccordionSection
                title="Marcas"
                open={brandsOpen}
                onToggle={() => setBrandsOpen((v) => !v)}
              >
                {filters.brands.length === 0 ? (
                  <p className="py-2 text-sm text-neutral-500">
                    Aún no hay marcas configuradas.
                  </p>
                ) : (
                  filters.brands.map((brand) => (
                    <OptionRow
                      key={brand}
                      label={brand}
                      selected={filters.selectedBrands.includes(brand)}
                      count={filters.brandCounts[brand] ?? 0}
                      onClick={() => toggleBrand(brand)}
                    />
                  ))
                )}
              </AccordionSection>

              {visibleAbrasivityLevels.length > 0 && (
                <AccordionSection
                  title="Abrasividad"
                  open={abrasivityOpen}
                  onToggle={() => setAbrasivityOpen((v) => !v)}
                >
                  {visibleAbrasivityLevels.map((level) => {
                    const selected = filters.selectedAbrasivities.includes(
                      level.value
                    )
                    const count = filters.abrasivityCounts[level.value] ?? 0
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => toggleAbrasivity(level.value)}
                        aria-pressed={selected}
                        className="flex w-full items-center gap-3 py-2.5 text-left text-[14px] text-[#1a1a1a]"
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors ${
                            selected
                              ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                              : "border-[#1a1a1a] bg-white text-transparent"
                          }`}
                        >
                          <svg
                            viewBox="0 0 12 12"
                            className="h-2.5 w-2.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="2.5,6.5 5,9 9.5,3.5" />
                          </svg>
                        </span>
                        <span
                          aria-hidden
                          className="inline-block h-3 w-3 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: level.color }}
                        />
                        <span
                          className={`flex-1 ${selected ? "font-semibold" : "font-normal"}`}
                        >
                          {level.label}
                          <span className="ml-1.5 font-normal text-[#1a1a1a]">
                            ({count})
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </AccordionSection>
              )}

              {showPriceSection && (
                <AccordionSection
                  title="Precio"
                  open={priceOpen}
                  onToggle={() => setPriceOpen((v) => !v)}
                >
                  {filters.priceBounds.max > filters.priceBounds.min && (
                    <>
                      <PriceRangeSlider
                        bounds={filters.priceBounds}
                        valueMin={filters.priceMin}
                        valueMax={filters.priceMax}
                        onChange={filters.onPriceChange}
                      />
                      <div className="mt-4 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                            $
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={filters.priceBounds.min}
                            max={filters.priceBounds.max}
                            value={filters.priceMin ?? ""}
                            onChange={(event) => {
                              const parsed = parsePriceInput(event.target.value)
                              const max = filters.priceMax
                              if (
                                parsed !== null &&
                                max !== null &&
                                parsed > max
                              ) {
                                filters.onPriceChange(parsed, parsed)
                              } else {
                                filters.onPriceChange(parsed, max)
                              }
                            }}
                            placeholder={String(filters.priceBounds.min)}
                            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none focus:border-neutral-400"
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
                            min={filters.priceBounds.min}
                            max={filters.priceBounds.max}
                            value={filters.priceMax ?? ""}
                            onChange={(event) => {
                              const parsed = parsePriceInput(event.target.value)
                              const min = filters.priceMin
                              if (
                                parsed !== null &&
                                min !== null &&
                                parsed < min
                              ) {
                                filters.onPriceChange(parsed, parsed)
                              } else {
                                filters.onPriceChange(min, parsed)
                              }
                            }}
                            placeholder={String(filters.priceBounds.max)}
                            className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none focus:border-neutral-400"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {filters.showOnSale && filters.onOnSaleChange && (
                    <label
                      className={`flex cursor-pointer items-center justify-between ${
                        filters.priceBounds.max > filters.priceBounds.min
                          ? "mt-4 border-t border-neutral-100 pt-4"
                          : "py-1"
                      }`}
                    >
                      <span className="text-sm text-neutral-800">En oferta</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={filters.onSale}
                        onClick={() =>
                          filters.onOnSaleChange?.(!filters.onSale)
                        }
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                          filters.onSale ? "bg-[#0a0a0a]" : "bg-neutral-300"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            filters.onSale ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </label>
                  )}
                </AccordionSection>
              )}

              <AccordionSection
                title="Buscar"
                open={searchOpen}
                onToggle={() => setSearchOpen((v) => !v)}
              >
                <input
                  type="text"
                  value={filters.search}
                  onChange={(event) => filters.onSearchChange(event.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full rounded-full border border-neutral-200 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#C9A84C]"
                />
              </AccordionSection>
            </>
          )}

          <AccordionSection
            title="Ordenar por"
            open={sortOpen}
            onToggle={() => setSortOpen((v) => !v)}
          >
            {sortOptions.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                selected={option.value === sort}
                onClick={() => onSortChange(option.value)}
              />
            ))}
          </AccordionSection>
        </div>

        <div className="shrink-0 border-t border-neutral-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4 md:pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-full bg-[#0a0a0a] text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-900"
          >
            Aplicar
          </button>
          {onClearAll && showFilters && filters && (
            <button
              type="button"
              onClick={() => {
                onClearAll()
                onClose()
              }}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-full border border-[#0a0a0a] bg-white text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a] transition-colors hover:bg-neutral-50"
            >
              Limpiar todo
            </button>
          )}
        </div>
    </>
  )

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      side="right"
      ariaLabel="Filtrar productos"
      className="w-full max-w-none overflow-hidden md:w-[380px]"
    >
      {panelInner}
    </Drawer>
  )
}
