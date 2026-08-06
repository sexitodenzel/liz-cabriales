"use client"

import { useEffect, useState } from "react"
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react"
import { useCart } from "@/app/components/cart/CartContext"
import StoreFilterPanel, {
  type StoreFilterPanelConfig,
} from "./StoreFilterPanel"
import {
  storeGoldHoverGlow,
  storeToolbarIconClassName,
} from "./store-button-styles"
import type { ProductViewMode } from "./useProductViewMode"

export type SortOptionItem = {
  value: string
  label: string
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
  onClearFilters?: () => void
  showFilter?: boolean
  activeFilterCount?: number
  activeChips?: ActiveFilterChip[]
  filterPanel?: StoreFilterPanelConfig
  viewMode?: ProductViewMode
  onViewModeChange?: (mode: ProductViewMode) => void
}

function ActiveFilterChipPill({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#0a0a0a] px-2.5 text-[11px] font-medium tracking-wide text-white">
      <span className="max-w-[200px] truncate uppercase">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar filtro ${label}`}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-white/70 transition-colors hover:text-white"
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
  onClearFilters,
  showFilter = true,
  activeFilterCount = 0,
  activeChips = [],
  filterPanel,
  viewMode = "grid",
  onViewModeChange,
}: ProductFilterSortBarProps) {
  const { isCartOpen, closeCart } = useCart()
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  const hasActiveChips = activeChips.length > 0
  const hasFilterPanel = showFilter && Boolean(filterPanel)

  useEffect(() => {
    if (!isCartOpen) return

    const timeoutId = window.setTimeout(() => {
      setFilterPanelOpen(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [isCartOpen])

  const openFilterPanel = () => {
    closeCart()
    setFilterPanelOpen(true)
  }

  const handleClearFilters = () => {
    setFilterPanelOpen(false)
    onClearFilters?.()
  }

  return (
    <>
      <div
        data-nav-collapse-guard
        className={`navbar-follow-collapse sticky top-[var(--navbar-actual-h)] z-20 -mx-[var(--site-px)] bg-ivory px-[var(--site-px)] py-1.5 transition-opacity duration-200 ${
          isCartOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {hasActiveChips && (
            <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-none sm:gap-3">
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
                  className="inline-flex h-7 shrink-0 items-center rounded-full border border-neutral-300 px-3 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-400 hover:text-[#0a0a0a]"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
            <div className="inline-flex items-center rounded-full border border-neutral-200 p-0.5">
              <button
                type="button"
                onClick={openFilterPanel}
                className={`${storeToolbarIconClassName} h-7 w-auto gap-1.5 px-2.5 text-[11px] font-medium tracking-wide ${
                  activeFilterCount > 0 || filterPanelOpen
                    ? "bg-[#0a0a0a] text-white"
                    : `text-neutral-500 ${storeGoldHoverGlow}`
                }`}
                aria-expanded={filterPanelOpen}
                aria-haspopup="dialog"
              >
                {hasFilterPanel ? "Filtrar" : "Ordenar"}
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                {activeFilterCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0a0a0a]">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {onViewModeChange && (
              <div
                className="inline-flex items-center rounded-full border border-neutral-200 p-0.5"
                role="group"
                aria-label="Cambiar vista de productos"
              >
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  aria-label="Vista en cuadrícula"
                  aria-pressed={viewMode === "grid"}
                  className={`${storeToolbarIconClassName} ${
                    viewMode === "grid"
                      ? "bg-[#0a0a0a] text-white"
                      : `text-neutral-500 ${storeGoldHoverGlow}`
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  aria-label="Vista en lista"
                  aria-pressed={viewMode === "list"}
                  className={`${storeToolbarIconClassName} ${
                    viewMode === "list"
                      ? "bg-[#0a0a0a] text-white"
                      : `text-neutral-500 ${storeGoldHoverGlow}`
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <StoreFilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        sort={sort}
        sortOptions={sortOptions}
        onSortChange={onSortChange}
        showFilters={hasFilterPanel}
        filters={filterPanel}
        onClearAll={onClearFilters}
      />
    </>
  )
}
