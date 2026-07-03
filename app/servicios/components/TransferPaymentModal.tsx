"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Check } from "lucide-react"

import {
  formatPaymentCountdown,
  getPaymentTimeRemainingMs,
  isSameDayAppointmentBooking,
} from "@/lib/appointmentPaymentPolicy"
import { PICKUP_LOCATION_NAME, buildWhatsAppHref } from "@/lib/constants/contact"
import type { AppointmentRecord } from "@/lib/supabase/appointments"
import type { AppointmentStatus } from "@/types"

type Props = {
  appointment: AppointmentRecord
  transferAccountNumber: string
  formatPrice: (v: number) => string
  formatTimeLabel: (hhmmss: string) => string
  prettyDate: (dateStr: string) => string
  onExpired?: () => void
  onStatusChange?: (status: AppointmentStatus) => void
  onDismiss?: () => void
  onCancelled?: () => void
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.666 4.799 1.824 6.797L2 30l7.418-1.797A13.93 13.93 0 0 0 16 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.826-1.594l-.418-.248-4.402 1.066 1.1-4.285-.272-.44A11.454 11.454 0 0 1 4.5 16C4.5 9.649 9.649 4.5 16 4.5S27.5 9.649 27.5 16 22.351 27.5 16 27.5zm6.29-8.61c-.345-.172-2.04-1.006-2.355-1.12-.316-.114-.546-.172-.776.172-.23.345-.89 1.12-1.09 1.35-.2.23-.4.258-.745.086-.345-.172-1.457-.537-2.775-1.713-1.025-.913-1.717-2.04-1.919-2.385-.2-.345-.022-.532.151-.703.155-.154.345-.402.517-.603.172-.2.23-.345.345-.575.114-.23.057-.431-.029-.603-.086-.172-.776-1.87-1.063-2.561-.28-.672-.565-.58-.776-.591l-.66-.012c-.23 0-.603.086-.919.431-.316.345-1.205 1.178-1.205 2.872s1.234 3.33 1.406 3.56c.172.23 2.428 3.707 5.882 5.197.822.355 1.463.567 1.963.726.824.263 1.574.226 2.167.137.661-.099 2.04-.834 2.327-1.639.287-.805.287-1.495.2-1.639-.086-.143-.316-.23-.66-.402z" />
    </svg>
  )
}

type ConfirmCancelProps = {
  isPaid: boolean
  cancelling: boolean
  cancelError: string | null
  onConfirm: () => void
  onBack: () => void
}

