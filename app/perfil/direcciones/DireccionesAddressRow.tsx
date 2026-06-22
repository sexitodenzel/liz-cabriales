import Link from "next/link"
import { Star } from "lucide-react"

import type { AddressCardEntry } from "../account-utils"

type DireccionesAddressRowProps = {
  addresses: AddressCardEntry[]
}

export default function DireccionesAddressRow({ addresses }: DireccionesAddressRowProps) {
  return (
    <div className="min-w-0 w-full max-w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-6">
        {addresses.map((address) => (
          <article
            key={address.id}
            className={`w-[220px] shrink-0 p-5 sm:w-[240px] ${
              address.isPrimary
                ? "bg-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                : "bg-transparent"
            }`}
          >
            <p className="text-base font-medium text-neutral-900">{address.name}</p>
            {address.postalCode ? (
              <p className="mt-3 text-sm text-neutral-800">{address.postalCode}</p>
            ) : null}
            <p className={`text-sm text-neutral-800 ${address.postalCode ? "mt-1" : "mt-3"}`}>
              {address.country}
            </p>
            {address.isPrimary ? (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-neutral-900">
                <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900" aria-hidden="true" />
                Dirección principal
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.14em] text-neutral-900">
              <Link
                href="/checkout"
                className="underline underline-offset-4 transition-colors hover:text-neutral-600"
              >
                Editar
              </Link>
              <span className="text-neutral-400" aria-hidden="true">
                |
              </span>
              <span className="text-neutral-400">Eliminar</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
