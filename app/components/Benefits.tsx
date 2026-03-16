"use client"

import {
  BadgeCheck,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Truck,
} from "lucide-react"

const benefits = [
  {
    icon: Truck,
    title: "Envíos a todo México",
    description: "Recibe tus productos en cualquier estado de la República.",
  },
  {
    icon: CreditCard,
    title: "6 meses sin intereses",
    description: "Paga tus compras a plazos con tarjetas participantes.",
  },
  {
    icon: BadgeCheck,
    title: "Distribuidores oficiales",
    description: "Marcas profesionales con respaldo y garantía real.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp directo",
    description: "Resuelve tus dudas al instante: 833 218 3399.",
  },
  {
    icon: ShieldCheck,
    title: "Pago seguro",
    description: "Tus datos están protegidos con métodos de pago confiables.",
  },
]

export default function Benefits() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="flex flex-col items-start gap-2">
                <Icon className="h-8 w-8 text-brand-gold" />
                <h3 className="text-sm font-semibold text-brand-black">
                  {benefit.title}
                </h3>
                <p className="text-sm text-neutral-600">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

