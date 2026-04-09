import { createClient } from "@supabase/supabase-js"

import { LOW_STOCK_THRESHOLD } from "@/constants/stock"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type LowStockVariantRow = {
  id: string
  variant_name: string
  sku: string
  stock: number
  product_id: string
  product_name: string
}

type ProductJoin = {
  name: string | null
  deleted_at: string | null
  is_active: boolean | null
}

type VariantRow = {
  id: string
  variant_name: string
  sku: string | null
  stock: number | string
  product_id: string
  products: ProductJoin | ProductJoin[] | null
}

function unwrapProduct(
  products: ProductJoin | ProductJoin[] | null
): ProductJoin | null {
  if (Array.isArray(products)) return products[0] ?? null
  return products ?? null
}

/**
 * Variantes activas con stock bajo, solo productos activos y no eliminados.
 */
export async function getLowStockVariants(): Promise<LowStockVariantRow[]> {
  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .select(
      `
      id,
      variant_name,
      sku,
      stock,
      product_id,
      products (
        name,
        deleted_at,
        is_active
      )
    `
    )
    .eq("is_active", true)
    .lte("stock", LOW_STOCK_THRESHOLD)
    .order("stock", { ascending: true })

  if (error) {
    console.error("[getLowStockVariants]", error.message)
    throw new Error(error.message)
  }

  const raw = (data ?? []) as VariantRow[]
  const filtered: LowStockVariantRow[] = []

  for (const row of raw) {
    const product = unwrapProduct(row.products)
    if (
      !product ||
      product.deleted_at !== null ||
      product.is_active !== true
    ) {
      continue
    }

    filtered.push({
      id: row.id,
      variant_name: row.variant_name,
      sku: row.sku ?? "",
      stock: Number(row.stock),
      product_id: row.product_id,
      product_name: product.name ?? "Producto",
    })
  }

  filtered.sort((a, b) => a.stock - b.stock)

  return filtered
}
