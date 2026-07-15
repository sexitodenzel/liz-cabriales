"use client"

import { useEffect, useState, type RefObject } from "react"

import SmoothImage from "@/app/components/shared/SmoothImage"

import type { ProductWithVariants, ProductVariant } from "@/lib/supabase/products"
import { applyDiscount } from "@/lib/tienda/discount"
import AddToCartButton from "./AddToCartButton"
import { storeCheckoutDetailButtonClassName } from "./store-button-styles"

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

type Props = {
  product: ProductWithVariants
  selectedVariant: ProductVariant | null
  triggerRef: RefObject<HTMLElement | HTMLDivElement | null>
}

export default function StickyCartBar({ product, selectedVariant, triggerRef }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf: number | null = null
    const check = () => {
      raf = null
      const node = triggerRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      // Aparece cuando el sentinel cruza arriba (pasaste todo el hero)
      setVisible(rect.top < 100)
    }
    const onScroll = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(check)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    check()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf !== null) cancelAnimationFrame(raf)
    }
  }, [triggerRef])

  const image = product.images?.[0] ?? null
  const rawPrice = selectedVariant?.price ?? product.base_price
  const displayPrice = applyDiscount(rawPrice, product.discount_percent)
  const colorName = selectedVariant?.color_name ?? null
  const colorHex = selectedVariant?.color_hex ?? null

  const goToTop = () => {
    triggerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (!visible) return null

  return (
    <div className="navbar-follow-collapse fixed left-0 right-0 z-40 border-b border-neutral-200 bg-white/85 backdrop-blur-md" style={{ top: "var(--navbar-actual-h, 64px)" }}>
      <div className="site-container">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3 py-2.5 sm:gap-4 sm:py-3">
        <button
          type="button"
          onClick={goToTop}
          className="flex flex-1 cursor-pointer items-center gap-3 text-left"
        >
          {image ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-neutral-100 sm:h-12 sm:w-12">
              <SmoothImage
                src={image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[#0a0a0a] sm:text-sm">
              {product.name}
            </p>
            {colorName ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-600">
                {colorHex ? (
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: colorHex }}
                  />
                ) : null}
                <span className="truncate uppercase tracking-[0.1em]">
                  {colorName}
                </span>
              </p>
            ) : null}
          </div>
        </button>

        <div className="hidden text-sm font-medium text-[#0a0a0a] sm:block">
          {formatPrice(displayPrice)}
        </div>

        <div className="w-auto shrink-0">
          <AddToCartButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            brand={product.brand ?? null}
            image={image}
            basePrice={product.base_price}
            discountPercent={product.discount_percent}
            variants={product.variants}
            selectedVariantId={selectedVariant?.id ?? null}
            enableSelector={false}
            hidePrice
            openCartOnAdd
            className={`${storeCheckoutDetailButtonClassName} !w-auto !px-4 !py-2 !text-[11px] sm:!px-5 sm:!py-2.5`}
          />
        </div>
        </div>
      </div>
    </div>
  )
}
