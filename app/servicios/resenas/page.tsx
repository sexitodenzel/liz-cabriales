import type { Metadata } from "next"
import Link from "next/link"
import { Star } from "lucide-react"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { STUDIO_REVIEWS } from "../reviews-data"
import { getApprovedServiceReviews } from "@/lib/supabase/service-reviews"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Reseñas | Liz Cabriales Studio",
  description:
    "Opiniones de clientas del estudio Liz Cabriales en Cd. Madero. Próximamente reseñas de Google y más.",
}

/** Tarjeta normalizada para render, sea reseña real o placeholder. */
type ReviewCard = {
  id: string
  name: string
  date: string
  stars: number
  quote: string
}

function formatRelativeDate(iso: string): string {
  const days = Math.floor(
    (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 1) return "hoy"
  if (days === 1) return "hace 1 día"
  if (days < 14) return `hace ${days} días`
  if (days < 45) {
    const weeks = Math.max(1, Math.round(days / 7))
    return weeks === 1 ? "hace 1 semana" : `hace ${weeks} semanas`
  }
  const months = Math.max(1, Math.round(days / 30))
  return months === 1 ? "hace 1 mes" : `hace ${months} meses`
}

function Stars({ count = 5 }: { count?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#111] text-[#111]" />
      ))}
    </span>
  )
}

export default async function ResenasPage() {
  const { reviews, summary } = await getApprovedServiceReviews()

  const hasRealReviews = summary.count > 0
  const cards: ReviewCard[] = hasRealReviews
    ? reviews.map((r) => ({
        id: r.id,
        name: r.author_name,
        date: formatRelativeDate(r.created_at),
        stars: r.rating,
        quote: r.comment ?? "",
      }))
    : STUDIO_REVIEWS.map((r) => ({
        id: r.id,
        name: r.name,
        date: r.date,
        stars: r.stars,
        quote: r.quote,
      }))

  const ratingLabel = hasRealReviews
    ? summary.average.toFixed(1).replace(".", ",")
    : "5,0"
  const ratingCount = hasRealReviews ? summary.count : STUDIO_REVIEWS.length

  return (
    <main className="min-h-screen bg-ivory text-[#1a1a1a]">
      <div className="site-container pt-5 pb-24">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Servicios", href: "/servicios" },
            { label: "Reseñas" },
          ]}
          className="mb-4"
        />

        <header className="mb-10">
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Reseñas
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[28px] font-semibold leading-none text-[#111]">{ratingLabel}</span>
            <Stars />
            <span className="text-[13px] text-[#8a6d26]">({ratingCount})</span>
          </div>
          <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-[#5a5a5a]">
            Lo que dicen nuestras clientas. Pronto aquí también verás reseñas de Google y otras
            fuentes.
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {cards.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-neutral-200/80 bg-white/70 px-5 py-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c6a75e]/20 text-[13px] font-semibold text-[#8a6d26]">
                  {review.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#111]">{review.name}</p>
                  <p className="text-[11px] text-neutral-400">{review.date}</p>
                </div>
              </div>
              <div className="mt-2">
                <Stars count={review.stars} />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#5a5a5a]">{review.quote}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/servicios"
            className="inline-flex h-7 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-3.5 text-[11px] font-normal text-[#111] transition-colors hover:border-neutral-500 sm:w-auto"
          >
            Volver a servicios
          </Link>
          <Link
            href="/servicios/agendar"
            className="inline-flex h-7 w-full items-center justify-center rounded-full border border-neutral-900 bg-neutral-900 px-3.5 text-[11px] font-normal text-white transition-colors hover:bg-neutral-800 sm:w-auto"
          >
            Reservar
          </Link>
        </div>
      </div>
    </main>
  )
}
