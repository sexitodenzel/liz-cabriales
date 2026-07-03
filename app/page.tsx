import { Suspense } from "react"

import HomeHeroTriCards from "./components/home/HomeHeroTriCards"
import CategoriasSection from "./components/home/CategoriasSection"
import DestacadosSection from "./components/home/DestacadosSection"
import HomeTopSections from "./components/home/HomeTopSections"
import AcademiaEventos from "./components/home/AcademiaEventos"
import NailArtSection from "./components/NailArtSection"
import HomeSpotlightSection from "./components/home/HomeSpotlightSection"
import InstagramFeed from "./components/InstagramFeed"

export const revalidate = 60

/* Orden narrativo de la landing:
   hero (3 pilares) → marcas → compra por categoría → en oferta/nuevos/best
   sellers → academia/eventos → inspiración → historia → instagram. */

export default function Home() {
  return (
    <main className="min-h-screen bg-ivory text-ink">
      <HomeHeroTriCards />
      <Suspense fallback={<div className="h-10 shrink-0 md:h-12" aria-hidden />}>
        <HomeTopSections />
      </Suspense>
      <div className="site-container">
        <Suspense fallback={null}>
          <CategoriasSection />
        </Suspense>
        <Suspense fallback={null}>
          <DestacadosSection />
        </Suspense>
      </div>
      <div className="site-container">
        <AcademiaEventos />
        <Suspense fallback={null}>
          <NailArtSection />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <HomeSpotlightSection />
      </Suspense>
      <InstagramFeed />
    </main>
  )
}
