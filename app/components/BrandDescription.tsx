"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

const FALLBACK_IMAGE = "https://picsum.photos/seed/liz/500/600"

const SOCIAL = {
  facebook: "https://www.facebook.com/profile.php?id=100008326095757",
  instagram: "https://instagram.com/liz_cabriales",
  whatsapp: "https://wa.me/528332183399",
} as const

const STATS = [
  { value: "7+", label: "años de experiencia" },
  { value: "15+", label: "marcas profesionales" },
  { value: "20+", label: "masters nacionales" },
]

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return { ref, inView }
}

function FacebookIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const socialLinkClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 lg:gap-2 lg:px-[18px] lg:py-2.5 lg:text-[13px]"

const fadeUp = (inView: boolean, delay: number) =>
  `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`

type Props = {
  photoUrl?: string
}

export default function BrandDescription({ photoUrl }: Props) {
  const IMAGE_SRC = photoUrl || FALLBACK_IMAGE
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="bg-white text-black">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:py-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-stretch lg:gap-16">

          {/* Text column */}
          <div className="order-2 flex min-h-0 min-w-0 flex-col lg:order-2">

            {/* Heading + divider */}
            <div
              className={fadeUp(inView, 0)}
              style={{ transitionDelay: "0ms" }}
            >
              <h2 className="mb-[18px] mt-3.5 font-[family-name:var(--font-playfair),serif] text-[clamp(36px,4.4vw,56px)] font-medium leading-[1.05] tracking-[-0.01em] text-black">
                El Arte y Cuidado{" "}
                <em className="font-medium italic text-[#a8862f]">de las Uñas</em>
              </h2>
              <div className="mb-[18px] h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
            </div>

            {/* Body text */}
            <div
              className={fadeUp(inView, 150)}
              style={{ transitionDelay: "150ms" }}
            >
              <p className="mb-4 max-w-[520px] text-[15px] font-semibold leading-[1.55] text-black">
                ¡Te damos la bienvenida a Liz Cabriales!
              </p>
              <p className="mb-4 max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
                Academia y Distribuidora Profesional de Uñas y Servicio Podal.
              </p>
              <p className="mb-4 max-w-[520px] font-[family-name:var(--font-playfair),serif] text-[16px] italic leading-[1.55] text-[#a8862f]">
                &ldquo;Piensa, cree, sueña y atrévete.&rdquo;
              </p>
              <p className="mb-4 max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
                Con más de 7 años de trayectoria formando profesionales de éxito en
                Tampico y llevando el respaldo de las mejores marcas a todo México,
                en Liz Cabriales somos expertas en el cuidado, salud y arte de las
                manos y los pies.
              </p>
              <p className="mb-4 max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
                Nuestra misión es elevar el estándar de la industria. Por ello, nos
                encargamos de formar onicotécnicas, pedicuristas y quiropodistas
                profesionales, brindándoles una educación continua, vanguardista e
                innovadora. Preparamos a cada uno de nuestros alumnos para dominar las
                técnicas más exigentes y ofrecer un servicio estético y clínico de la
                más alta calidad.
              </p>
              <p className="mb-4 max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
                Como distribuidora oficial, respaldamos tu trabajo clínico y creativo
                con el catálogo de las marcas líderes del mercado.
              </p>
              <p className="mb-4 max-w-[520px] text-[15px] font-normal leading-[1.55] text-[#8a8a8a]">
                Si estás lista para transformar tu pasión en una carrera profesional o
                abastecer tu negocio con lo mejor del sector, estás en el lugar
                correcto. Explora nuestros cursos, descubre nuestra tienda en línea y
                da el siguiente paso.
              </p>
              <div className="mb-2 max-w-[520px] text-[15px] font-bold leading-relaxed">
                <span className="text-black">
                  Piensa en grande, cree en tu talento, sueña con el éxito y{" "}
                </span>
                <span className="text-[#a8862f]">¡atrévete a lograrlo con nosotros!</span>
              </div>
            </div>

            {/* Gold stats row */}
            <div
              className={`my-8 grid grid-cols-3 gap-4 border-y border-[#c9a84c]/25 py-6 ${fadeUp(inView, 280)}`}
              style={{ transitionDelay: "280ms" }}
            >
              {STATS.map((s) => (
                <div key={s.value} className="flex flex-col gap-0.5">
                  <span className="font-[family-name:var(--font-playfair),serif] text-[clamp(22px,2.4vw,30px)] font-medium text-[#a8862f]">
                    {s.value}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8a8a8a]">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Social links */}
            <div
              className={`lg:mt-auto ${fadeUp(inView, 380)}`}
              style={{ transitionDelay: "380ms" }}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-px w-5 bg-[#c9a84c]" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
                  Síguenos y contáctanos
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 lg:flex lg:flex-wrap lg:gap-3">
                <Link
                  href={SOCIAL.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialLinkClass} bg-black hover:bg-zinc-800`}
                >
                  <FacebookIcon />
                  Facebook
                </Link>
                <Link
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialLinkClass} bg-black hover:bg-zinc-800`}
                >
                  <InstagramIcon />
                  Instagram
                </Link>
                <Link
                  href={SOCIAL.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${socialLinkClass} bg-black hover:bg-zinc-800`}
                >
                  <WhatsAppIcon />
                  WhatsApp
                </Link>
              </div>
            </div>
          </div>

          {/* Image column */}
          <div
            className={`order-1 mx-auto flex w-full max-w-xs flex-col items-stretch justify-between lg:order-1 lg:mx-0 lg:h-full lg:min-h-0 lg:max-w-none lg:justify-self-start lg:self-stretch transition-all duration-700 ease-out ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="w-full lg:pt-7">
              <div className="relative">
                <div className="aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-[0_8px_32px_rgba(201,168,76,0.14)] ring-1 ring-[#c9a84c]/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={IMAGE_SRC}
                    alt="Liz Cabriales — arte y cuidado de uñas"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
                  />
                </div>
              </div>
            </div>

            <Link
              href={SOCIAL.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 shrink-0 text-center text-[13px] font-semibold tracking-[0.1em] text-[#a8862f] transition-colors duration-200 hover:text-[#c9a84c] lg:mt-0"
            >
              @liz_cabriales
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
