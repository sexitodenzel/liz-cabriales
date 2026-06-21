import { Suspense } from "react"

import NuevosLanzamientos from "./components/NuevosLanzamientos"
import NailArtSection from "./components/NailArtSection"
import HomeHero from "./components/home/HomeHero"
import HomeTopSections from "./components/home/HomeTopSections"
import HomeHeroSkeleton from "./components/home/HomeHeroSkeleton"
import InstagramFeed from "./components/InstagramFeed"

export const revalidate = 60

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Suspense fallback={<HomeHeroSkeleton />}>
        <HomeHero />
      </Suspense>
      <div className="h-10 shrink-0 md:h-12" aria-hidden />
      <div className="site-container">
        <Suspense fallback={null}>
          <HomeTopSections />
        </Suspense>
        <Suspense fallback={null}>
          <NailArtSection />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <NuevosLanzamientos />
      </Suspense>
      <InstagramFeed />
    </main>
  )
}
