import HeroSlider from "../hero/HeroSlider"
import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"

export default async function HomeHero() {
  const { heroSlides } = await getLandingPageDataCached()
  return <HeroSlider slides={heroSlides} />
}
