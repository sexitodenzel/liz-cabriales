import BrandDescription from "../BrandDescription"
import { getLandingPageDataCached } from "@/lib/supabase/landing-slots"

export default async function HomeSpotlightSection() {
  const { slots } = await getLandingPageDataCached()

  return (
    <div className="site-container">
      <BrandDescription photoUrl={slots["brand_photo"]} />
    </div>
  )
}
