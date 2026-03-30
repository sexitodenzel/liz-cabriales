"use client"

import type { ProductWithCategory } from "@/lib/supabase/products"
import { useCart } from "@/app/components/cart/CartContext"
import { useState } from "react"

type Props = {
  product: ProductWithCategory
  onAddToCart?: (product: ProductWithCategory) => void
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ProductCard({ product, onAddToCart }: Props) {
  const { addItem, openCart } = useCart()
  const [added, setAdded] = useState(false)

  const brand = product.brand ?? "Sin marca"
  const firstImage = product.images?.[0] ?? null
  const initials = brand
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")
  const handleAdd = () => {
    const variant = product.variants?.[0]
    const price = variant?.price ?? product.base_price

    void addItem({
      productId: product.id,
      variantId: variant?.id ?? product.id,
      quantity: 1,
      price,
      name: product.name,
      brand: product.brand ?? null,
      image: firstImage,
    })

    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)

    onAddToCart?.(product)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative bg-neutral-100">
        {firstImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={product.name}
            className="h-64 w-full object-cover"
          />
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-neutral-100 text-3xl font-semibold text-neutral-400">
            {initials || "LC"}
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#C9A84C]">
          {brand}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">
            {product.category.name}
          </p>
          <h3 className="mt-1 text-sm font-medium text-[#0a0a0a]">
            {product.name}
          </h3>
        </div>

        <p className="text-lg font-semibold text-[#C9A84C]">
          {formatPrice(product.base_price)}
        </p>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-auto w-full rounded-full bg-[#0a0a0a] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a]"
        >
          {added ? "✓ Agregado" : "Agregar al carrito"}
        </button>
      </div>
    </article>
  )
}

