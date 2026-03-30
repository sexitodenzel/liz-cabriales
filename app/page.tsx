import HeroSlider from "./components/hero/HeroSlider"
import BrandsSlider from "./components/BrandsSlider"
import PromoCards from "./components/PromoCards"
import InspirationGallery from "./components/InspirationGallery"
import FeaturedKits from "./components/FeaturedKits"
import FeaturedColors from "./components/FeaturedColors"
import AcademyBanner from "./components/AcademyBanner"
import Testimonials from "./components/Testimonials"
import Benefits from "./components/Benefits"
import Footer from "./components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="max-w-[1460px] mx-auto w-full px-6">
        <HeroSlider />
        <BrandsSlider />
        <PromoCards />
        <InspirationGallery preview={true} />
        <FeaturedKits />
        <FeaturedColors />
        <AcademyBanner />
        <Testimonials />
        <Benefits />
      </div>
      <Footer />
    </main>
  )
}