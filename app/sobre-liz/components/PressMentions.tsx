import SmoothImage from "@/app/components/shared/SmoothImage"

export type PressMention = {
  id: string
  /** Medio o programa: "El Sol de Tampico", "Milenio Tamaulipas", etc. */
  outlet: string
  /** Titular o descripción corta de la aparición. */
  title: string
  /** Texto libre: "Marzo 2025". */
  date?: string
  /** Enlace a la nota o a la publicación del medio en redes. */
  url: string
  /** Foto opcional de la nota o del momento. */
  image?: string
}

type Props = {
  items: PressMention[]
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  )
}

export default function PressMentions({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section className="site-container mt-24">
      <div className="mb-10 max-w-3xl">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Prensa y medios
        </p>
        <h2 className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111]">
          Hemos salido en las noticias
        </h2>
        <p className="mt-4 text-[15px] leading-[1.7] text-[#4b4b4b]">
          Medios locales han cubierto el trabajo de la academia. Cada nota
          enlaza a la publicación original.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-2xl border border-[#c6a75e]/20 bg-white transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.07)]"
          >
            {m.image ? (
              <span className="relative block aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                <SmoothImage
                  src={m.image}
                  alt={m.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                />
              </span>
            ) : null}
            <span className="flex flex-1 flex-col p-6">
              <span className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                  {m.outlet}
                </span>
                <span className="text-neutral-400 transition-colors group-hover:text-gold">
                  <ExternalIcon />
                </span>
              </span>
              <span className="mt-3 flex-1 text-[15.5px] font-semibold leading-snug text-[#111]">
                {m.title}
              </span>
              {m.date ? (
                <span className="mt-4 text-[12px] text-[#6b6b6b]">{m.date}</span>
              ) : null}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
