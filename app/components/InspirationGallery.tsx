"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

interface InspirationPost {
  id: string
  image_url: string
  category: string
  title: string
  description: string
  product_ids: string[]
}

const POSTS: InspirationPost[] = [
  {
    id: "1",
    image_url: "https://picsum.photos/seed/liz-nails-1/900/900",
    category: "Gel UV",
    title: "Gel UV rosa nude",
    description: "Look sofisticado con acabado brillante ideal para el día a día.",
    product_ids: ["prod-gel-uv-1"],
  },
  {
    id: "2",
    image_url: "https://picsum.photos/seed/liz-nails-2/600/800",
    category: "Nail Art",
    title: "Nail art minimalista",
    description: "Diseño delicado con detalles finos para un estilo elegante.",
    product_ids: ["prod-art-1", "prod-art-2"],
  },
  {
    id: "3",
    image_url: "https://picsum.photos/seed/liz-nails-3/600/800",
    category: "Acrílico",
    title: "Estructura acrílica almond",
    description: "Uñas alargadas con forma almond para un look estilizado.",
    product_ids: ["prod-acrilico-1"],
  },
  {
    id: "4",
    image_url: "https://picsum.photos/seed/liz-nails-4/600/800",
    category: "Manicure Natural",
    title: "Manicure natural glow",
    description: "Acabado natural que resalta el brillo saludable de la uña.",
    product_ids: ["prod-natural-1"],
  },
  {
    id: "5",
    image_url: "https://picsum.photos/seed/liz-nails-5/600/800",
    category: "Nail Art",
    title: "Nail art con brillo",
    description: "Toques de brillo para un look de noche moderno y llamativo.",
    product_ids: ["prod-art-3"],
  },
]

const FILTERS = ["Todos", "Gel UV", "Nail Art", "Acrílico", "Manicure Natural"] as const
type FilterValue = (typeof FILTERS)[number]

export default function InspirationGallery({ preview }: { preview?: boolean }) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("Todos")
  const [selectedPost, setSelectedPost] = useState<InspirationPost | null>(null)

  const filteredPosts = useMemo(() => {
    if (activeFilter === "Todos") {
      return POSTS
    }

    return POSTS.filter((post) => post.category === activeFilter)
  }, [activeFilter])

  const mainPost = filteredPosts[0] ?? null
  const sidePosts = filteredPosts.slice(1, 5)
  const isPreview = preview === true

  return (
    <section className="py-4">
      <div className="max-w-[1400px] mx-auto px-6">
        {isPreview ? (
          <>
            <div className=" mb-1">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
                Más de 10,000 clientas felices
              </h2>
            </div>
            <p className=" text-sm md:text-base text-gray-600 mb-4">
            Tag @lizcabriales o usa el hashtag #lizcabriales para ser incluido en nuestra galería!
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
                Nail Inspiration
              </h2>
            </div>
            <p className="text-center text-sm md:text-base text-gray-600 mb-10">
              Etiquétanos en Instagram como{" "}
              <span className="font-semibold text-gray-900">@lizcabriales</span> para aparecer en
              nuestra galería
            </p>
          </>
        )}

        {!isPreview && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900"
                  }`}
                >
                  {filter}
                </button>
              )
            })}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="text-center text-gray-500 text-sm">
            No hay looks en esta categoría todavía.
          </div>
        ) : (
          <div className="flex flex-row gap-2 h-[520px] md:h-[620px] lg:h-[660px]">
            <div className="grid grid-cols-2 gap-2 basis-1/2 h-full">
              {sidePosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="group relative h-full w-full overflow-hidden rounded-xl"
                >
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {!isPreview && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-left text-white">
                        <p className="text-[10px] uppercase tracking-[0.18em] mb-0.5 opacity-80">
                          {post.category}
                        </p>
                        <p className="text-xs font-medium line-clamp-2">{post.title}</p>
                      </div>
                    </>
                  )}
                </button>
              ))}
            </div>

            {mainPost && (
              <button
                type="button"
                onClick={() => setSelectedPost(mainPost)}
                className="group relative basis-1/2 h-full w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={mainPost.image_url}
                  alt={mainPost.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {!isPreview && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                      <p className="text-xs uppercase tracking-[0.18em] mb-1 opacity-80">
                        {mainPost.category}
                      </p>
                      <h3 className="text-lg md:text-xl font-semibold line-clamp-2">
                        {mainPost.title}
                      </h3>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {isPreview && (
          <div className="flex justify-center mt-5">
            <Link
              href="/inspiracion"
              className="inline-flex min-w-[320px] items-center justify-center px-11 py-3.5 rounded-md bg-black text-white text-[12px] font-medium hover:bg-gray-900 transition-colors">               
               Descubre looks de fans
            </Link>
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="relative max-w-5xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-72 md:h-full bg-black">
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8 flex flex-col justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">
                    {selectedPost.category}
                  </p>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Look del día</h3>
                  <p className="text-sm text-gray-700 mb-4">{selectedPost.description}</p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                    onClick={() => setSelectedPost(null)}
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    Ver productos relacionados
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
