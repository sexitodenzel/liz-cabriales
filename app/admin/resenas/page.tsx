import { getAllProductReviews } from "@/lib/supabase/product-reviews"

import ProductReviewsModeration from "./ProductReviewsModeration"

export const dynamic = "force-dynamic"

export default async function AdminResenasPage() {
  const result = await getAllProductReviews()
  const reviews = result.data ?? []

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">
          Reseñas de productos
        </h1>
        <p className="mt-1 text-[13px] text-[#6b6b6b]">
          Reseñas con compra verificada. Oculta una reseña para que deje de
          mostrarse en la tienda sin borrarla.
        </p>
        {result.error ? (
          <p className="mt-6 text-[13px] text-red-600">
            No se pudieron cargar las reseñas: {result.error.message}. Si la
            tabla aún no existe, corre docs/delivery/sql-product-reviews.sql en
            Supabase.
          </p>
        ) : (
          <ProductReviewsModeration initialReviews={reviews} />
        )}
      </div>
    </main>
  )
}
