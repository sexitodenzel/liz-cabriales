"use client"

import Image from "next/image"

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
      className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-lg:min-h-0 lg:max-h-[calc(100dvh-var(--navbar-actual-h,64px)-6.5rem)]"
    >
      {/* Header */}
      {isConfirmStep && selectedProfessional ? (
        <div className="flex shrink-0 flex-col items-center border-b border-neutral-100 px-6 pb-6 pt-8 text-center">
          <div className="mb-3 h-16 w-16 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
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
          <p className="font-[family-name:var(--font-playfair),serif] text-lg text-[#111]">
            {selectedProfessional.name}
          </p>
          {selectedProfessional.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
              {selectedProfessional.bio}
            </p>
          )}
        </div>
      ) : (
        <div className="shrink-0 border-b border-neutral-100 p-5">
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
              <p className="font-[family-name:var(--font-playfair),serif] text-[16px] leading-tight text-[#111]">
                Liz Cabriales
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-neutral-500">
                {PICKUP_LOCATION_ADDRESS}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stack middle — aquí se apilan servicios / fecha */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {!hasSelection ? (
          <p className="py-10 text-center text-[13px] text-neutral-400">
            No hay servicios seleccionados
          </p>
        ) : (
          <div className="space-y-5">
            {isConfirmStep && (
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Resumen de tu cita
              </p>
            )}

            {selectedDate && selectedSlot && (
              <div className="space-y-2 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2 text-sm text-[#111]">
                  <IconCalendar />
                  <span className="capitalize">{prettyDate(selectedDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#111]">
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

            <ul className="space-y-4">
              {selectedServices.map((s) => {
                const opts = resolveServiceOptions(s, selectedOptionsByService)
                const linePrice =
                  s.price + opts.reduce((sum, o) => sum + o.price_delta, 0)
                const lineDuration =
                  s.duration_min +
                  opts.reduce((sum, o) => sum + o.duration_delta, 0)

                return (
                  <li key={s.id} className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] font-semibold leading-snug text-[#111]">
                        {s.name}
                      </p>
                      <p className="shrink-0 text-[14px] font-semibold text-[#111]">
                        {formatPrice(linePrice)}
                      </p>
                    </div>
                    {opts.length > 0 && (
                      <p className="mt-1 text-[12px] text-neutral-500">
                        {opts.map((o) => o.label).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-[12px] text-neutral-500">
                      {formatDuration(lineDuration)} con {profLabel}
                    </p>
                  </li>
                )
              })}
            </ul>

            {isConfirmStep && formattedPhone && (
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                  Celular
                </p>
                <p className="mt-1 text-sm text-[#111]">{formattedPhone}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer fijo abajo: total + CTA */}
      <div className="shrink-0 border-t border-neutral-100 px-5 py-4">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-neutral-500">Total</span>
          <span className="text-[15px] font-semibold text-[#111]">
            {hasSelection ? formatPrice(totalPrice) : "Gratis"}
          </span>
        </div>

        {isConfirmStep && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-neutral-50 p-3.5">
            <span className="text-[#111]" aria-hidden>
              ✓
            </span>
            <p className="text-xs leading-relaxed text-neutral-600">
              Al confirmar, tu reserva quedará en espera. Realiza la transferencia
              del anticipo y envía tu comprobante por WhatsApp.
            </p>
          </div>
        )}

        {showActions && (
          <>
            {step < 4 ? (
              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black text-[12px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={submitting}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-black text-[12px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
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
          </>
        )}
      </div>
    </div>
  )
}
