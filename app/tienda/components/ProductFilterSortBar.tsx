"use client"

import { useEffect, useState } from "react"
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react"
import { useCart } from "@/app/components/cart/CartContext"
import Breadcrumb, { type BreadcrumbItem } from "@/components/shared/Breadcrumb"
import StoreFilterPanel, {
  type StoreFilterPanelConfig,
} from "./StoreFilterPanel"
import {
  storeGoldHoverGlow,
  storeToolbarIconClassName,
  storeToolbarTriggerClassName,
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
  breadcrumbItems?: BreadcrumbItem[]
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
  onClearFilters,
  showFilter = true,
  activeFilterCount = 0,
  activeChips = [],
  filterPanel,
  breadcrumbItems,
  viewMode = "grid",
  onViewModeChange,
}: ProductFilterSortBarProps) {
  const { isCartOpen, closeCart } = useCart()
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  const hasActiveChips = activeChips.length > 0
  const hasFilterPanel = showFilter && Boolean(filterPanel)

  useEffect(() => {
    if (isCartOpen) setFilterPanelOpen(false)
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
        className={`navbar-follow-collapse sticky top-[var(--navbar-actual-h)] z-20 -mx-[var(--site-px)] bg-white px-[var(--site-px)] py-1.5 transition-opacity duration-200 ${
          isCartOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {breadcrumbItems && breadcrumbItems.length > 0 ? (
              <Breadcrumb items={breadcrumbItems} className="mb-0" />
            ) : null}
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
                  className={`${storeToolbarIconClassName} ${
                    viewMode === "grid"
                      ? "bg-[#0a0a0a] text-white"
                      : `text-neutral-500 ${storeGoldHoverGlow}`
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 md:h-2.5 md:w-2.5" />
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
                  <List className="h-3.5 w-3.5 md:h-2.5 md:w-2.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={openFilterPanel}
              className={`${storeToolbarTriggerClassName} ${
                activeFilterCount > 0 || filterPanelOpen
                  ? "text-[#a8862f]"
                  : `text-[#0a0a0a] ${storeGoldHoverGlow}`
              }`}
              aria-expanded={filterPanelOpen}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
              {hasFilterPanel ? "Filtrar" : "Ordenar"}
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-bold text-[#0a0a0a]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {hasActiveChips && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-3">
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
