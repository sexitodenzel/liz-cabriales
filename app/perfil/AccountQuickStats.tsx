"use client"

import Link from "next/link"
import { BookOpen, Heart, Package, Sparkles } from "lucide-react"

import { useWishlist } from "@/app/components/wishlist/WishlistContext"

type Props = {
  ordersCount: number
  coursesCount: number
  servicesCount: number
}

const STAT_ITEMS = [
  {
    key: "pedidos",
    label: "Pedidos",
    href: "/perfil/pedidos",
    icon: Package,
    countKey: "orders" as const,
  },
  {
    key: "wishlist",
    label: "Wishlist",
    href: "/wishlist",
    icon: Heart,
    countKey: "wishlist" as const,
  },
  {
    key: "cursos",
    label: "Cursos",
    href: "/perfil/cursos",
    icon: BookOpen,
    countKey: "courses" as const,
  },
  {
    key: "servicios",
    label: "Servicios",
    href: "/perfil/servicios",
    icon: Sparkles,
    countKey: "services" as const,
  },
] as const

export default function AccountQuickStats({
  ordersCount,
  coursesCount,
  servicesCount,
}: Props) {
  const { count: wishlistCount, hydrated } = useWishlist()

  const counts: Record<(typeof STAT_ITEMS)[number]["countKey"], number> = {
    orders: ordersCount,
    wishlist: hydrated ? wishlistCount : 0,
    courses: coursesCount,
    services: servicesCount,
  }

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {STAT_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.key}
            href={item.href}
            className="group flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-[var(--surface)] p-4 shadow-sm transition-colors hover:border-[var(--gold)]/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#faf8f5] text-[var(--gold)] transition-colors group-hover:bg-[var(--gold)]/10">
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {item.label}
              </span>
              <span className="mt-0.5 block text-2xl font-medium leading-none text-neutral-900">
                {counts[item.countKey]}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
