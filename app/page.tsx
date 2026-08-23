import { Suspense } from "react"

import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import {
  HOME_TRI_FALLBACKS,
  HOME_TRI_SLOT_KEYS,
} from "@/lib/media-slots"
import HomeHeroTriCards from "./components/home/HomeHeroTriCards"
import CategoriasSection from "./components/home/CategoriasSection"
import AcademiaShowcase from "./components/home/AcademiaShowcase"
import HomeTopSections from "./components/home/HomeTopSections"
import NailArtSection from "./components/NailArtSection"
import BeforeAfterSection from "./components/home/BeforeAfterSection"
import HomeVlogSection from "./components/home/HomeVlogSection"
import InstagramFeed from "./components/InstagramFeed"

// Dinámica en cada request: evita que el build pre-genere esta página llamando
// a Supabase (las queries tardaban >60s y tumbaban el deploy por timeout). El
// sitio se sirve como antes, con datos frescos. El cache rápido se retoma luego.
export const dynamic = "force-dynamic"

/* Orden narrativo de la landing:
   hero (3 pilares) → compra por categoría → marcas → inspiración →
   instagram. */

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
      <div className="site-container">
        <Suspense fallback={null}>
          <CategoriasSection />
        </Suspense>
      </div>
      <Suspense fallback={<div className="h-10 shrink-0 md:h-12" aria-hidden />}>
        <HomeTopSections />
      </Suspense>
      <Suspense fallback={null}>
        <AcademiaShowcase />
      </Suspense>
      <Suspense fallback={null}>
        <NailArtSection />
      </Suspense>
      <Suspense fallback={null}>
        <BeforeAfterSection />
      </Suspense>
      <div className="site-container">
        <Suspense fallback={null}>
          <HomeVlogSection />
        </Suspense>
      </div>
      <InstagramFeed />
    </main>
  )
}
