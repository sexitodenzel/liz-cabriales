import { Suspense } from "react"

import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import {
  HOME_TRI_FALLBACKS,
  HOME_TRI_SLOT_KEYS,
} from "@/lib/media-slots"
import HomeHeroTriCards from "./components/home/HomeHeroTriCards"
import CategoriasSection from "./components/home/CategoriasSection"
import DestacadosSection from "./components/home/DestacadosSection"
import HomeTopSections from "./components/home/HomeTopSections"
import NailArtSection from "./components/NailArtSection"
import InstagramFeed from "./components/InstagramFeed"
import InView from "./components/ui/motion/in-view"

export const revalidate = 60

/* Orden narrativo de la landing:
   hero (3 pilares) → marcas → en oferta/nuevos/best sellers → compra por
   categoría → inspiración → instagram. */

export default async function Home() {
  const triImages = await getOrderedSlotUrls(
    [...HOME_TRI_SLOT_KEYS],
    HOME_TRI_FALLBACKS
  )

  return (
    <main className="min-h-screen bg-ivory text-ink">
      <h1 className="sr-only">
        Liz Cabriales — Academia y distribuidora profesional de uñas
      </h1>
      <HomeHeroTriCards images={triImages} />
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
          <Suspense fallback={null}>
            <NailArtSection />
          </Suspense>
        </InView>
      </div>
      <InstagramFeed />
    </main>
  )
}
