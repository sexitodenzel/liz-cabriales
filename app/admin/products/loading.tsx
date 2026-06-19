import PageLoading from "@/components/shared/PageLoading"

export default function Loading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1400px] animate-pulse px-6 py-8">
        <div className="mb-6 h-4 w-48 rounded bg-neutral-200" />
        <div className="mb-8 h-8 w-64 rounded bg-neutral-200" />
        <div className="mb-4 flex gap-3">
          <div className="h-9 w-28 rounded-lg bg-neutral-100" />
          <div className="h-9 w-28 rounded-lg bg-neutral-100" />
          <div className="h-9 w-28 rounded-lg bg-neutral-100" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    </main>
  )
}
