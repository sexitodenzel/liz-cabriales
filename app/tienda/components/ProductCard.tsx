"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { ProductWithCategory } from "@/lib/supabase/products"
import AddToCartButton from "./AddToCartButton"
import NotifyWhenAvailable from "./NotifyWhenAvailable"

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
  const isOutOfStock =
    activeVariants.length === 0 ||
    activeVariants.every((variant) => variant.stock <= 0)

  const imagePillClassName =
    "rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide sm:px-3 sm:py-1 sm:text-xs"

  const cardButtonClassName =
    "inline-flex w-full items-center justify-center rounded-full bg-[#C9A84C] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#0a0a0a] transition-colors duration-200 hover:bg-[#b8952f] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-60 sm:px-4 sm:py-2.5 sm:text-[11px] sm:tracking-[0.2em]"

  const singleVariant = activeVariants.length === 1 ? activeVariants[0] : null

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex((i) => (i - 1 + images.length) % images.length)
  }

  function next(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setImgIndex((i) => (i + 1) % images.length)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg sm:rounded-xl border border-neutral-200 bg-white shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-neutral-100 sm:h-64">
        <Link href={`/tienda/${product.slug}`} className="block h-full">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover transition-opacity duration-200"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-neutral-400">
              {initials || "LC"}
            </div>
          )}

          <div
            className={`absolute left-2 top-2 ${imagePillClassName} text-[#C9A84C] sm:left-3 sm:top-3`}
          >
            {brand}
          </div>

          {isOutOfStock ? (
            <div
              className={`absolute right-2 top-2 ${imagePillClassName} text-red-400 sm:right-3 sm:top-3`}
            >
              Agotado
            </div>
          ) : null}

          {hasMultiple ? (
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full bg-[var(--gold)] transition-all duration-200 ${
                    i === imgIndex
                      ? "h-2 w-2 opacity-100"
                      : "h-1.5 w-1.5 opacity-45"
                  }`}
                />
              ))}
            </div>
          ) : null}
        </Link>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-200 hover:bg-black/75 sm:left-3"
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
              type="button"
              onClick={next}
              aria-label="Siguiente imagen"
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-200 hover:bg-black/75 sm:right-3"
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
          </>
        ) : null}
      </div>

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
          ) : isOutOfStock && singleVariant ? (
            <NotifyWhenAvailable
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              variantId={singleVariant.id}
              outOfStock
              className={cardButtonClassName}
            />
          ) : (
            <AddToCartButton
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              brand={product.brand ?? null}
              image={currentImage}
              basePrice={product.base_price}
              variants={product.variants ?? []}
              className={cardButtonClassName}
            />
          )}
        </div>
      </div>
    </article>
  )
}
