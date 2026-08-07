import type { Metadata } from "next"
import Link from "next/link"

import Breadcrumb from "@/components/shared/Breadcrumb"
import Eyebrow from "@/app/components/ui/Eyebrow"
import ProductCard from "@/app/tienda/components/ProductCard"
import { getSearchIndex } from "@/lib/search/catalog"
import { groupHits, searchDocs, type SearchDoc } from "@/lib/search/engine"
import { getStoreSearchDestination } from "@/lib/search-navigation"
import { getAllProductsCached } from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"

/**
 * Resultados unificados. Antes el Enter del buscador caía siempre en /tienda,
 * así que buscar un servicio o un curso terminaba en una cuadrícula vacía.
 * Aquí se responde con todo lo que el sitio ofrece para esa consulta.
 */

export const metadata: Metadata = {
  title: "Buscar | Liz Cabriales",
  robots: { index: false, follow: true },
}

const LIMITS = {
  product: 36,
  course: 8,
  service: 10,
  category: 10,
  brand: 8,
  page: 4,
} as const

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value[0] ?? ""
  return ""
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const CHIP_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-[13px] text-neutral-800 transition-colors hover:border-[#c6a75e] hover:text-gold"

const SECTION_TITLE_CLASS =
  "font-display text-[22px] font-medium tracking-[-0.01em] text-[#111] sm:text-[26px]"

/** Tarjeta simple para cursos y servicios (no comparten card con productos). */
function ResultCard({ doc }: { doc: SearchDoc }) {
  return (
    <Link
      href={doc.href}
      className="group flex gap-4 rounded-xl border border-neutral-200 bg-white p-3 transition-shadow hover:shadow-md"
    >
      <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        {doc.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-neutral-500">
            LC
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="line-clamp-2 text-[15px] font-medium leading-snug text-[#1a1a1a] transition-colors group-hover:text-gold">
          {doc.title}
        </span>
        {doc.meta ? (
          <span className="mt-1 block truncate text-[12px] text-neutral-500">
            {doc.meta}
          </span>
        ) : null}
        {doc.price !== null ? (
          <span className="mt-1 block text-[13px] font-semibold text-gold">
            {formatPrice(doc.price)}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const sp = await searchParams
  const query = firstString(sp.q).trim().slice(0, 80)

  const [index, productsResult] = await Promise.all([
    getSearchIndex(),
    getAllProductsCached(),
  ])

  const hits = query.length >= 2 ? searchDocs(index, query) : []
  const groups = groupHits(hits, LIMITS)

  // Los productos se pintan con la misma tarjeta que la tienda (carrito,
  // favoritos, variantes), así que se resuelven contra el catálogo completo.
  const productsById = new Map<string, ProductWithCategory>(
    (productsResult.data ?? []).map((product) => [product.id, product])
  )
  const products = groups.product
    .map((doc) => productsById.get(doc.id.replace(/^product:/, "")))
    .filter((product): product is ProductWithCategory => Boolean(product))

  const quickLinks = [...groups.category, ...groups.brand, ...groups.page]
  const hasResults =
    products.length > 0 ||
    groups.course.length > 0 ||
    groups.service.length > 0 ||
    quickLinks.length > 0

  return (
    <main className="min-h-screen bg-ivory text-[#0a0a0a]">
      <div className="site-container pb-16 pt-5 max-lg:pt-3">
        <Breadcrumb
          items={[{ label: "Inicio", href: "/" }, { label: "Búsqueda" }]}
          className="mb-4 hidden lg:flex"
        />

        <header className="mb-8 border-b border-neutral-200 pb-6">
          <Eyebrow>Búsqueda</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            {query ? `“${query}”` : "¿Qué estás buscando?"}
          </h1>
          {query ? (
            <p className="mt-2 text-[14px] text-neutral-600">
              {hits.length === 0
                ? "Sin coincidencias"
                : `${hits.length} ${hits.length === 1 ? "resultado" : "resultados"} en productos, cursos, servicios y categorías`}
            </p>
          ) : (
            <p className="mt-2 text-[14px] text-neutral-600">
              Escribe en el buscador del menú: encuentra productos, cursos,
              servicios del estudio, categorías y marcas.
            </p>
          )}
        </header>

        {query.length >= 2 && !hasResults ? (
          <section className="py-6">
            <p className="text-[15px] text-neutral-700">
              No encontramos nada para <span className="font-medium">«{query}»</span>.
            </p>
            <p className="mt-1 text-[14px] text-neutral-500">
              Revisa la escritura o prueba con una palabra más general (por
              ejemplo “gel”, “lima”, “curso” o “manicura”).
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/tienda" className={CHIP_CLASS}>
                Ver toda la tienda
              </Link>
              <Link href="/academia" className={CHIP_CLASS}>
                Ver cursos
              </Link>
              <Link href="/servicios" className={CHIP_CLASS}>
                Ver servicios
              </Link>
            </div>
          </section>
        ) : null}

        {quickLinks.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Ir directo a
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((doc) => (
                <Link key={doc.id} href={doc.href} className={CHIP_CLASS}>
                  {doc.title}
                  <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                    {doc.type === "brand"
                      ? "Marca"
                      : doc.type === "page"
                        ? "Sección"
                        : "Categoría"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {groups.service.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className={SECTION_TITLE_CLASS}>Servicios del estudio</h2>
              <Link
                href="/servicios"
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-gold"
              >
                Ver todos
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.service.map((doc) => (
                <ResultCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        )}

        {groups.course.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className={SECTION_TITLE_CLASS}>Cursos y eventos</h2>
              <Link
                href="/academia"
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-gold"
              >
                Ver academia
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.course.map((doc) => (
                <ResultCard key={doc.id} doc={doc} />
              ))}
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className={SECTION_TITLE_CLASS}>Productos</h2>
              <Link
                href={getStoreSearchDestination(query)}
                className="text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-700 underline decoration-neutral-400 underline-offset-[5px] transition-colors hover:text-gold"
              >
                Filtrar en la tienda
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
