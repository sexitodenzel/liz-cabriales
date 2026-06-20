"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown, X } from "lucide-react"

import PriceRangeSlider from "./PriceRangeSlider"

type CategoryItem = {
  id: string
  name: string
  slug: string
}

type ActiveChip = {
  id: string
  label: string
  onRemove: () => void
}

type MobileFilterSheetProps = {
  open: boolean
  onClose: () => void
  categories: CategoryItem[]
  brands: string[]
  selectedCategories: string[]
  selectedBrands: string[]
  search: string
  priceMin: number | null
  priceMax: number | null
  priceBounds: { min: number; max: number }
  activeChips: ActiveChip[]
  onCategoriesChange: (slugs: string[]) => void
  onBrandsChange: (brands: string[]) => void
  onSearchChange: (value: string) => void
  onPriceChange: (min: number | null, max: number | null) => void
  onClearAll: () => void
}

function parsePriceInput(value: string): number | null {
  if (value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 py-2 pl-4 pr-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]">
      <span className="max-w-[180px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center text-neutral-500"
      >
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </span>
  )
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
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center justify-between py-4 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a] ${
          open ? "sticky top-0 z-10 -mx-4 border-b border-neutral-200 bg-white px-4" : ""
        }`}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ease-out ${
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
            className={`pb-4 transition-opacity duration-300 ${
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
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left text-sm text-[#0a0a0a] transition-colors"
    >
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center text-sm ${
          selected ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
      <span className={selected ? "font-semibold" : "font-normal"}>{label}</span>
    </button>
  )
}

export default function MobileFilterSheet({
  open,
  onClose,
  categories,
  brands,
  selectedCategories,
  selectedBrands,
  search,
  priceMin,
  priceMax,
  priceBounds,
  activeChips,
  onCategoriesChange,
  onBrandsChange,
  onSearchChange,
  onPriceChange,
  onClearAll,
}: MobileFilterSheetProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(selectedCategories.length > 0)
  const [brandsOpen, setBrandsOpen] = useState(selectedBrands.length > 0)
  const [priceOpen, setPriceOpen] = useState(
    priceMin !== null || priceMax !== null
  )
  const [searchOpen, setSearchOpen] = useState(search.trim().length > 0)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

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

  const handleClearAll = () => {
    onClearAll()
    setCategoriesOpen(false)
    setBrandsOpen(false)
    setPriceOpen(false)
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[72] bg-black/40 md:hidden transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filtros de productos"
        className={`fixed bottom-0 left-6 right-6 z-[73] flex max-h-[92vh] flex-col rounded-t-[20px] bg-white shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-2">
          <div className="h-0.5 w-8 rounded-full bg-neutral-300" aria-hidden="true" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
          {activeChips.length > 0 && (
            <div className="shrink-0 border-b border-neutral-100 pb-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <FilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain">
          <AccordionSection
            title="Categorías"
            open={categoriesOpen}
            onToggle={() => setCategoriesOpen((value) => !value)}
          >
            <OptionRow
              label="Todas"
              selected={selectedCategories.length === 0}
              onClick={() => onCategoriesChange([])}
            />
            {categories.map((category) => (
              <OptionRow
                key={category.id}
                label={category.name}
                selected={selectedCategories.includes(category.slug)}
                onClick={() => toggleCategory(category.slug)}
              />
            ))}
          </AccordionSection>

          <AccordionSection
            title="Marcas"
            open={brandsOpen}
            onToggle={() => setBrandsOpen((value) => !value)}
          >
            {brands.length === 0 ? (
              <p className="py-2 text-sm text-neutral-500">
                Aún no hay marcas configuradas.
              </p>
            ) : (
              brands.map((brand) => (
                <OptionRow
                  key={brand}
                  label={brand}
                  selected={selectedBrands.includes(brand)}
                  onClick={() => toggleBrand(brand)}
                />
              ))
            )}
          </AccordionSection>

          {priceBounds.max > priceBounds.min && (
            <AccordionSection
              title="Precio"
              open={priceOpen}
              onToggle={() => setPriceOpen((value) => !value)}
            >
              <PriceRangeSlider
                bounds={priceBounds}
                valueMin={priceMin}
                valueMax={priceMax}
                onChange={onPriceChange}
              />
              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                    $
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={priceMin ?? ""}
                    onChange={(event) => {
                      const parsed = parsePriceInput(event.target.value)
                      if (parsed !== null && priceMax !== null && parsed > priceMax) {
                        onPriceChange(parsed, parsed)
                      } else {
                        onPriceChange(parsed, priceMax)
                      }
                    }}
                    placeholder={String(priceBounds.min)}
                    className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none focus:border-[#C9A84C]"
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
                    min={priceBounds.min}
                    max={priceBounds.max}
                    value={priceMax ?? ""}
                    onChange={(event) => {
                      const parsed = parsePriceInput(event.target.value)
                      if (parsed !== null && priceMin !== null && parsed < priceMin) {
                        onPriceChange(parsed, parsed)
                      } else {
                        onPriceChange(priceMin, parsed)
                      }
                    }}
                    placeholder={String(priceBounds.max)}
                    className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-6 pr-3 text-sm text-neutral-800 outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>
            </AccordionSection>
          )}

          <AccordionSection
            title="Buscar"
            open={searchOpen}
            onToggle={() => setSearchOpen((value) => !value)}
          >
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-full border border-neutral-200 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#C9A84C]"
            />
          </AccordionSection>
          </div>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-3 border-t border-neutral-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0a0a0a] text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-900"
          >
            Ver resultados
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#0a0a0a] bg-white text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0a0a0a] transition-colors hover:bg-neutral-50"
          >
            Limpiar todo
          </button>
        </div>
      </div>
    </>
  )
}
