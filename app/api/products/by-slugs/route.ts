import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const slugs = req.nextUrl.searchParams.get("slugs")?.split(",").filter(Boolean) ?? []

  if (slugs.length === 0) return NextResponse.json({ data: [], error: null })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, base_price, images, brand, is_active,
      categories ( id, name, slug ),
      product_variants ( id, product_id, sku, variant_name, price, stock, is_active )
    `)
    .in("slug", slugs)
    .is("deleted_at", null)
    .eq("is_active", true)

  if (error) return NextResponse.json({ data: null, error: { message: error.message } }, { status: 500 })

  return NextResponse.json({ data: data ?? [], error: null })
}
