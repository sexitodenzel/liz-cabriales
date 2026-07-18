export type ReviewSource = "facebook" | "google"

export type VerifiedReviewsData = {
  /** Cards de agregado oficial, una por plataforma. */
  sources: {
    id: ReviewSource
    /** Cifra grande: "100%", "5.0". */
    stat: string
    /** Texto bajo la cifra. */
    detail: string
    /** Enlace a las opiniones en la plataforma. */
    url: string
    /** Texto del CTA. */
    cta: string
  }[]
  /** Reseñas públicas capturadas tal cual de cada plataforma. */
  quotes: {
    id: string
    source: ReviewSource
    name: string
    date?: string
    quote: string
  }[]
}

const SOURCE_LABEL: Record<ReviewSource, string> = {
  facebook: "Facebook",
  google: "Google",
}

function SourceIcon({ source }: { source: ReviewSource }) {
  if (source === "google") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M21.35 11.1H12v2.9h5.35c-.5 2.4-2.55 3.9-5.35 3.9a5.9 5.9 0 1 1 0-11.8c1.5 0 2.85.55 3.9 1.45l2.2-2.2A8.9 8.9 0 1 0 12 20.9c4.45 0 8.55-3.24 9.35-7.9.1-.63.1-1.27 0-1.9Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.9 3.77-3.9 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

function QuoteMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-6 w-6 text-[#c6a75e]/35">
      <path d="M9.5 5C6.46 5 4 7.46 4 10.5V19h7.5v-7.5H7.75C7.75 9.4 8.9 8.25 10.5 8.25V5h-1zm10 0C16.46 5 14 7.46 14 10.5V19h7.5v-7.5h-3.75c0-2.1 1.15-3.25 2.75-3.25V5h-1z" />
    </svg>
  )
}

export default function VerifiedReviews({ data }: { data: VerifiedReviewsData }) {
  const urlBySource = Object.fromEntries(
    data.sources.map((s) => [s.id, s.url])
  ) as Record<ReviewSource, string | undefined>

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
      {/* Agregados oficiales */}
      <div className="flex flex-col gap-5">
        {data.sources.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-1 flex-col justify-between rounded-2xl bg-[#111] p-7 transition-colors hover:bg-[#1c1c1c]"
          >
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              <SourceIcon source={s.id} />
              Reseñas verificadas en {SOURCE_LABEL[s.id]}
            </div>
            <div className="mt-6">
              <p className="text-[44px] font-semibold leading-none text-white">
                {s.stat}
              </p>
              <p className="mt-2 text-[13.5px] leading-snug text-white/60">
                {s.detail}
              </p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#c6a75e] transition-colors group-hover:text-[#e8c97a]">
              {s.cta} →
            </span>
          </a>
        ))}
      </div>

      {/* Reseñas públicas textuales */}
      <div className="grid grid-cols-1 content-start gap-5 sm:grid-cols-2">
        {data.quotes.map((q) => (
          <figure
            key={q.id}
            className="flex h-full flex-col rounded-2xl border border-[#c6a75e]/20 bg-white p-7"
          >
            <QuoteMark />
            <blockquote className="mt-3 flex-1 whitespace-pre-line text-[14.5px] leading-[1.7] text-[#3a3a3a]">
              &ldquo;{q.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#c6a75e]/15 pt-4">
              <span className="text-[14px] font-semibold text-[#111]">{q.name}</span>
              {q.date ? (
                <span className="text-[12px] text-[#6b6b6b]">{q.date}</span>
              ) : null}
              <a
                href={urlBySource[q.source]}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3a3a3a] transition-colors hover:bg-[#c6a75e]/15 hover:text-gold"
              >
                <SourceIcon source={q.source} />
                vía {SOURCE_LABEL[q.source]}
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
