"use client"

import { useEffect } from "react"

import type { SortOptionItem } from "./ProductFilterSortBar"

type MobileSortSheetProps = {
  open: boolean
  onClose: () => void
  sort: string
  sortOptions: SortOptionItem[]
  onSortChange: (value: string) => void
}

function SortOptionRow({
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
      className="flex w-full items-center gap-3 py-4 text-left text-sm text-[#0a0a0a]"
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

export default function MobileSortSheet({
  open,
  onClose,
  sort,
  sortOptions,
  onSortChange,
}: MobileSortSheetProps) {
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const handleSelect = (value: string) => {
    onSortChange(value)
    onClose()
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
        aria-label="Ordenar productos"
        className={`fixed bottom-0 left-6 right-6 z-[73] flex flex-col rounded-t-[20px] bg-white shadow-2xl md:hidden transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
      >
        <div className="flex shrink-0 justify-center pt-3 pb-2">
          <div className="h-0.5 w-8 rounded-full bg-neutral-300" aria-hidden="true" />
        </div>

        <div className="px-4 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
            Ordenar
          </p>
        </div>

        <div className="mx-4 border-b border-neutral-200" />

        <div className="px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {sortOptions.map((option) => (
            <SortOptionRow
              key={option.value}
              label={option.label}
              selected={option.value === sort}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
