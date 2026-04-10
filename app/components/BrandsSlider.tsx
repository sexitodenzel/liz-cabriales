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
    <section className="border-b border-t border-neutral-100 bg-white py-5">
      <div className="mx-auto max-w-[1400px] px-6">
        <p className="mb-6 text-center text-[10px] font-light uppercase tracking-[0.3em] text-neutral-400">
          Nuestras marcas
        </p>

        <div className="brands-marquee overflow-hidden">
          <div className="brands-marquee-track flex items-center gap-6 md:gap-10">
            {items.map((brand, index) => (
              <div
                key={`${brand}-${index}`}
                className="flex cursor-default items-center justify-center whitespace-nowrap rounded-full border border-[#C6A75E]/30 bg-white px-6 py-3 text-sm font-light tracking-wide text-[#0a0a0a] transition-colors hover:border-[#C6A75E] hover:text-[#C6A75E] md:px-10 md:py-3 md:text-base"
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
