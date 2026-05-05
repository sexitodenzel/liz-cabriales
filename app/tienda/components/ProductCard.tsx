"use client"

import Link from "next/link"
import type { ProductWithCategory } from "@/lib/supabase/products"
import AddToCartButton from "./AddToCartButton"
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
  const firstImage = product.images?.[0] ?? null
  const initials = brand
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("")

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/tienda/${product.slug}`} className="block">
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
      </Link>

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

        <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href={`/tienda/${product.slug}`}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#111] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors duration-200 hover:bg-[#c9a84c]"
          >
            Ver producto
          </Link>
          <AddToCartButton
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            brand={product.brand ?? null}
            image={firstImage}
            basePrice={product.base_price}
            variants={product.variants ?? []}
            className="inline-flex w-full items-center justify-center rounded-full border border-[#c9a84c] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f] transition-colors duration-200 hover:bg-[#c9a84c] hover:text-white hover:border-[#c9a84c] disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:opacity-60"
          />
        </div>
      </div>
    </article>
  )
}

