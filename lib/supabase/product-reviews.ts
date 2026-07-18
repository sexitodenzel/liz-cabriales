import { createClient as createServiceClient } from "@supabase/supabase-js"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

/* ──────────────────────────────────────────────────────────────────────────
 * Tipos
 * ────────────────────────────────────────────────────────────────────── */

export type ProductReviewRow = {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  author_name: string
}

export type ProductReviewSummary = {
  average: number
  count: number
}

/** Estados de orden que cuentan como compra pagada (todo lo posterior a
 *  'pending' menos 'cancelled'). */
const PAID_ORDER_STATUSES = [
  "paid",
  "awaiting_shipping_payment",
  "shipping_paid",
  "shipped",
  "delivered",
]

type RawReviewRow = {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  users:
    | { first_name?: string | null; last_name?: string | null }
    | { first_name?: string | null; last_name?: string | null }[]
    | null
}

const SELECT = `id, product_id, user_id, rating, comment, is_approved, created_at,
  users ( first_name, last_name )`

function mapRow(raw: RawReviewRow): ProductReviewRow {
  const user = Array.isArray(raw.users) ? raw.users[0] : raw.users
  const first = user?.first_name?.trim() ?? ""
  const lastInitial = user?.last_name?.trim()?.[0]
  const name = first
    ? lastInitial
      ? `${first} ${lastInitial}.`
      : first
    : "Clienta verificada"
  return {
    id: raw.id,
    product_id: raw.product_id,
    user_id: raw.user_id,
    rating: Number(raw.rating),
    comment: raw.comment ?? null,
    is_approved: Boolean(raw.is_approved),
    created_at: raw.created_at,
    author_name: name,
  }
}

function summarize(reviews: { rating: number }[]): ProductReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0 }
  const total = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Lectura pública
 * ────────────────────────────────────────────────────────────────────── */

/** Reseñas aprobadas de un producto. Degrada a vacío si la tabla no existe. */
export async function getProductReviews(
  productId: string
): Promise<{ reviews: ProductReviewRow[]; summary: ProductReviewSummary }> {
  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .select(SELECT)
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) return { reviews: [], summary: summarize([]) }
  const reviews = (data as unknown as RawReviewRow[]).map(mapRow)
  return { reviews, summary: summarize(reviews) }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Elegibilidad y escritura (compra verificada)
 * ────────────────────────────────────────────────────────────────────── */

export type ProductReviewEligibility = {
  canReview: boolean
  ownReview: ProductReviewRow | null
}

/** ¿La usuaria tiene una orden pagada que incluya este producto? */
async function hasVerifiedPurchase(
  productId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("order_items")
    .select("id, orders!inner ( id )")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .in("orders.status", PAID_ORDER_STATUSES)
    .limit(1)

  return Boolean(data && data.length > 0)
}

export async function getProductReviewEligibility(
  productId: string,
  userId: string
): Promise<ProductReviewEligibility> {
  const [purchased, { data: own }] = await Promise.all([
    hasVerifiedPurchase(productId, userId),
    supabaseAdmin
      .from("product_reviews")
      .select(SELECT)
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  return {
    canReview: purchased,
    ownReview: own ? mapRow(own as unknown as RawReviewRow) : null,
  }
}

/** Crea o actualiza la reseña de la usuaria. Valida la compra pagada. */
export async function upsertProductReview(input: {
  productId: string
  userId: string
  rating: number
  comment: string | null
}): Promise<Result<ProductReviewRow>> {
  const rating = Math.round(input.rating)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return {
      data: null,
      error: { message: "La calificación debe ser de 1 a 5", code: "VALIDATION_ERROR" },
    }
  }

  const comment = input.comment?.trim() || null
  if (comment && comment.length > 1000) {
    return {
      data: null,
      error: {
        message: "El comentario no puede exceder 1000 caracteres",
        code: "VALIDATION_ERROR",
      },
    }
  }

  const purchased = await hasVerifiedPurchase(input.productId, input.userId)
  if (!purchased) {
    return {
      data: null,
      error: {
        message: "Solo clientas con compra verificada pueden reseñar este producto",
        code: "FORBIDDEN",
      },
    }
  }

  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .upsert(
      {
        product_id: input.productId,
        user_id: input.userId,
        rating,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id,user_id" }
    )
    .select(SELECT)
    .single()

  if (error || !data) {
    return {
      data: null,
      error: {
        message: error?.message ?? "No se pudo guardar la reseña",
        code: error?.code,
      },
    }
  }
  return { data: mapRow(data as unknown as RawReviewRow), error: null }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Moderación (admin)
 * ────────────────────────────────────────────────────────────────────── */

export type AdminProductReviewRow = ProductReviewRow & {
  product_name: string
  product_slug: string | null
}

type RawAdminRow = RawReviewRow & {
  products:
    | { name?: string | null; slug?: string | null }
    | { name?: string | null; slug?: string | null }[]
    | null
}

/** Todas las reseñas de productos (incluidas ocultas), más recientes primero. */
export async function getAllProductReviews(
  limit = 200
): Promise<Result<AdminProductReviewRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("product_reviews")
    .select(`${SELECT}, products ( name, slug )`)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = ((data ?? []) as unknown as RawAdminRow[]).map((raw) => {
    const product = Array.isArray(raw.products) ? raw.products[0] : raw.products
    return {
      ...mapRow(raw),
      product_name: product?.name ?? "Producto eliminado",
      product_slug: product?.slug ?? null,
    }
  })
  return { data: rows, error: null }
}

export async function setProductReviewApproval(
  reviewId: string,
  isApproved: boolean
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("product_reviews")
    .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function deleteProductReview(
  reviewId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("product_reviews")
    .delete()
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}
