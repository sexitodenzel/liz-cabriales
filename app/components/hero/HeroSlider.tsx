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
        </div>
      </SwiperSlide>

    </Swiper>

  </div>
</section>


</>

)

}