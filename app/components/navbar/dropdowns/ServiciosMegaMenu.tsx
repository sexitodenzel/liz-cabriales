"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import SmoothImage from "@/app/components/shared/SmoothImage"
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
  const [gallery, setGallery] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  // Trae categorías + galería Media al montar (mismo patrón que AcademiaMegaMenu).
  useEffect(() => {
    let isMounted = true
    void fetch("/api/navbar/servicios-menu")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          json: {
            data?: { categories?: TiendaCategory[]; gallery?: string[] } | TiendaCategory[]
          } | null
        ) => {
          if (!isMounted) return
          const payload = json?.data
          // Compat: respuesta antigua era un array de categorías.
          if (Array.isArray(payload)) {
            setCategories(payload)
            setGallery([])
            return
          }
          setCategories(Array.isArray(payload?.categories) ? payload.categories : [])
          setGallery(Array.isArray(payload?.gallery) ? payload.gallery : [])
        }
      )
      .catch(() => {
        if (isMounted) {
          setCategories([])
          setGallery([])
        }
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

  // Galería fija (2 fotos Media): no se remonta al cambiar filtros.
  const galleryTiles = useMemo(
    () =>
      gallery.slice(0, 2).map((image, i) => ({
        key: `servicios-gallery-${i}`,
        image,
        href: "/servicios" as const,
      })),
    [gallery]
  )

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
          : "opacity-0 pointer-events-none duration-100"
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

        <div className="relative min-h-[300px] flex-1 pl-8 lg:pl-12">
          <div className="flex gap-10">
            <div className="min-w-0 flex-1">
              {activeCat ? (
                <div key={activeCat.slug} className="lc-mega-panel-in">
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
              ) : null}
            </div>

            {galleryTiles.length > 0 ? (
              <div className="w-[340px] shrink-0 border-l border-neutral-200 pl-10">
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Nuestros servicios
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {galleryTiles.map((tile) => (
                    <ServiceImageTile
                      key={tile.key}
                      href={tile.href}
                      image={tile.image}
                      onClose={onClose}
                    />
                  ))}
                </div>
                <p className="mt-2 text-center text-[12px] leading-snug text-[#1a1a1a]">
                  Nuestros trabajos
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceImageTile({
  href,
  image,
  onClose,
}: {
  href: string
  image: string
  onClose: () => void
}) {
  return (
    <Link href={href} onClick={onClose} className="group block w-full">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-neutral-100">
        {image ? (
          <SmoothImage
            src={image}
            alt="Nuestros trabajos"
            fill
            sizes="160px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-neutral-200" />
        )}
      </div>
    </Link>
  )
}
