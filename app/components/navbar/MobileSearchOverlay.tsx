"use client"

import { useEffect, useRef, type FormEvent } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  EmptyStatePanel,
  SearchSuggestionsContent,
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import { getSearchDestination } from "@/lib/search-navigation"
import { SITE_CONTAINER_CLASS } from "@/lib/site-shell"

type Props = {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (value: string) => void
  products: SearchSuggestionProduct[]
  suggestionsLoading: boolean
  topSearches: TopSearchChip[]
  bestSellers: SearchSuggestionProduct[]
  emptyLoading: boolean
}

export default function MobileSearchOverlay({
  open,
  onClose,
  query,
  onQueryChange,
  products,
  suggestionsLoading,
  topSearches,
  bestSellers,
  emptyLoading,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const timer = setTimeout(() => inputRef.current?.focus(), 80)
    return () => {
      document.body.style.overflow = previous
      clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    router.push(getSearchDestination(query))
    onQueryChange("")
    onClose()
  }

  const isEmpty = query.trim().length < 2

  const overlayContent = (
    <>
      <div className="shrink-0 pt-4 pb-1">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3 border-b-[1.5px] border-neutral-900 pb-2.5"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-neutral-900" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="¿Qué estás buscando?"
            className="navbar-search-input min-w-0 flex-1 bg-transparent text-[13px] tracking-wide text-neutral-900 placeholder:text-neutral-400 outline-none"
            aria-label="Buscar productos"
          />
          <button
            type="button"
            onClick={() => {
              if (query.length > 0) {
                onQueryChange("")
              } else {
                onClose()
              }
            }}
            className="inline-flex shrink-0 items-center justify-center p-1 text-neutral-900 transition-colors hover:text-[#C6A75E]"
            aria-label={query.length > 0 ? "Limpiar búsqueda" : "Cerrar búsqueda"}
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        </form>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyStatePanel
            topSearches={topSearches}
            bestSellers={bestSellers}
            loading={emptyLoading}
            onClose={onClose}
            variant="mobile"
          />
        ) : (
          <SearchSuggestionsContent
            query={query}
            products={products}
            loading={suggestionsLoading}
            onClose={onClose}
            variant="mobile"
          />
        )}
      </div>
    </>
  )

  return (
    <div
      className={`fixed inset-x-0 bottom-0 top-[var(--navbar-actual-h)] z-40 flex flex-col bg-white transition-[opacity,transform] duration-[900ms] will-change-[opacity,transform] ${
        open
          ? "opacity-100 translate-y-0 pointer-events-auto ease-[cubic-bezier(.16,1,.3,1)]"
          : "opacity-0 -translate-y-4 pointer-events-none ease-[cubic-bezier(.7,0,.84,0)]"
      }`}
      aria-hidden={!open}
    >
      <div className={`${SITE_CONTAINER_CLASS} flex min-h-0 flex-1 flex-col`}>
        {overlayContent}
      </div>
    </div>
  )
}
