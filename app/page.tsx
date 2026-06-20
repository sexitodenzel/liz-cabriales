import { Suspense } from "react"

import NuevosLanzamientos from "./components/NuevosLanzamientos"
import NailArtSection from "./components/NailArtSection"
import HomeTopSections from "./components/home/HomeTopSections"
import HomeHeroSkeleton from "./components/home/HomeHeroSkeleton"
import InstagramFeed from "./components/InstagramFeed"

export const revalidate = 60

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="site-container">
        <Suspense fallback={<HomeHeroSkeleton />}>
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
