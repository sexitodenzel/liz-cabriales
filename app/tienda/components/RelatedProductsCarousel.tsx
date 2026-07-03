"use client"

import type { ProductWithCategory } from "@/lib/supabase/products"
import ProductCard from "./ProductCard"
import SectionCarousel from "./SectionCarousel"

type Props = {
  products: ProductWithCategory[]
}

export default function RelatedProductsCarousel({ products }: Props) {
  if (products.length === 0) return null

  return (
    <SectionCarousel title="También te puede interesar">
      {products.map((product) => (
        <div key={product.id} className="w-64 flex-none">
          <ProductCard product={product} />
        </div>
      ))}
    </SectionCarousel>
  )
}
