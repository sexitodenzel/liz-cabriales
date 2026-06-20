"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { ProductWithCategory } from "@/lib/supabase/products"
import AddToCartButton from "./AddToCartButton"
import NotifyWhenAvailable from "./NotifyWhenAvailable"
import { Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"

type Props = {
  product: ProductWithCategory
  layout?: "grid" | "list"
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ProductCard({ product, layout = "grid" }: Props) {
  const { toggle, has, hydrated: wishlistHydrated } = useWishlist()
  const wishlisted = wishlistHydrated && has(product.slug)
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

  const imageNavButtonClassName =
    "absolute top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center text-black/70 transition-all duration-200 hover:text-black md:opacity-0 md:group-hover:opacity-100"

  const cardButtonClassName =
    "inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-200 hover:bg-[#C9A84C] hover:text-[#0a0a0a] hover:shadow-[0_0_14px_rgba(201,168,76,0.45)] active:bg-[#C9A84C] active:text-[#0a0a0a] active:shadow-[0_0_14px_rgba(201,168,76,0.45)] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-60 disabled:shadow-none sm:px-4 sm:py-2.5 sm:text-[11px] sm:tracking-[0.2em]"

  const singleVariant = activeVariants.length === 1 ? activeVariants[0] : null

  const actionButton =
    hasMultipleVariants ? (
      <Link href={`/tienda/${product.slug}`} className={cardButtonClassName}>
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
    )

  if (layout === "list") {
    const listActionButton =
      hasMultipleVariants ? (
        <Link href={`/tienda/${product.slug}`} className={cardButtonClassName}>
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
      )

    return (
      <article className="flex gap-5 border-b border-neutral-200 py-5 sm:gap-8 sm:py-7 md:gap-10 md:py-8">
        <Link
          href={`/tienda/${product.slug}`}
          className="relative h-36 w-36 shrink-0 overflow-hidden rounded-xl sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60"
        >
          {currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 144px, (max-width: 1024px) 208px, 240px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-2xl font-semibold text-neutral-400 sm:text-3xl">
              {initials || "LC"}
            </div>
          )}
          {isOutOfStock && (
            <div className={`absolute right-2 top-2 z-10 ${imagePillClassName} text-red-400`}>
              Agotado
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 sm:gap-3 md:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900 sm:text-xs sm:tracking-[0.18em]">
                {brand}
              </p>
              <h3 className="mt-1 text-sm font-medium leading-snug text-[#0a0a0a] sm:text-base md:text-lg">
                <Link href={`/tienda/${product.slug}`} className="hover:text-[#a8862f]">
                  {product.name}
                </Link>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => toggle(product.slug)}
              aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
              className="shrink-0 p-1 text-neutral-900 transition-colors hover:text-neutral-600 active:scale-95"
            >
              <Heart
                className={`h-4 w-4 transition-colors sm:h-5 sm:w-5 ${
                  wishlisted ? "fill-neutral-900 text-neutral-900" : ""
                }`}
              />
            </button>
          </div>

          <p className="text-base font-semibold text-[#C9A84C] sm:text-lg md:text-xl">
            {formatPrice(product.base_price)}
          </p>

          <div className="w-full max-w-sm">{listActionButton}</div>
        </div>
      </article>
    )
  }

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

          {isOutOfStock && (
            <div
              className={`absolute right-2 top-2 z-10 ${imagePillClassName} text-red-400 sm:right-3 sm:top-3`}
            >
              Agotado
            </div>
          )}

          {hasMultiple ? (
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`block h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                    i === imgIndex ? "bg-black" : "bg-[#ccc]"
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
              className={`${imageNavButtonClassName} left-1.5 sm:left-2`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente imagen"
              className={`${imageNavButtonClassName} right-1.5 sm:right-2`}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900 sm:text-xs sm:tracking-[0.18em]">
              {brand}
            </p>
            <h3 className="mt-0.5 text-xs font-medium leading-snug text-[#0a0a0a] sm:mt-1 sm:text-sm">
              {product.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => toggle(product.slug)}
            aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
            className="shrink-0 p-0.5 text-neutral-900 transition-colors hover:text-neutral-600 active:scale-95"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors sm:h-4 sm:w-4 ${
                wishlisted ? "fill-neutral-900 text-neutral-900" : ""
              }`}
            />
          </button>
        </div>

        <p className="text-sm font-semibold text-[#C9A84C] sm:text-lg">
          {formatPrice(product.base_price)}
        </p>

        <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
          {actionButton}
        </div>
      </div>
    </article>
  )
}
