"use client"

import { useEffect, useId, useMemo, useState } from "react"

import { useCart } from "@/app/components/cart/CartContext"
import type { CartItem } from "@/lib/cart"
import type { ProductVariant } from "@/lib/supabase/products"
import NotifyWhenAvailable from "./NotifyWhenAvailable"

type Props = {
  productId: string
  productSlug?: string | null
  productName: string
  brand: string | null
  image: string | null
  basePrice: number
  variants: ProductVariant[]
  enableSelector?: boolean
  className?: string
  enableQuantitySelector?: boolean
  openCartOnAdd?: boolean
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function pickVariant(variants: ProductVariant[]): ProductVariant | null {
  const active = variants.filter((variant) => variant.is_active)
  const withStock = active.find((variant) => variant.stock > 0)
  if (withStock) return withStock
  if (active.length > 0) return active[0]
  if (variants.length > 0) return variants[0]
  return null
}

export default function AddToCartButton({
  productId,
  productSlug,
  productName,
  brand,
  image,
  basePrice,
  variants,
  enableSelector = false,
  className,
  enableQuantitySelector = false,
  openCartOnAdd = true,
}: Props) {
  const { addItem, openCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const selectId = useId()

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.is_active),
    [variants]
  )
  const defaultVariant = useMemo(() => pickVariant(variants), [variants])
  const [selectedId, setSelectedId] = useState<string | null>(
    defaultVariant?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = useMemo(() => {
    if (selectedId) {
      const match = variants.find((variant) => variant.id === selectedId)
      if (match) return match
    }
    return defaultVariant
  }, [variants, selectedId, defaultVariant])

  const showSelector = enableSelector && activeVariants.length > 1
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : true
  const canAdd = Boolean(selectedVariant) && !outOfStock
  const maxQuantity = 99
  const displayPrice = selectedVariant?.price ?? basePrice

  useEffect(() => {
    setQuantity((current) => {
      if (current < 1) return 1
      if (current > maxQuantity) return maxQuantity
      return current
    })
  }, [maxQuantity])

  const handleAdd = async () => {
    if (!selectedVariant || !canAdd || isAdding) return

    const item: CartItem = {
      productId,
      productSlug: productSlug ?? null,
      variantId: selectedVariant.id,
      quantity,
      price: selectedVariant.price || basePrice,
      name:
        selectedVariant.variant_name?.trim().length > 0
          ? `${productName} - ${selectedVariant.variant_name}`
          : productName,
      brand,
      image,
    }

    setIsAdding(true)
    try {
      await addItem(item)
      setQuantity(1)
      if (openCartOnAdd) {
        openCart()
      }
    } finally {
      setIsAdding(false)
    }
  }

  const button = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!canAdd || isAdding}
      className={className}
      aria-disabled={!canAdd || isAdding}
      title={!canAdd ? "Presentación sin inventario disponible" : undefined}
    >
      {!selectedVariant
        ? "Sin inventario"
        : outOfStock
          ? "Agotado"
          : isAdding
            ? "Agregando..."
            : "Agregar al carrito"}
    </button>
  )

  const primaryAction = outOfStock && selectedVariant ? (
    <NotifyWhenAvailable
      productId={productId}
      productSlug={productSlug ?? null}
      productName={productName}
      variantId={selectedVariant.id}
      outOfStock={outOfStock}
      className={className}
    />
  ) : (
    button
  )

  if (!enableSelector) {
    return (
      <div className="space-y-3">
        {outOfStock && selectedVariant ? (
          <NotifyWhenAvailable
            productId={productId}
            productSlug={productSlug ?? null}
            productName={productName}
            variantId={selectedVariant.id}
            outOfStock={outOfStock}
            className={className}
          />
        ) : (
          button
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {showSelector ? (
        <div className="space-y-1.5">
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500"
          >
            Presentación
          </label>
          <select
            id={selectId}
            value={selectedVariant?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none transition-colors focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
          >
            {activeVariants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                {variant.variant_name} — {formatPrice(variant.price)}
                {variant.stock <= 0 ? " (Agotado)" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[#0a0a0a]">
          {formatPrice(displayPrice)}
        </span>
        <span className="text-sm font-medium text-neutral-500">MXN</span>
      </div>

      {!selectedVariant || !outOfStock ? (
        <p className="text-xs font-medium">
          {!selectedVariant ? (
            <span className="text-red-500">Sin presentaciones disponibles</span>
          ) : selectedVariant.stock <= 5 ? (
            <span className="text-amber-600">
              Últimas {selectedVariant.stock} piezas
            </span>
          ) : (
            <span className="text-emerald-600">Disponible</span>
          )}
        </p>
      ) : null}

      {enableQuantitySelector ? (
        <div className="grid grid-cols-[1fr_2fr] items-center gap-3 sm:grid-cols-[minmax(0,140px)_1fr]">
          <div className="inline-flex w-full items-center justify-between rounded-full border border-neutral-300 px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={!canAdd || quantity <= 1 || isAdding}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
              aria-label="Disminuir cantidad"
            >
              -
            </button>
            <span className="min-w-[2ch] text-center text-sm font-semibold text-[#0a0a0a]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity((current) => Math.min(maxQuantity, current + 1))
              }
              disabled={outOfStock || quantity >= maxQuantity || isAdding}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300"
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
          {primaryAction}
        </div>
      ) : (
        primaryAction
      )}
    </div>
  )
}
