"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { resolveSobreLizBrandPhoto } from "@/lib/sobre-liz/brand-photo"
import Button from "@/app/components/ui/Button"

const COLLAGE_PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
    alt: "Detalle de nail art profesional",
  },
  {
    src: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80",
    alt: "Manos con manicura impecable",
  },
  {
    src: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=600&q=80",
    alt: "Estación de trabajo en la academia",
  },
] as const

/* Datos del cierre: solo hechos que ya afirma el copy de la marca. */
const FACTS = [
  { value: "7+", label: "Años de trayectoria" },
  { value: "Tampico", label: "Academia y estudio" },
  { value: "México", label: "Distribución nacional" },
] as const

function useInView<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null)
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

const fadeUp = (inView: boolean) =>
  `transition-all duration-700 ease-out ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`

/* Sello circular giratorio: texto sobre un círculo SVG que rota en CSS
   (.lc-rotate-slow, GPU-only) con monograma estático al centro. */
function RotatingStamp() {
  return (
    <div className="pointer-events-none absolute -left-4 -top-4 z-10 hidden sm:block">
      <div className="relative h-[104px] w-[104px]">
        <span className="absolute inset-0 rounded-full bg-surface shadow-[0_8px_24px_rgba(20,20,20,0.12)]" />
        <svg viewBox="0 0 100 100" className="lc-rotate-slow absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <path
              id="lc-stamp-circle"
              d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            />
          </defs>
          <text className="fill-gold" style={{ fontSize: "7.5px", fontWeight: 600, letterSpacing: "0.18em" }}>
            <textPath href="#lc-stamp-circle" textLength="226">
              ACADEMIA · LIZ CABRIALES · TAMPICO · MX ·
            </textPath>
          </text>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[22px] font-medium italic tracking-[0.02em] text-ink">
            LC
          </span>
        </span>
      </div>
    </div>
  )
}

type Props = {
  photoUrl?: string
}

