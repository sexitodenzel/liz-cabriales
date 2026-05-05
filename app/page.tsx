import BrandDescription from "./components/BrandDescription"
import PillarCards from "./components/PillarCards"
import ShopByNailPolishColors from "./components/ShopByNailPolishColors"
import HeroSlider from "./components/hero/HeroSlider"
import Footer from "./components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-[1460px] px-6">
        <HeroSlider />
        <div className="h-16 shrink-0" aria-hidden />
        <BrandDescription />
        <div className="h-16 shrink-0" aria-hidden />
        <PillarCards />
        <ShopByNailPolishColors />
      </div>
      <Footer />
    </main>
  )
}
