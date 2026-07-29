"use client"

import { useEffect, useMemo, useState } from "react"
import { Heart } from "lucide-react"

import type { ProductWithVariants, ProductVariant } from "@/lib/supabase/products"
import type { ProductReviewSummary } from "@/lib/supabase/product-reviews"
import { applyDiscount } from "@/lib/tienda/discount"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"
import AddToCartButton from "./AddToCartButton"
import { storeHeroAddToCartClassName } from "./store-button-styles"
import { Drawer } from "@/app/components/ui/motion/drawer"

const VARIANT_SWATCH_LIMIT = 5

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function dedupeSizes(variants: ProductVariant[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of variants) {
    const s = v.size_label?.trim()
    if (!s) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

function openAccordionSection(id: string) {
  window.dispatchEvent(
    new CustomEvent("lc:product-accordion-open", { detail: id })
  )
}

const WHATSAPP_URL = "https://wa.me/528332183399"

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
      <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 01-1.44-5.01c0-5.18 4.22-9.4 9.41-9.4 2.51 0 4.87.98 6.64 2.76a9.34 9.34 0 012.75 6.65c-.01 5.18-4.22 9.4-9.4 9.4zm8-17.4A11.32 11.32 0 0012.05.75C5.82.75.76 5.81.76 12.03c0 1.99.52 3.93 1.5 5.64L.67 23.5l5.96-1.56a11.29 11.29 0 005.41 1.38h.01c6.23 0 11.29-5.06 11.29-11.28 0-3.01-1.18-5.85-3.3-7.98z" />
    </svg>
  )
}

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          fill={n <= Math.round(value) ? "#c6a75e" : "none"}
          stroke={n <= Math.round(value) ? "#c6a75e" : "#d9d9d9"}
          strokeWidth="1.6"
          className="h-[15px] w-[15px]"
          aria-hidden
        >
          <path d="M12 2.5l2.95 6.06 6.68.92-4.87 4.67 1.2 6.63L12 17.6l-5.96 3.18 1.2-6.63-4.87-4.67 6.68-.92L12 2.5z" />
        </svg>
      ))}
    </span>
  )
}

type Props = {
  product: ProductWithVariants
  selectedVariantId: string | null
  onSelectVariant: (variantId: string) => void
  reviewSummary?: ProductReviewSummary
}

