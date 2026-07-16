"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  EmptyStatePanel,
  SearchSuggestionsContent,
  type SearchSuggestionBrand,
  type SearchSuggestionCategory,
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import { SearchTypewriter } from "./SearchTypewriter"
import { getSearchDestination } from "@/lib/search-navigation"
import { SITE_CONTAINER_CLASS } from "@/lib/site-shell"
import { MOBILE_CHROME_PANEL_CLASS } from "@/lib/site-chrome"

type Props = {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (value: string) => void
  products: SearchSuggestionProduct[]
  brands?: SearchSuggestionBrand[]
  categories?: SearchSuggestionCategory[]
  suggestionsLoading: boolean
  topSearches: TopSearchChip[]
  bestSellers: SearchSuggestionProduct[]
  emptyLoading: boolean
  hideForm?: boolean
}

export default function MobileSearchOverlay({
  open,
  onClose,
  query,
  onQueryChange,
  products,
  brands = [],
  categories = [],
  suggestionsLoading,
  topSearches,
  bestSellers,
  emptyLoading,
  hideForm = false,
}: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [isWideViewport, setIsWideViewport] = useState(false)

  useEffect(() => {
    const update = () => setIsWideViewport(window.innerWidth >= 768)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const useDesktopBranch = hideForm && isWideViewport

  useEffect(() => {
    if (!open) {
      setInputFocused(false)
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
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
  const showTypewriter = open && !inputFocused && query.length === 0

  const overlayContent = (
    <>
      {!useDesktopBranch && (
        <div className="shrink-0 pt-8 pb-2 md:pt-10 md:pb-4">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-4 border-b border-neutral-900 pb-3 md:pb-4"
          >
            <Search className="h-6 w-6 shrink-0 text-neutral-900" strokeWidth={1.5} />
            <div className="relative min-w-0 flex-1">
              <SearchTypewriter
                active={showTypewriter}
                className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-base tracking-wide text-neutral-400 md:text-[17px]"
              />
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => {
                  if (query.length === 0) setInputFocused(false)
                }}
                placeholder=""
                className="navbar-search-input relative z-[1] w-full min-w-0 bg-transparent text-base tracking-wide text-neutral-900 outline-none md:text-[17px]"
                aria-label="Buscar productos"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (query.length > 0) {
                  onQueryChange("")
                } else {
                  onClose()
                }
              }}
              className="inline-flex shrink-0 items-center justify-center p-1 text-neutral-900 transition-colors hover:text-[#c6a75e]"
              aria-label={query.length > 0 ? "Limpiar búsqueda" : "Cerrar búsqueda"}
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}

      <div
        className={`${
          useDesktopBranch
            ? "py-6"
            : "min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        }`}
      >
        {isEmpty ? (
          <EmptyStatePanel
            topSearches={topSearches}
            bestSellers={bestSellers}
            loading={emptyLoading}
            onClose={onClose}
            variant={useDesktopBranch ? "desktop-dropdown" : "mobile"}
          />
        ) : (
          <SearchSuggestionsContent
            query={query}
            products={products}
            brands={brands}
            categories={categories}
            loading={suggestionsLoading}
            onClose={onClose}
            variant={useDesktopBranch ? "desktop-dropdown" : "mobile"}
          />
        )}
      </div>
    </>
  )

  if (useDesktopBranch) {
    return (
      <div
        className={`bg-white transition-opacity will-change-[opacity] ${
          open
            ? "opacity-100 pointer-events-auto duration-200 ease-out"
            : "opacity-0 pointer-events-none duration-150 ease-in"
        }`}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 56,
          zIndex: 51,
          maxHeight: "calc(100vh - 56px - 40px)",
          overflowY: "auto",
          overflowX: "hidden",
        }}
        aria-hidden={!open}
      >
        <div className="mx-auto w-full max-w-[1600px] px-6 lg:px-10">
          {overlayContent}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${MOBILE_CHROME_PANEL_CLASS} z-40 flex flex-col overflow-x-hidden bg-white transition-opacity will-change-[opacity] ${
        open
          ? "opacity-100 pointer-events-auto duration-200 ease-out"
          : "opacity-0 pointer-events-none duration-150 ease-in"
      }`}
      aria-hidden={!open}
    >
      <div className={`${SITE_CONTAINER_CLASS} flex min-h-0 flex-1 flex-col`}>
        {overlayContent}
      </div>
    </div>
  )
}
