type Props = {
  variant?: "grid" | "simple"
}

export default function PageLoading({ variant = "grid" }: Props) {
  if (variant === "simple") {
    return (
      <main className="min-h-screen bg-white">
        <div className="site-container flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-500" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="site-container animate-pulse py-12">
        <div className="mb-6 h-3 w-28 rounded bg-neutral-200" />
        <div className="mb-3 h-8 w-72 max-w-full rounded bg-neutral-200" />
        <div className="mb-10 h-4 w-96 max-w-full rounded bg-neutral-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] rounded bg-neutral-100" />
              <div className="h-3 w-20 rounded bg-neutral-100" />
              <div className="h-4 w-full rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
