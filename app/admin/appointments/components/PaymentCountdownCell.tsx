"use client"

import { useEffect, useState } from "react"

import {
  formatPaymentCountdown,
  getPaymentTimeRemainingMs,
} from "@/lib/appointmentPaymentPolicy"
import type { AppointmentStatus } from "@/types"

type Props = {
  appointmentDate: string
  createdAt: string
  status: AppointmentStatus
}

export default function PaymentCountdownCell({
  appointmentDate,
  createdAt,
  status,
}: Props) {
  const [remainingMs, setRemainingMs] = useState(() =>
    getPaymentTimeRemainingMs(appointmentDate, createdAt)
  )

  useEffect(() => {
    if (status !== "pending") return

    const tick = () =>
      setRemainingMs(getPaymentTimeRemainingMs(appointmentDate, createdAt))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [appointmentDate, createdAt, status])

  if (status !== "pending") {
    return <span className="text-neutral-400">—</span>
  }

  if (remainingMs <= 0) {
    return (
      <span className="text-sm font-medium text-red-600">Expirado</span>
    )
  }

  return (
    <span className="whitespace-nowrap text-sm font-medium tabular-nums text-[#c9a84c]">
      {formatPaymentCountdown(remainingMs)}
    </span>
  )
}
