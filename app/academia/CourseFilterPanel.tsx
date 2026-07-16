"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronDown, X } from "lucide-react"

import { Drawer } from "@/app/components/ui/motion/drawer"

type LevelPill = { name: string; n: number }

type CourseFilterPanelProps = {
  open: boolean
  onClose: () => void
  sortOptions: readonly string[]
  sort: string
  onSortChange: (value: string) => void
  levelPills: LevelPill[]
  level: string
  onLevelChange: (value: string) => void
  typePills: LevelPill[]
  type: string
  onTypeChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
  onClearAll: () => void
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

export default function CourseFilterPanel({
  open,
  onClose,
  sortOptions,
  sort,
  onSortChange,
  levelPills,
  level,
  onLevelChange,
  typePills,
  type,
  onTypeChange,
  search,
  onSearchChange,
  onClearAll,
}: CourseFilterPanelProps) {
  const [mounted, setMounted] = useState(false)

  const [sortOpen, setSortOpen] = useState(true)
  const [levelOpen, setLevelOpen] = useState(true)
  const [typeOpen, setTypeOpen] = useState(true)
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
    if (!open) return
    setSortOpen(true)
    setLevelOpen(true)
    setTypeOpen(true)
    setSearchOpen(search.trim().length > 0)
  }, [open, search])

  if (!mounted) return null

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      side="right"
      ariaLabel="Filtrar eventos"
      className="w-full max-w-none overflow-hidden md:w-[380px]"
    >
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
        <AccordionSection
          title="Ordenar"
          open={sortOpen}
          onToggle={() => setSortOpen((v) => !v)}
        >
          {sortOptions.map((option) => (
            <OptionRow
              key={option}
              label={option}
              selected={option === sort}
              onClick={() => onSortChange(option)}
            />
          ))}
        </AccordionSection>

        <AccordionSection
          title="Nivel"
          open={levelOpen}
          onToggle={() => setLevelOpen((v) => !v)}
        >
          {levelPills.map((pill) => (
            <OptionRow
              key={pill.name}
              label={pill.name}
              selected={pill.name === level}
              count={pill.n}
              onClick={() => onLevelChange(pill.name)}
            />
          ))}
        </AccordionSection>

        <AccordionSection
          title="Tipo de evento"
          open={typeOpen}
          onToggle={() => setTypeOpen((v) => !v)}
        >
          {typePills.map((pill) => (
            <OptionRow
              key={pill.name}
              label={pill.name}
              selected={pill.name === type}
              count={pill.n}
              onClick={() => onTypeChange(pill.name)}
            />
          ))}
        </AccordionSection>

        <AccordionSection
          title="Buscar"
          open={searchOpen}
          onToggle={() => setSearchOpen((v) => !v)}
        >
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar un evento..."
            className="w-full rounded-full border border-neutral-200 px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#c6a75e]"
          />
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
      </div>
    </Drawer>
  )
}
