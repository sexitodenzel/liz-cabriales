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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Servicios profesionales</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Podología y cuidado de uñas a tu alcance
          </p>
        </div>
        <Link
          href="/citas"
          className="hidden text-sm font-medium text-[#a8862f] hover:underline sm:block"
        >
          Agendar cita →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div>
              <h3 className="text-base font-semibold text-[#0a0a0a]">{service.name}</h3>
              {service.description ? (
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                  {service.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold text-[#C9A84C]">
                  {formatPrice(service.price)}
                </span>
                <span className="text-xs text-neutral-400">
                  {formatDuration(service.duration_min)}
                </span>
              </div>
              <Link
                href="/citas"
                className={storeInlineButtonClassName}
              >
                Agendar
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 sm:hidden">
        <Link href="/citas" className="text-sm font-medium text-[#a8862f] hover:underline">
          Agendar cita →
        </Link>
      </div>
    </section>
  )
}
