import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getNailArtPostBySlug } from "@/lib/supabase/nail-art"
import Breadcrumb from "@/components/shared/Breadcrumb"

const NAIL_PLACEHOLDERS = [
  "https://picsum.photos/seed/nails1/800/1067",
  "https://picsum.photos/seed/nails2/800/1067",
  "https://picsum.photos/seed/nails3/800/1067",
  "https://picsum.photos/seed/nails4/800/1067",
  "https://picsum.photos/seed/nails5/800/1067",
  "https://picsum.photos/seed/nails6/800/1067",
]

function pickPlaceholder(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return NAIL_PLACEHOLDERS[hash % NAIL_PLACEHOLDERS.length]
}

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function NailArtDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await getNailArtPostBySlug(slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="site-container pt-5 pb-16">

        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Nail Art", href: "/nail-art" },
            { label: post.title },
          ]}
        />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">

          {/* Imagen de portada */}
          <div className="relative overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "3/4" }}>
            <Image
              src={post.cover_image || pickPlaceholder(post.slug)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 45vw"
              priority
            />
          </div>

          {/* Contenido */}
          <div className="flex flex-col gap-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
                Nail Art
              </p>
              <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,3.5vw,48px)] font-medium italic leading-[1.1] tracking-[-0.01em] text-[#111]">
                {post.title}
              </h1>
              {post.description && (
                <p className="mt-5 text-[14px] leading-[1.85] text-[#6b6b6b]">
                  {post.description}
                </p>
              )}
            </div>

            {/* Productos usados */}
            {post.linked_products.length > 0 && (
              <div>
                <div className="mb-5 h-px bg-[#ececec]" aria-hidden />
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
                  Productos que usamos
                </p>
                <div className="flex flex-col gap-4">
                  {post.linked_products.map((lp) => {
                    const thumbUrl = lp.product.images?.[0] ?? null
                    return (
                      <div key={lp.id} className="flex items-start gap-4">
                        {/* Miniatura */}
                        <Link
                          href={`/tienda/${lp.product.slug}`}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 transition-opacity hover:opacity-80"
                        >
                          <Image
                            src={thumbUrl || `https://picsum.photos/seed/${lp.product.slug}/64/64`}
                            alt={lp.product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </Link>

                        {/* Info */}
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <Link
                            href={`/tienda/${lp.product.slug}`}
                            className="text-[13px] font-semibold text-[#111] transition-colors hover:text-[#a8862f] truncate"
                          >
                            {lp.product.name}
                          </Link>
                          {lp.usage_description && (
                            <p className="text-[12px] leading-relaxed text-[#8a8a8a]">
                              {lp.usage_description}
                            </p>
                          )}
                          <Link
                            href={`/tienda/${lp.product.slug}`}
                            className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a8862f] transition-opacity hover:opacity-70"
                          >
                            Ver en tienda
                            <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" className="h-2.5 w-4" aria-hidden>
                              <path d="M0 6 H18 M13 1 L18 6 L13 11" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Volver */}
            <div className="mt-2">
              <div className="mb-6 h-px bg-[#ececec]" aria-hidden />
              <Link
                href="/nail-art"
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] transition-colors hover:text-[#a8862f]"
              >
                <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" className="h-3 w-[18px] rotate-180" aria-hidden>
                  <path d="M0 6 H18 M13 1 L18 6 L13 11" />
                </svg>
                Ver todos
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
