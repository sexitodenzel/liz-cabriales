import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Próximamente | Liz Cabriales Studio",
  description: "Esta sección estará disponible muy pronto.",
}

export default function ProximamentePage() {
  return (
    <main className="min-h-[60vh] bg-white px-6 py-24 text-center text-[#111]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8862f]">
        Servicios
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-playfair),serif] text-[clamp(32px,4vw,48px)] font-medium leading-tight tracking-[-0.02em]">
        Próximamente
      </h1>
      <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[#8a8a8a]">
        Estamos preparando esta experiencia para ti. Vuelve pronto o explora la tienda y la
        academia mientras tanto.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-[#c9a84c] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8862f] transition-colors hover:bg-[#a8862f]/10"
        >
          Ir al inicio
        </Link>
        <Link
          href="/tienda"
          className="inline-flex items-center justify-center bg-[#111] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
        >
          Ver tienda
        </Link>
      </div>
    </main>
  )
}