function ConfirmCancelDialog({
  isPaid,
  cancelling,
  cancelError,
  onConfirm,
  onBack,
}: ConfirmCancelProps) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-cancel-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xl">
        <h3
          id="confirm-cancel-title"
          className="text-center font-[family-name:var(--font-playfair),serif] text-xl font-medium text-[#111]"
        >
          ¿Estás seguro que quieres cancelar tu cita
          {isPaid ? " agendada" : ""}?
        </h3>
        {isPaid && (
          <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.04em] text-red-600">
            ¡¡TU ANTICIPO NO ES REEMBOLSABLE!!
          </p>
        )}
        {cancelError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
            {cancelError}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={cancelling}
            className="w-full rounded-lg bg-red-600 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {cancelling ? "Cancelando…" : "Cancelar cita"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={cancelling}
            className="w-full rounded-lg border border-neutral-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] transition-colors hover:border-[#111] disabled:opacity-50"
          >
            Volver a mi cita
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TransferPaymentModal({
  appointment,
  transferAccountNumber,
  formatPrice,
  formatTimeLabel,
  prettyDate,
  onExpired,
  onStatusChange,
  onDismiss,
  onCancelled,
}: Props) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status)
  const [remainingMs, setRemainingMs] = useState(() =>
    getPaymentTimeRemainingMs(appointment.date, appointment.created_at)
  )
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const isPaid = status === "paid"
  const isSameDay = isSameDayAppointmentBooking(
    appointment.date,
    appointment.created_at
  )

  const whatsAppHref = useMemo(() => {
    const serviceNames = appointment.services.map((s) => s.service_name).join(", ")
    const timeLabel = formatTimeLabel(appointment.start_time)
    const dateLabel = prettyDate(appointment.date)
    return buildWhatsAppHref(
      `Hola, envío comprobante de anticipo para mi cita del ${dateLabel} a las ${timeLabel}. Servicio: ${serviceNames}. Total: ${formatPrice(appointment.total)}.`
    )
  }, [appointment, formatPrice, formatTimeLabel, prettyDate])

  useEffect(() => {
    setStatus(appointment.status)
  }, [appointment.status])

  useEffect(() => {
    if (status !== "pending") return

    const tick = () => {
      const next = getPaymentTimeRemainingMs(
        appointment.date,
        appointment.created_at
      )
      setRemainingMs(next)
      if (next <= 0) {
        onExpired?.()
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [appointment.created_at, appointment.date, onExpired, status])

  useEffect(() => {
    if (status !== "pending") return

    let mounted = true

    const poll = async () => {
      try {
        const res = await fetch("/api/appointments/active")
        const json = await res.json()
        if (!mounted || !res.ok || !json.data?.appointment) return
        if (json.data.appointment.id !== appointment.id) return
        if (json.data.appointment.status === "paid") {
          setStatus("paid")
          onStatusChange?.("paid")
        }
      } catch {
        // noop
      }
    }

    const id = window.setInterval(() => void poll(), 15000)
    void poll()

    return () => {
      mounted = false
      window.clearInterval(id)
    }
  }, [appointment.id, onStatusChange, status])

  const handleConfirmCancel = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}/cancel`, {
        method: "PATCH",
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setCancelError(
          json?.error?.message ?? "No se pudo cancelar la cita. Intenta de nuevo."
        )
        return
      }
      setShowCancelConfirm(false)
      onCancelled?.()
    } catch {
      setCancelError("Error de red al cancelar la cita")
    } finally {
      setCancelling(false)
    }
  }

  const openCancelConfirm = () => {
    setCancelError(null)
    setShowCancelConfirm(true)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-payment-title"
      >
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-xl">
          <div className="bg-[var(--background)] px-8 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Liz Cabriales Studio"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h2
              id="transfer-payment-title"
              className="font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-[#111]"
            >
              {PICKUP_LOCATION_NAME}
            </h2>
          </div>

          <div className="px-8 pb-8 pt-6">
          {isPaid ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <Check className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="mt-4 text-lg font-semibold text-emerald-600">Pagado</p>
              <p className="mt-3 text-sm text-neutral-600">
                Tu cita quedó confirmada para
              </p>
              <p className="mt-1 font-[family-name:var(--font-playfair),serif] text-xl text-[#111]">
                {prettyDate(appointment.date)}
              </p>
              <p className="mt-1 text-sm font-medium text-[#111]">
                {formatTimeLabel(appointment.start_time)}
              </p>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="mt-6 w-full rounded-lg border border-neutral-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] transition-colors hover:border-[#111]"
                >
                  Entendido
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mt-3 text-center text-sm text-neutral-600">
                Reserva registrada. Realiza tu transferencia de anticipo para
                mantener tu horario.
              </p>

              <div className="mt-6 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-5 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Número para transferencias
                </p>
                <p className="mt-2 break-all font-mono text-lg font-semibold tracking-wide text-[#111]">
                  {transferAccountNumber || "—"}
                </p>
                {!transferAccountNumber && (
                  <p className="mt-2 text-xs text-neutral-500">
                    El estudio aún no ha configurado el número de cuenta.
                  </p>
                )}
                <p className="mt-3 text-sm text-neutral-600">
                  Anticipo:{" "}
                  <span className="font-semibold text-[#111]">
                    {formatPrice(appointment.total)}
                  </span>
                </p>
              </div>

              <p className="mt-6 text-center text-sm leading-relaxed text-neutral-600">
                Manda tu comprobante de tu anticipo al siguiente WhatsApp
              </p>

              <a
                href={whatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                <WhatsAppIcon />
                Enviar comprobante por WhatsApp
              </a>

              <div className="mt-6 rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-800/80">
                  Tiempo para completar el pago
                </p>
                <p
                  className={`mt-1 text-lg font-semibold tabular-nums ${
                    remainingMs <= 0 ? "text-red-600" : "text-[#c9a84c]"
                  }`}
                >
                  {formatPaymentCountdown(remainingMs)}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {isSameDay
                    ? "Citas el mismo día: 20 minutos para transferir."
                    : "Citas con anticipación: 4 horas para transferir."}
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-neutral-500">
                {prettyDate(appointment.date)} ·{" "}
                {formatTimeLabel(appointment.start_time)}
              </p>
            </>
          )}

          <button
            type="button"
            onClick={openCancelConfirm}
            className="mt-6 w-full rounded-lg border border-red-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600 transition-colors hover:bg-red-50"
          >
            Cancelar cita
          </button>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
        <ConfirmCancelDialog
          isPaid={isPaid}
          cancelling={cancelling}
          cancelError={cancelError}
          onConfirm={() => void handleConfirmCancel()}
          onBack={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  )
}
