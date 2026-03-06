"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, Navigation } from "swiper/modules"

import "swiper/css"
import "swiper/css/pagination"
import "swiper/css/navigation"

export default function HeroSlider() {

return (

<>
<section className="h-[80vh] px-6">
  <div className="h-full max-w-[1400px]  mx-auto rounded-md overflow-hidden">

    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 4000 }}
      loop={true}
      pagination={{ clickable: true }}
      navigation
      speed={900}
      className="h-full"
    >

      {/* SLIDE 1 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1604654894610-df63bc536371"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Kits Profesionales
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Comprar ahora
            </button>
          </div>
        </div>
      </SwiperSlide>

      {/* SLIDE 2 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1583001809873-a128495da465"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Masterclass Nacional
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Ver detalles
            </button>
          </div>
        </div>
      </SwiperSlide>

      {/* SLIDE 3 */}
      <SwiperSlide>
        <div className="relative h-full">
          <img
            src="https://images.unsplash.com/photo-1596704017254-9756e98c3c54"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-4xl font-light tracking-wide">
              Envíos a toda la República
            </h2>
            <div className="w-16 h-[1px] bg-[#C6A75E] mt-6"></div>
            <button className="mt-10 px-8 py-3 border border-white hover:border-[#C6A75E] hover:text-[#C6A75E] transition-all">
              Explorar productos
            </button>
          </div>
        </div>
      </SwiperSlide>

    </Swiper>

  </div>
</section>


</>

)

}