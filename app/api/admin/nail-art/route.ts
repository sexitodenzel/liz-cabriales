import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin"
import {
  getAllNailArtPostsAdmin,
  createNailArtPost,
  updateNailArtPost,
  deleteNailArtPost,
  listPendingInspirations,
  moderateInspiration,
} from "@/lib/supabase/nail-art"
import { revalidateTag } from "next/cache"

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: Request) {
  try {
    const user = await getAdminUser()
    const auth = await requireAdmin(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    const { searchParams } = new URL(request.url)
    const pendingOnly = searchParams.get("pending") === "1"

    if (pendingOnly) {
      const pending = await listPendingInspirations()
      return NextResponse.json({ data: pending, error: null })
    }

    const posts = await getAllNailArtPostsAdmin()
    return NextResponse.json({ data: posts, error: null })
  } catch {
    return NextResponse.json({ data: null, error: { message: "Error interno" } }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAdminUser()
    const auth = await requireAdmin(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ data: null, error: { message: "Cuerpo inválido" } }, { status: 400 })
    }

    const { title, slug, description, cover_image, is_active, sort_order, products } = body as Record<string, unknown>

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ data: null, error: { message: "title es requerido" } }, { status: 400 })
    }
    if (typeof slug !== "string" || !slug.trim()) {
      return NextResponse.json({ data: null, error: { message: "slug es requerido" } }, { status: 400 })
    }

    const result = await createNailArtPost({
      title: title.trim(),
      slug: slug.trim(),
      description: typeof description === "string" ? description : undefined,
      cover_image: typeof cover_image === "string" ? cover_image : undefined,
      is_active: typeof is_active === "boolean" ? is_active : true,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      products: Array.isArray(products)
        ? (products as Array<{ product_id: string; usage_description?: string; sort_order?: number }>)
        : [],
    })

    if (result.error) {
      return NextResponse.json({ data: null, error: { message: result.error } }, { status: 500 })
    }

    try { revalidateTag("nail-art", "max") } catch { /* ignore */ }

    return NextResponse.json({ data: { id: result.id }, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: { message: "Error interno" } }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAdminUser()
    const auth = await requireAdmin(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ data: null, error: { message: "Cuerpo inválido" } }, { status: 400 })
    }

    const { id, action, rejection_reason, ...fields } = body as Record<string, unknown>

    if (typeof id !== "string" || !id) {
      return NextResponse.json({ data: null, error: { message: "id es requerido" } }, { status: 400 })
    }

    if (action === "approve" || action === "reject") {
      if (!user?.id) {
        return NextResponse.json({ data: null, error: { message: "No autenticado" } }, { status: 401 })
      }
      const result = await moderateInspiration(
        id,
        action,
        user.id,
        typeof rejection_reason === "string" ? rejection_reason : undefined
      )
      if (result.error) {
        return NextResponse.json({ data: null, error: { message: result.error } }, { status: 400 })
      }
      try { revalidateTag("nail-art", "max") } catch { /* ignore */ }
      return NextResponse.json({ data: { ok: true }, error: null })
    }

    const update: Parameters<typeof updateNailArtPost>[1] = {}
    if (typeof fields.title === "string") update.title = fields.title
    if (typeof fields.slug === "string") update.slug = fields.slug
    if (typeof fields.description === "string") update.description = fields.description
    if (typeof fields.cover_image === "string") update.cover_image = fields.cover_image
    if (typeof fields.is_active === "boolean") update.is_active = fields.is_active
    if (typeof fields.sort_order === "number") update.sort_order = fields.sort_order
    if (Array.isArray(fields.products)) {
      update.products = fields.products as Array<{ product_id: string; usage_description?: string; sort_order?: number }>
    }

    const result = await updateNailArtPost(id, update)
    if (result.error) {
      return NextResponse.json({ data: null, error: { message: result.error } }, { status: 500 })
    }

    try { revalidateTag("nail-art", "max") } catch { /* ignore */ }
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: { message: "Error interno" } }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAdminUser()
    const auth = await requireAdmin(user?.id)
    if (auth.error) {
      const status = auth.error.code === "UNAUTHENTICATED" ? 401 : 403
      return NextResponse.json({ data: null, error: auth.error }, { status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ data: null, error: { message: "id es requerido" } }, { status: 400 })
    }

    const result = await deleteNailArtPost(id)
    if (result.error) {
      return NextResponse.json({ data: null, error: { message: result.error } }, { status: 500 })
    }

    try { revalidateTag("nail-art", "max") } catch { /* ignore */ }
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: { message: "Error interno" } }, { status: 500 })
  }
}
