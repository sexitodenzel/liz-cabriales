"use client"

import { useMemo, useState } from "react"

import { useCart } from "@/app/components/cart/CartContext"
import type { CartItem } from "@/lib/cart"
import type { ProductVariant } from "@/lib/supabase/products"

type Props = {
  productId: string
  productSlug?: string | null
  productName: string
  brand: string | null
  image: string | null
  basePrice: number
  variants: ProductVariant[]
  className?: string
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
  className,
}: Props) {
  const { addItem, openCart } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const selectedVariant = useMemo(() => pickVariant(variants), [variants])

  const canAdd = Boolean(selectedVariant)

  const handleAdd = async () => {
    if (!selectedVariant || isAdding) return

    const item: CartItem = {
      productId,
      productSlug: productSlug ?? null,
      variantId: selectedVariant.id,
      quantity: 1,
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
      openCart()
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!canAdd || isAdding}
      className={className}
      aria-disabled={!canAdd || isAdding}
      title={!canAdd ? "Producto sin variantes disponibles" : undefined}
    >
      {!canAdd
        ? "Sin inventario"
        : isAdding
          ? "Agregando..."
          : "Agregar al carrito"}
    </button>
  )
}
