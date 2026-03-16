"use client"

import Link from "next/link"

const collageImages = [
  "https://picsum.photos/seed/30/800/1200",
  "https://picsum.photos/seed/31/800/1200",
  "https://picsum.photos/seed/32/800/1200",
  "https://picsum.photos/seed/33/800/1200",
]

export default function AcademyBanner() {
  return (
    <section className="h-[80vh] mt-16">
      <div className="relative h-full max-w-[1400px] mx-auto overflow-hidden rounded-md bg-black">
        <div className="absolute inset-0 grid h-full w-full grid-cols-2 grid-rows-2">
          {collageImages.map((src, index) => (
            <div key={index} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Personas capacitándose en academia de uñas"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-0 bg-black/70" />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            ACADEMIA LIZ CABRIALES
          </p>
          <h2 className="text-3xl font-semibold text-white md:text-4xl lg:text-5xl">
            Capacítate con nosotros
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-neutral-200 md:text-base">
            Masters Internacionales y Nacionales en Tampico, Tamaulipas
          </p>
          <div className="mt-8">
            <Link
              href="/cursos"
              className="rounded-full bg-brand-gold px-8 py-3 text-sm font-semibold uppercase tracking-wide text-brand-black transition hover:bg-brand-gold/90"
            >
              Ver próximos cursos
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

