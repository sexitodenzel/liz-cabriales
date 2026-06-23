import { Suspense } from "react"

import NuevosLanzamientos from "./components/NuevosLanzamientos"
import OfertasHome from "./components/OfertasHome"
import NailArtSection from "./components/NailArtSection"
import HomeHeroTriCards from "./components/home/HomeHeroTriCards"
import HomeTopSections from "./components/home/HomeTopSections"
import HomeSpotlightSection from "./components/home/HomeSpotlightSection"
import InstagramFeed from "./components/InstagramFeed"

export const revalidate = 60

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <HomeHeroTriCards />
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
        <OfertasHome />
      </Suspense>
      <Suspense fallback={null}>
        <NuevosLanzamientos />
      </Suspense>
      <Suspense fallback={null}>
        <HomeSpotlightSection />
      </Suspense>
      <InstagramFeed />
    </main>
  )
}
