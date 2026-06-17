import Image from "next/image"
import Link from "next/link"
import { getNailArtPosts } from "@/lib/supabase/nail-art"
import type { NailArtPost } from "@/lib/supabase/nail-art"

const NAIL_PLACEHOLDERS = [
  "https://picsum.photos/seed/nails1/400/533",
  "https://picsum.photos/seed/nails2/400/533",
  "https://picsum.photos/seed/nails3/400/533",
  "https://picsum.photos/seed/nails4/400/533",
  "https://picsum.photos/seed/nails5/400/533",
  "https://picsum.photos/seed/nails6/400/533",
]

function pickPlaceholder(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return NAIL_PLACEHOLDERS[hash % NAIL_PLACEHOLDERS.length]
}

export const revalidate = 60

function ArrowCta() {
  return (
    <svg
      viewBox="0 0 18 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      aria-hidden
      className="h-3 w-[18px] shrink-0"
    >
      <path d="M0 6 H18 M13 1 L18 6 L13 11" />
    </svg>
  )
}

function NailArtCard({ post }: { post: NailArtPost }) {
  const coverImage = post.cover_image || pickPlaceholder(post.slug)
  const productChips = post.linked_products.slice(0, 4)

  return (
    <Link href={`/nail-art/${post.slug}`} className="group flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "3/4" }}>
        <Image
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-playfair),serif] text-[17px] font-medium italic leading-snug text-[#111] transition-colors group-hover:text-[#a8862f]">
          {post.title}
        </h2>
        {post.description && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-[#8a8a8a]">
            {post.description}
          </p>
        )}
        {productChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {productChips.map((lp) => (
              <span
                key={lp.id}
                className="rounded-full border border-[#c9a84c]/40 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-[#a8862f]"
              >
                {lp.product.name}
              </span>
            ))}
            {post.linked_products.length > 4 && (
              <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400">
                +{post.linked_products.length - 4}
              </span>
            )}
          </div>
        )}
        <span className="group/cta mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
          Ver más
          <span className="transition-transform duration-[280ms] ease-out group-hover/cta:translate-x-1">
            <ArrowCta />
          </span>
        </span>
      </div>
    </Link>
  )
}

export default async function NailArtPage() {
  const posts = await getNailArtPosts()

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-[1400px] px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a8a8a] transition-colors hover:text-[#a8862f]"
          >
            <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" className="h-3 w-[18px] rotate-180" aria-hidden>
              <path d="M0 6 H18 M13 1 L18 6 L13 11" />
            </svg>
            Inicio
          </Link>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
            Inspiración
          </p>
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(36px,5vw,64px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
            Nail Art
          </h1>
          <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[14px] text-neutral-400">Próximamente — estamos preparando contenido increíble.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((post) => (
              <NailArtCard key={post.id} post={post} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
