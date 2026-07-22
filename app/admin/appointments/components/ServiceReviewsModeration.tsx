"use client"

import { useMemo, useState } from "react"

import type { ServiceReviewRow } from "@/lib/supabase/service-reviews"
import { toast } from "@/app/components/ui/motion/toast-provider"

type Props = {
  initialReviews: ServiceReviewRow[]
}

type Filter = "all" | "pending" | "approved"

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

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

export default function ServiceReviewsModeration({ initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filter, setFilter] = useState<Filter>("pending")
  const [busy, setBusy] = useState<string | null>(null)

  const pendingCount = reviews.filter((r) => !r.is_approved).length
  const approvedCount = reviews.filter((r) => r.is_approved).length

  const visible = useMemo(() => {
    if (filter === "pending") return reviews.filter((r) => !r.is_approved)
    if (filter === "approved") return reviews.filter((r) => r.is_approved)
    return reviews
  }, [filter, reviews])

  async function setApproval(review: ServiceReviewRow, isApproved: boolean) {
    setBusy(review.id)
    try {
      const res = await fetch(`/api/admin/service-reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_approved: isApproved }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json.error?.message ?? "No se pudo actualizar")
        return
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_approved: isApproved } : r
        )
      )
      toast.success(isApproved ? "Reseña aprobada" : "Reseña puesta en espera")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBusy(null)
    }
  }

  async function remove(review: ServiceReviewRow) {
    if (!window.confirm("¿Eliminar esta reseña definitivamente?")) return
    setBusy(review.id)
    try {
      const res = await fetch(`/api/admin/service-reviews/${review.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        toast.error(json.error?.message ?? "No se pudo eliminar")
        return
      }
      setReviews((prev) => prev.filter((r) => r.id !== review.id))
      toast.success("Reseña eliminada")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Reseñas de servicios
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#111]">
            Moderación
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Aprueba reseñas para que aparezcan en /servicios. Las nuevas llegan
            en estado de espera.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "pending", label: `En espera (${pendingCount})` },
              { id: "approved", label: `Aprobadas (${approvedCount})` },
              { id: "all", label: `Todas (${reviews.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                filter === tab.id
                  ? "bg-[#111] text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-[#c9a84c]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-neutral-500">
          {filter === "pending"
            ? "No hay reseñas en espera."
            : filter === "approved"
              ? "Aún no hay reseñas aprobadas."
              : "Aún no hay reseñas."}
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {visible.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#111]">{r.author_name}</p>
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} filled={n <= r.rating} />
                      ))}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        r.is_approved
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {r.is_approved ? "Aprobada" : "En espera"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {formatDate(r.created_at)}
                  </p>
                  {r.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                      {r.comment}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!r.is_approved ? (
                    <button
                      type="button"
                      onClick={() => void setApproval(r, true)}
                      disabled={busy === r.id}
                      className="rounded-lg bg-[#111] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white hover:bg-[#c9a84c] hover:text-[#111] disabled:opacity-50"
                    >
                      {busy === r.id ? "…" : "Aprobar"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void setApproval(r, false)}
                      disabled={busy === r.id}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-600 hover:border-[#c9a84c] disabled:opacity-50"
                    >
                      {busy === r.id ? "…" : "Poner en espera"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    disabled={busy === r.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
