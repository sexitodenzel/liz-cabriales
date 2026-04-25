"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

type Props = {
  courseId: string
  fullPrice: number
  minDeposit: number
  isAuthenticated: boolean
  pendingRegistrationId: string | null
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function RegisterCourseButton({
  courseId,
  fullPrice,
  minDeposit,
  isAuthenticated,
  pendingRegistrationId,
}: Props) {
  const router = useRouter()
  const [paymentMode, setPaymentMode] = useState<"deposit" | "full">(
    "deposit"
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAmount = paymentMode === "full" ? fullPrice : minDeposit
  const canDeposit = minDeposit > 0 && minDeposit < fullPrice

  const handleRegister = async () => {
    if (!isAuthenticated) {
      const redirectTo = `/cursos/${courseId}`
      router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)
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
          body: JSON.stringify({ course_id: courseId, attendees: 1 }),
        })
        const regJson = await regRes.json()

        if (!regRes.ok || regJson.error) {
          setError(
            regJson?.error?.message ?? "No se pudo crear la inscripción"
          )
          return
        }
        registrationId = regJson.data.registration_id as string
      }

      const payRes = await fetch("/api/payments/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_id: registrationId,
          amount: selectedAmount,
        }),
      })
      const payJson = await payRes.json()
      if (!payRes.ok || payJson.error) {
        setError(payJson?.error?.message ?? "No se pudo iniciar el pago")
        return
      }

      if (payJson.data.payment_url) {
        window.location.href = payJson.data.payment_url
      } else {
        setError("MercadoPago no devolvió una URL de pago")
      }
    } catch {
      setError("Error de red al procesar la inscripción")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {canDeposit && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Elige forma de pago
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMode("deposit")}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                paymentMode === "deposit"
                  ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                  : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#9b7a1f]">
                Apartado
              </span>
              <span className="mt-1 block">{formatPrice(minDeposit)}</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("full")}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                paymentMode === "full"
                  ? "border-[#C9A84C] bg-[#fdf8ea] font-semibold"
                  : "border-neutral-200 bg-white hover:border-[#C9A84C]/60"
              }`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Pago completo
              </span>
              <span className="mt-1 block">{formatPrice(fullPrice)}</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleRegister}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#0a0a0a] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Procesando…"
          : isAuthenticated
            ? `Inscribirme y pagar ${formatPrice(selectedAmount)}`
            : "Iniciar sesión para inscribirme"}
      </button>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
