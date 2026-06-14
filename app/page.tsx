import BrandDescription from "./components/BrandDescription"
import NuevosLanzamientos from "./components/NuevosLanzamientos"
import PillarStage from "./components/PillarStage"
import ShopByNailPolishColors from "./components/ShopByNailPolishColors"
import HeroSlider from "./components/hero/HeroSlider"
import InstagramFeed from "./components/InstagramFeed"
import { getLandingSlots, getHeroSlides } from "@/lib/supabase/landing-slots"

export const revalidate = 60

export default async function Home() {
  const [slots, heroSlides] = await Promise.all([getLandingSlots(), getHeroSlides()])

  const pillarImages = {
    dist: [
      slots["pillar_dist_1"] ?? "",
      slots["pillar_dist_2"] ?? "",
      slots["pillar_dist_3"] ?? "",
    ] as [string, string, string],
    acad: [
      slots["pillar_acad_1"] ?? "",
      slots["pillar_acad_2"] ?? "",
      slots["pillar_acad_3"] ?? "",
    ] as [string, string, string],
    serv: [
      slots["pillar_serv_1"] ?? "",
      slots["pillar_serv_2"] ?? "",
      slots["pillar_serv_3"] ?? "",
    ] as [string, string, string],
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-[1460px] px-6">
        <HeroSlider slides={heroSlides} />

        <div className="h-16 shrink-0" aria-hidden />
        <BrandDescription photoUrl={slots["brand_photo"]} />
        <div className="h-16 shrink-0" aria-hidden />
        <PillarStage pillarImages={pillarImages} />
        <ShopByNailPolishColors />
      </div>
      <NuevosLanzamientos />
      <InstagramFeed />
    </main>
  )
}
