"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Clock, Search, TrendingUp } from "lucide-react"

import { highlightSegments } from "@/lib/search/highlight"
import {
  SEARCH_TYPE_LABEL,
  isEmptyPayload,
  type SearchItem,
  type SearchPayload,
} from "@/lib/search/types"

/* ── Tipos compartidos con el navbar ─────────────────────────────────────── */

export type TopSearchChip = {
  id: string
  label: string
  href: string
}

/** Producto del estado vacío (endpoint /api/products/best-sellers). */
export type SearchSuggestionProduct = {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
}

export type SearchPanelVariant = "overlay" | "mobile"

/* ── Utilidades de presentación ──────────────────────────────────────────── */

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const HEADING_CLASS =
  "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500"

const PRICE_CLASS = "text-[13px] font-semibold text-gold"

/** Marca en negrita el tramo que la clienta ya escribió. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query)
  return (
    <>
      {segments.map((segment, index) =>
        segment.match ? (
          <strong key={index} className="font-semibold text-neutral-900">
            {segment.text}
          </strong>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  )
}

export function searchOptionDomId(id: string): string {
  return `search-option-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

/* ── Filas y tarjetas ────────────────────────────────────────────────────── */

type RowProps = {
  item: SearchItem
  query: string
  active: boolean
  onSelect: (item: SearchItem) => void
}

