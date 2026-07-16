import Link from "next/link"
import type { ServiceRow } from "@/lib/supabase/appointments"
import { storeInlineButtonClassName } from "./store-button-styles"

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

type Props = { services: ServiceRow[] }

export default function ServicesSection({ services }: Props) {
  if (services.length === 0) return null

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">
            <Link
              href="/servicios"
              className="transition-colors hover:text-[#a8862f]"
            >
              Servicios profesionales
            </Link>
          </h2>
        </div>
        <Link
          href="/servicios"
          className="hidden text-sm font-medium text-[#a8862f] hover:underline sm:block"
        >
          Agendar cita →
        </Link>
      </div>

      <div className="mt-6 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex h-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors duration-200 hover:border-neutral-300"
          >
            <div className="min-w-0">
              <h3 className="truncate text-base font-medium leading-snug text-[#0a0a0a]">
                {service.name}
              </h3>
              {service.description ? (
                <p className="mt-1 line-clamp-1 text-sm leading-relaxed text-neutral-500">
                  {service.description}
                </p>
              ) : null}
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {formatDuration(service.duration_min)}
              </p>
              <p className="mt-2 text-base font-semibold text-[#c6a75e]">
                {formatPrice(service.price)}
              </p>
            </div>

            <Link href="/servicios" className={`${storeInlineButtonClassName} shrink-0`}>
              Agendar
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 sm:hidden">
        <Link href="/servicios" className="text-sm font-medium text-[#a8862f] hover:underline">
          Agendar cita →
        </Link>
      </div>
    </section>
  )
}
