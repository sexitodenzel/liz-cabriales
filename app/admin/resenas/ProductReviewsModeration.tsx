"use client"

import { useState } from "react"
import Link from "next/link"
import type { AdminProductReviewRow } from "@/lib/supabase/product-reviews"

type Props = {
  initialReviews: AdminProductReviewRow[]
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "#c9a84c" : "none"}
      stroke={filled ? "#c9a84c" : "#d9d9d9"}
      strokeWidth="1.6"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M12 2.5l2.95 6.06 6.68.92-4.87 4.67 1.2 6.63L12 17.6l-5.96 3.18 1.2-6.63-4.87-4.67 6.68-.92L12 2.5z" />
    </svg>
  )
}

export default function ProductReviewsModeration({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleApproval(review: AdminProductReviewRow) {
    setBusy(review.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/product-reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: !review.is_approved }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error?.message ?? "No se pudo actualizar")
        return
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_approved: !r.is_approved } : r
        )
      )
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(null)
    }
  }

  async function remove(review: AdminProductReviewRow) {
    if (!window.confirm("¿Eliminar esta reseña definitivamente?")) return
    setBusy(review.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/product-reviews/${review.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error?.message ?? "No se pudo eliminar")
        return
      }
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
    } catch {
      setError("Error de conexión")
    } finally {
      setBusy(null)
    }
  }

  if (reviews.length === 0) {
    return (
      <p className="mt-6 text-[14px] text-[#6b6b6b]">
        Aún no hay reseñas de productos.
      </p>
    )
  }

  return (
    <>
      {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}

      <ul className="mt-6 space-y-3">
        {reviews.map((r) => (
          <li
            key={r.id}
            className={`rounded-xl border p-4 ${
              r.is_approved
                ? "border-[#ececec] bg-neutral-100"
                : "border-dashed border-[#d9d9d9] bg-white opacity-70"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">
                  {r.author_name}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} filled={n <= r.rating} />
                  ))}
                </span>
                {r.product_slug ? (
                  <Link
                    href={`/tienda/${r.product_slug}`}
                    target="_blank"
                    className="text-[12px] font-medium text-[#a8862f] underline decoration-[#c9a84c]/40 underline-offset-2 hover:decoration-[#c9a84c]"
                  >
                    {r.product_name}
                  </Link>
                ) : (
                  <span className="text-[12px] text-[#9a9a9a]">
                    {r.product_name}
                  </span>
                )}
                {!r.is_approved && (
                  <span className="rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Oculta
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleApproval(r)}
                  disabled={busy === r.id}
                  className="rounded-full border border-[#ececec] px-3.5 py-1.5 text-[12px] font-medium text-[#3a3a3a] transition-colors hover:border-[#c9a84c] hover:text-[#a8862f] disabled:opacity-50"
                >
                  {r.is_approved ? "Ocultar" : "Mostrar"}
                </button>
                <button
                  onClick={() => remove(r)}
                  disabled={busy === r.id}
                  className="rounded-full border border-red-200 px-3.5 py-1.5 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
            {r.comment && (
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#4b4b4b]">
                {r.comment}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}
