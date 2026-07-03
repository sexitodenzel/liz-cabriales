import Image from "next/image"
import Link from "next/link"

import SectionHeader from "@/app/components/ui/SectionHeader"
import { ArrowRightIcon } from "@/app/components/ui/icons"

/* Los otros dos pilares del negocio además de la tienda: formación y eventos.
   Imágenes placeholder (Unsplash) hasta tener fotos propias de la academia. */

const CARDS = [
  {
    href: "/academia",
    eyebrow: "Academia",
    title: "Cursos y certificaciones",
    copy: "Formación presencial y online en onicotecnia, pedicura y quiropodia. Más de 7 años preparando profesionales de éxito desde Tampico.",
    cta: "Ver cursos",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1000&q=75",
    alt: "Clase de formación profesional en la academia",
  },
  {
    href: "/sobre-liz#eventos",
    eyebrow: "Eventos",
    title: "Seminarios y giras",
    copy: "Seminarios con expertos nacionales e internacionales — en nuestro estudio y en sedes por todo México. Educación continua para elevar el estándar de la industria.",
    cta: "Próximos eventos",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1000&q=75",
    alt: "Evento y seminario de la industria de las uñas",
  },
] as const

export default function AcademiaEventos() {
  return (
    <section className="py-12 md:py-16" aria-labelledby="home-academia-title">
      <SectionHeader
        id="home-academia-title"
        eyebrow="Más que una tienda"
        title={
          <>
            Academia y <em>Eventos</em>
          </>
        }
        description="Distribuidora, academia y estudio en un mismo lugar — y también de gira por el país."
      />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
        {CARDS.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-neutral-100">
              <Image
                src={card.image}
                alt={card.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            </div>

            <div className="pt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                {card.eyebrow}
              </p>
              <h3 className="font-display text-[24px] font-medium leading-[1.15] tracking-[-0.01em] text-ink transition-colors duration-300 group-hover:text-gold md:text-[28px]">
                {card.title}
              </h3>
              <p className="mt-2.5 max-w-[480px] text-[14px] leading-[1.65] text-ink-soft sm:text-[15px]">
                {card.copy}
              </p>
              <span className="mt-4 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 group-hover:text-ink">
                {card.cta}
                <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