export default function ProductInfoPanel({
  product,
  selectedVariantId,
  onSelectVariant,
  reviewSummary,
}: Props) {
  const wishlist = useWishlist()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const activeVariants = useMemo(
    () => product.variants.filter((v) => v.is_active),
    [product.variants]
  )

  const colorVariants = useMemo(
    () => activeVariants.filter((v) => Boolean(v.color_hex)),
    [activeVariants]
  )

  const sizeLabels = useMemo(() => dedupeSizes(activeVariants), [activeVariants])
  const hasColors = colorVariants.length > 0
  const hasSizes = sizeLabels.length > 1
  const hasFallbackPills = !hasColors && activeVariants.length > 1

  const selectedVariant = useMemo(() => {
    if (selectedVariantId) {
      const match = product.variants.find((v) => v.id === selectedVariantId)
      if (match) return match
    }
    return activeVariants[0] ?? product.variants[0] ?? null
  }, [product.variants, activeVariants, selectedVariantId])

  const selectedSize = selectedVariant?.size_label ?? null
  const selectedColorHex = selectedVariant?.color_hex ?? null

  const rawPrice = selectedVariant?.price ?? product.base_price
  const displayPrice = applyDiscount(rawPrice, product.discount_percent)
  const isLimited = Boolean(selectedVariant?.is_limited_edition)
  const isFavorited = wishlist.has(product.slug)

  const visibleSwatches = colorVariants.slice(0, VARIANT_SWATCH_LIMIT)
  const overflowSwatches = colorVariants.slice(VARIANT_SWATCH_LIMIT)

  const handleSelectVariant = (variantId: string) => {
    onSelectVariant(variantId)
  }

  const handleSelectColorAndSize = (colorVariantId: string, sizeLabel: string) => {
    const match = activeVariants.find(
      (v) => v.color_hex === product.variants.find((x) => x.id === colorVariantId)?.color_hex
        && v.size_label === sizeLabel
    )
    if (match) onSelectVariant(match.id)
  }

  const handleSelectSize = (sizeLabel: string) => {
    if (!selectedColorHex) {
      const match = activeVariants.find((v) => v.size_label === sizeLabel)
      if (match) onSelectVariant(match.id)
      return
    }
    handleSelectColorAndSize(selectedVariant!.id, sizeLabel)
  }

  const tagline = product.description?.trim() ?? product.brand ?? null
  const refLabel = product.slug
    ? product.slug.replace(/-/g, " ").toUpperCase()
    : null

  // Enlace de WhatsApp con mensaje prellenado (nombre del producto + URL de la
  // página). La URL se resuelve en cliente tras montar para incluir el link real.
  const [whatsappHref, setWhatsappHref] = useState(WHATSAPP_URL)
  useEffect(() => {
    const variantNote = selectedVariant?.color_name
      ? ` (${selectedVariant.color_name})`
      : selectedSize
        ? ` (${selectedSize})`
        : ""
    const message = `¡Hola! 👋 Me interesa este producto: ${product.name}${variantNote}. ¿Me pueden dar más información?\n${window.location.href}`
    setWhatsappHref(`${WHATSAPP_URL}?text=${encodeURIComponent(message)}`)
  }, [product.name, selectedVariant?.color_name, selectedSize])

  return (
    // justify-center: el aside (min-height = alto de la 1a imagen) estira este
    // wrapper y el contenido queda centrado al centro vertical de la imagen.
    <div className="flex w-full flex-col justify-center">
      <h1 className="font-display text-[clamp(26px,2.2vw,34px)] font-medium leading-[1.15] tracking-[-0.01em] text-[#111]">
        {product.name}
      </h1>
      {reviewSummary && reviewSummary.count > 0 ? (
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("resenas")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-2 inline-flex cursor-pointer items-center gap-2 self-start text-[13px] text-neutral-600 transition-colors hover:text-[#0a0a0a]"
        >
          <RatingStars value={reviewSummary.average} />
          <span>
            {reviewSummary.average.toFixed(1)} ({reviewSummary.count} reseña
            {reviewSummary.count !== 1 ? "s" : ""})
          </span>
        </button>
      ) : null}
      <div className="mt-3 h-px w-full bg-neutral-900/85" />

      {tagline ? (
        <p className="mt-5 line-clamp-3 text-[15px] leading-[1.65] text-[#0a0a0a]">
          {tagline}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => openAccordionSection("descripcion")}
        className="mt-3 cursor-pointer self-start text-sm text-neutral-700 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-[#0a0a0a]"
      >
        Más información
      </button>

      {/* Bloque de compra: ref + precio + variantes. */}
      <div className="mt-6">
        {refLabel ? (
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            Ref. {refLabel}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-4">
          <span className="text-[22px] font-medium text-[#0a0a0a]">
            {formatPrice(displayPrice)}
            <span className="ml-1 text-xs font-normal text-neutral-500">MXN</span>
          </span>
          <button
            type="button"
            onClick={() => wishlist.toggle(product.slug)}
            aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFavorited}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-neutral-700 transition-colors hover:text-[#0a0a0a]"
          >
            <Heart
              className="h-5 w-5"
              strokeWidth={1.5}
              fill={isFavorited ? "currentColor" : "none"}
              style={isFavorited ? { color: "#0a0a0a" } : undefined}
            />
          </button>
        </div>

        {hasColors ? (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              {visibleSwatches.map((v) => {
                const isSelected = v.id === selectedVariant?.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVariant(v.id)}
                    aria-label={v.color_name ?? v.variant_name}
                    className={`relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-transform sm:h-9 sm:w-9 ${
                      isSelected
                        ? "ring-2 ring-neutral-900 ring-offset-2"
                        : "ring-1 ring-neutral-300 ring-offset-0 hover:scale-105"
                    } h-11 w-11`}
                    style={{ backgroundColor: v.color_hex ?? "#e5e5e5" }}
                  >
                    <span className="sr-only">{v.color_name ?? v.variant_name}</span>
                  </button>
                )
              })}
              {overflowSwatches.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-neutral-300 px-4 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 sm:h-9"
                >
                  +{overflowSwatches.length}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {hasSizes ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {sizeLabels.map((label) => {
              const isSelected = label === selectedSize
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleSelectSize(label)}
                  className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-4 text-xs font-medium transition-colors ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ) : null}

        {hasFallbackPills ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeVariants.map((v) => {
              const isSelected = v.id === selectedVariant?.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectVariant(v.id)}
                  disabled={v.stock <= 0}
                  className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-4 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {v.variant_name}
                  {v.stock <= 0 ? " (agotado)" : ""}
                </button>
              )
            })}
          </div>
        ) : null}

        {(hasColors || isLimited) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {selectedVariant ? (
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                {selectedColorHex ? (
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedColorHex }}
                  />
                ) : null}
                <span className="uppercase tracking-[0.1em] text-neutral-600">
                  {selectedVariant.color_name ?? selectedVariant.variant_name}
                </span>
              </div>
            ) : <span />}
            {isLimited ? (
              <span className="rounded-sm border border-neutral-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-700">
                Edición limitada
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6">
        <AddToCartButton
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          brand={product.brand ?? null}
          image={product.images?.[0] ?? null}
          basePrice={product.base_price}
          discountPercent={product.discount_percent}
          variants={product.variants}
          enableSelector
          enableQuantitySelector={false}
          selectedVariantId={selectedVariant?.id ?? null}
          onVariantChange={handleSelectVariant}
          hidePrice
          className={storeHeroAddToCartClassName}
        />
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-neutral-300 bg-white px-6 py-3.5 text-[13px] font-medium uppercase tracking-[0.14em] text-neutral-800 transition-all duration-200 ease-out hover:border-[#25D366] hover:text-[#128C4B] active:scale-[0.98] active:duration-75"
      >
        <span className="text-[#25D366] transition-colors group-hover:text-[#128C4B]">
          <WhatsAppIcon />
        </span>
        Preguntar por WhatsApp
      </a>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        side="right"
        ariaLabel="Todas las presentaciones"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-700">
              Presentaciones
            </h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-900"
            >
              Cerrar
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {colorVariants.map((v) => {
              const isSelected = v.id === selectedVariant?.id
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    handleSelectVariant(v.id)
                    setDrawerOpen(false)
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    isSelected ? "bg-neutral-100" : "hover:bg-neutral-50"
                  }`}
                >
                  <span
                    className="inline-block h-7 w-7 rounded-full ring-1 ring-neutral-200"
                    style={{ backgroundColor: v.color_hex ?? "#e5e5e5" }}
                  />
                  <span className="flex-1 text-sm text-neutral-700">
                    {v.color_name ?? v.variant_name}
                  </span>
                  {v.is_limited_edition ? (
                    <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                      Limitada
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </Drawer>
    </div>
  )
}
