import { createClient as createServiceClient } from "@supabase/supabase-js"

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SupabaseError = { message: string; code?: string }
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: SupabaseError }

export type ServiceReviewRow = {
  id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  author_name: string
}

export type ServiceReviewSummary = {
  average: number
  count: number
}

type RawReviewRow = {
  id: string
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

const SELECT = `id, user_id, rating, comment, is_approved, created_at,
  users ( first_name, last_name )`

function mapRow(raw: RawReviewRow): ServiceReviewRow {
  const user = Array.isArray(raw.users) ? raw.users[0] : raw.users
  const first = user?.first_name?.trim() ?? ""
  const lastInitial = user?.last_name?.trim()?.[0]
  const name = first
    ? lastInitial
      ? `${first} ${lastInitial}.`
      : first
    : "Clienta"
  return {
    id: raw.id,
    user_id: raw.user_id,
    rating: Number(raw.rating),
    comment: raw.comment ?? null,
    is_approved: Boolean(raw.is_approved),
    created_at: raw.created_at,
    author_name: name,
  }
}

function summarize(reviews: { rating: number }[]): ServiceReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0 }
  const total = reviews.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  }
}

function isMissingTableError(error: { message?: string; code?: string }): boolean {
  if (error.code === "42P01") return true
  const msg = (error.message ?? "").toLowerCase()
  return msg.includes("service_reviews") && msg.includes("does not exist")
}

/** Reseñas aprobadas visibles en /servicios. */
export async function getApprovedServiceReviews(): Promise<{
  reviews: ServiceReviewRow[]
  summary: ServiceReviewSummary
}> {
  const { data, error } = await supabaseAdmin
    .from("service_reviews")
    .select(SELECT)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) {
    if (error && isMissingTableError(error)) {
      return { reviews: [], summary: summarize([]) }
    }
    return { reviews: [], summary: summarize([]) }
  }

  const reviews = (data as unknown as RawReviewRow[]).map(mapRow)
  return { reviews, summary: summarize(reviews) }
}

/** Reseña propia (aprobada o pendiente). */
export async function getOwnServiceReview(
  userId: string
): Promise<ServiceReviewRow | null> {
  const { data, error } = await supabaseAdmin
    .from("service_reviews")
    .select(SELECT)
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return mapRow(data as unknown as RawReviewRow)
}

/**
 * Crea o actualiza la reseña. Siempre queda pendiente (is_approved = false)
 * hasta que el admin la apruebe.
 */
export async function upsertServiceReview(input: {
  userId: string
  rating: number
  comment: string | null
}): Promise<Result<ServiceReviewRow>> {
  const rating = Math.round(input.rating)
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return {
      data: null,
      error: {
        message: "La calificación debe ser de 1 a 5",
        code: "VALIDATION_ERROR",
      },
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
  if (!comment) {
    return {
      data: null,
      error: {
        message: "Escribe un comentario para tu reseña",
        code: "VALIDATION_ERROR",
      },
    }
  }

  const { data, error } = await supabaseAdmin
    .from("service_reviews")
    .upsert(
      {
        user_id: input.userId,
        rating,
        comment,
        is_approved: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
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

/** Todas las reseñas para moderación admin (pendientes primero). */
export async function getAllServiceReviews(): Promise<
  Result<ServiceReviewRow[]>
> {
  const { data, error } = await supabaseAdmin
    .from("service_reviews")
    .select(SELECT)
    .order("created_at", { ascending: false })

  if (error) {
    if (isMissingTableError(error)) {
      return { data: [], error: null }
    }
    return { data: null, error: { message: error.message, code: error.code } }
  }

  const rows = ((data ?? []) as unknown as RawReviewRow[]).map(mapRow)
  rows.sort((a, b) => {
    if (a.is_approved === b.is_approved) {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    return a.is_approved ? 1 : -1
  })

  return { data: rows, error: null }
}

export async function setServiceReviewApproval(
  reviewId: string,
  isApproved: boolean
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("service_reviews")
    .update({
      is_approved: isApproved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function deleteServiceReview(
  reviewId: string
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("service_reviews")
    .delete()
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}
