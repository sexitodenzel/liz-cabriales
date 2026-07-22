"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"

import type {
  ServiceReviewRow,
  ServiceReviewSummary,
} from "@/lib/supabase/service-reviews"

type Props = {
  initialReviews: ServiceReviewRow[]
  initialSummary: ServiceReviewSummary
  isAuthenticated: boolean
  ownReview: ServiceReviewRow | null
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return "hoy"
  if (days === 1) return "hace 1 día"
  if (days < 14) return `hace ${days} días`
  if (days < 45) {
    const weeks = Math.max(1, Math.round(days / 7))
    return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`
  }
  const months = Math.max(1, Math.round(days / 30))
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`
}

function formatAverage(avg: number): string {
  if (avg <= 0) return "—"
  return avg.toFixed(1).replace(".", ",")
}

function summarize(list: { rating: number }[]): ServiceReviewSummary {
  if (list.length === 0) return { average: 0, count: 0 }
  const total = list.reduce((acc, r) => acc + r.rating, 0)
  return {
    average: Math.round((total / list.length) * 10) / 10,
    count: list.length,
  }
}

function StarsRow({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < count
              ? "fill-[#c6a75e] text-[#c6a75e]"
              : "fill-transparent text-neutral-300"
          }`}
        />
      ))}
    </span>
  )
}

function ReviewForm({
  ownReview,
  onSaved,
}: {
  ownReview: ServiceReviewRow | null
  onSaved: (review: ServiceReviewRow) => void
}) {
  const router = useRouter()
  const [rating, setRating] = useState(ownReview?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(ownReview?.comment ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Tras refresh o navegación, recupera la reseña registrada del usuario.
  useEffect(() => {
    setRating(ownReview?.rating ?? 0)
    setComment(ownReview?.comment ?? "")
  }, [ownReview?.id, ownReview?.rating, ownReview?.comment])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      setError("Selecciona una calificación")
      return
    }
    if (!comment.trim()) {
      setError("Escribe un comentario para tu reseña")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/service-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      })
      const json = await res.json()
      if (res.status === 401) {
        router.push(
          `/login?redirect=${encodeURIComponent("/servicios#resenas")}`
        )
        return
      }
      if (!res.ok || !json.data) {
        setError(json.error?.message ?? "No se pudo guardar la reseña")
        return
      }
      setSaved(true)
      onSaved(json.data.review as ServiceReviewRow)
      router.refresh()
    } catch {
      setError("Error de conexión, intenta de nuevo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-[#ececec] bg-white p-5 sm:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d26]">
        Tu opinión
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-playfair),serif] text-[22px] font-medium text-[#111]">
        {ownReview ? "Tu reseña" : "Escribe una reseña"}
      </h3>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => {
              setSaved(false)
              setRating(n)
            }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                n <= (hover || rating)
                  ? "fill-[#c6a75e] text-[#c6a75e]"
                  : "fill-transparent text-neutral-300"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => {
          setSaved(false)
          setComment(e.target.value)
        }}
        rows={3}
        maxLength={1000}
        placeholder="Cuéntanos tu experiencia en el estudio…"
        className="mt-4 w-full resize-none rounded-xl border border-[#ececec] bg-ivory px-4 py-3 text-[14px] text-[#1a1a1a] outline-none placeholder:text-[#9a9a9a] transition-all focus:border-[#c6a75e]"
      />

      {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      {saved && !error && (
        <p className="mt-2 text-[13px] text-[#8a6d26]">
          ¡Gracias por enviar tu reseña! Te invitamos a que explores nuestro
          catálogo:{" "}
          <a
            href="/tienda"
            className="font-semibold underline underline-offset-2 hover:text-[#111]"
          >
            /tienda
          </a>
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center rounded-full bg-[#1a1a1a] px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Guardando…"
          : ownReview
            ? "Actualizar reseña"
            : "Enviar reseña"}
      </button>
    </form>
  )
}

export function ServiceReviewsAverage({
  summary,
  className = "",
}: {
  summary: ServiceReviewSummary
  className?: string
}) {
  if (summary.count === 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="font-semibold text-[#111]">Nuevo</span>
        <StarsRow count={0} />
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold text-[#111]">
        {formatAverage(summary.average)}
      </span>
      <StarsRow count={Math.round(summary.average)} />
      <span className="text-[#8a6d26]">({summary.count})</span>
    </span>
  )
}

export default function ServiceReviewsSection({
  initialReviews,
  initialSummary,
  isAuthenticated,
  ownReview,
}: Props) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [summary, setSummary] = useState(initialSummary)
  const [own, setOwn] = useState(ownReview)
  // Si ya tiene reseña, se muestra al entrar / al hacer refresh.
  const [showForm, setShowForm] = useState(
    () => Boolean(isAuthenticated && ownReview)
  )

  useEffect(() => {
    setOwn(ownReview)
    setReviews(initialReviews)
    setSummary(initialSummary)
    if (isAuthenticated && ownReview) {
      setShowForm(true)
    }
  }, [ownReview, initialReviews, initialSummary, isAuthenticated])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.location.hash === "#resenas" && isAuthenticated) {
      setShowForm(true)
    }
  }, [isAuthenticated])

  function handleWriteClick() {
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent("/servicios#resenas")}`
      )
      return
    }
    setShowForm(true)
  }

  function handleSaved(review: ServiceReviewRow) {
    setOwn(review)
    setShowForm(true)
    // Al crear/actualizar queda pendiente: sale del listado público hasta reaprobar.
    if (!review.is_approved) {
      setReviews((prev) => {
        const next = prev.filter(
          (r) => r.id !== review.id && r.user_id !== review.user_id
        )
        setSummary(summarize(next))
        return next
      })
    }
  }

  return (
    <section id="resenas" className="scroll-mt-36" aria-labelledby="resenas-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="resenas-heading"
            className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]"
          >
            Reseñas
          </h2>
          <div className="mt-5 flex items-center gap-2">
            {summary.count > 0 ? (
              <>
                <span className="text-[28px] font-semibold leading-none text-[#111]">
                  {formatAverage(summary.average)}
                </span>
                <StarsRow count={Math.round(summary.average)} />
                <span className="text-[13px] text-[#8a6d26]">
                  ({summary.count})
                </span>
              </>
            ) : (
              <p className="text-[13px] text-[#6b6b6b]">
                Aún no hay reseñas publicadas.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleWriteClick}
          className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-neutral-800"
        >
          {own ? "Mi reseña" : "Escribir reseña"}
        </button>
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c6a75e]/20 text-[13px] font-semibold text-[#8a6d26]">
                  {review.author_name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111]">
                    {review.author_name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {formatRelativeDate(review.created_at)}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <StarsRow count={review.rating} />
              </div>
              {review.comment && (
                <p className="mt-2 text-[13px] leading-relaxed text-[#5a5a5a]">
                  {review.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-[13px] text-[#6b6b6b]">
          Sé la primera en compartir tu experiencia.
        </p>
      )}

      {showForm && isAuthenticated && (
        <ReviewForm ownReview={own} onSaved={handleSaved} />
      )}
    </section>
  )
}
