"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"
import ProductCard from "@/app/tienda/components/ProductCard"
import type { ProductWithCategory } from "@/lib/supabase/products"

export default function WishlistPage() {
  const { slugs } = useWishlist()
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slugs.length === 0) { setProducts([]); setLoading(false); return }
    setLoading(true)
    fetch(`/api/products/by-slugs?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setProducts(json.data as ProductWithCategory[]) })
      .finally(() => setLoading(false))
  }, [slugs])

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
      <div className="mb-10 flex items-center gap-3">
        <Heart className="h-6 w-6 text-[#C6A75E]" />
        <h1 className="font-[family-name:var(--font-playfair),serif] text-3xl font-medium text-[#111]">
          Mi wishlist
        </h1>
        {products.length > 0 && (
          <span className="rounded-full bg-[#C6A75E]/15 px-3 py-0.5 text-sm font-semibold text-[#C6A75E]">
            {products.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <Heart className="h-12 w-12 text-neutral-200" />
          <p className="text-lg font-medium text-neutral-400">Tu wishlist está vacía</p>
          <Link
            href="/tienda"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#C6A75E] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b8952f]"
          >
            Explorar tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  )
}
