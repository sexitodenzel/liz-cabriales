"use client"

import Image from "next/image"

import type {
  ProfessionalRow,
  ServiceWithOptions,
} from "@/lib/supabase/appointments"
import { resolveServiceOptions } from "@/components/shared/ServiceOptionsPicker"

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

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200/80 bg-white shadow-[0_4px_20px_-2px_rgba(17,17,17,0.06)]">
      {isConfirmStep && selectedProfessional ? (
        <div className="flex flex-col items-center border-b border-neutral-100 px-8 pb-8 pt-10 text-center">
          <div className="mb-4 h-20 w-20 overflow-hidden rounded-full border border-neutral-200/80 bg-neutral-50">
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
          <p className="font-[family-name:var(--font-playfair),serif] text-xl text-[#111]">
            {selectedProfessional.name}
          </p>
          {selectedProfessional.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
              {selectedProfessional.bio}
            </p>
          )}
        </div>
      ) : (
        <div className="border-b border-neutral-100 p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0">
              <Image
                src="/images/logo.png"
                alt="Liz Cabriales Studio"
                width={48}
                height={48}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-playfair),serif] text-[15px] leading-tight text-[#111]">
                Liz Cabriales Studio
              </p>
              <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                Tampico, Tamaulipas
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedServices.length > 0 && (
        <div className="space-y-4 border-b border-neutral-100 px-5 py-5">
          {isConfirmStep && (
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c6a75e]">
              Resumen de tu cita
            </p>
          )}
          {selectedServices.map((s) => {
            const opts = resolveServiceOptions(s, selectedOptionsByService)
            const linePrice =
              s.price + opts.reduce((sum, o) => sum + o.price_delta, 0)
            const lineDuration =
              s.duration_min + opts.reduce((sum, o) => sum + o.duration_delta, 0)

            return (
              <div key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug text-[#111]">
                    {s.name}
                  </p>
                  <p className="shrink-0 font-[family-name:var(--font-playfair),serif] text-sm text-[#111]">
                    {formatPrice(linePrice)}
                  </p>
                </div>
                {opts.length > 0 && (
                  <p className="mt-1 text-xs text-[#c6a75e]">
                    {opts.map((o) => o.label).join(" · ")}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  {formatDuration(lineDuration)} con {profLabel}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {selectedDate && selectedSlot && (
        <div className="space-y-2 border-b border-neutral-100 px-5 py-4">
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

      {isConfirmStep && formattedPhone && (
        <div className="border-b border-neutral-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            Celular
          </p>
          <p className="mt-1 text-sm text-[#111]">{formattedPhone}</p>
        </div>
      )}

      <div className="px-5 py-5">
        {selectedServices.length > 0 && (
          <div
            className={`mb-5 flex items-baseline justify-between ${
              isConfirmStep ? "border-t border-neutral-100 pt-5" : ""
            }`}
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Total
            </span>
            <span
              className={`font-[family-name:var(--font-playfair),serif] text-[#c6a75e] ${
                isConfirmStep ? "text-4xl leading-none" : "text-xl"
              }`}
            >
              {formatPrice(totalPrice)}
            </span>
          </div>
        )}

        {isConfirmStep && (
          <div className="mb-5 flex items-start gap-3 rounded-lg bg-neutral-50 p-4">
            <span className="text-[#c6a75e]">✓</span>
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
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#111] py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Continuar <span aria-hidden>→</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#111] py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#c6a75e] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-35"
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
