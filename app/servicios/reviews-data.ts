export type StudioReview = {
  id: string
  name: string
  date: string
  stars: number
  quote: string
  /** Origen futuro: "local" | "google" | etc. */
  source?: "local" | "google"
}

/** Placeholder hasta conectar Google / sistema de reseñas. */
export const STUDIO_REVIEWS: StudioReview[] = [
  {
    id: "r1",
    name: "Mariana R.",
    date: "hace 2 semanas",
    stars: 5,
    quote: "Gran atención y super recomendado. Las uñas quedaron impecables.",
    source: "local",
  },
  {
    id: "r2",
    name: "Gabriela S.",
    date: "hace 3 semanas",
    stars: 5,
    quote: "Ambiente limpio, puntualidad y resultado profesional. Volveré.",
    source: "local",
  },
  {
    id: "r3",
    name: "Daniela O.",
    date: "hace 1 mes",
    stars: 5,
    quote: "Me encantó el detalle y el cuidado con el que trabajan.",
    source: "local",
  },
  {
    id: "r4",
    name: "Paola M.",
    date: "hace 1 mes",
    stars: 5,
    quote: "Excelente experiencia de punta a punta. Muy recomendable.",
    source: "local",
  },
]
