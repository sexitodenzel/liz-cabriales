import Link from "next/link"
import type { Metadata } from "next"

import SmoothImage from "@/app/components/shared/SmoothImage"

import EventsGallery, { type EventGalleryItem } from "./components/EventsGallery"
import VerifiedReviews, { type VerifiedReviewsData } from "./components/VerifiedReviews"
import PressMentions, { type PressMention } from "./components/PressMentions"
import SobreLizStats from "./components/SobreLizStats"
import TrajectoryTimeline from "./components/TrajectoryTimeline"
import { resolveSobreLizBrandPhoto } from "@/lib/sobre-liz/brand-photo"
import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"
import {
  getEventsGallery,
  getPastCoursesForGallery,
} from "@/lib/supabase/events-gallery"

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
      "Salón con servicios de manicure, pedicure, quiropodia y arte de uñas atendido por masters certificadas por la academia.",
    href: "/servicios/agendar",
    cta: "Reservar cita",
  },
] as const

const TIMELINE = [
  {
    year: "2019",
    title: "Primeros Pasos",
    description:
      "Se imparte el primer curso oficial de capacitación profesional y, en paralelo, se consolida la alianza con la primera marca de distribución, marcando el inicio de nuestro compromiso con las y los profesionales de Tampico.",
  },
  {
    year: "2020",
    title: "Rompiendo Fronteras: El Primer Máster Internacional",
    description:
      "Frente a la crisis global, nos convertimos en la primera academia en Tampico en certificar el área con estrictos protocolos de desinfección. Lejos de detenernos, marcamos un hito al traer a nuestro primer Máster de nivel internacional, elevando el nivel técnico de la zona con seguridad absoluta.",
  },
  {
    year: "2021",
    title: "El Año del Crecimiento Compartido",
    description:
      "Vivimos un año histórico al romper récord de asistentes en talleres altamente valorados. Con el firme propósito de impulsar la economía local, brindamos cursos 100% gratuitos enfocados en los mejores perfiles laborales, elevando el nivel técnico y asegurando el crecimiento profesional de nuestra comunidad.",
  },
  {
    year: "2022",
    title: "Consolidación y Galardón como la Mejor Organización",
    description:
      "Hicimos historia en la primera Certificación UINS Novel, donde fuimos reconocidos con el primer lugar como la mejor organización. Este gran logro no solo premió la logística, sino el amor impregnado en cada detalle, nuestro trato profundamente humano y el empoderamiento que inspiramos en cada uno de los asistentes.",
  },
  {
    year: "2023",
    title: "Instalaciones Propias y Consolidación Internacional",
    description: "Un año de crecimiento exponencial y saltos definitivos:",
    bullets: [
      {
        label: "Sede Fija:",
        text: "Se inaugura oficialmente la infraestructura de la Academia y Distribuidora Liz Cabriales.",
      },
      {
        label: "Año de Másters Internacionales:",
        text: 'La academia eleva el estándar formativo de la zona trayendo a grandes referentes como León Cabriales ("el máster de los masters") y al nail trainer internacional Willy Álvarez.',
      },
      {
        label: "The Ultimate Nail Camp:",
        text: "Se lleva a cabo este magno evento de entrenamiento intensivo, posicionando a la marca como líder en eventos educativos de alto rendimiento.",
      },
    ],
  },
  {
    year: "2024",
    title: "Revolución Técnica y Especialización Europea",
    description:
      "La academia se transforma en el referente de capacitación avanzada y clínica en la región gracias a hitos como:",
    bullets: [
      {
        label: "Presencia Internacional:",
        text: "Se recibe por primera vez desde Ucrania a la reconocida Pdga. Oksana Makarova, elevando el nivel de formación clínica.",
      },
      {
        label: "Innovación en Nail Art:",
        text: "Lanzamiento de cursos con las tendencias mundiales más exigentes, incluyendo Flores Camaleón y Cartoon 3D Nivel Avanzado.",
      },
      {
        label: "Especialización Quiropódica y Podal:",
        text: "Introducción de técnicas revolucionarias y necesarias para el cuidado de la salud, como Reflexología Podal, Reconstrucción Ungueal, Ortonixia (corrección de uñas) y tratamiento avanzado de Onicocriptosis (uñas encarnadas).",
      },
    ],
  },
  {
    year: "2025",
    title: "El Año de la Conexión Global",
    description: "Un año marcado por la conexión con la élite mundial del sector:",
    bullets: [
      {
        label: "Hub Internacional:",
        text: "Se recibe por primera vez a referentes internacionales y nacionales de peso como la Master Anna Shevchenko (Ucrania), Dorty Girón Ceballos (Guatemala), Lic. Martín Dávila y Lic. Karina Rojas (Bolivia), así como a los expertos Pdgo. Armando Calderón, Cardone, Danny Art, Diana Gómez, Ángela Juárez, entre muchos otros grandes másters.",
      },
      {
        label: "Seminario de Marca:",
        text: "Se celebra con éxito el primer Seminario Quiro Aesthetic Pedicure 2025, consolidando una metodología propia que fusiona la estética con la quiropodia clínica.",
      },
    ],
  },
] as const

