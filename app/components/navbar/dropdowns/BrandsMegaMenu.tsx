/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import type { BrandMenuItem } from "@/lib/navbar/brands-category"

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
      style={{ maxHeight: "calc(100vh - var(--navbar-actual-h) - 80px)" }}
      className={`
        megamenu-hover-bridge absolute left-0 right-0 top-full z-40 hidden md:block
        overflow-y-auto bg-white border-t border-neutral-200
        transition-opacity ease-out
        ${isOpen
          ? "opacity-100 pointer-events-auto duration-300"
          : "opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div className="site-container py-10">
        <div className="mb-6">
          <Link
            href="/tienda"
            onClick={onClose}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A75E] hover:opacity-80 transition-opacity"
          >
            Ver toda la tienda
          </Link>
        </div>

        {sortedBrands.length === 0 ? (
          <p className="py-6 text-[14px] text-neutral-500">
            Cargando marcas…
          </p>
        ) : (
          <ul className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-3">
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
                  className="block text-[14px] text-neutral-700 hover:text-[#C6A75E] transition-colors"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
