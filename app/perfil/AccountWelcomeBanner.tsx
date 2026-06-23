type Props = {
  firstName: string
  initial: string
}
export default function AccountWelcomeBanner({ firstName, initial }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-[var(--surface)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--gold)]/30 bg-[#faf8f5] text-2xl font-medium text-[var(--gold)] sm:h-[4.5rem] sm:w-[4.5rem] sm:text-3xl"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p
            className="text-xl leading-snug text-neutral-900 sm:text-2xl"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Bienvenid@ de vuelta,{" "}
            <span className="italic text-[var(--gold)]">{firstName}</span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Nos alegra verte por aquí · Liz Cabriales
          </p>
        </div>
      </div>

      <div className="flex shrink-0 sm:justify-end">
        <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Miembro Regular
        </span>
      </div>
    </div>
  )
}
