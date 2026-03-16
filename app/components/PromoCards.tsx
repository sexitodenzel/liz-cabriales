"use client"

import Link from "next/link"

type PromoCardProps = {
  title: string
  description: string
  buttonLabel: string
  href: string
}

const cards: PromoCardProps[] = [
  {
    title: "Conoce nuestra tienda",
    description: "Productos profesionales para uñas con envío a todo México",
    buttonLabel: "Descubre ahora",
    href: "/tienda",
  },
  {
    title: "Colores de Primavera",
    description: "Descubre los nuevos colores de primavera",
    buttonLabel: "Descubre ahora",
    href: "/cursos",
  },
  {
    title: "Encuentra tu manicure",
    description: "Descubre que tipo de manicure te queda mejor",
    buttonLabel: "Descubre ahora",
    href: "/servicios",
  },
]

export default function PromoCards() {
  return (
    <section className="py-8 px-6"> 
      <div className="max-w-[px1400] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <article
              key={card.title}
              className="flex flex-row rounded-xl bg-gray-50 overflow-hidden h-44"
            >
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-6">
                    {card.description}
                  </p>
                </div>

                <Link
                  href={card.href}
                  className="inline-flex w-fit items-center justify-center px-7 py-3 rounded-md bg-black text-white text-[11px] font-medium hover:bg-gray-900 transition-colors"
                >
                  {card.buttonLabel}
                </Link>
              </div>

              <div className="w-1/3 h-full bg-gray-200" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

