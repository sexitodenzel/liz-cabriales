"use client"

import Image from "next/image"
import type { RefObject } from "react"

import type {
  ProfessionalRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import { resolveServiceOptions } from "@/components/shared/ServiceOptionsPicker"
import { PICKUP_LOCATION_ADDRESS } from "@/lib/constants/contact"

type Slot = {
  start_time: string
  end_time: string
  professional_id: string
}

type Props = {
  selectedServices: ServiceWithOptions[]
  selectedOptionsByService: Record<string, string[]>
  profLabel: string
  selectedProfessional?: ProfessionalRow
  selectedDate: string | null
  selectedSlot: Slot | null
  totalPrice: number
  totalDuration: number
  step: 1 | 2 | 3 | 4
  formatPrice: (v: number) => string
  formatDuration: (min: number) => string
  formatTimeLabel: (hhmmss: string) => string
  prettyDate: (dateStr: string) => string
  getInitials: (name: string) => string
  onContinue?: () => void
  onConfirm?: () => void
  canContinue: boolean
  submitting: boolean
  showActions?: boolean
  clientPhone?: string
  /** Ancla del CTA in-page: el sticky inferior se oculta al llegar aquí. */
  actionsRef?: RefObject<HTMLDivElement | null>
}

function IconCalendar() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-[#111]" />
  )
}

export default function BookingSummary({
  selectedServices,
  selectedOptionsByService,
  profLabel,
  selectedProfessional,
  selectedDate,
  selectedSlot,
  totalPrice,
  totalDuration,
  step,
  formatPrice,
  formatDuration,
  formatTimeLabel,
  prettyDate,
  getInitials,
  onContinue,
  onConfirm,
  canContinue,
  submitting,
  showActions = true,
  clientPhone = "",
  actionsRef,
}: Props) {
  const isConfirmStep = step === 4
  const phoneDigits = clientPhone.replace(/\D/g, "").slice(0, 10)
  const formattedPhone =
    phoneDigits.length === 10
      ? `+52 ${phoneDigits.slice(0, 3)} ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}`
      : null
  const hasSelection = selectedServices.length > 0

  return (
    <div
      // Estilo sidebar academia: bg #fafafa + líneas inset (padding del card).
      className="flex flex-col overflow-hidden rounded-xl border border-[#ececec] bg-[#fafafa] p-5 max-lg:min-h-0 lg:h-[calc(100dvh-var(--navbar-actual-h,64px)-4.75rem)] lg:max-h-[calc(100dvh-var(--navbar-actual-h,64px)-4.75rem)]"
    >
      {/* Header */}
      {isConfirmStep && selectedProfessional ? (
        <div className="flex shrink-0 flex-col items-center border-b border-[#ececec] pb-5 text-center">
          <div className="mb-2.5 h-14 w-14 overflow-hidden rounded-full border border-[#ececec] bg-white">
            {selectedProfessional.photo_url ? (
              <img
                src={selectedProfessional.photo_url}
                alt={selectedProfessional.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-500">
                {getInitials(selectedProfessional.name)}
              </div>
            )}
          </div>
          <p className="font-[family-name:var(--font-playfair),serif] text-lg text-[#1a1a1a]">
            {selectedProfessional.name}
          </p>
          {selectedProfessional.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-[#6b6b6b]">
              {selectedProfessional.bio}
            </p>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-b border-[#ececec] pb-5">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0">
              <Image
                src="/images/logo.png"
                alt="Liz Cabriales Studio"
                width={44}
                height={44}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-playfair),serif] text-[16px] leading-tight text-[#1a1a1a]">
                Liz Cabriales
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#6b6b6b]">
                {PICKUP_LOCATION_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stack middle */}
      <div
        className={`min-h-0 flex-1 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isConfirmStep ? "overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        {!hasSelection ? (
          <p className="py-10 text-center text-[13px] text-[#6b6b6b]">
            No hay servicios seleccionados
          </p>
        ) : (
          <div className={isConfirmStep ? "space-y-3" : "space-y-5"}>
            {isConfirmStep && (
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                Resumen de tu cita
              </p>
            )}

            {selectedDate && selectedSlot && (
              <div className="space-y-2 border-b border-[#ececec] pb-3">
                <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                  <IconCalendar />
                  <span className="capitalize">{prettyDate(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#1a1a1a]">
                  <IconClock />
                  <span>
                    {formatTimeLabel(selectedSlot.start_time)}
                    {selectedSlot.end_time
                      ? ` – ${formatTimeLabel(selectedSlot.end_time)}`
                      : ""}{" "}
                    ({formatDuration(totalDuration)})
                  </span>
                </div>
              </div>
            )}

            <ul className="space-y-3">
              {selectedServices.map((s) => {
                const opts = resolveServiceOptions(s, selectedOptionsByService)
                const linePrice =
                  s.price + opts.reduce((sum, o) => sum + o.price_delta, 0)
                const lineDuration =
                  s.duration_min +
                  opts.reduce((sum, o) => sum + o.duration_delta, 0)

                return (
                  <li
                    key={s.id}
                    className="border-b border-[#ececec] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold leading-snug text-[#1a1a1a]">
                        {s.name}
                      </p>
                      <p className="shrink-0 text-[14px] font-semibold text-[#1a1a1a]">
                        {formatPrice(linePrice)}
                      </p>
                    </div>
                    {opts.length > 0 && (
                      <p className="mt-1 text-[12px] text-[#6b6b6b]">
                        {opts.map((o) => o.label).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-[12px] text-[#6b6b6b]">
                      {formatDuration(lineDuration)} con {profLabel}
                    </p>
                  </li>
                )
              })}
            </ul>

            {isConfirmStep && formattedPhone && (
              <div className="border-t border-[#ececec] pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6b6b6b]">
                  Celular
                </p>
                <p className="mt-1 text-sm text-[#1a1a1a]">{formattedPhone}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: total + CTA */}
      <div className="shrink-0 border-t border-[#ececec] pt-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-[#6b6b6b]">Total</span>
          <span className="text-[15px] font-semibold text-[#1a1a1a]">
            {hasSelection ? formatPrice(totalPrice) : "Gratis"}
          </span>
        </div>

        {isConfirmStep && (
          <div className="mb-4 flex items-start gap-3 rounded-[10px] border border-[#ececec] bg-white p-3.5">
            <span className="text-[#1a1a1a]" aria-hidden>
              ✓
            </span>
            <p className="text-xs leading-relaxed text-[#6b6b6b]">
              Al confirmar, tu reserva quedará en espera. Realiza la transferencia
              del anticipo y envía tu comprobante por WhatsApp.
            </p>
          </div>
        )}

        {showActions && (
          <div ref={actionsRef}>
            {step < 4 ? (
              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#1a1a1a] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#1a1a1a] text-[12px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Spinner /> Procesando…
                  </>
                ) : (
                  "Confirmar reserva"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
