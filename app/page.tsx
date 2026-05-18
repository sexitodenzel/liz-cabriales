import BrandDescription from "./components/BrandDescription"
import NuevosLanzamientos from "./components/NuevosLanzamientos"
import PillarStage from "./components/PillarStage"
import ShopByNailPolishColors from "./components/ShopByNailPolishColors"
import HeroSlider from "./components/hero/HeroSlider"
import InstagramFeed from "./components/InstagramFeed"
import Footer from "./components/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-black">
      <div className="mx-auto w-full max-w-[1460px] px-6">
        <HeroSlider />
        <div className="h-16 shrink-0" aria-hidden />
        <BrandDescription />
        <div className="h-16 shrink-0" aria-hidden />
        <PillarStage />
        <ShopByNailPolishColors />
      </div>
      <NuevosLanzamientos />
      <InstagramFeed />
      <Footer />
    </main>
  )
}
