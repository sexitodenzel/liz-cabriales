"use client"

const BRANDS = [
  "Exotic",
  "Staleks",
  "Lúa",
  "Gmi",
  "Lovely",
  "Alfatech",
  "Golden Nail's",
  "Tuttimani",
  "Fantasy",
  "Productos de Spa",
  "Herramientas Podos",
]

export default function BrandsSlider() {
  const items = [...BRANDS, ...BRANDS]

  return (
    <section className="bg-white py-5">
      <div className="max-w-[1400px] mx-auto px-6">
        <p className="text-sm font-light text-gray-400 mb-6 text-center">
          Nuestras marcas
        </p>

        <div className="brands-marquee overflow-hidden">
          <div className="brands-marquee-track flex items-center gap-6 md:gap-10">
            {items.map((brand, index) => (
              <div
                key={`${brand}-${index}`}
                className="flex items-center justify-center px-6 md:px-10 py-3 md:py-3 rounded-full bg-gray-100 text-sm md:text-base font-light tracking-wide text-gray-700 whitespace-nowrap border border-gray-100"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .brands-marquee {
          position: relative;
        }

        .brands-marquee-track {
          animation: brands-scroll-left 25s linear infinite;
          will-change: transform;
        }

        .brands-marquee:hover .brands-marquee-track {
          animation-play-state: paused;
        }

        @keyframes brands-scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  )
}
