"use client"

import { useState } from "react"
import type {
  CourseReviewRow,
  CourseReviewSummary,
} from "@/lib/supabase/course-reviews"

type Props = {
  courseId: string
  initialReviews: CourseReviewRow[]
  initialSummary: CourseReviewSummary
  canReview: boolean
  ownReview: CourseReviewRow | null
}

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
}

function Star({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "#c6a75e" : "none"}
      stroke={filled ? "#c6a75e" : "#d9d9d9"}
      strokeWidth="1.6"
      className={className ?? "h-4 w-4"}
      aria-hidden
    >
      <path d="M12 2.5l2.95 6.06 6.68.92-4.87 4.67 1.2 6.63L12 17.6l-5.96 3.18 1.2-6.63-4.87-4.67 6.68-.92L12 2.5z" />
    </svg>
  )
}

function Stars({ value, size }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} filled={n <= Math.round(value)} className={size} />
      ))}
    </span>
  )
}

function ReviewForm({
  courseId,
  ownReview,
  onSaved,
}: {
  courseId: string
  ownReview: CourseReviewRow | null
  onSaved: (review: CourseReviewRow) => void
}) {
  const [rating, setRating] = useState(ownReview?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(ownReview?.comment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      setError("Selecciona una calificación")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok || !json.data) {
        setError(json.error?.message ?? "No se pudo guardar la reseña")
        return
      }
      setSaved(true)
      onSaved(json.data.review)
    } catch {
      setError("Error de conexión, intenta de nuevo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#c6a75e]/25 bg-neutral-100 p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8862f]">
        Participante avalada
      </p>
      <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#111] sm:text-[16px]">
        {ownReview ? "Edita tu reseña" : "Comparte tu experiencia"}
      </h3>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star filled={n <= (hover || rating)} className="h-7 w-7" />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="¿Qué te pareció el curso? (opcional)"
        className="mt-4 w-full resize-none rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#9a9a9a] transition-all focus:border-[#c6a75e] focus:shadow-[0_0_0_3px_#f5efdc]"
      />

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-2 text-[13px] text-[#a8862f]">
          ¡Gracias! Tu reseña quedó guardada.
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center rounded-full bg-[#1a1a1a] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#a8862f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Guardando…"
          : ownReview
            ? "Actualizar reseña"
            : "Publicar reseña"}
      </button>
    </form>
  )
}

export default function CourseReviews({
  courseId,
  initialReviews,
  initialSummary,
  canReview,
  ownReview,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [summary, setSummary] = useState(initialSummary)
  const [own, setOwn] = useState(ownReview)

  function handleSaved(review: CourseReviewRow) {
    setOwn(review)
    setReviews((prev) => {
      const rest = prev.filter((r) => r.id !== review.id)
      return [review, ...rest]
    })
    setSummary(() => {
      const all = [review, ...reviews.filter((r) => r.id !== review.id)]
      const total = all.reduce((acc, r) => acc + r.rating, 0)
      return {
        average: Math.round((total / all.length) * 10) / 10,
        count: all.length,
      }
    })
  }

  if (reviews.length === 0 && !canReview) return null

  return (
    <section className="mt-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
          Lo que dicen las participantes
        </h2>
        <div className="mb-4 mt-5 h-0.5 w-9 bg-[#c6a75e]" />
        {summary.count > 0 ? (
          <div className="flex items-center gap-3">
            <span className="text-[28px] font-semibold leading-none text-[#111]">
              {summary.average.toFixed(1)}
            </span>
            <div>
              <Stars value={summary.average} size="h-[18px] w-[18px]" />
              <p className="mt-0.5 text-[12.5px] text-[#6b6b6b]">
                {summary.count} reseña{summary.count !== 1 ? "s" : ""} de
                participantes avaladas
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed text-[#6b6b6b]">
            Aún no hay reseñas de esta edición.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,380px)]">
        {/* Lista */}
        <div>
          {reviews.length > 0 ? (
            <ul className="divide-y divide-[#ececec]">
              {reviews.map((r) => (
                <li key={r.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#c6a75e]/15 text-[13px] font-semibold text-[#a8862f]">
                        {r.author_name[0]?.toUpperCase() ?? "P"}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-[#1a1a1a]">
                          {r.author_name}
                        </p>
                        <p className="text-[11.5px] text-[#9a9a9a]">
                          {formatDate(r.created_at)}
                        </p>
                      </div>
                    </div>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="mt-3 text-[14px] leading-relaxed text-[#4b4b4b]">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[#6b6b6b]">
              Sé la primera en compartir tu experiencia.
            </p>
          )}
        </div>

        {/* Formulario — solo participantes avaladas */}
        {canReview && (
          <div>
            <ReviewForm
              courseId={courseId}
              ownReview={own}
              onSaved={handleSaved}
            />
          </div>
        )}
      </div>
    </section>
  )
}
