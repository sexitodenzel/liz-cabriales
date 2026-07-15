import Link from "next/link"

import SmoothImage from "@/app/components/shared/SmoothImage"
import { getNailArtPosts } from "@/lib/supabase/nail-art"
import type { NailArtPost } from "@/lib/supabase/nail-art"
import SectionHeader from "@/app/components/ui/SectionHeader"

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

function NailArtCard({ post }: { post: NailArtPost }) {
  const coverImage = post.cover_image || pickPlaceholder(post.slug)
  const productChips = post.linked_products.slice(0, 3)

  return (
    <Link href={`/nail-art/${post.slug}`} className="group flex flex-col gap-3">
      <div
        className="relative overflow-hidden rounded-card bg-neutral-100"
        style={{ aspectRatio: "3/4" }}
      >
        <SmoothImage
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-display text-[15px] font-medium italic leading-snug text-ink transition-colors group-hover:text-gold">
          {post.title}
        </h3>
        {productChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {productChips.map((lp) => (
              <span
                key={lp.id}
                className="rounded-full border border-gold-soft/40 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-gold"
              >
                {lp.product.name}
              </span>
            ))}
            {post.linked_products.length > 3 && (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-medium text-ink-soft/70">
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
    <section className="py-12 md:py-16" aria-labelledby="home-nail-art-title">
      <SectionHeader
        id="home-nail-art-title"
        eyebrow="Inspiración"
        title="Nail Art"
        cta={{ href: "/nail-art", label: "Ver todos" }}
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {posts.map((post) => (
          <NailArtCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
