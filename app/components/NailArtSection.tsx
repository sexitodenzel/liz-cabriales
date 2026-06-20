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
  const productChips = post.linked_products.slice(0, 3)

  return (
    <Link
      href={`/nail-art/${post.slug}`}
      className="group flex flex-col gap-3"
    >
      <div className="relative overflow-hidden rounded-xl bg-neutral-100" style={{ aspectRatio: "3/4" }}>
        <Image
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-[family-name:var(--font-playfair),serif] text-[15px] font-medium italic leading-snug text-[#111] transition-colors group-hover:text-[#a8862f]">
          {post.title}
        </h3>
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
            {post.linked_products.length > 3 && (
              <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[10px] font-medium text-neutral-400">
                +{post.linked_products.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function NailArtSection() {
  const posts = await getNailArtPosts(6)
  if (posts.length === 0) return null

  return (
    <section className="bg-white py-20 text-black">
      <div>

        {/* Header */}
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]">
              Inspiración
            </p>
            <h2 className="font-[family-name:var(--font-playfair),serif] text-[clamp(32px,4vw,52px)] font-medium leading-[1.05] tracking-[-0.01em] text-[#111]">
              Nail Art
            </h2>
            <div className="mt-5 h-0.5 w-16 rounded-sm bg-[#c9a84c]" aria-hidden />
          </div>
          <Link
            href="/nail-art"
            className="group mb-1 inline-flex shrink-0 items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a8862f]"
          >
            Ver todos
            <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
              <ArrowCta />
            </span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {posts.map((post) => (
            <NailArtCard key={post.id} post={post} />
          ))}
        </div>

      </div>
    </section>
  )
}
