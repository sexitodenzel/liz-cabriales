"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { CourseWithStats } from "@/lib/supabase/courses"

type Props = {
  course: CourseWithStats
  isAuthenticated: boolean
  pendingRegistrationId: string | null
  onClose: () => void
}

function formatPrice(value: number): string {
  return "$ " + value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ISO date → "dd/mm/aa, HH:MM"
function salesEndStr(startDate: string, startTime: string): string {
  const [y, m, d] = startDate.split("-").map(Number)
  const eve = new Date(y, m - 1, d - 1)
  const dd = String(eve.getDate()).padStart(2, "0")
  const mm = String(eve.getMonth() + 1).padStart(2, "0")
  const yy = String(eve.getFullYear()).slice(2)
  const time = startTime.slice(0, 5)
  return `${dd}/${mm}/${yy}, ${time}`
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a84c"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  )
}

export default function RegisterModal({
  course,
  isAuthenticated,
  pendingRegistrationId,
  onClose,
}: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxQty = course.spots_remaining
  const subtotal = course.price * qty
  const salesEnd = salesEndStr(course.start_date, course.start_time)

  const handleClose = useCallback(() => {
    if (!loading) onClose()
  }, [loading, onClose])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleClose])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  async function handleConfirm() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/academia/${course.id}`)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let registrationId = pendingRegistrationId

      if (!registrationId) {
        const regRes = await fetch("/api/course-registrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: course.id, attendees: qty }),
        })
        const regJson = await regRes.json()
        if (!regRes.ok || regJson.error) {
          setError(regJson?.error?.message ?? "No se pudo crear la inscripción")
          return
        }
        registrationId = regJson.data.registration_id as string
      }

      const payRes = await fetch("/api/payments/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          amount: subtotal,
        }),
      })
      const payJson = await payRes.json()
      if (!payRes.ok || payJson.error) {
        setError(payJson?.error?.message ?? "No se pudo iniciar el pago")
        return
      }

      if (payJson.data?.payment_url) {
        window.location.href = payJson.data.payment_url
      } else {
        setError("No se recibió URL de pago")
      }
    } catch {
      setError("Error de red al procesar la inscripción")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-[rgba(15,15,15,0.55)] p-6 backdrop-blur-[3px]"
      style={{ animation: "fadeIn .2s ease" }}
      onClick={handleClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>

      <div
        className="w-full max-w-[560px] overflow-hidden rounded-[14px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
        style={{ animation: "scaleIn .2s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ececec] px-7 py-[22px]">
          <h3
            className="text-2xl font-medium text-[#1a1a1a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Boletos
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="grid h-8 w-8 place-items-center rounded-full text-[#6b6b6b] transition-all hover:bg-[#fafafa] hover:text-[#1a1a1a]"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {/* Ticket row */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-[18px] rounded-[10px] border border-[#ececec] bg-white p-[18px] transition-colors hover:border-[#e8dcb0]">
            <div>
              <div className="mb-0.5 text-[15px] font-semibold text-[#1a1a1a]">
                Inscripción · {course.title}
              </div>
              <div className="text-[12px] text-[#6b6b6b]">
                {course.spots_remaining} lugar{course.spots_remaining !== 1 ? "es" : ""} disponible{course.spots_remaining !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Price badge */}
            <div className="whitespace-nowrap rounded-full border border-[#e8dcb0] bg-[#f5efdc] px-4 py-[6px] text-[14px] font-semibold tracking-[0.02em] text-[#a8893a]">
              {formatPrice(course.price)}
            </div>

            {/* Qty control */}
            <div className="flex items-center overflow-hidden rounded-lg border border-[#ececec]">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="flex h-9 w-9 items-center justify-center border-none bg-white text-base text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a] disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <div className="min-w-[36px] text-center text-[15px] font-semibold text-[#1a1a1a]">
                {qty}
              </div>
              <button
                onClick={() => setQty(Math.min(maxQty, qty + 1))}
                disabled={qty >= maxQty}
                className="flex h-9 w-9 items-center justify-center border-none bg-white text-base text-[#3a3a3a] transition-colors hover:bg-[#f5efdc] hover:text-[#a8893a] disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Sales-end note */}
          <div className="mt-3.5 flex items-center gap-1.5 text-[12px] text-[#6b6b6b]">
            <ClockIcon />
            Las ventas finalizan el {salesEnd}
          </div>

          {/* Subtotal */}
          <div className="mt-[22px] flex items-baseline justify-between border-t border-dashed border-[#ececec] pt-5">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6b6b6b]">
              Subtotal
            </span>
            <span
              className="text-[28px] font-medium text-[#1a1a1a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {formatPrice(subtotal)}
              <small className="ml-1.5 font-sans text-[12px] font-normal text-[#6b6b6b]">
                MXN
              </small>
            </span>
          </div>

          {/* Error */}
          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-[#ececec] bg-[#fafafa] px-7 py-[18px]">
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-[#ececec] bg-white px-[22px] py-3 text-[13px] font-medium text-[#3a3a3a] transition-all hover:border-[#c9a84c] hover:text-[#a8893a] disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || maxQty === 0}
            className="rounded-lg bg-[#c9a84c] px-[22px] py-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_4px_14px_rgba(201,168,76,0.3)] transition-all hover:bg-[#a8893a] hover:shadow-[0_6px_18px_rgba(201,168,76,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Procesando…"
              : isAuthenticated
                ? "Registrar"
                : "Iniciar sesión"}
          </button>
        </div>
      </div>
    </div>
  )
}