/** Fila de texto: categorías, marcas, servicios, cursos y secciones. */
function SuggestionRow({ item, query, active, onSelect }: RowProps) {
  return (
    <li>
      <Link
        id={searchOptionDomId(item.id)}
        role="option"
        aria-selected={active}
        href={item.href}
        onClick={() => onSelect(item)}
        className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
          active ? "bg-neutral-100" : "hover:bg-neutral-100"
        }`}
      >
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full border border-neutral-200 object-cover"
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-light text-neutral-700">
            <Highlighted text={item.title} query={query} />
          </span>
          {item.meta ? (
            <span className="mt-0.5 block truncate text-[11px] text-neutral-500">
              {item.meta}
              {item.price !== null ? ` · ${formatPrice(item.price)}` : ""}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-neutral-500">
          {SEARCH_TYPE_LABEL[item.type]}
        </span>
      </Link>
    </li>
  )
}

/** Tarjeta de producto del panel. */
function ProductCardMini({ item, query, active, onSelect }: RowProps) {
  return (
    <Link
      id={searchOptionDomId(item.id)}
      role="option"
      aria-selected={active}
      href={item.href}
      onClick={() => onSelect(item)}
      className={`group flex flex-col rounded-lg p-1.5 transition-colors ${
        active ? "bg-neutral-100" : "hover:bg-neutral-100"
      }`}
    >
      <span className="block aspect-square w-full overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-500">
            LC
          </span>
        )}
      </span>
      {item.subtitle ? (
        <span className="mt-1.5 block truncate text-[10px] uppercase tracking-[0.12em] text-neutral-500">
          {item.subtitle}
        </span>
      ) : null}
      <span className="mt-0.5 line-clamp-2 text-[12px] font-light leading-snug text-[#1a1a1a]">
        <Highlighted text={item.title} query={query} />
      </span>
      {item.price !== null ? (
        <span className={`mt-1 ${PRICE_CLASS}`}>{formatPrice(item.price)}</span>
      ) : null}
    </Link>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className={HEADING_CLASS}>{title}</h3>
      {children}
    </section>
  )
}

function RowsSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-8 animate-pulse rounded-lg bg-neutral-100" />
      ))}
    </div>
  )
}

function CardsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-square w-full animate-pulse rounded-md bg-neutral-100" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  )
}

/* ── Panel de resultados ─────────────────────────────────────────────────── */

type SearchResultsPanelProps = {
  query: string
  payload: SearchPayload | null
  loading: boolean
  variant: SearchPanelVariant
  activeId: string | null
  onSelect: (item: SearchItem) => void
  onSubmit: () => void
}

export function SearchResultsPanel({
  query,
  payload,
  loading,
  variant,
  activeId,
  onSelect,
  onSubmit,
}: SearchResultsPanelProps) {
  const trimmed = query.trim()
  const isMobile = variant === "mobile"
  const empty = isEmptyPayload(payload)

  if (empty && loading) {
    return (
      <div className={isMobile ? "pb-8 pt-5" : "pb-8 pt-6"}>
        <div
          className={
            isMobile ? "space-y-6" : "grid gap-x-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
          }
        >
          <RowsSkeleton />
          <CardsSkeleton count={isMobile ? 4 : 6} />
        </div>
      </div>
    )
  }

  if (empty) {
    return (
      <div className={isMobile ? "pb-10 pt-6" : "pb-10 pt-6"}>
        <p className="text-[15px] text-neutral-700">
          Sin resultados para <span className="font-medium">«{trimmed}»</span>
        </p>
        <p className="mt-1 text-[13px] text-neutral-500">
          Revisa la escritura o busca por marca, categoría o tipo de servicio.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#1a1a1a]"
        >
          Ver todos los resultados
        </button>
      </div>
    )
  }

  const data = payload as SearchPayload
  // Orden de lectura = orden que recorren las flechas (ver flattenPayload).
  const suggestions = [...data.categories, ...data.brands, ...data.pages]
  const hasProducts = data.products.length > 0

  const rows = (items: SearchItem[]) => (
    <ul className="-mx-2 flex flex-col" role="presentation">
      {items.map((item) => (
        <SuggestionRow
          key={item.id}
          item={item}
          query={trimmed}
          active={activeId === item.id}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )

  const leftColumn = (
    <div>
      {suggestions.length > 0 && (
        <Section title="Sugerencias">{rows(suggestions)}</Section>
      )}
      {data.services.length > 0 && (
        <Section title="Servicios del estudio">{rows(data.services)}</Section>
      )}
      {data.courses.length > 0 && (
        <Section title="Cursos">{rows(data.courses)}</Section>
      )}
    </div>
  )

  const productsColumn = hasProducts ? (
    <div>
      <h3 className={HEADING_CLASS}>Productos</h3>
      <div
        className={`-mx-1.5 grid gap-x-2 gap-y-3 ${
          isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
        }`}
      >
        {data.products.map((item) => (
          <ProductCardMini
            key={item.id}
            item={item}
            query={trimmed}
            active={activeId === item.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  ) : null

  const shown =
    suggestions.length +
    data.services.length +
    data.courses.length +
    data.products.length

  return (
    <div
      className={isMobile ? "pb-8 pt-5" : "pb-8 pt-6"}
      role="listbox"
      aria-label="Sugerencias de búsqueda"
    >
      {/* Lector de pantalla: sin esto, escribir no anuncia nada. */}
      <p className="sr-only" role="status" aria-live="polite">
        {`${shown} ${shown === 1 ? "sugerencia" : "sugerencias"} para ${trimmed}`}
      </p>
      <div
        className={
          isMobile
            ? "space-y-7"
            : "grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        }
      >
        {leftColumn}
        {productsColumn}
      </div>

      <div className={`mt-8 flex ${isMobile ? "justify-center" : "justify-start"}`}>
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#1a1a1a]"
        >
          Ver todos los resultados
          {data.total > 0 ? ` (${data.total})` : ""}
        </button>
      </div>
    </div>
  )
}

/* ── Estado vacío (aún sin escribir) ─────────────────────────────────────── */

const FALLBACK_LINKS: TopSearchChip[] = [
  { id: "fallback-tienda", label: "Tienda", href: "/tienda" },
  { id: "fallback-academia", label: "Academia", href: "/academia" },
  { id: "fallback-servicios", label: "Servicios", href: "/servicios" },
  { id: "fallback-ofertas", label: "Ofertas", href: "/tienda/ofertas" },
]

type SearchEmptyPanelProps = {
  variant: SearchPanelVariant
  recent: string[]
  topSearches: TopSearchChip[]
  bestSellers: SearchSuggestionProduct[]
  loading?: boolean
  onPickRecent: (value: string) => void
  onClearRecent: () => void
  onClose: () => void
}

export function SearchEmptyPanel({
  variant,
  recent,
  topSearches,
  bestSellers,
  loading = false,
  onPickRecent,
  onClearRecent,
  onClose,
}: SearchEmptyPanelProps) {
  const isMobile = variant === "mobile"
  const chips = topSearches.length > 0 ? topSearches : FALLBACK_LINKS

  return (
    <div className={isMobile ? "pb-8 pt-5" : "pb-8 pt-6"}>
      <div
        className={
          isMobile
            ? "space-y-7"
            : "grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]"
        }
      >
        <div>
          {recent.length > 0 && (
            <section className="mb-6">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className={`${HEADING_CLASS} mb-0`}>Búsquedas recientes</h3>
                <button
                  type="button"
                  onClick={onClearRecent}
                  className="text-[11px] text-neutral-500 underline underline-offset-[3px] transition-colors hover:text-gold"
                >
                  Borrar
                </button>
              </div>
              <ul className="-mx-2 flex flex-col">
                {recent.map((value) => (
                  <li key={value}>
                    <button
                      type="button"
                      onClick={() => onPickRecent(value)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-100"
                    >
                      <Clock
                        className="h-3.5 w-3.5 shrink-0 text-neutral-500"
                        strokeWidth={1.75}
                      />
                      <span className="truncate text-[14px] font-light text-neutral-700">
                        {value}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className={HEADING_CLASS}>
              {topSearches.length > 0 ? "Lo más buscado" : "Explorar"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.id}
                  href={chip.href}
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-800 transition-colors hover:border-[#c6a75e] hover:text-gold"
                >
                  <TrendingUp className="h-3 w-3 text-neutral-500" strokeWidth={2} />
                  {chip.label}
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div>
          <h3 className={HEADING_CLASS}>Más vendidos</h3>
          {loading && bestSellers.length === 0 ? (
            <CardsSkeleton count={isMobile ? 4 : 6} />
          ) : bestSellers.length > 0 ? (
            <div
              className={`-mx-1.5 grid gap-x-2 gap-y-3 ${
                isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {bestSellers.map((product) => (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  onClick={onClose}
                  className="group flex flex-col rounded-lg p-1.5 transition-colors hover:bg-neutral-100"
                >
                  <span className="block aspect-square w-full overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-500">
                        LC
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12px] font-light leading-snug text-[#1a1a1a]">
                    {product.name}
                  </span>
                  <span className={`mt-1 ${PRICE_CLASS}`}>
                    {formatPrice(product.price)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              href="/tienda"
              onClick={onClose}
              className="inline-flex items-center gap-2 text-[13px] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-gold"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
              Ver todo el catálogo
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
