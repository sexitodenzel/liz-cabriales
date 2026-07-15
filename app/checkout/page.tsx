import Link from "next/link"
import { redirect } from "next/navigation"

import CheckoutClient from "./CheckoutClient"

import { getActiveCartSnapshot } from "@/lib/supabase/cart"
import {
  getProductBySlugCached,
  getRelatedProductsCached,
} from "@/lib/supabase/cache"
import type { ProductWithCategory } from "@/lib/supabase/products"
import { createClient } from "@/lib/supabase/server"

export default async function CheckoutPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Auto-cancel any abandoned pending orders before showing checkout.
  // Stock is only decremented in the MP webhook (deductStockForOrder),
  // so pending orders here never held inventory — safe to cancel.
  await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .eq("status", "pending")

  const cartResult = await getActiveCartSnapshot(user.id)

  if (!cartResult.data) {
    return (
      <main className="min-h-screen bg-white site-container py-10 text-[#0a0a0a]">
        <div className="mx-auto max-w-[720px] border border-neutral-200 bg-white p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Finalizar compra
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            No pudimos cargar tu pedido
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            {cartResult.error.message}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/carrito"
              className="inline-flex items-center justify-center border border-neutral-300 px-5 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:border-[#c9a84c] hover:text-[#c9a84c]"
            >
              Volver a la bolsa
            </Link>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#c9a84c] hover:text-[#0a0a0a]"
            >
              Seguir explorando
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (cartResult.data.items.length === 0) {
    redirect("/carrito")
  }

  const cartProductIds = new Set(cartResult.data.items.map((item) => item.productId))
  const firstSlug = cartResult.data.items[0]?.productSlug
  let relatedProducts: ProductWithCategory[] = []

  if (firstSlug) {
    const { data: anchorProduct } = await getProductBySlugCached(firstSlug)
    if (anchorProduct) {
      const { data: related } = await getRelatedProductsCached(
        anchorProduct.category_id,
        anchorProduct.brand,
        anchorProduct.id,
        8,
      )
      relatedProducts = (related ?? []).filter((product) => !cartProductIds.has(product.id))
    }
  }

  return (
    <CheckoutClient
      initialCart={cartResult.data}
      relatedProducts={relatedProducts}
    />
  )
}
