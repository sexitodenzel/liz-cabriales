"use client"

import Link from "next/link"
import { useState } from "react"
import type { ProductWithCategory } from "@/lib/supabase/products"
import AddToCartButton from "./AddToCartButton"

type Props = { product: ProductWithCategory }

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ProductCard({ product }: Props) {
  const brand = product.brand ?? "Sin marca"
  const images = product.images ?? []
  const initials = brand
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")

  const [imgIndex, setImgIndex] = useState(0)
  const hasMultiple = images.length > 1
  const currentImage = images[imgIndex] ?? null

  const activeVariants = (product.variants ?? []).filter(
    (variant) => variant.is_active
  )
  const hasMultipleVariants = activeVariants.length > 1

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    setImgIndex((i) => (i - 1 + images.length) % images.length)
  }

  function next(e: React.MouseEvent) {
    e.preventDefault()
    setImgIndex((i) => (i + 1) % images.length)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg sm:rounded-xl border border-neutral-200 bg-white shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/tienda/${product.slug}`} className="block">
        <div className="relative bg-neutral-100">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt={product.name}
              className="h-36 w-full object-cover transition-opacity duration-200 sm:h-64"
            />
          ) : (
            <div className="flex h-36 w-full items-center justify-center bg-neutral-100 text-3xl font-semibold text-neutral-400 sm:h-64">
              {initials || "LC"}
            </div>
          )}

          <div className="absolute left-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#C9A84C] sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
            {brand}
          </div>

          {hasMultiple && (
            <>
              <button
                onClick={prev}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/75"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={next}
                aria-label="Siguiente imagen"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/75"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`block h-1.5 w-1.5 rounded-full transition-colors duration-200 ${
                      i === imgIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-3 sm:p-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 sm:text-xs sm:tracking-[0.18em]">
            {product.category.name}
          </p>
          <h3 className="mt-0.5 text-xs font-medium leading-snug text-[#0a0a0a] sm:mt-1 sm:text-sm">
            {product.name}
          </h3>
        </div>

        <p className="text-sm font-semibold text-[#C9A84C] sm:text-lg">
          {formatPrice(product.base_price)}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
          {hasMultipleVariants ? (
            <Link
              href={`/tienda/${product.slug}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#C9A84C] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] transition-colors duration-200 hover:bg-[#b8952f] sm:px-4 sm:py-2.5 sm:text-[11px] sm:tracking-[0.2em]"
            >
              Elegir presentación
            </Link>
          ) : (
            <AddToCartButton
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              brand={product.brand ?? null}
              image={currentImage}
              basePrice={product.base_price}
              variants={product.variants ?? []}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#C9A84C] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] transition-colors duration-200 hover:bg-[#b8952f] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-[11px] sm:tracking-[0.2em]"
            />
          )}
        </div>
      </div>
    </article>
  )
}
