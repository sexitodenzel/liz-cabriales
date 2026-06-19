import BrandDescription from "../BrandDescription"
import PillarStage from "../PillarStage"
import HeroSlider from "../hero/HeroSlider"
import ShopByNailPolishColors from "../ShopByNailPolishColors"
import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"

export default async function HomeTopSections() {
  const { slots, heroSlides } = await getLandingPageDataCached()

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
    <>
      <HeroSlider slides={heroSlides} />
      <div className="h-16 shrink-0" aria-hidden />
      <BrandDescription photoUrl={slots["brand_photo"]} />
      <div className="h-16 shrink-0" aria-hidden />
      <PillarStage pillarImages={pillarImages} />
      <ShopByNailPolishColors />
    </>
  )
}
