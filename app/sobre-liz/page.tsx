import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

import EventsGallery, { type EventGalleryItem } from "./components/EventsGallery"
import SobreLizStats from "./components/SobreLizStats"
import TestimonialsCarousel, { type Testimonial } from "./components/TestimonialsCarousel"
import { resolveSobreLizBrandPhoto } from "@/lib/sobre-liz/brand-photo"
import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"
import { getEventsGallery } from "@/lib/supabase/events-gallery"

export const metadata: Metadata = {
  title: "Sobre Liz Cabriales | Academia y Distribuidora",
  description:
    "Conoce a Liz Cabriales, fundadora de la Academia y Distribuidora Profesional de Uñas. Más de 7 años formando profesionales en Tampico y México.",
}

export const revalidate = 300

const SOCIAL = {
  instagram: "https://instagram.com/liz_cabriales",
  facebook: "https://www.facebook.com/profile.php?id=100008326095757",
  whatsapp: "https://wa.me/528332183399",
} as const


const EVENT_GALLERY: EventGalleryItem[] = [
  {
    id: "ev-1",
    url: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=900&q=80",
    caption: "Masterclass de acrílico nivel profesional",
    date: "2025 · Tampico",
  },
  {
    id: "ev-2",
    url: "https://images.unsplash.com/photo-1583001809873-a128495da465?auto=format&fit=crop&w=900&q=80",
    caption: "Encuentro nacional de masters",
    date: "2024 · CDMX",
  },
  {
    id: "ev-3",
    url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=900&q=80",
    caption: "Taller de nail art editorial",
    date: "2024 · Tampico",
  },
  {
    id: "ev-4",
    url: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?auto=format&fit=crop&w=900&q=80",
    caption: "Lanzamiento de marca",
    date: "2024 · Monterrey",
  },
  {
    id: "ev-5",
    url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    caption: "Curso intensivo de gel polish",
    date: "2025 · Tampico",
  },
  {
    id: "ev-6",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    caption: "Graduación generación 2024",
    date: "2024 · Tampico",
  },
  {
    id: "ev-7",
    url: "https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?auto=format&fit=crop&w=900&q=80",
    caption: "Convención profesional de uñas",
    date: "2023 · Guadalajara",
  },
  {
    id: "ev-8",
    url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=900&q=80",
    caption: "Workshop de uñas esculpidas",
    date: "2024 · Tampico",
  },
  {
    id: "ev-9",
    url: "https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=900&q=80",
    caption: "Sesión de fotos para marca",
    date: "2023 · Tampico",
  },
]

function InstagramIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

const PILLARS = [
  {
    title: "Academia",
    description:
      "Talleres, cursos intensivos y certificaciones presenciales en Tampico para formar profesionales del cuidado y arte de las uñas.",
    href: "/academia",
    cta: "Ver cursos",
  },
  {
    title: "Distribuidora",
    description:
      "Distribución oficial de más de 15 marcas profesionales — la curaduría más completa de productos de uñas en México.",
    href: "/tienda",
    cta: "Comprar productos",
  },
  {
    title: "Servicios",
    description:
      "Salón con servicios de manicure, pedicure, podología y arte de uñas atendido por masters certificadas por la academia.",
    href: "/servicios",
    cta: "Reservar cita",
  },
] as const