export default function BrandDescription({ photoUrl }: Props) {
  const MAIN_PHOTO = resolveSobreLizBrandPhoto(photoUrl)
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="border-t border-line text-ink">
      <div className="py-14 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">

          {/* ── LEFT: editorial text ── */}
          <div className={`order-2 flex flex-col lg:order-1 ${fadeUp(inView)}`}>
            <p className="mb-5 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              <span className="h-px w-8 bg-gold-soft" /> Nuestra historia
            </p>

            <h2 className="max-w-[560px] font-display text-[clamp(32px,4.4vw,56px)] font-medium leading-[1.06] tracking-[-0.015em]">
              <span className="text-ink">¡Te damos la bienvenida a </span>
              <span className="italic text-gold">Liz Cabriales!</span>
            </h2>

            <p className="mt-4 max-w-[560px] text-[15px] font-semibold leading-[1.55] text-ink">
              Academia y Distribuidora Profesional de Uñas y Servicio Podal.
            </p>

            {/* Lema como pull-quote editorial */}
            <blockquote className="relative mt-7 max-w-[560px] border-l-2 border-gold-soft pl-5">
              <p className="font-display text-[clamp(19px,2.2vw,24px)] italic leading-[1.35] text-gold">
                &ldquo;Piensa, cree, sueña y atrévete.&rdquo;
              </p>
            </blockquote>

            <div className="mt-7 max-w-[560px] space-y-4 text-[14px] leading-[1.75] text-ink-soft sm:text-[15px]">
              <p className="first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-display first-letter:text-[52px] first-letter:font-medium first-letter:leading-[0.8] first-letter:text-gold">
                Con más de 7 años de trayectoria formando profesionales de éxito en Tampico y
                llevando el respaldo de las mejores marcas a todo México, en Liz Cabriales somos
                expertas en el cuidado, salud y arte de las manos y los pies.
              </p>
              <p>
                Nuestra misión es elevar el estándar de la industria. Por ello, nos encargamos de
                formar onicotécnicas, pedicuristas y quiropodistas profesionales, brindándoles una
                educación continua, vanguardista e innovadora. Preparamos a cada uno de nuestros
                alumnos para dominar las técnicas más exigentes y ofrecer un servicio estético y
                clínico de la más alta calidad.
              </p>
              <p>
                Como distribuidora oficial, respaldamos tu trabajo clínico y creativo con el
                catálogo de las marcas líderes del mercado. Si estás lista para transformar tu
                pasión en una carrera profesional o abastecer tu negocio con lo mejor del sector,
                estás en el lugar correcto. Explora nuestros cursos, descubre nuestra tienda en
                línea y da el siguiente paso.
              </p>
              <p className="pt-1 font-display text-[15px] font-medium leading-[1.65] text-ink sm:text-[16px]">
                Piensa en grande, cree en tu talento, sueña con el éxito y{" "}
                <span className="italic text-gold">¡atrévete a lograrlo con nosotros!</span>
              </p>
            </div>

            {/* Fila de datos con separadores hairline */}
            <dl
              className={`mt-9 grid max-w-[560px] grid-cols-3 divide-x divide-line border-y border-line py-5 ${fadeUp(inView)}`}
              style={{ transitionDelay: "180ms" }}
            >
              {FACTS.map((fact) => (
                <div key={fact.label} className="px-4 first:pl-0 last:pr-0">
                  <dt className="sr-only">{fact.label}</dt>
                  <dd className="font-display text-[clamp(20px,2vw,26px)] font-medium leading-none tracking-[-0.01em] text-ink">
                    {fact.value}
                  </dd>
                  <dd className="mt-2 text-[10px] font-semibold uppercase leading-[1.4] tracking-[0.16em] text-ink-soft">
                    {fact.label}
                  </dd>
                </div>
              ))}
            </dl>

            <div
              className={`mt-9 flex flex-wrap items-center gap-3 ${fadeUp(inView)}`}
              style={{ transitionDelay: "280ms" }}
            >
              <Button href="/sobre-liz" variant="primary" withArrow>
                Conoce su historia
              </Button>
              <Button href="/sobre-liz#eventos" variant="outline">
                Ver eventos
              </Button>
            </div>
          </div>

          {/* ── RIGHT: spotlight collage ── */}
          <div
            className={`order-1 lg:order-2 ${fadeUp(inView)}`}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="relative mx-auto grid w-full max-w-[640px] grid-cols-12 grid-rows-6 gap-3">
              {/* Featured large photo con marco hairline desplazado */}
              <div className="relative col-span-8 row-span-6">
                <span
                  aria-hidden
                  className="absolute -bottom-3 -left-3 right-3 top-3 rounded-card border border-gold-soft/40"
                />
                <div className="relative overflow-hidden rounded-card bg-neutral-100 shadow-[0_18px_50px_rgba(20,20,20,0.18)]">
                  <div className="relative aspect-[4/5] w-full">
                    <Image
                      src={MAIN_PHOTO}
                      alt="Liz Cabriales — fundadora de la academia"
                      fill
                      sizes="(max-width: 1024px) 70vw, 420px"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-5 pb-5 pt-12">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-soft">
                        Fundadora
                      </p>
                      <p className="mt-1 font-display text-[18px] font-medium leading-tight text-white">
                        Liz Cabriales
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Small photo top-right */}
              <div className="relative col-span-4 row-span-3 overflow-hidden rounded-card bg-neutral-100 shadow-[0_10px_30px_rgba(20,20,20,0.12)]">
                <div className="relative h-full w-full">
                  <Image
                    src={COLLAGE_PHOTOS[0].src}
                    alt={COLLAGE_PHOTOS[0].alt}
                    fill
                    sizes="(max-width: 1024px) 30vw, 210px"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Small photo middle-right */}
              <div className="relative col-span-4 row-span-3 overflow-hidden rounded-card bg-neutral-100 shadow-[0_10px_30px_rgba(20,20,20,0.12)]">
                <div className="relative h-full w-full">
                  <Image
                    src={COLLAGE_PHOTOS[1].src}
                    alt={COLLAGE_PHOTOS[1].alt}
                    fill
                    sizes="(max-width: 1024px) 30vw, 210px"
                    className="object-cover"
                  />
                </div>
              </div>

              <RotatingStamp />
            </div>

            <Link
              href="/sobre-liz"
              className="mt-6 block text-center text-[12px] font-semibold uppercase tracking-[0.16em] text-gold transition-colors hover:text-ink"
            >
              Ver todas las fotos →
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
