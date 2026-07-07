import { Suspense } from "react"

import HomeHeroTriCards from "./components/home/HomeHeroTriCards"
import CategoriasSection from "./components/home/CategoriasSection"
import DestacadosSection from "./components/home/DestacadosSection"
import HomeTopSections from "./components/home/HomeTopSections"
import AcademiaEventos from "./components/home/AcademiaEventos"
import NailArtSection from "./components/NailArtSection"
import HomeSpotlightSection from "./components/home/HomeSpotlightSection"
import InstagramFeed from "./components/InstagramFeed"
import InView from "./components/ui/motion/in-view"

export const revalidate = 60

/* Orden narrativo de la landing:
   hero (3 pilares) → marcas → en oferta/nuevos/best sellers → compra por
   categoría → academia/eventos → inspiración → historia → instagram. */

export default function Home() {
  return (
    <main className="min-h-screen bg-ivory text-ink">
      <h1 className="sr-only">
        Liz Cabriales — Academia y distribuidora profesional de uñas
      </h1>
      <HomeHeroTriCards />
      <Suspense fallback={<div className="h-10 shrink-0 md:h-12" aria-hidden />}>
        <HomeTopSections />
      </Suspense>
      <div className="site-container">
        <InView>
          <Suspense fallback={null}>
            <DestacadosSection />
          </Suspense>
        </InView>
        <InView>
          <Suspense fallback={null}>
            <CategoriasSection />
          </Suspense>
        </InView>
      </div>
      <div className="site-container">
        <InView>
          <AcademiaEventos />
        </InView>
        <InView>
          <Suspense fallback={null}>
            <NailArtSection />
          </Suspense>
        </InView>
      </div>
      <Suspense fallback={null}>
        <HomeSpotlightSection />
      </Suspense>
      <InstagramFeed />
    </main>
  )
}
