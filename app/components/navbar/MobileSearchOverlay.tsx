"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { Search, X } from "lucide-react"

import {
  SearchEmptyPanel,
  SearchResultsPanel,
  searchOptionDomId,
  type SearchSuggestionProduct,
  type TopSearchChip,
} from "./SearchBarPanels"
import type { SearchItem, SearchPayload } from "@/lib/search/types"
import { SITE_CONTAINER_CLASS } from "@/lib/site-shell"
import { MOBILE_CHROME_PANEL_CLASS } from "@/lib/site-chrome"
import { SearchTypewriter } from "./SearchTypewriter"

type Props = {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (value: string) => void
  payload: SearchPayload | null
  suggestionsLoading: boolean
  activeId: string | null
  onSelectSuggestion: (item: SearchItem) => void
  onSubmit: () => void
  onSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void
  recentSearches: string[]
  onPickRecent: (value: string) => void
  onClearRecent: () => void
  topSearches: TopSearchChip[]
  bestSellers: SearchSuggestionProduct[]
  emptyLoading: boolean
  /**
   * true en desktop ancho: la búsqueda baja como panel pegado al navbar en vez
   * de la cortina a pantalla completa. En ambos casos el campo vive AQUÍ — el
   * navbar solo tiene la lupa que abre/cierra.
   */
  dropdown?: boolean
}