/**
 * Apariciones en prensa y medios. Las notas locales viven en publicaciones de
 * Facebook de los medios (no están indexadas en buscadores), así que los
 * enlaces se capturan a mano desde lo que comparta Liz. La sección se oculta
 * sola mientras la lista esté vacía.
 *
 * Formato de cada entrada:
 * {
 *   id: "p-1",
 *   outlet: "El Sol de Tampico",
 *   title: "Titular o descripción de la nota",
 *   date: "Marzo 2025",
 *   url: "https://…", // nota o publicación del medio en redes
 *   image: "https://…", // opcional, foto de la nota
 * }
 */
const PRESS_MENTIONS: PressMention[] = [
  {
    id: "press-somos-noticias-qap-2025",
    outlet: "Somos Noticias Mx",
    title:
      "La zona conurbada se convirtió en sede del Primer Seminario Internacional Quiro Aesthetic Pedicure 2025, organizado por la Academia Liz Cabriales.",
    date: "Noviembre 2025",
    url: "https://www.facebook.com/permalink.php?story_fbid=pfbid02ZsjjfncBxe9YYLA7j5rvcCs5TEkJEV5Fzkapoh6cCGNc9Yx5QErMcNfsAdFTrMmVl&id=61556355743027",
  },
  {
    id: "press-nail-krush-entrevista-2021",
    outlet: "Revista Nail Krush",
    title:
      "Entrevista completa a Liz Cabriales en la edición de la revista Nail Krush.",
    date: "Julio 2021",
    url: "https://www.facebook.com/nailkrush/posts/pfbid0n1NxYoGGssTnYHc8m4CEpqufG76A1TYm8DgYsCB8m3KqhGpPKH9MofvEoM1augf8l",
  },
]

/**
 * Reseñas reales capturadas tal cual de las plataformas (jul 2026):
 * - Facebook: página de la academia; de las 8 opiniones solo las públicas son
 *   legibles — el resto está restringido por privacidad de cada autora.
 * - Google Maps: ficha "Academia Liz Cabriales" (Nayarit #204-B, Cd. Madero),
 *   enlace estable por CID. Viviana Zenitram dejó solo estrellas (sin texto).
 * Los agregados (% / promedio y conteos) son los oficiales de cada plataforma.
 */
