"use client"

import { useEffect, useState } from "react"

import {
  formatPaymentCountdown,
  getPaymentTimeRemainingMs,
  PENDING_PAYMENT_HOURS,
} from "@/lib/appointmentPaymentPolicy"

type Props = {
  createdAt: string
  variant?: "page" | "inline"
}

export default function AppointmentPaymentDeadlineAlert({
  createdAt,
  variant = "page",
}: Props) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getPaymentTimeRemainingMs(createdAt)
  )

  useEffect(() => {
    const tick = () => setRemainingMs(getPaymentTimeRemainingMs(createdAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [createdAt])

  const expired = remainingMs <= 0

  if (variant === "inline") {
    return (
      <p className="text-sm text-neutral-700">
        {expired ? (
          <>
            El plazo de {PENDING_PAYMENT_HOURS} horas expiró. Esta reserva será
            cancelada automáticamente.
          </>
        ) : (
          <>
            Tienes{" "}
            <span className="font-semibold text-[#9b7a1f]">
              {formatPaymentCountdown(remainingMs)}
            </span>{" "}
            para completar el pago.
          </>
        )}
      </p>
    )
  }

  return (
    <div className="mb-8 rounded-[24px] border border-[#d9c58a] bg-[#fff8e7] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9b7a1f]">
        Pago pendiente
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-[#111]">
        {expired
          ? "Tu reserva está por vencer"
          : "Completa tu pago lo antes posible"}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Tienes <strong>{PENDING_PAYMENT_HOURS} horas</strong> desde que agendaste
        para pagar tu cita. Paga lo antes posible para garantizar la
        disponibilidad del horario reservado.
      </p>
      {!expired && (
        <p className="mt-4 text-sm font-medium text-[#9b7a1f]">
          Tiempo restante: {formatPaymentCountdown(remainingMs)}
        </p>
      )}
      {expired && (
        <p className="mt-4 text-sm font-medium text-red-700">
          El plazo expiró. Esta reserva se cancelará automáticamente si no
          completas el pago.
        </p>
      )}
    </div>
  )
}
