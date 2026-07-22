"use client"

import type {
  EnabledServiceOption,
  ServiceOptionType,
} from "@/lib/supabase/appointments"

type Props = {
  serviceId: string
  options: EnabledServiceOption[]
  selectedOptionIds: string[]
  onChange: (serviceId: string, optionIds: string[]) => void
  compact?: boolean
  variant?: "chips" | "subindex"
  serviceName?: string
  hidePrice?: boolean
  hideDuration?: boolean
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v)
}

function groupByType(options: EnabledServiceOption[]) {
  const nailTypes = options.filter((o) => o.option_type === "nail_type")
  const extras = options.filter((o) => o.option_type === "extra")
  return { nailTypes, extras }
}

function OptionChip({
  option,
  selected,
  onClick,
  compact,
  hidePrice = false,
  hideDuration = false,
}: {
  option: EnabledServiceOption
  selected: boolean
  onClick: () => void
  compact?: boolean
  hidePrice?: boolean
  hideDuration?: boolean
}) {
  const showPrice = !hidePrice && option.price_delta > 0
  const showDuration = !hideDuration && option.duration_delta > 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-left transition-colors ${
        compact ? "text-xs" : "text-sm"
      } ${
        selected
          ? "border-neutral-900 bg-neutral-900 font-medium text-white"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
      }`}
    >
      {option.label}
      {(showPrice || showDuration) && (
        <span className="ml-1 text-[10px] text-neutral-500">
          {showPrice ? `+${formatPrice(option.price_delta)}` : ""}
          {showPrice && showDuration ? " · " : ""}
          {showDuration ? `+${option.duration_delta} min` : ""}
        </span>
      )}
    </button>
  )
}

function Section({
  title,
  type,
  options,
  selectedOptionIds,
  serviceId,
  onChange,
  compact,
  hidePrice = false,
  hideDuration = false,
}: {
  title: string
  type: ServiceOptionType
  options: EnabledServiceOption[]
  selectedOptionIds: string[]
  serviceId: string
  onChange: (serviceId: string, optionIds: string[]) => void
  compact?: boolean
  hidePrice?: boolean
  hideDuration?: boolean
}) {
  if (options.length === 0) return null

  const typeIds = options.map((o) => o.id)
  const otherIds = selectedOptionIds.filter((id) => !typeIds.includes(id))

  const toggle = (optionId: string) => {
    if (type === "nail_type") {
      const next = selectedOptionIds.includes(optionId)
        ? otherIds
        : [...otherIds, optionId]
      onChange(serviceId, next)
      return
    }

    const next = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId]
    onChange(serviceId, next)
  }

  return (
    <div>
      <p
        className={`mb-2 font-semibold uppercase tracking-[0.12em] text-neutral-500 ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <OptionChip
            key={opt.id}
            option={opt}
            selected={selectedOptionIds.includes(opt.id)}
            onClick={() => toggle(opt.id)}
            compact={compact}
            hidePrice={hidePrice}
            hideDuration={hideDuration}
          />
        ))}
      </div>
    </div>
  )
}

function SubindexCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
        checked
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-300 bg-white"
      }`}
    >
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6l3 3 5-5" />
        </svg>
      )}
    </span>
  )
}

function SubindexList({
  serviceId,
  serviceName,
  options,
  selectedOptionIds,
  onChange,
  hidePrice = false,
  hideDuration = false,
}: {
  serviceId: string
  serviceName?: string
  options: EnabledServiceOption[]
  selectedOptionIds: string[]
  onChange: (serviceId: string, optionIds: string[]) => void
  hidePrice?: boolean
  hideDuration?: boolean
}) {
  const toggle = (optionId: string) => {
    const next = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId]
    onChange(serviceId, next)
  }

  return (
    <div
      className="mt-4 border-t border-neutral-200 pt-4"
      onClick={(e) => e.stopPropagation()}
    >
      {serviceName && (
        <p className="mb-3 text-sm font-medium text-[#0a0a0a]">
          {serviceName}
        </p>
      )}
      <ul className="space-y-2 border-l-2 border-neutral-200 pl-4">
        {options.map((opt) => {
          const active = selectedOptionIds.includes(opt.id)
          const checkboxId = `service-option-${serviceId}-${opt.id}`
          return (
            <li key={opt.id}>
              <label
                htmlFor={checkboxId}
                className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-neutral-100 font-medium text-[#0a0a0a]"
                    : "text-neutral-700 hover:bg-neutral-50 hover:text-[#0a0a0a]"
                }`}
              >
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={active}
                    onChange={() => toggle(opt.id)}
                    className="sr-only"
                  />
                  <SubindexCheckbox checked={active} />
                  <span>{opt.label}</span>
                </span>
                {(() => {
                  const showOptPrice = !hidePrice && opt.price_delta > 0
                  const showOptDuration =
                    !hideDuration && opt.duration_delta > 0
                  if (!showOptPrice && !showOptDuration) return null
                  return (
                    <span className="shrink-0 text-sm tabular-nums text-[#0a0a0a]">
                      {showOptPrice ? `+${formatPrice(opt.price_delta)}` : ""}
                      {showOptPrice && showOptDuration ? " · " : ""}
                      {showOptDuration
                        ? `+${opt.duration_delta} min`
                        : ""}
                    </span>
                  )
                })()}
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function ServiceOptionsPicker({
  serviceId,
  options,
  selectedOptionIds,
  onChange,
  compact = false,
  variant = "chips",
  serviceName,
  hidePrice = false,
  hideDuration = false,
}: Props) {
  if (variant === "subindex") {
    return (
      <SubindexList
        serviceId={serviceId}
        serviceName={serviceName}
        options={options}
        selectedOptionIds={selectedOptionIds}
        onChange={onChange}
        hidePrice={hidePrice}
        hideDuration={hideDuration}
      />
    )
  }

  const { nailTypes, extras } = groupByType(options)

  return (
    <div
      className={`space-y-3 rounded-lg border border-neutral-200 bg-white ${
        compact ? "p-3" : "p-4"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <Section
        title="Tipo de uña"
        type="nail_type"
        options={nailTypes}
        selectedOptionIds={selectedOptionIds}
        serviceId={serviceId}
        onChange={onChange}
        compact={compact}
        hidePrice={hidePrice}
        hideDuration={hideDuration}
      />
      <Section
        title="Extras"
        type="extra"
        options={extras}
        selectedOptionIds={selectedOptionIds}
        serviceId={serviceId}
        onChange={onChange}
        compact={compact}
        hidePrice={hidePrice}
        hideDuration={hideDuration}
      />
    </div>
  )
}

export function buildServiceSelections(
  selectedServiceIds: string[],
  selectedOptionsByService: Record<string, string[]>
) {
  return selectedServiceIds
    .map((service_id) => ({
      service_id,
      option_ids: selectedOptionsByService[service_id] ?? [],
    }))
    .filter((row) => row.option_ids.length > 0)
}

export function resolveServiceOptions(
  service: { id: string; options: EnabledServiceOption[] },
  selectedOptionsByService: Record<string, string[]>
): EnabledServiceOption[] {
  const ids = new Set(selectedOptionsByService[service.id] ?? [])
  return service.options.filter((o) => ids.has(o.id))
}

export function sumSelectedOptions(
  services: Array<{
    id: string
    options: EnabledServiceOption[]
  }>,
  selectedOptionsByService: Record<string, string[]>
) {
  let price = 0
  let duration = 0

  for (const service of services) {
    const ids = selectedOptionsByService[service.id] ?? []
    for (const opt of service.options) {
      if (ids.includes(opt.id)) {
        price += opt.price_delta
        duration += opt.duration_delta
      }
    }
  }

  return { price, duration }
}