const VERIFIED_REVIEWS: VerifiedReviewsData = {
  sources: [
    {
      id: "google",
      stat: "5.0",
      detail: "de calificación promedio · 3 opiniones en Google Maps",
      url: "https://maps.google.com/?cid=11615870019560735969",
      cta: "Ver la ficha en Google",
    },
    {
      id: "facebook",
      stat: "100%",
      detail: "de recomendación · 8 opiniones en la página oficial de la academia",
      url: "https://www.facebook.com/profile.php?id=100063880305172&sk=reviews",
      cta: "Ver todas en Facebook",
    },
  ],
  quotes: [
    {
      id: "fb-fernanda-gar",
      source: "facebook",
      name: "Fernanda Gar",
      date: "Marzo 2026",
      quote:
        "Recomiendo absolutamente todo, atención, profesionalismo. Siempre trae a los mejores masters. Acabo de salir de la capacitación con una excelente maestra, así como ella siempre tiene muy buenos temas.",
    },
    {
      id: "fb-joshz-nails",
      source: "facebook",
      name: "Joshz Nails and Hair",
      date: "Marzo 2026",
      quote:
        "Tengo ya dos años aprendiendo en la academia y en esta ocasión con la maestra Liz Togo aprendí su técnica de pedicure y me he actualizado; quedé satisfecha con mis resultados en la práctica. Recomendado, y espero volver a estar presente en un siguiente taller.",
    },
    {
      id: "fb-stephany-deantes",
      source: "facebook",
      name: "Stephany Deantes",
      date: "Marzo 2026",
      quote:
        "Siempre tienen a los mejores maestros. Este fin de semana asistí a otra capacitación más, ahora con la maestra Liz Togo, y quedé como siempre muy satisfecha con todo lo aprendido. Nunca me decepcionan.",
    },
    {
      id: "fb-lizzeth-pancardo",
      source: "facebook",
      name: "Lizzeth Pancardo",
      date: "Marzo 2026",
      quote:
        "Van 2 cursos que tomo aquí en la academia y la verdad 10/10: el primero con la miss Liz Cabriales y el segundo con la miss Liz Togo, y todo excelente.",
    },
    {
      id: "fb-elisa-domm",
      source: "facebook",
      name: "Elisa Domm",
      date: "Septiembre 2025",
      quote:
        "100% recomendado. Mis capacitaciones las he tomado en esta academia y el trato siempre ha sido muy amable; no sé cuántas llevo, pero lo recomiendo ampliamente.",
    },
    {
      id: "fb-siomara-mireles",
      source: "facebook",
      name: "Siomara Mireles",
      date: "Septiembre 2025",
      quote:
        "Muy amables, muy buena academia. Los cursos 10/10, súper recomendados.",
    },
    {
      id: "fb-edith-perez",
      source: "facebook",
      name: "Edith Perez",
      date: "Febrero 2024",
      quote:
        "Ya no recuerdo exactamente cuántos años tengo tomando cursos con su organización, pero desde el primero jamás ha hecho excepción por nadie: siempre su trato excelente, su atención nada que decir y los maestros que trae son de 10. Yo encantada con su academia.",
    },
    {
      id: "fb-abi-rodriguez",
      source: "facebook",
      name: "Abi Rodríguez",
      date: "Diciembre 2023",
      quote: "Los mejores cursos y la atención 100 de 100.",
    },
    {
      id: "g-vianey-cruz",
      source: "google",
      name: "Vianey Cruz Escobedo",
      quote:
        "La mejor escuela que puedes encontrar en Tamaulipas, te brindan cursos de lo más actual a nivel nacional e internacional, una organización de primer mundo, un trato como si fuera tu propia casa, la honestidad y responsabilidad de todo el equipo de trabajo es sumamente alto, sin duda alguna es la mejor opción para muchas de nosotras que nos dedicamos en este medio.",
    },
    {
      id: "g-itzel-osorio",
      source: "google",
      name: "Itzel Osorio",
      quote:
        "Un lugar muy cálido, con todas las comodidades! Pero lo mejor es que siempre hay maestros de calidad, lo más novedoso. Lo mejor de Tampico, Madero y Altamira.",
    },
  ],
}