const TIMELINE = [
  { year: "2018", title: "Apertura de la academia", description: "Nace la Academia Liz Cabriales en Tampico." },
  { year: "2020", title: "Primera marca distribuida", description: "Comienza la distribución oficial de productos profesionales." },
  { year: "2022", title: "100ª alumna certificada", description: "Celebramos un centenar de profesionales formadas." },
  { year: "2024", title: "15+ marcas profesionales", description: "La curaduría más completa de productos de uñas en México." },
  { year: "2025", title: "E-commerce nacional", description: "Lanzamiento de la tienda en línea con envíos a todo el país." },
] as const

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-1",
    name: "Mariana Reyes",
    course: "Acrílico profesional",
    quote:
      "La academia cambió mi carrera por completo. Hoy tengo mi propio salón y clientas fieles gracias a lo que aprendí con Liz.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "t-2",
    name: "Gabriela Soto",
    course: "Gel polish avanzado",
    quote:
      "Las maestras explican cada detalle con paciencia. Salí con la confianza de atender a cualquier clienta desde el primer día.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "t-3",
    name: "Daniela Ortiz",
    course: "Nail art editorial",
    quote:
      "Aprendí técnicas que no había visto en ningún otro lado. El nivel de los cursos es realmente profesional.",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "t-4",
    name: "Paola Méndez",
    course: "Uñas esculpidas",
    quote:
      "Más que un curso, fue una comunidad. Sigo en contacto con mis compañeras y nos apoyamos en nuestros negocios.",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "t-5",
    name: "Karen Villa",
    course: "Podología básica",
    quote:
      "El respaldo de las marcas y el material de práctica hicieron toda la diferencia. Recomiendo la academia totalmente.",
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  },
  {
    id: "t-6",
    name: "Lucía Fernández",
    course: "Manicure ruso",
    quote:
      "Liz transmite su pasión en cada clase. Me motivó a atreverme y montar mi propio estudio en menos de un año.",
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  },
]

function mapEventRows(
  rows: { id: string; image_url: string; caption: string | null; event_date: string | null }[]
): EventGalleryItem[] {
  return rows.map((row) => {
    const year = row.event_date?.match(/\b(20\d{2})\b/)?.[1]
    return {
      id: row.id,
      url: row.image_url,
      caption: row.caption,
      date: year ?? undefined,
    }
  })
}

