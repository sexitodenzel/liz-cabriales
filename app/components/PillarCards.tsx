"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { pillarTextColumnWidthClass } from "./pillarTextColumn"

type RowImage = { src: string; alt: string }

const imageCardClass =
  "relative box-border h-[220px] w-full min-w-0 shrink-0 py-[1cm] sm:h-[240px] lg:h-full lg:min-h-0 lg:flex-1"

const imageSizesRow = "(max-width: 1023px) 30vw, 22vw"

type PromoSection = {
  label: string | null
  headline: string
  description: string
  href: string
  cta: string
  textAlign: "left" | "right"
  imagesAlign: "left" | "right"
  images: RowImage[]
  mediaGroupId?: string
  mediaTypes?: ("video" | "before-after")[]
}

const promoSections: PromoSection[] = [
  {
    label: "Distribuidora",
    headline: "Los mejores productos, en un solo lugar.",
    description:
      "Distribuidoras oficiales de Exotic, Lovely, Manikure Pro, Golden Nails, Miss Nails, Cardone, Lúa, Mia Secret y más. Envíos a todo México con stock real y garantía de autenticidad.",
    href: "/tienda",
    cta: "Ver Tienda",
    textAlign: "left",
    imagesAlign: "right",
    images: [
      { src: "https://picsum.photos/seed/nails1/400/600", alt: "Productos 1" },
      { src: "https://picsum.photos/seed/nails2/400/600", alt: "Productos 2" },
      { src: "https://picsum.photos/seed/nails3/400/600", alt: "Productos 3" },
    ],
  },
  {
    label: "Academia",
    headline: "Formación de alto nivel, donde tú estés.",
    description:
      "Cursos presenciales impartidos por masters nacionales e internacionales. Desde nivel principiante hasta avanzado. Todo incluido: certificado, coffee break, comida y material de marca.",
    href: "/academia",
    cta: "Ver Academia",
    textAlign: "right",
    imagesAlign: "left",
    images: [
      { src: "https://picsum.photos/seed/academia1/400/600", alt: "Academia 1" },
      { src: "https://picsum.photos/seed/academia2/400/600", alt: "Academia 2" },
      { src: "https://picsum.photos/seed/academia3/400/600", alt: "Academia 3" },
    ],
  },
]

function useInView(threshold = 0.08) {
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

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3 w-3"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  )
}

function ImageCard({
  img,
  mediaType,
}: {
  img: RowImage
  mediaType?: "video" | "before-after"
}) {
  return (
    <div
      className={imageCardClass}
      {...(mediaType !== undefined ? { "data-media-type": mediaType } : {})}
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden rounded-2xl">
        <Image
          src={img.src}
          alt={img.alt}
          width={400}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.04]"
          sizes={imageSizesRow}
        />
      </div>
    </div>
  )
}

function TextCard({
  section,
  alignEnd,
  className = "",
  inView,
  delay,
}: {
  section: PromoSection
  alignEnd: boolean
  className?: string
  inView: boolean
  delay: number
}) {
  return (
    <div
      className={`flex min-h-[360px] flex-col justify-center gap-5 border-t-2 border-[#c9a84c] bg-white p-6 sm:p-8 sm:min-h-[400px] lg:aspect-square lg:min-h-0 ${pillarTextColumnWidthClass} ${
        alignEnd ? "items-end text-right" : "items-start text-left"
      } ${className} transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {section.label && (
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#a8862f]">
          {section.label}
        </span>
      )}
      <h2 className="font-[family-name:var(--font-playfair),serif] text-[clamp(26px,2.4vw,38px)] font-medium leading-[1.1] tracking-[-0.01em] text-black">
        {section.headline}
      </h2>
      <p className="text-[13px] leading-[1.75] text-[#8a8a8a]">{section.description}</p>
      <Link
        href={section.href}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f] transition-[gap,color] duration-[220ms] hover:gap-3 hover:text-[#c9a84c]"
      >
        {section.cta}
        <ArrowRight />
      </Link>
    </div>
  )
}

function ImageRow({
  section,
  className,
  inView,
  delay,
}: {
  section: PromoSection
  className?: string
  inView: boolean
  delay: number
}) {
  return (
    <div
      id={section.mediaGroupId}
      className={`grid grid-cols-3 gap-2 sm:gap-3 lg:flex lg:min-h-0 lg:flex-1 lg:gap-3 transition-all duration-700 ease-out ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className ?? ""}`}
      style={{ transitionDelay: `${delay + 80}ms` }}
    >
      {section.images.map((img, i) => (
        <ImageCard
          key={`${img.src}-${i}`}
          img={img}
          mediaType={section.mediaTypes?.[i]}
        />
      ))}
    </div>
  )
}

export default function PillarCards() {
  const { ref, inView } = useInView()

  return (
    <section
      ref={ref}
      aria-label="Pilares de la marca"
      className="w-full space-y-10 lg:space-y-12"
    >
      {promoSections.map((section, idx) => {
        const isRightText = section.textAlign === "right"
        const imagesFirst = section.imagesAlign === "left"
        const delay = idx * 100

        return (
          <article
            key={section.href}
            className="flex w-full min-h-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-stretch lg:gap-3"
          >
            {imagesFirst ? (
              <>
                <ImageRow
                  section={section}
                  className="order-1 lg:order-none"
                  inView={inView}
                  delay={delay}
                />
                <TextCard
                  section={section}
                  alignEnd={isRightText}
                  className="order-2 lg:order-none"
                  inView={inView}
                  delay={delay}
                />
              </>
            ) : (
              <>
                <TextCard
                  section={section}
                  alignEnd={isRightText}
                  className="order-1 lg:order-none"
                  inView={inView}
                  delay={delay}
                />
                <ImageRow
                  section={section}
                  className="order-2 lg:order-none"
                  inView={inView}
                  delay={delay}
                />
              </>
            )}
          </article>
        )
      })}
    </section>
  )
}
