"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import type { TiendaCategory } from "../menuData"

type ServiciosMegaMenuProps = {
  isOpen: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function ServiciosMegaMenu({
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: ServiciosMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)
  const [categories, setCategories] = useState<TiendaCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  // Trae las categorías AL MONTAR (no al abrir): el megamenú está siempre
  // montado, así que los datos ya están listos antes del primer hover y no se
  // vuelve a pedir a la red cada vez que se abre (que era la causa del skeleton
  // en cada hover). Mismo patrón que AcademiaMegaMenu.
  useEffect(() => {
    let isMounted = true
    void fetch("/api/navbar/servicios-menu")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: TiendaCategory[] } | null) => {
        if (!isMounted) return
        setCategories(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => {
        if (isMounted) setCategories([])
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    setContentVisible(false)
    const raf = requestAnimationFrame(() => setContentVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Categoría por defecto: la primera con servicios (para que el panel derecho
  // no abra vacío). Si ninguna tiene, la primera de la lista.
  const defaultSlug = useMemo(() => {
    const withSubs = categories.find((c) => c.subcategories.length > 0)
    return (withSubs ?? categories[0])?.slug ?? null
  }, [categories])

  useEffect(() => {
    setActiveSlug(defaultSlug)
  }, [defaultSlug])

  const activeCat = useMemo(() => {
    const match = categories.find((c) => c.slug === activeSlug)
    return match ?? categories.find((c) => c.slug === defaultSlug) ?? null
  }, [categories, activeSlug, defaultSlug])

  const visibleSubs = activeCat?.subcategories ?? []
  // Placeholders etiquetados: los servicios de la categoría activa (o la propia
  // categoría si no tiene servicios). Cuando llegue el contenido de nail art /
  // fotos de servicios, se cambia el fondo de estos tiles por la imagen real.
  const tiles = (
    visibleSubs.length > 0
      ? visibleSubs.map((sub) => sub.label)
      : activeCat
        ? [activeCat.label]
        : []
  ).slice(0, 2)

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        bg-ivory border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div
        className={`
          site-container flex gap-0 pt-6 pb-8
          transition-opacity duration-300 ease-out
          ${contentVisible ? "opacity-100" : "opacity-0"}
        `}
      >
        {/* ===== Columna izquierda: categorías de servicio ===== */}
        <div className="w-60 shrink-0 border-r border-neutral-200 pr-6 lg:w-64">
          <Link
            href="/servicios"
            onClick={onClose}
            onMouseEnter={() => setActiveSlug(defaultSlug)}
            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e] transition-opacity hover:opacity-80"
          >
            Ver servicios
          </Link>

          {loading ? (
            <ul className="space-y-1 px-3 py-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="h-6 animate-pulse rounded-md bg-neutral-100" />
              ))}
            </ul>
          ) : (
            <ul className="-ml-3">
              {categories.map((cat) => {
                const isActive = cat.slug === activeCat?.slug
                return (
                  <li key={cat.slug}>
                    <Link
                      href={cat.href}
                      onClick={onClose}
                      onMouseEnter={() => setActiveSlug(cat.slug)}
                      onFocus={() => setActiveSlug(cat.slug)}
                      className={`
                        block rounded-md px-3 py-[7px] text-[13px] font-medium tracking-wide transition-colors
                        ${isActive
                          ? "bg-neutral-100 text-[#c6a75e]"
                          : "text-[#1a1a1a] hover:text-[#c6a75e]"
                        }
                      `}
                    >
                      {cat.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* ===== Panel derecho: servicios + placeholders etiquetados ===== */}
        <div className="relative min-h-[300px] flex-1 pl-8 lg:pl-12">
          {activeCat && (
            <div key={activeCat.slug} className="lc-mega-panel-in flex gap-10">
              {/* Servicios de la categoría activa */}
              <div className="min-w-0 flex-1">
                <Link
                  href={activeCat.href}
                  onClick={onClose}
                  className="mb-6 inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c6a75e] transition-opacity hover:opacity-80"
                >
                  Ver todo en {activeCat.label}
                </Link>

                {visibleSubs.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-x-10 gap-y-3 lg:grid-cols-3">
                    {visibleSubs.map((sub) => (
                      <li key={sub.label}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className="block py-1 text-[14px] text-neutral-700 transition-colors hover:text-[#c6a75e] line-clamp-1"
                        >
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="max-w-sm text-[14px] leading-relaxed text-neutral-500">
                    Agenda tu cita en{" "}
                    <span className="text-neutral-700">{activeCat.label}</span>.
                  </p>
                )}
              </div>

              {/* Mismo panel/tamaño que AcademiaMegaMenu (w-[340px], gap-4, 4/5). */}
              {tiles.length > 0 && (
                <div className="w-[340px] shrink-0 border-l border-neutral-200 pl-10">
                  <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Nuestros servicios
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {tiles.map((label) => (
                      <ServicePlaceholderTile key={label} label={label} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Tile placeholder — misma caja que FlyerCard de AcademiaMegaMenu
 * (aspect 4/5, rounded-md, título debajo). Cuando lleguen fotos reales,
 * sustituir el fondo por <SmoothImage>.
 */
function ServicePlaceholderTile({ label }: { label: string }) {
  return (
    <div className="group block w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-neutral-100">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200" />
        <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-600">
          Próximamente
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#1a1a1a] line-clamp-2">
        {label}
      </p>
    </div>
  )
}
