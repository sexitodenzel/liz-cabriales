/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { SearchSuggestionProduct } from "../SearchBarPanels"

type BestSellersMegaMenuProps = {
  isOpen: boolean
  products: SearchSuggestionProduct[]
  loading: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function BestSellersMegaMenu({
  isOpen,
  products,
  loading,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: BestSellersMegaMenuProps) {
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

  const tiles = products.slice(0, 5)

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: "var(--navbar-actual-h)" }}
      className={`
        fixed left-0 right-0 z-40 hidden md:block
        overflow-hidden bg-white border-t border-neutral-200
        shadow-[0_16px_40px_rgba(0,0,0,0.06)]
        transition-opacity ease-out
        ${isOpen
          ? "visible opacity-100 pointer-events-auto duration-300"
          : "invisible opacity-0 pointer-events-none duration-200"
        }
      `}
    >
      <div className="site-container py-8">
        <div className="mb-6 flex items-baseline justify-between">
          <Link
            href="/tienda/mas-vendidos"
            onClick={onClose}
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A75E] hover:opacity-80 transition-opacity"
          >
            Ver todos los más vendidos
          </Link>
        </div>

        <div className="grid grid-cols-6 gap-x-4 lg:gap-x-6 [contain:paint]">
          {loading && tiles.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2"
                >
                  <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-neutral-100" />
                  <div className="h-3 w-3/4 animate-pulse rounded-sm bg-neutral-100" />
                </div>
              ))
            : tiles.map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/tienda/${product.slug}`}
                  onClick={onClose}
                  className={`
                    group flex flex-col gap-2
                    transition-opacity duration-300 ease-out
                    ${contentVisible ? "opacity-100" : "opacity-0"}
                  `}
                  style={{ transitionDelay: `${idx * 40}ms` }}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 1024px) 14vw, 200px"
                        className="object-cover transition-[filter] duration-300 ease-out group-hover:brightness-[0.97]"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="line-clamp-2 text-[13px] font-medium leading-snug text-[#1a1a1a] group-hover:text-[#C6A75E] transition-colors">
                      {product.name}
                    </span>
                    <span className="text-[12px] text-neutral-500">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </Link>
              ))}

          {/* Tile "Ver todos" */}
          <Link
            href="/tienda/mas-vendidos"
            onClick={onClose}
            className={`
              group flex flex-col gap-2
              transition-opacity duration-300 ease-out
              ${contentVisible ? "opacity-100" : "opacity-0"}
            `}
            style={{ transitionDelay: `${tiles.length * 40}ms` }}
          >
            <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-sm bg-[#f1ece4] transition-colors duration-300 group-hover:bg-[#ece5d6]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A75E]">
                Ver todo
              </span>
            </div>
            <span className="text-[13px] font-medium leading-snug text-[#1a1a1a]">
              Todos los más vendidos
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
