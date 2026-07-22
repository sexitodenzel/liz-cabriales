"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"

import { PICKUP_LOCATION_NAME } from "@/lib/constants/contact"
import { buildAppointmentWhatsAppHref } from "@/lib/appointments/whatsapp-booking"

export type BookingDraft = {
  date: string
  start_time: string
  end_time: string
  professional_name: string | null
  client_phone: string
  total: number
  showPrice: boolean
  services: Array<{
    service_name: string
    options: string[]
    unit_price: number | null
    duration_min: number | null
  }>
}

type Props = {
  draft: BookingDraft
  formatPrice: (v: number) => string
  formatTimeLabel: (hhmmss: string) => string
  prettyDate: (dateStr: string) => string
  onEdit: () => void
  onGoHome: () => void
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

export default function WhatsAppBookingModal({
  draft,
  formatPrice,
  formatTimeLabel,
  prettyDate,
  onEdit,
  onGoHome,
}: Props) {
  const whatsAppHref = useMemo(
    () =>
      buildAppointmentWhatsAppHref({
        dateLabel: prettyDate(draft.date),
        timeLabel: formatTimeLabel(draft.start_time),
        professionalName: draft.professional_name,
        clientPhone: draft.client_phone,
        services: draft.services.map((s) => ({
          name: s.service_name,
          options: s.options,
          price: s.unit_price,
          durationMin: s.duration_min,
        })),
        total: draft.showPrice ? draft.total : null,
        formatPrice: draft.showPrice ? formatPrice : undefined,
      }),
    [draft, formatPrice, formatTimeLabel, prettyDate]
  )

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-booking-title"
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col items-center border-b border-neutral-100 px-8 pb-4 pt-8">
          <div className="mb-3 h-16 w-16 overflow-hidden">
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
            id="whatsapp-booking-title"
            className="font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-[#111]"
          >
            {PICKUP_LOCATION_NAME}
          </h2>
        </div>

        <div className="px-8 pb-8 pt-6">
          <p className="text-center text-sm text-neutral-600">
            Revisa los datos de tu cita. Al enviarla por WhatsApp el estudio la
            confirmará contigo.
          </p>

          <div className="mt-6 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-5 text-center">
            <p className="font-[family-name:var(--font-playfair),serif] text-xl text-[#111]">
              {prettyDate(draft.date)}
            </p>
            <p className="mt-1 text-sm font-medium text-[#111]">
              {formatTimeLabel(draft.start_time)}
              {draft.end_time
                ? ` – ${formatTimeLabel(draft.end_time)}`
                : ""}
            </p>
            {draft.professional_name && (
              <p className="mt-2 text-sm text-neutral-600">
                Con {draft.professional_name}
              </p>
            )}
            <ul className="mt-3 space-y-1 text-sm text-neutral-700">
              {draft.services.map((s) => (
                <li key={`${s.service_name}-${s.options.join(",")}`}>
                  {s.service_name}
                  {s.options.length > 0 ? ` (${s.options.join(", ")})` : ""}
                </li>
              ))}
            </ul>
            {draft.showPrice && (
              <p className="mt-3 text-sm text-neutral-600">
                Total:{" "}
                <span className="font-semibold text-[#111]">
                  {formatPrice(draft.total)}
                </span>
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg px-5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppIcon />
              Mandar cita por WhatsApp
            </a>

            <button
              type="button"
              onClick={onEdit}
              className="w-full rounded-lg border border-neutral-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111] transition-colors hover:border-[#111]"
            >
              Editar cita
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="w-full rounded-lg border border-neutral-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-600 transition-colors hover:border-neutral-400 hover:text-[#111]"
            >
              Volver a inicio
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">
            Si vuelves al inicio, esta selección no se guarda. También puedes ir
            a la{" "}
            <Link href="/tienda" className="underline underline-offset-2">
              tienda
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
