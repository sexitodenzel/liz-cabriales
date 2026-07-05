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

export type CourseReviewRow = {
  id: string
  course_id: string
  user_id: string
  rating: number
  comment: string | null
  is_approved: boolean
  created_at: string
  author_name: string
}

export type CourseReviewSummary = {
  average: number
  count: number
}

type RawReviewRow = {
  id: string
  course_id: string
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

const SELECT = `id, course_id, user_id, rating, comment, is_approved, created_at,
  users ( first_name, last_name )`

function mapRow(raw: RawReviewRow): CourseReviewRow {
  const user = Array.isArray(raw.users) ? raw.users[0] : raw.users
  const first = user?.first_name?.trim() ?? ""
  const lastInitial = user?.last_name?.trim()?.[0]
  const name = first
    ? lastInitial
      ? `${first} ${lastInitial}.`
      : first
    : "Participante"
  return {
    id: raw.id,
    course_id: raw.course_id,
    user_id: raw.user_id,
    rating: Number(raw.rating),
    comment: raw.comment ?? null,
    is_approved: Boolean(raw.is_approved),
    created_at: raw.created_at,
    author_name: name,
  }
}

function summarize(reviews: { rating: number }[]): CourseReviewSummary {
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

/** Reseñas aprobadas de un curso. Degrada a vacío si la tabla no existe. */
export async function getCourseReviews(
  courseId: string
): Promise<{ reviews: CourseReviewRow[]; summary: CourseReviewSummary }> {
  const { data, error } = await supabaseAdmin
    .from("course_reviews")
    .select(SELECT)
    .eq("course_id", courseId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })

  if (error || !data) return { reviews: [], summary: summarize([]) }
  const reviews = (data as unknown as RawReviewRow[]).map(mapRow)
  return { reviews, summary: summarize(reviews) }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Elegibilidad y escritura (participantes avaladas)
 * ────────────────────────────────────────────────────────────────────── */

export type ReviewEligibility = {
  canReview: boolean
  ownReview: CourseReviewRow | null
}

/** Una usuaria puede reseñar si tiene inscripción pagada al curso. */
export async function getReviewEligibility(
  courseId: string,
  userId: string
): Promise<ReviewEligibility> {
  const [{ data: regs }, { data: own }] = await Promise.all([
    supabaseAdmin
      .from("course_registrations")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .eq("status", "paid")
      .limit(1),
    supabaseAdmin
      .from("course_reviews")
      .select(SELECT)
      .eq("course_id", courseId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  return {
    canReview: Boolean(regs && regs.length > 0),
    ownReview: own ? mapRow(own as unknown as RawReviewRow) : null,
  }
}

/** Crea o actualiza la reseña de la usuaria. Valida la inscripción pagada. */
export async function upsertReview(input: {
  courseId: string
  userId: string
  rating: number
  comment: string | null
}): Promise<Result<CourseReviewRow>> {
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

  const { data: regs, error: regErr } = await supabaseAdmin
    .from("course_registrations")
    .select("id")
    .eq("course_id", input.courseId)
    .eq("user_id", input.userId)
    .eq("status", "paid")
    .limit(1)

  if (regErr) {
    return { data: null, error: { message: regErr.message, code: regErr.code } }
  }
  if (!regs || regs.length === 0) {
    return {
      data: null,
      error: {
        message: "Solo participantes con inscripción pagada pueden reseñar este curso",
        code: "FORBIDDEN",
      },
    }
  }

  const { data, error } = await supabaseAdmin
    .from("course_reviews")
    .upsert(
      {
        course_id: input.courseId,
        user_id: input.userId,
        rating,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id,user_id" }
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

/** Todas las reseñas de un curso, incluidas las ocultas. */
export async function getAllCourseReviews(
  courseId: string
): Promise<Result<CourseReviewRow[]>> {
  const { data, error } = await supabaseAdmin
    .from("course_reviews")
    .select(SELECT)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return {
    data: ((data ?? []) as unknown as RawReviewRow[]).map(mapRow),
    error: null,
  }
}

export async function setReviewApproval(
  reviewId: string,
  isApproved: boolean
): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("course_reviews")
    .update({ is_approved: isApproved, updated_at: new Date().toISOString() })
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}

export async function deleteReview(reviewId: string): Promise<Result<null>> {
  const { error } = await supabaseAdmin
    .from("course_reviews")
    .delete()
    .eq("id", reviewId)

  if (error) {
    return { data: null, error: { message: error.message, code: error.code } }
  }
  return { data: null, error: null }
}