export default async function SobreLizPage() {
  const [{ slots }, eventRows] = await Promise.all([
    getLandingPageDataCached(),
    getEventsGallery(),
  ])
  const heroPhoto = resolveSobreLizBrandPhoto(slots.brand_photo)
  const galleryItems = eventRows.length > 0 ? mapEventRows(eventRows) : EVENT_GALLERY

  return (
    <main id="sobre-liz" className="min-h-screen bg-white text-black">
      {/* ── HERO ── */}
      <section className="site-container pt-12 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8862f]">
              <span className="h-px w-8 bg-[#c9a84c]" /> Sobre Liz
            </p>
            <h1
              className="font-medium leading-[0.98] tracking-[-0.02em] text-[#111]"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(44px, 6.5vw, 84px)",
              }}
            >
              Liz Cabriales
              <br />
              <em className="font-medium italic text-[#a8862f]">Maestra del arte</em>
              <br />
              de las uñas
            </h1>
            <div className="mt-6 h-0.5 w-20 rounded-sm bg-[#c9a84c]" aria-hidden />

            <p className="mt-8 max-w-xl text-[16px] leading-[1.7] text-[#2c2c2c]">
              Soy Liz Cabriales, fundadora de la Academia y Distribuidora Profesional de Uñas y Servicio
              Podal. Llevo más de 7 años formando profesionales en Tampico y llevando el respaldo de las
              mejores marcas a todo México.
            </p>
            <p
              className="mt-5 max-w-xl text-[18px] italic leading-[1.55] text-[#a8862f]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              &ldquo;Piensa, cree, sueña y atrévete.&rdquo;
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/academia"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#a8862f]"
              >
                Conoce la academia
              </Link>
              <Link
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/60 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8862f] transition-colors hover:bg-[#c9a84c]/10"
              >
                Hablar por WhatsApp
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <div className="relative rounded-2xl bg-gradient-to-br from-[#f0dfa8] via-[#c6a75e] to-[#8f6f2f] p-[3px] shadow-[0_18px_50px_rgba(168,134,47,0.22)]">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[13px] bg-neutral-100">
                <Image
                  src={heroPhoto}
                  alt="Liz Cabriales"
                  fill
                  priority
                  sizes="(max-width: 1024px) 80vw, 420px"
                  className="object-cover"
                />
              </div>
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25"
                aria-hidden
              />
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <Link
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-[#a8862f] transition-colors hover:text-[#c9a84c]"
              >
                <InstagramIcon />
              </Link>
              <Link
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-[#a8862f] transition-colors hover:text-[#c9a84c]"
              >
                <FacebookIcon />
              </Link>
              <Link
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-[#a8862f] transition-colors hover:text-[#c9a84c]"
              >
                <WhatsAppIcon />
              </Link>
              <Link
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold tracking-[0.1em] text-[#a8862f] transition-colors hover:text-[#c9a84c]"
              >
                @liz_cabriales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SobreLizStats />

      {/* ── PILLARS / WHAT WE DO ── */}
      <section id="academia" className="site-container mt-24">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
            Tres pilares
          </p>
          <h2
            className="font-medium leading-[1.05] tracking-[-0.01em] text-[#111]"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 4vw, 52px)",
            }}
          >
            Una marca, tres formas de acompañarte
          </h2>
          <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="flex h-full flex-col rounded-2xl border border-[#c9a84c]/20 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(168,134,47,0.12)]"
            >
              <h3
                className="text-[24px] font-medium text-[#111]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                {pillar.title}
              </h3>
              <div className="mt-3 h-0.5 w-10 bg-[#c9a84c]" aria-hidden />
              <p className="mt-5 flex-1 text-[14.5px] leading-[1.65] text-[#4b4b4b]">
                {pillar.description}
              </p>
              <Link
                href={pillar.href}
                className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f] transition-colors hover:text-[#c9a84c]"
              >
                {pillar.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="site-container mt-24">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
            Nuestra trayectoria
          </p>
          <h2
            className="font-medium leading-[1.05] tracking-[-0.01em] text-[#111]"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 4vw, 52px)",
            }}
          >
            De un sueño a una comunidad
          </h2>
          <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute left-0 right-0 top-[7px] hidden h-px bg-[#c9a84c]/30 lg:block"
            aria-hidden
          />
          <ol className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 lg:grid lg:snap-none lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:pb-0">
            {TIMELINE.map((item) => (
              <li
                key={item.year}
                className="relative min-w-[230px] shrink-0 snap-start lg:min-w-0"
              >
                <span
                  className="block h-3.5 w-3.5 rounded-full border-2 border-white bg-[#c9a84c] shadow-[0_0_0_1px_rgba(201,168,76,0.5)]"
                  aria-hidden
                />
                <p
                  className="mt-5 text-[28px] font-medium leading-none text-[#a8862f]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  {item.year}
                </p>
                <h3 className="mt-3 text-[15px] font-semibold text-[#111]">{item.title}</h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-[#5a5a5a]">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="site-container mt-24">
        <div className="mb-12 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
            Voces de la academia
          </p>
          <h2
            className="font-medium leading-[1.05] tracking-[-0.01em] text-[#111]"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(32px, 4vw, 52px)",
            }}
          >
            Lo que dicen nuestras alumnas
          </h2>
          <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </div>
        <TestimonialsCarousel items={TESTIMONIALS} />
      </section>

      {/* ── EVENTS GALLERY ── */}
      <section id="eventos" className="site-container">
        <EventsGallery
          items={galleryItems}
          eyebrow="Eventos & academia"
          title="Galería de eventos"
          description="Detrás de cámaras de masterclasses, talleres y momentos especiales con nuestras alumnas, marcas y la comunidad de uñas profesionales."
          showYearFilter
        />
      </section>

      {/* ── CTA ── */}
      <section className="site-container pb-24">
        <div className="rounded-3xl bg-[#111] px-8 py-14 text-center text-white lg:px-16 lg:py-20">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a84c]">
            Únete a la comunidad
          </p>
          <h2
            className="mx-auto max-w-2xl font-medium leading-[1.1] tracking-[-0.01em]"
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "clamp(28px, 3.6vw, 44px)",
            }}
          >
            Piensa en grande, cree en tu talento y{" "}
            <em className="italic text-[#c9a84c]">atrévete a lograrlo con nosotros.</em>
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/academia"
              className="inline-flex items-center gap-2 rounded-full bg-[#c9a84c] px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-black transition-colors hover:bg-white"
            >
              Ver próximos cursos
            </Link>
            <Link
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
            >
              Síguenos en Instagram
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
