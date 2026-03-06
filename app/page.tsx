import Navbar from "./components/navbar/Navbar"
import HeroSlider from "./components/hero/HeroSlider"

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Navbar />
      <HeroSlider />
    </main>
  )
}