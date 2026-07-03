"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { resolveSobreLizBrandPhoto } from "@/lib/sobre-liz/brand-photo"

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

type Props = {
  photoUrl?: string
}

export default function BrandDescription({ photoUrl }: Props) {
  const MAIN_PHOTO = resolveSobreLizBrandPhoto(photoUrl)
  const { ref, inView } = useInView()

  return (
    <section ref={ref} className="bg-white text-black">
      <div className="py-12 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">

          {/* ── LEFT: text + CTA ── */}
          <div className={`order-2 flex flex-col lg:order-1 ${fadeUp(inView)}`}>
            <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8862f]">
              <span className="h-px w-8 bg-[#c9a84c]" /> Spotlight
            </p>

            <h2
              className="max-w-[560px] font-medium leading-[1.08] tracking-[-0.01em]"
              style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: "clamp(30px, 4.2vw, 52px)",
              }}
            >
              <span className="text-black">¡Te damos la bienvenida a </span>
              <span className="text-[#c9a84c]">Liz Cabriales!</span>
            </h2>
            <div className="mb-6 mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />

            <div className="max-w-[560px] space-y-4">
              <p className="text-[15px] font-semibold leading-[1.55] text-black">
                Academia y Distribuidora Profesional de Uñas y Servicio Podal.
              </p>
              <p
                className="text-[17px] italic leading-[1.5] text-[#c9a84c]"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                &ldquo;Piensa, cree, sueña y atrévete.&rdquo;
              </p>

              <div className="space-y-4 pt-1 text-[14px] leading-[1.75] text-[#2c2c2c] sm:text-[15px]">
                <p>
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
                <p
                  className="pt-1 text-[15px] font-medium leading-[1.65] text-black sm:text-[16px]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Piensa en grande, cree en tu talento, sueña con el éxito y{" "}
                  <span className="text-[#c9a84c]">¡atrévete a lograrlo con nosotros!</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sobre-liz"
                className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#a8862f]"
              >
                Conoce su historia
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/sobre-liz#eventos"
                className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c]/60 px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#a8862f] transition-colors hover:bg-[#c9a84c]/10"
              >
                Ver eventos
              </Link>
            </div>
          </div>

          {/* ── RIGHT: spotlight collage ── */}
          <div
            className={`order-1 lg:order-2 ${fadeUp(inView)}`}
            style={{ transitionDelay: "120ms" }}
          >
            <div className="relative mx-auto grid w-full max-w-[640px] grid-cols-12 grid-rows-6 gap-3">
              {/* Featured large photo */}
              <div className="relative col-span-8 row-span-6 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_18px_50px_rgba(20,20,20,0.18)]">
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e7c97a]">
                      Fundadora
                    </p>
                    <p
                      className="mt-1 text-[18px] font-medium leading-tight text-white"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      Liz Cabriales
                    </p>
                  </div>
                </div>
              </div>

              {/* Small photo top-right */}
              <div className="relative col-span-4 row-span-3 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_10px_30px_rgba(20,20,20,0.12)]">
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
              <div className="relative col-span-4 row-span-3 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_10px_30px_rgba(20,20,20,0.12)]">
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

              {/* Floating "Member of the month" style badge */}
              <div className="pointer-events-none absolute -left-3 -top-3 z-10 hidden sm:block">
                <div className="relative">
                  <span className="block h-[88px] w-[88px] rounded-full border border-[#c9a84c]/60 bg-white shadow-[0_8px_24px_rgba(20,20,20,0.12)]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#a8862f]">
                      Academia
                    </span>
                    <span
                      className="text-[11px] font-medium text-black"
                      style={{ fontFamily: "var(--font-playfair), serif" }}
                    >
                      Liz Cabriales
                    </span>
                    <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#a8862f]">
                      Tampico
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/sobre-liz"
              className="mt-5 block text-center text-[13px] font-semibold tracking-[0.1em] text-[#a8862f] transition-colors hover:text-[#c9a84c]"
            >
              Ver todas las fotos →
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
