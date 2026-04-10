"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

const testimonials = [
  {
    quote: "Hermoso, se robó el corazón de todas. Súper atento y profesional 🔥",
    author: "Alumna curso Rock Lab, Tampico",
  },
  {
    quote: "La mejor educadora de la mano de la mejor organizadora 😍",
    author: "Alumna curso Pedicure Pro",
  },
  {
    quote: "Fue un honor aprender de su experiencia. Gracias por transmitir su pasión con humildad.",
    author: "Tete Abrego, Mérida",
  },
]

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0)

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  return (
    <section className="bg-neutral-100 py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Testimonios
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-brand-black md:text-3xl">
            Lo que dicen nuestras alumnas
          </h2>
          <p className="mt-3 text-sm text-neutral-600 md:text-base">
            Más de 6 años formando profesionales en todo México
          </p>
        </div>

        {/* Desktop / tablet grid */}
        <div className="hidden gap-6 md:grid md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.author}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-1 text-brand-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4 fill-brand-gold text-brand-gold"
                  />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm text-neutral-700">
                {testimonial.quote}
              </p>
              <p className="mt-4 text-sm font-semibold text-brand-black">
                {testimonial.author}
              </p>
            </article>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <div className="relative">
            {testimonials.map((testimonial, index) => (
              <article
                key={testimonial.author}
                className={`flex flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-opacity duration-300 ${
                  index === activeIndex ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
                }`}
              >
                <div className="flex items-center gap-1 text-brand-gold">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-4 w-4 fill-brand-gold text-brand-gold"
                    />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm text-neutral-700">
                  {testimonial.quote}
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-black">
                  {testimonial.author}
                </p>
              </article>
            ))}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm"
                aria-label="Ver testimonio anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === activeIndex
                        ? "bg-brand-gold"
                        : "bg-neutral-300"
                    }`}
                    aria-label={`Ir al testimonio ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-sm"
                aria-label="Ver siguiente testimonio"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

