"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { ProductWithCategory } from "@/lib/supabase/products"
import { getAbrasivityLevel } from "@/lib/constants/abrasivity"
import { applyDiscount, hasDiscount } from "@/lib/tienda/discount"
import AddToCartButton from "./AddToCartButton"
import NotifyWhenAvailable from "./NotifyWhenAvailable"
import { storeCardButtonClassName, storeIconButtonClassName } from "./store-button-styles"
import { Heart, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"
import { TiltCard } from "@/app/components/ui/motion/tilt-card"

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
  const [leavingImage, setLeavingImage] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next")
  const hasMultiple = images.length > 1
  const desktopHoverSwapEnabled =
    images.length === 2 && product.desktop_image_mode !== "carousel"
  const currentImage = images[imgIndex] ?? null
  const slideDurationMs = 260

  const abrasivityLevel = getAbrasivityLevel(product.abrasivity)
  const productHasDiscount = hasDiscount(product.discount_percent)
  const discountedPrice = applyDiscount(product.base_price, product.discount_percent)

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

  const cardButtonClassName = storeCardButtonClassName
  const imageSizes = "(max-width: 768px) 50vw, 33vw"

  const singleVariant = activeVariants.length === 1 ? activeVariants[0] : null

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggle(product.slug)
  }

  const productActionIconClass = "h-4 w-4 sm:h-[18px] sm:w-[18px]"

  const heartButton = (
    <button
      type="button"
      onClick={handleWishlistToggle}
      aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={storeIconButtonClassName}
    >
      <Heart
        className={`${productActionIconClass} transition-colors${
          wishlisted ? " fill-neutral-900 text-neutral-900" : ""
        }`}
      />
    </button>
  )

  const iconActionButton =
    hasMultipleVariants ? (
      <Link
        href={`/tienda/${product.slug}`}
        className={storeIconButtonClassName}
        onClick={(e) => e.stopPropagation()}
        aria-label="Elegir presentación"
      >
        <ShoppingBag className={productActionIconClass} strokeWidth={1.75} />
      </Link>
    ) : isOutOfStock && singleVariant ? (
      <NotifyWhenAvailable
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        variantId={singleVariant.id}
        outOfStock
        className={storeIconButtonClassName}
        iconOnly
        label="Avísame disponibilidad"
      />
    ) : (
      <AddToCartButton
        productId={product.id}
        productSlug={product.slug}
        productName={product.name}
        brand={product.brand ?? null}
        image={currentImage}
        basePrice={product.base_price}
        discountPercent={product.discount_percent}
        variants={product.variants ?? []}
        variant="icon"
      />
    )

  const priceBlock = productHasDiscount ? (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <p className="text-sm font-semibold text-[#C9A84C] sm:text-base">
        {formatPrice(discountedPrice)}
      </p>
      <p className="text-[11px] text-neutral-400 line-through sm:text-xs">
        {formatPrice(product.base_price)}
      </p>
      <span className="rounded-full bg-[#C9A84C] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white sm:text-[10px]">
        -{product.discount_percent}%
      </span>
    </div>
  ) : (
    <p className="text-sm font-semibold text-[#C9A84C] sm:text-base">
      {formatPrice(product.base_price)}
    </p>
  )

  useEffect(() => {
    if (!leavingImage) return
    const timeoutId = window.setTimeout(() => setLeavingImage(null), slideDurationMs)
    return () => window.clearTimeout(timeoutId)
  }, [leavingImage, slideDurationMs])

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
          label="Avísame disponibilidad"
        />
      ) : (
        <AddToCartButton
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          brand={product.brand ?? null}
          image={currentImage}
          basePrice={product.base_price}
          discountPercent={product.discount_percent}
          variants={product.variants ?? []}
          className={cardButtonClassName}
        />
      )

    return (
      <article className="flex gap-5 border-b border-neutral-200 py-5 sm:gap-8 sm:py-7 md:gap-10 md:py-8">
        <Link
          href={`/tienda/${product.slug}`}
          className="relative h-36 w-36 shrink-0 overflow-hidden sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60"
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
          {abrasivityLevel && (
            <span
              aria-label={`Abrasividad ${abrasivityLevel.label} (cinta ${abrasivityLevel.tape})`}
              title={`Abrasividad ${abrasivityLevel.label} · Cinta ${abrasivityLevel.tape}`}
              className="absolute left-2 top-2 z-10 inline-block h-3 w-3 rounded-full border border-white/70 shadow-sm"
              style={{ backgroundColor: abrasivityLevel.color }}
            />
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 sm:gap-3 md:gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900 sm:text-xs sm:tracking-[0.18em]">
                {brand}
              </p>
              <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-[#0a0a0a] [min-height:2lh] sm:text-base md:text-lg">
                <Link href={`/tienda/${product.slug}`} className="hover:text-[#a8862f]">
                  {product.name}
                </Link>
              </h3>
            </div>
            <button
              type="button"
              onClick={handleWishlistToggle}
              aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
              className={`${storeIconButtonClassName} p-1`}
            >
              <Heart
                className={`h-4 w-4 transition-colors sm:h-5 sm:w-5 ${
                  wishlisted ? "fill-neutral-900 text-neutral-900" : ""
                }`}
              />
            </button>
          </div>

          {productHasDiscount ? (
            <div className="flex items-baseline gap-2">
              <p className="text-base font-semibold text-[#C9A84C] sm:text-lg md:text-xl">
                {formatPrice(discountedPrice)}
              </p>
              <p className="text-xs text-neutral-400 line-through sm:text-sm">
                {formatPrice(product.base_price)}
              </p>
              <span className="rounded-full bg-[#C9A84C] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white sm:text-[11px]">
                -{product.discount_percent}%
              </span>
            </div>
          ) : (
            <p className="text-base font-semibold text-[#C9A84C] sm:text-lg md:text-xl">
              {formatPrice(product.base_price)}
            </p>
          )}

          <div className="w-full max-w-sm">{listActionButton}</div>
        </div>
      </article>
    )
  }

  function prev(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (currentImage) setLeavingImage(currentImage)
    setSlideDirection("prev")
    setImgIndex((i) => (i - 1 + images.length) % images.length)
  }

  function next(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (currentImage) setLeavingImage(currentImage)
    setSlideDirection("next")
    setImgIndex((i) => (i + 1) % images.length)
  }

  return (
    <article className="group flex h-full flex-col">
      <TiltCard
        max={8}
        glare={false}
        className="relative aspect-square w-full rounded-none bg-neutral-50"
      >
        <Link href={`/tienda/${product.slug}`} className="relative block h-full w-full">
          {currentImage ? (
            desktopHoverSwapEnabled ? (
              <>
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-opacity duration-200 md:hidden"
                  sizes={imageSizes}
                />
                <Image
                  src={images[0]}
                  alt={product.name}
                  fill
                  className="hidden object-cover transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:block md:opacity-100 md:group-hover:opacity-0"
                  sizes={imageSizes}
                />
                <Image
                  src={images[1]}
                  alt={`${product.name} alternativa`}
                  fill
                  className="hidden object-cover transition-opacity duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:block md:opacity-0 md:group-hover:opacity-100"
                  sizes={imageSizes}
                />
              </>
            ) : (
              <>
                {leavingImage ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      animation: `${slideDirection === "next" ? "productCardSlideOutLeft" : "productCardSlideOutRight"} ${slideDurationMs}ms ease`,
                    }}
                  >
                    <Image
                      src={leavingImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes={imageSizes}
                    />
                  </div>
                ) : null}

                <div
                  className="absolute inset-0"
                  style={
                    leavingImage
                      ? {
                          animation: `${slideDirection === "next" ? "productCardSlideInRight" : "productCardSlideInLeft"} ${slideDurationMs}ms ease`,
                        }
                      : undefined
                  }
                >
                  <Image
                    src={currentImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-opacity duration-200"
                    sizes={imageSizes}
                  />
                </div>
              </>
            )
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

          {productHasDiscount && !isOutOfStock && (
            <div className="absolute right-2 top-2 z-10 rounded-full bg-[#C9A84C] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
              -{product.discount_percent}%
            </div>
          )}

          {abrasivityLevel && (
            <span
              aria-label={`Abrasividad ${abrasivityLevel.label} (cinta ${abrasivityLevel.tape})`}
              title={`Abrasividad ${abrasivityLevel.label} · Cinta ${abrasivityLevel.tape}`}
              className="absolute left-2 top-2 z-10 inline-block h-3 w-3 rounded-full border border-white/70 shadow-sm sm:left-3 sm:top-3 sm:h-3.5 sm:w-3.5"
              style={{ backgroundColor: abrasivityLevel.color }}
            />
          )}

          {hasMultiple ? (
            <div
              className={`pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 ${
                desktopHoverSwapEnabled ? "md:hidden" : ""
              }`}
            >
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
              className={`${imageNavButtonClassName} left-1.5 sm:left-2 ${
                desktopHoverSwapEnabled ? "md:hidden" : ""
              }`}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente imagen"
              className={`${imageNavButtonClassName} right-1.5 sm:right-2 ${
                desktopHoverSwapEnabled ? "md:hidden" : ""
              }`}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </>
        ) : null}
      </TiltCard>

      <div className="pt-2">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.15em] text-neutral-900 sm:text-xs sm:tracking-[0.18em]">
              {brand}
            </p>
            <h3 className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-[#0a0a0a] sm:text-sm">
              {product.name}
            </h3>
            <div className="mt-1">{priceBlock}</div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {heartButton}
            {iconActionButton}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes productCardSlideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes productCardSlideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes productCardSlideOutLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-100%);
          }
        }
        @keyframes productCardSlideOutRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
      `}</style>
    </article>
  )
}
