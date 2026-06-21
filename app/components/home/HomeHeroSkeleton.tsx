export default function HomeHeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[clamp(180px,46vw,400px)] w-full bg-neutral-100" />
      <div className="hero-pagination-dots">
        <span className="h-2.5 w-2.5 rounded-full bg-black" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#b3b3b3]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#b3b3b3]" />
      </div>
    </div>
  )
}