export default function MobileSearchOverlay({
  open,
  onClose,
  query,
  onQueryChange,
  payload,
  suggestionsLoading,
  activeId,
  onSelectSuggestion,
  onSubmit,
  onSearchKeyDown,
  recentSearches,
  onPickRecent,
  onClearRecent,
  topSearches,
  bestSellers,
  emptyLoading,
  dropdown = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isWideViewport, setIsWideViewport] = useState(false)

  useEffect(() => {
    const update = () => setIsWideViewport(window.innerWidth >= 768)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const useDesktopBranch = dropdown && isWideViewport

  useEffect(() => {
    if (!open) return
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

  // El campo vive aquí en las dos variantes, así que el foco al abrir también.
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 220)
    return () => window.clearTimeout(timer)
  }, [open])

  // La selección con teclado puede caer fuera de la vista en listas largas.
  useEffect(() => {
    if (!activeId) return
    const node = document.getElementById(searchOptionDomId(activeId))
    node?.scrollIntoView({ block: "nearest" })
  }, [activeId])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit()
  }

  const isEmptyQuery = query.trim().length < 2
  const variant = useDesktopBranch ? "overlay" : "mobile"

  const panel = isEmptyQuery ? (
    <SearchEmptyPanel
      variant={variant}
      recent={recentSearches}
      topSearches={topSearches}
      bestSellers={bestSellers}
      loading={emptyLoading}
      // Tras elegir una reciente el foco vuelve al campo, que ahora vive aquí.
      onPickRecent={(value) => {
        onPickRecent(value)
        inputRef.current?.focus()
      }}
      onClearRecent={onClearRecent}
      onClose={onClose}
    />
  ) : (
    <SearchResultsPanel
      query={query}
      payload={payload}
      loading={suggestionsLoading}
      variant={variant}
      activeId={activeId}
      onSelect={onSelectSuggestion}
      onSubmit={onSubmit}
    />
  )

  const overlayContent = (
    <>
      {/* En desktop la X se separa del campo y se va al extremo derecho (como
          la referencia de OPI); en móvil sigue pegada al final del renglón. */}
      <div
        className={
          useDesktopBranch
            ? "shrink-0 pt-10 pb-2"
            : "shrink-0 pt-8 pb-2 md:pt-10 md:pb-4"
        }
      >
        {/* Desktop: se centra el CAMPO (márgenes idénticos a izquierda y
            derecha, tope de 900px como en la referencia) y la X se saca del
            flujo pegada al borde derecho. Si la X fuera parte del grupo
            centrado, empujaría el campo media X hacia la izquierda y dejaría de
            estar centrado. Móvil sigue a ancho completo dentro de la cortina. */}
        <form
          onSubmit={handleSubmit}
          className={
            useDesktopBranch
              ? "relative flex items-center justify-center"
              : "flex items-center gap-4 border-b border-neutral-900 pb-3 md:pb-4"
          }
        >
          <div
            className={
              useDesktopBranch
                ? "flex w-full min-w-0 max-w-[900px] items-center gap-4 border-b border-neutral-900 pb-3"
                : "flex min-w-0 flex-1 items-center gap-4"
            }
          >
            <Search className="h-6 w-6 shrink-0 text-neutral-900" strokeWidth={1.5} />
            <div className="relative min-w-0 flex-1">
              {/* El typewriter era el placeholder animado del navbar; se muda
                  con el campo para no perderlo al sacarlo de la barra. */}
              {useDesktopBranch && (
                <SearchTypewriter
                  active={query.length === 0}
                  className="navbar-search-typewriter pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden whitespace-nowrap text-base tracking-wide text-neutral-400 md:text-[17px]"
                />
              )}
              <input
                ref={inputRef}
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder={useDesktopBranch ? "" : "Productos, cursos, servicios…"}
                className="navbar-search-input relative z-[1] w-full min-w-0 bg-transparent text-base tracking-wide text-neutral-900 outline-none placeholder:text-neutral-400 md:text-[17px]"
                aria-label="Buscar productos, cursos y servicios"
                role="combobox"
                aria-expanded={open}
                aria-controls="search-suggestions-panel"
                aria-autocomplete="list"
                aria-activedescendant={
                  activeId ? searchOptionDomId(activeId) : undefined
                }
              />
            </div>
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
            className={`inline-flex shrink-0 items-center justify-center p-1 text-neutral-900 transition-colors hover:text-[#c6a75e] ${
              useDesktopBranch ? "absolute right-0 top-1/2 -translate-y-1/2" : ""
            }`}
            aria-label={query.length > 0 ? "Limpiar búsqueda" : "Cerrar búsqueda"}
          >
            <X className="h-6 w-6" strokeWidth={1.5} />
          </button>
        </form>
      </div>

      <div
        id="search-suggestions-panel"
        className={
          useDesktopBranch
            ? "py-2"
            : "min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        }
      >
        {panel}
      </div>
    </>
  )

  if (useDesktopBranch) {
    return (
      <div
        className={`bg-ivory transition-opacity will-change-[opacity] ${
          open
            ? "opacity-100 pointer-events-auto duration-200 ease-out"
            : "opacity-0 pointer-events-none duration-150 ease-in"
        }`}
        // Se ancla al borde inferior REAL del chrome (--site-chrome-bottom
        // sigue la compresión de la barra de anuncios). Antes iba clavado a
        // 56px, heredado del navbar de dos filas: con el chrome actual dejaba
        // el panel metido bajo la barra.
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: "var(--site-chrome-bottom, var(--navbar-actual-h))",
          zIndex: 51,
          maxHeight:
            "calc(100vh - var(--site-chrome-bottom, var(--navbar-actual-h)) - 40px)",
          overflowY: "auto",
          overflowX: "hidden",
          // Si el panel desborda, su scrollbar se come el ancho por un lado y
          // descentra el campo ~7px. Reservando el carril en AMBOS bordes el
          // centro no se mueve haya scroll o no.
          scrollbarGutter: "stable both-edges",
        }}
        aria-hidden={!open}
        // Sigue montada al cerrarse (para la transición): sin inert, sus
        // enlaces quedarían en el recorrido del tabulador.
        inert={!open}
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
      inert={!open}
    >
      <div className={`${SITE_CONTAINER_CLASS} flex min-h-0 flex-1 flex-col`}>
        {overlayContent}
      </div>
    </div>
  )
}
