"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { useWishlist } from "@/app/components/wishlist/WishlistContext"
import ProductCard from "@/app/tienda/components/ProductCard"
import type { ProductWithCategory } from "@/lib/supabase/products"
import AccountShell from "@/app/perfil/AccountShell"
import AccountSubNavTab from "@/app/perfil/AccountSubNavTab"

type WishlistTab = "products" | "nail-art"

type WishlistClientProps = {
  isAdmin?: boolean
}

export default function WishlistClient({ isAdmin = false }: WishlistClientProps) {
  const { slugs, clearAll } = useWishlist()
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<WishlistTab>("products")

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    setProducts((prev) => prev.filter((p) => slugs.includes(p.slug)))
    setLoading(true)
    fetch(`/api/products/by-slugs?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setProducts(json.data as ProductWithCategory[])
      })
      .finally(() => setLoading(false))
  }, [slugs])

  return (
    <AccountShell
      active="wishlist"
      title="Tu wishlist"
      breadcrumbLabel="Wishlist"
      isAdmin={isAdmin}
      showFooter={false}
      headerAction={
        activeTab === "products" && products.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-900 underline underline-offset-4 transition-colors hover:text-black"
          >
            Limpiar todo
          </button>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-5">
        <AccountSubNavTab
          as="button"
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          label="Productos"
        />
        <AccountSubNavTab
          as="button"
          active={activeTab === "nail-art"}
          onClick={() => setActiveTab("nail-art")}
          label="Nail art"
        />
      </div>

      <div className="mt-7">
        {activeTab === "products" ? (
          loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-neutral-200/60" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-start gap-4 py-12">
              <Heart className="h-10 w-10 text-neutral-400" />
              <p className="text-base text-neutral-600">Sin artículos</p>
              <Link
                href="/tienda"
                className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 underline underline-offset-4 transition-colors hover:text-black"
              >
                Explorar tienda
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-col items-start gap-4 py-12">
            <p className="text-base text-neutral-600">Sin artículos</p>
            <Link
              href="/nail-art"
              className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 underline underline-offset-4 transition-colors hover:text-black"
            >
              Explorar nail art
            </Link>
          </div>
        )}
      </div>
    </AccountShell>
  )
}
