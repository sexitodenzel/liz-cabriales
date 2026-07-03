"use client"

import { useMemo, useState } from "react"
import { Heart } from "lucide-react"

import type { ProductWithVariants, ProductVariant } from "@/lib/supabase/products"
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

type Props = {
  product: ProductWithVariants
  selectedVariantId: string | null
  onSelectVariant: (variantId: string) => void
}

export default function ProductInfoPanel({
  product,
  selectedVariantId,
  onSelectVariant,
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

  return (
    <div className="w-full">
      <h1 className="text-[clamp(1.75rem,2.8vw,2.6rem)] font-semibold uppercase tracking-[0.14em] text-[#0a0a0a]">
        {product.name}
      </h1>
      <div className="mt-4 h-px w-full bg-neutral-900/85" />

      {tagline ? (
        <p className="mt-8 line-clamp-3 text-[16px] leading-7 text-[#0a0a0a]">
          {tagline}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => openAccordionSection("descripcion")}
        className="mt-4 cursor-pointer text-sm text-neutral-700 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-[#0a0a0a]"
      >
        Más información
      </button>

      {refLabel ? (
        <p className="mt-10 text-xs uppercase tracking-[0.18em] text-neutral-400">
          Ref. {refLabel}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-[22px] font-medium text-[#0a0a0a]">
          {formatPrice(displayPrice)}
          <span className="ml-1 text-xs font-normal text-neutral-500">MXN</span>
        </span>
        <button
          type="button"
          onClick={() => wishlist.toggle(product.slug)}
          aria-label={isFavorited ? "Quitar de favoritos" : "Agregar a favoritos"}
          aria-pressed={isFavorited}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-neutral-700 transition-colors hover:text-rose-500"
        >
          <Heart
            className="h-5 w-5"
            strokeWidth={1.5}
            fill={isFavorited ? "currentColor" : "none"}
            style={isFavorited ? { color: "#e11d48" } : undefined}
          />
        </button>
      </div>

      {hasColors ? (
        <div className="mt-6">
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
        <div className="mt-6 flex flex-wrap items-center gap-2">
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

      <div className="mt-8">
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
          idleLabel="Añadir al carrito"
          className={storeHeroAddToCartClassName}
        />
      </div>

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
