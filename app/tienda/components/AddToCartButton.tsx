"use client"

import { useCallback, useEffect, useId, useMemo, useState } from "react"

import { useCart } from "@/app/components/cart/CartContext"
import type { CartItem } from "@/lib/cart"
import type { ProductVariant } from "@/lib/supabase/products"
import { applyDiscount } from "@/lib/tienda/discount"
import { ActionSwapText } from "@/app/components/ui/motion/action-swap"
import SlidingNumber from "@/app/components/ui/motion/sliding-number"
import NotifyWhenAvailable from "./NotifyWhenAvailable"
import { storeIconButtonClassName } from "./store-button-styles"
import { Check, Loader2, ShoppingBag } from "lucide-react"

type Props = {
  productId: string
  productSlug?: string | null
  productName: string
  brand: string | null
  image: string | null
  basePrice: number
  discountPercent?: number
  variants: ProductVariant[]
  enableSelector?: boolean
  className?: string
  enableQuantitySelector?: boolean
  openCartOnAdd?: boolean
  variant?: "default" | "icon"
  /** Si se pasa, oculta el <select> interno y delega la selección al padre. */
  selectedVariantId?: string | null
  /** Notifica al padre cuando cambia la selección desde el <select> interno. */
  onVariantChange?: (variantId: string) => void
  /** Oculta el bloque de precio (úsalo cuando el padre ya lo muestra). */
  hidePrice?: boolean
  /** Texto del botón en estado idle. Default: "Agregar a la bolsa". */
  idleLabel?: string
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
  discountPercent = 0,
  variants,
  enableSelector = false,
  className,
  enableQuantitySelector = false,
  openCartOnAdd = true,
  variant = "default",
  selectedVariantId,
  onVariantChange,
  hidePrice = false,
  idleLabel,
}: Props) {
  const isControlled = selectedVariantId !== undefined
  const { addItem, openCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const selectId = useId()

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1500)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  const activeVariants = useMemo(
    () => variants.filter((variant) => variant.is_active),
    [variants]
  )
  const defaultVariant = useMemo(() => pickVariant(variants), [variants])
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    defaultVariant?.id ?? null
  )
  const selectedId = isControlled
    ? selectedVariantId ?? null
    : internalSelectedId
  const setSelectedId = useCallback(
    (id: string) => {
      if (!isControlled) setInternalSelectedId(id)
      onVariantChange?.(id)
    },
    [isControlled, onVariantChange]
  )
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = useMemo(() => {
    if (selectedId) {
      const match = variants.find((variant) => variant.id === selectedId)
      if (match) return match
    }
    return defaultVariant
  }, [variants, selectedId, defaultVariant])

  const showSelector = enableSelector && activeVariants.length > 1 && !isControlled
  const outOfStock = selectedVariant ? selectedVariant.stock <= 0 : true
  const canAdd = Boolean(selectedVariant) && !outOfStock
  const maxQuantity = 99
  const rawPrice = selectedVariant?.price ?? basePrice
  const displayPrice = applyDiscount(rawPrice, discountPercent)
  const hasActiveDiscount = displayPrice < rawPrice

  useEffect(() => {
    setQuantity((current) => {
      if (current < 1) return 1
      if (current > maxQuantity) return maxQuantity
      return current
    })
  }, [maxQuantity])

  const handleAdd = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!selectedVariant || !canAdd || isAdding) return

    const item: CartItem = {
      productId,
      productSlug: productSlug ?? null,
      variantId: selectedVariant.id,
      quantity,
      price: applyDiscount(selectedVariant.price || basePrice, discountPercent),
      name: (() => {
        const variant = selectedVariant.variant_name?.trim() ?? ""
        if (!variant) return productName
        if (variant === productName) return productName
        return `${productName} - ${variant}`
      })(),
      brand,
      image,
    }

    setIsAdding(true)
    try {
      await addItem(item)
      setQuantity(1)
      setJustAdded(true)
      if (openCartOnAdd) {
        openCart()
      }
    } finally {
      setIsAdding(false)
    }
  }

  const swapKey = !selectedVariant
    ? "no-variant"
    : outOfStock
      ? "out-of-stock"
      : isAdding
        ? "adding"
        : justAdded
          ? "added"
          : "idle"

  const swapLabel =
    swapKey === "no-variant"
      ? "Sin inventario"
      : swapKey === "out-of-stock"
        ? "Agotado"
        : swapKey === "adding"
          ? "Agregando..."
          : swapKey === "added"
            ? "Agregado"
            : (idleLabel ?? "Agregar a la bolsa")

  const iconButtonClassName = className ?? storeIconButtonClassName

  const iconButton = (
    <button
      type="button"
      onClick={(e) => void handleAdd(e)}
      disabled={!canAdd || isAdding}
      className={iconButtonClassName}
      aria-disabled={!canAdd || isAdding}
      aria-label={
        justAdded
          ? "Agregado a la bolsa"
          : isAdding
            ? "Agregando a la bolsa"
            : "Agregar a la bolsa"
      }
      title={!canAdd ? "Presentación sin inventario disponible" : undefined}
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
      ) : justAdded ? (
        <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
      ) : (
        <ShoppingBag className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
      )}
    </button>
  )

  const button = (
    <button
      type="button"
      onClick={() => void handleAdd()}
      disabled={!canAdd || isAdding}
      className={className}
      aria-disabled={!canAdd || isAdding}
      title={!canAdd ? "Presentación sin inventario disponible" : undefined}
    >
      <ActionSwapText value={swapKey} animation="blur">
        {swapLabel}
      </ActionSwapText>
    </button>
  )

  const primaryAction = outOfStock && selectedVariant ? (
    <NotifyWhenAvailable
      productId={productId}
      productSlug={productSlug ?? null}
      productName={productName}
      variantId={selectedVariant.id}
      outOfStock={outOfStock}
      className={variant === "icon" ? iconButtonClassName : className}
      iconOnly={variant === "icon"}
    />
  ) : (
    button
  )

  if (!enableSelector) {
    if (variant === "icon") {
      if (outOfStock && selectedVariant) {
        return (
          <NotifyWhenAvailable
            productId={productId}
            productSlug={productSlug ?? null}
            productName={productName}
            variantId={selectedVariant.id}
            outOfStock={outOfStock}
            className={iconButtonClassName}
            iconOnly
            label="Avísame disponibilidad"
          />
        )
      }
      return iconButton
    }

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

      {!hidePrice && (
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold text-[#0a0a0a]">
            {formatPrice(displayPrice)}
          </span>
          <span className="text-sm font-medium text-neutral-500">MXN</span>
          {hasActiveDiscount && (
            <>
              <span className="text-sm text-neutral-400 line-through">
                {formatPrice(rawPrice)}
              </span>
              <span className="bg-[#C9A84C] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>
      )}

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
            <span className="flex min-w-[2ch] justify-center text-sm font-semibold tabular-nums text-[#0a0a0a]">
              <SlidingNumber value={quantity} />
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
