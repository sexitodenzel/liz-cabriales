/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { BrandMenuItem } from "@/lib/navbar/brands-category"

// Sellos de confianza que validan las marcas de la distribuidora. Iconos SVG
// inline (sin dependencias externas) con el dorado de marca.
const TRUST_ITEMS = [
  {
    title: "Producto 100% original",
    desc: "Marcas auténticas, sin réplicas",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <path d="M12 3l7 2.6v5.1c0 4.3-2.9 7.3-7 8.7-4.1-1.4-7-4.4-7-8.7V5.6L12 3z" />
        <path d="M9.2 12l2 2 3.6-3.8" />
      </svg>
    ),
  },
  {
    title: "Distribuidor autorizado",
    desc: "Respaldo directo de cada marca",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <circle cx="12" cy="9.5" r="6" />
        <path d="M9.4 9.5l1.9 1.9 3.4-3.6" />
        <path d="M8.6 15L7 21.5l5-2.4 5 2.4L15.4 15" />
      </svg>
    ),
  },
  {
    title: "Compra protegida",
    desc: "Envíos seguros y rastreables",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <path d="M3 6.5h10v9H3z" />
        <path d="M13 9.5h4l3 3v3h-7z" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Asesoría profesional",
    desc: "Te guiamos en cada compra",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <path d="M20 12a7 7 0 0 1-9.6 6.5L4 20l1.6-4.1A7 7 0 1 1 20 12z" />
        <path d="M8.5 11.5h7M8.5 14h4.5" />
      </svg>
    ),
  },
] as const

type BrandsMegaMenuProps = {
  isOpen: boolean
  brands: BrandMenuItem[]
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export default function BrandsMegaMenu({
  isOpen,
  brands,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: BrandsMegaMenuProps) {
  const [contentVisible, setContentVisible] = useState(false)

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

  const sortedBrands = useMemo(
    () => [...brands].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [brands]
  )

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        overflow-hidden bg-ivory border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div className="site-container flex min-h-[360px] gap-0 pt-6 pb-8">
        {/* ===== Columna izquierda: grid de marcas ===== */}
        <div className="flex min-w-0 flex-1 flex-col pr-8 lg:pr-12">
          <div className="mb-6">
            <Link
              href="/tienda"
              onClick={onClose}
              className="flex w-fit items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e] hover:opacity-80 transition-opacity"
            >
              Ver toda la tienda
            </Link>
          </div>

          {sortedBrands.length === 0 ? (
            <p className="py-6 text-[14px] text-neutral-500">
              Cargando marcas…
            </p>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-3.5">
              {sortedBrands.map((brand, idx) => (
                <li
                  key={brand.slug}
                  className={`
                    transition-opacity duration-300 ease-out
                    ${contentVisible ? "opacity-100" : "opacity-0"}
                  `}
                  style={{ transitionDelay: `${Math.min(idx * 15, 300)}ms` }}
                >
                  <Link
                    href={`/tienda?marca=${encodeURIComponent(brand.name)}`}
                    onClick={onClose}
                    className="group flex items-center gap-2.5 text-[14px] text-neutral-700 hover:text-[#c6a75e] transition-colors"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                      {brand.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brand.logo_url}
                          alt=""
                          aria-hidden
                          className="h-full w-full object-contain p-0.5"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="text-[11px] font-semibold uppercase text-neutral-400"
                        >
                          {brand.name.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="truncate">{brand.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ===== Columna derecha: sellos de confianza (distribuidos en el alto,
             como los flyers de Academia) ===== */}
        <div className="hidden w-[260px] shrink-0 flex-col border-l border-neutral-200 pl-10 lg:flex">
          <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Distribuidora oficial
          </p>
          <ul className="flex flex-1 flex-col justify-between gap-5">
            {TRUST_ITEMS.map((item, idx) => (
              <li
                key={item.title}
                className={`
                  flex items-start gap-3.5
                  transition-opacity duration-300 ease-out
                  ${contentVisible ? "opacity-100" : "opacity-0"}
                `}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f1e6] text-[#c6a75e]">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1a1a1a]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-neutral-500">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/**
 * Tile editorial — mismo footprint que el FlyerCard de AcademiaMegaMenu
 * (aspect 4/5, rounded-md, caption debajo) pero sin imagen: fondo con
 * degradado marfil→dorado tenue y texto de sello.
 */
function BrandNoteTile({
  overline,
  title,
  caption,
}: {
  overline: string
  title: string
  caption: string
}) {
  return (
    <div className="block w-full">
      <div className="relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-md bg-gradient-to-b from-[#f6f1e6] to-[#ece2ce] p-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#c6a75e]">
          {overline}
        </span>
        <span
          className="mt-1 text-[13px] font-medium leading-tight text-[#1a1a1a]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {title}
        </span>
      </div>
      <p className="mt-2 text-[12px] leading-snug text-[#1a1a1a] line-clamp-2">
        {caption}
      </p>
    </div>
  )
}