export default async function SobreLizPage() {
  const [{ slots }, eventRows, pastCoursesData] = await Promise.all([
    getLandingPageDataCached(),
    getEventsGallery(),
    getPastCoursesForGallery(),
  ])
  const heroPhoto = resolveSobreLizBrandPhoto(slots.brand_photo)

  // Fotos de cursos pasados: navegan directo a la página del curso.
  const courseItems: EventGalleryItem[] = pastCoursesData.courses.map((course) => ({
    id: `course-${course.id}`,
    url: course.cover_image,
    caption: course.title,
    date: course.start_date.slice(0, 4),
    href: `/academia/${course.id}`,
  }))

  // Fotos sueltas de liz_events que no pertenecen a ningún curso.
  const courseUrls = new Set(pastCoursesData.knownUrls)
  const extraItems: EventGalleryItem[] = eventRows
    .filter((row) => !courseUrls.has(row.image_url))
    .map((row) => ({
      id: row.id,
      url: row.image_url,
      caption: row.caption,
      date: row.event_date?.match(/\b(20\d{2})\b/)?.[1],
    }))

  const dbItems = [...courseItems, ...extraItems].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? "")
  )
  const galleryItems = dbItems.length > 0 ? dbItems : EVENT_GALLERY

  return (
    <main id="sobre-liz" className="min-h-screen bg-ivory text-black">
      {/* ── HERO ── */}
      <section className="site-container pt-12 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:gap-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-[#c6a75e]" /> Sobre Liz
            </p>
            <h1 className="font-display text-[clamp(30px,5vw,46px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
              Liz Cabriales
              <br />
              <em className="font-medium italic text-gold">Maestra del arte</em>
              <br />
              de las uñas
            </h1>
            <div className="mt-6 h-0.5 w-20 rounded-sm bg-[#c6a75e]" aria-hidden />

            <p className="mt-8 max-w-xl text-[16px] leading-[1.7] text-[#2c2c2c]">
              Soy Liz Cabriales, fundadora de la Academia y Distribuidora Profesional de Uñas y Servicio
              Podal. Llevo más de 7 años formando profesionales en Tampico y llevando el respaldo de las
              mejores marcas a todo México.
            </p>
            <p className="mt-5 max-w-xl font-display text-[18px] italic leading-[1.55] text-gold">
              &ldquo;Piensa, cree, sueña y atrévete.&rdquo;
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/academia"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gold"
              >
                Conoce la academia
              </Link>
              <Link
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#c6a75e]/60 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:bg-[#c6a75e]/10"
              >
                Hablar por WhatsApp
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[420px]">
            <div className="relative rounded-2xl bg-gradient-to-br from-[#f0dfa8] via-[#c6a75e] to-[#8f6f2f] p-[3px] shadow-[0_18px_50px_rgba(168,134,47,0.22)]">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[13px] bg-neutral-100">
                <SmoothImage
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
                className="text-gold transition-colors hover:text-ink"
              >
                <InstagramIcon />
              </Link>
              <Link
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gold transition-colors hover:text-ink"
              >
                <FacebookIcon />
              </Link>
              <Link
                href={SOCIAL.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-gold transition-colors hover:text-ink"
              >
                <WhatsAppIcon />
              </Link>
              <Link
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold tracking-[0.1em] text-gold transition-colors hover:text-ink"
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
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Tres pilares
          </p>
          <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
            Una marca, tres formas de acompañarte
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="flex h-full flex-col rounded-2xl border border-[#c6a75e]/20 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(168,134,47,0.12)]"
            >
              <h3 className="text-[20px] font-semibold text-[#111]">
                {pillar.title}
              </h3>
              <div className="mt-3 h-0.5 w-10 bg-[#c6a75e]" aria-hidden />
              <p className="mt-5 flex-1 text-[14.5px] leading-[1.65] text-[#4b4b4b]">
                {pillar.description}
              </p>
              <Link
                href={pillar.href}
                className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:text-ink"
              >
                {pillar.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="site-container mt-24">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Nuestra trayectoria
          </p>
          <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
            De un sueño a una comunidad
          </h2>
        </div>

        <TrajectoryTimeline items={TIMELINE} />
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="site-container mt-24">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
            Voces de la academia
          </p>
          <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
            Lo que dicen nuestras alumnas
          </h2>
        </div>
        <VerifiedReviews data={VERIFIED_REVIEWS} />
      </section>

      {/* ── EN LOS MEDIOS ── */}
      <PressMentions items={PRESS_MENTIONS} />

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
        <div className="group rounded-3xl bg-[#111] px-8 py-14 lg:px-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 transition-colors duration-300 group-hover:text-ink">
              Próximo paso
            </p>
            <h2 className="text-[clamp(24px,3vw,34px)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
              Piensa en grande, cree en tu talento y atrévete a lograrlo con nosotros.
            </h2>
            <div
              className="mt-5 h-0.5 w-16 rounded-sm bg-white/25 transition-colors duration-300 group-hover:bg-[#c6a75e]"
              aria-hidden
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/academia"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#111] transition-colors hover:bg-white/90"
              >
                Ver próximos cursos
              </Link>
              <Link
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
              >
                Síguenos en Instagram
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
