export default function HomeHeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/7] w-full rounded-sm bg-neutral-100" />
      <div className="mt-16 space-y-4">
        <div className="mx-auto h-4 w-48 rounded bg-neutral-100" />
        <div className="mx-auto h-8 w-96 max-w-full rounded bg-neutral-100" />
        <div className="mx-auto h-4 w-72 max-w-full rounded bg-neutral-100" />
      </div>
    </div>
  )
}
