import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import { searchProductsForBlog } from "@/lib/supabase/blog"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const auth = await requireAdmin(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""

    const products = await searchProductsForBlog(q, 20)
    return NextResponse.json({ data: products, error: null })
  } catch {
    return NextResponse.json({ data: null, error: { message: "Error interno" } }, { status: 500 })
  }
}
