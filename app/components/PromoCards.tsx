"use client"

import Link from "next/link"

type PromoCardProps = {
  title: string
  description: string
  buttonLabel: string
  href: string
  img: string
  external?: boolean
}

const cards: PromoCardProps[] = [
  {
    title: "Conoce nuestra tienda",
    description: "Productos profesionales con envío a todo México",
    buttonLabel: "Descubrir",
    href: "/tienda",
    img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop",
  },
  {
    title: "Colores de temporada",
    description: "Descubre los nuevos colores de la colección",
    buttonLabel: "Ver colores",
    href: "/tienda",
    img: "https://images.unsplash.com/photo-1583001809873-a128495da465?w=600&h=400&fit=crop",
  },
  {
    title: "Agenda tu cita",
    description: "Atención profesional en Tampico, Tamaulipas",
    buttonLabel: "WhatsApp",
    href: "https://wa.me/528332183399",
    img: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&h=400&fit=crop",
    external: true,
  },
]

export default function PromoCards() {
  return (
    <section className="px-6 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map((card) => {
            const buttonClass =
              "mt-4 inline-flex rounded-full bg-[#C6A75E] px-5 py-2 text-xs font-semibold text-black transition-colors hover:bg-white"

            const inner = (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <h3 className="text-lg font-semibold">{card.title}</h3>
                  <p className="mt-1 text-xs text-white/80">{card.description}</p>
                  {card.external ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass}
                    >
                      {card.buttonLabel}
                    </a>
                  ) : (
                    <Link href={card.href} className={buttonClass}>
                      {card.buttonLabel}
                    </Link>
                  )}
                </div>
              </>
            )

            return (
              <article
                key={card.title}
                className="relative h-64 overflow-hidden rounded-2xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.img}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {inner}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
