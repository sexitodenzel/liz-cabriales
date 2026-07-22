import Link from "next/link"
import SmoothImage from "@/app/components/shared/SmoothImage"
import { getBlogPosts } from "@/lib/supabase/blog"
import type { BlogPost } from "@/lib/supabase/blog"
import { getOrderedSlotUrls } from "@/lib/supabase/landing-slots"
import {
  BLOG_HERO_FALLBACKS,
  BLOG_HERO_SLOT_KEYS,
} from "@/lib/media-slots"
import Breadcrumb from "@/components/shared/Breadcrumb"
import {
  BLOG_CATEGORIES,
  getCategoryByLabel,
  getCategoryBySlug,
  type BlogCategory,
} from "@/lib/blog-categories"

export const revalidate = 60

const BLOG_PLACEHOLDERS = [
  "https://picsum.photos/seed/blog1/800/533",
  "https://picsum.photos/seed/blog2/800/533",
  "https://picsum.photos/seed/blog3/800/533",
  "https://picsum.photos/seed/blog4/800/533",
  "https://picsum.photos/seed/blog5/800/533",
  "https://picsum.photos/seed/blog6/800/533",
]

function pickPlaceholder(slug: string) {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  return BLOG_PLACEHOLDERS[hash % BLOG_PLACEHOLDERS.length]
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function ArrowCta() {
  return (
    <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4"
      strokeLinecap="square" aria-hidden className="h-3 w-[18px] shrink-0">
      <path d="M0 6 H18 M13 1 L18 6 L13 11" />
    </svg>
  )
}

function CategoryTag({ label }: { label: string }) {
  const category = getCategoryByLabel(label)
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${category?.tag ?? "border-neutral-200 bg-neutral-100 text-neutral-500"}`}>
      {label}
    </span>
  )
}

/** Card estándar (portada + tag + título + extracto), estilo academia/tienda. */
function BlogCard({ post }: { post: BlogPost }) {
  const coverImage = post.cover_image || pickPlaceholder(post.slug)

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "3/2" }}>
        <SmoothImage
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <CategoryTag label={post.category} />
          <span className="text-[11px] text-[#6b6b6b]">{formatDate(post.published_at)}</span>
        </div>
        <h3 className="font-[family-name:var(--font-playfair),serif] text-[19px] font-medium leading-snug text-[#111] transition-colors group-hover:text-[#8a6d26]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-[#6b6b6b]">
            {post.excerpt}
          </p>
        )}
        <span className="group/cta mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d26]">
          Leer más
          <span className="transition-transform duration-[280ms] ease-out group-hover/cta:translate-x-1">
            <ArrowCta />
          </span>
        </span>
      </div>
    </Link>
  )
}

/** Artículo destacado: imagen grande a la izquierda, texto a la derecha. */
function FeaturedCard({ post }: { post: BlogPost }) {
  const coverImage = post.cover_image || pickPlaceholder(post.slug)

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8"
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "16/11" }}>
        <SmoothImage
          src={coverImage}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>

      <div className="flex flex-col justify-center gap-3">
        <div className="flex items-center gap-3">
          <CategoryTag label={post.category} />
          <span className="text-[11px] text-[#6b6b6b]">{formatDate(post.published_at)}</span>
        </div>
        <h3 className="font-[family-name:var(--font-playfair),serif] text-[clamp(22px,2.4vw,30px)] font-medium leading-[1.15] text-[#111] transition-colors group-hover:text-[#8a6d26]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="max-w-[46ch] text-[14px] leading-relaxed text-[#6b6b6b]">
            {post.excerpt}
          </p>
        )}
        <span className="group/cta mt-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d26]">
          Leer artículo
          <span className="transition-transform duration-[280ms] ease-out group-hover/cta:translate-x-1">
            <ArrowCta />
          </span>
        </span>
      </div>
    </Link>
  )
}

/** Sección editorial de una categoría: encabezado + destacado + fila de 3. */
function CategorySection({
  category,
  posts,
}: {
  category: BlogCategory
  posts: BlogPost[]
}) {
  if (posts.length === 0) return null
  const [featured, ...rest] = posts
  const row = rest.slice(0, 3)

  return (
    <section className="border-t border-[#ececec] pt-12">
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]">
            {category.label}
          </h2>
          <p className="mt-2 text-[12px] text-[#8a8a8a]">{category.tagline}</p>
        </div>
        <Link
          href={`/blog?categoria=${category.slug}`}
          className="group inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6d26]"
        >
          Ver todos
          <span className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1">
            <ArrowCta />
          </span>
        </Link>
      </div>

      <FeaturedCard post={featured} />

      {row.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {row.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}

/** Banda hero: 3 imágenes con el título sobre el panel central. */
function HeroBand({ images }: { images: string[] }) {
  const [left, center, right] = [
    images[0] || BLOG_HERO_FALLBACKS[0],
    images[1] || BLOG_HERO_FALLBACKS[1],
    images[2] || BLOG_HERO_FALLBACKS[2],
  ]

  return (
    <section className="relative -mx-[var(--site-px)] mb-14 grid grid-cols-1 sm:grid-cols-3">
      {/* Imagen izquierda — solo en pantallas medianas+ */}
      <div className="relative hidden aspect-[3/4] sm:block">
        <SmoothImage
          src={left}
          alt=""
          fill
          className="object-cover"
          sizes="33vw"
          priority
        />
      </div>

      {/* Panel central con imagen + velo marfil + título */}
      <div className="relative aspect-[4/3] sm:aspect-[3/4]">
        <SmoothImage
          src={center}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
          priority
        />
        <div className="absolute inset-0 bg-ivory/80 backdrop-blur-[1px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8a6d26]">
            Liz Cabriales
          </span>
          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(40px,6vw,72px)] font-medium leading-[1.02] tracking-[-0.01em] text-[#111]">
            Blog
          </h1>
          <p className="mt-4 max-w-[320px] text-[13px] leading-relaxed text-[#5a5a5a]">
            Nail art, bioseguridad, tendencias y novedades — de parte del equipo de Liz Cabriales.
          </p>
          <div className="mt-5 h-0.5 w-14 rounded-sm bg-[#c6a75e]" aria-hidden />
        </div>
      </div>

      {/* Imagen derecha — solo en pantallas medianas+ */}
      <div className="relative hidden aspect-[3/4] sm:block">
        <SmoothImage
          src={right}
          alt=""
          fill
          className="object-cover"
          sizes="33vw"
          priority
        />
      </div>
    </section>
  )
}

/** Círculos de categoría (nav OPI). Portada = primera imagen de la categoría. */
function CategoryCircles({
  covers,
  activeSlug,
}: {
  covers: Map<string, string>
  activeSlug: string | null
}) {
  return (
    <nav aria-label="Categorías del blog" className="mb-16">
      <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6 sm:gap-x-12">
        {BLOG_CATEGORIES.map((cat) => {
          const isActive = activeSlug === cat.slug
          const cover =
            covers.get(cat.label) ??
            `https://picsum.photos/seed/${cat.slug}/200/200`
          return (
            <li key={cat.slug}>
              <Link
                href={isActive ? "/blog" : `/blog?categoria=${cat.slug}`}
                className="group flex w-20 flex-col items-center gap-2.5 text-center"
              >
                <span
                  className={`relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-ivory transition-all sm:h-20 sm:w-20 ${
                    isActive
                      ? "ring-[#8a6d26]"
                      : "ring-transparent group-hover:ring-[#c6a75e]"
                  }`}
                >
                  <SmoothImage
                    src={cover}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    sizes="80px"
                  />
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                    isActive ? "text-[#8a6d26]" : "text-[#3a3a3a] group-hover:text-[#8a6d26]"
                  }`}
                >
                  {cat.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type Props = { searchParams: Promise<{ categoria?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const { categoria } = await searchParams
  const activeCategory = getCategoryBySlug(categoria)
  const [allPosts, heroImages] = await Promise.all([
    getBlogPosts(),
    getOrderedSlotUrls([...BLOG_HERO_SLOT_KEYS], BLOG_HERO_FALLBACKS),
  ])

  // Agrupa por categoría (label) conservando el orden ya ordenado de la query.
  const byCategory = new Map<string, BlogPost[]>()
  for (const post of allPosts) {
    const list = byCategory.get(post.category)
    if (list) list.push(post)
    else byCategory.set(post.category, [post])
  }

  // Portada de cada círculo = primera publicación de esa categoría.
  const covers = new Map<string, string>()
  for (const [label, list] of byCategory) {
    const cover = list[0]?.cover_image || (list[0] && pickPlaceholder(list[0].slug))
    if (cover) covers.set(label, cover)
  }

  const activePosts = activeCategory
    ? byCategory.get(activeCategory.label) ?? []
    : []

  return (
    <main className="min-h-screen bg-ivory text-black">
      <div className="site-container pt-5 pb-20">
        <Breadcrumb items={[{ label: "Inicio", href: "/" }, { label: "Blog" }]} />

        <HeroBand images={heroImages} />

        <CategoryCircles covers={covers} activeSlug={activeCategory?.slug ?? null} />

        {activeCategory ? (
          /* ── Vista filtrada: grid de la categoría seleccionada ─────────── */
          <section>
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-playfair),serif] text-[26px] font-medium leading-none text-[#111]">
                  {activeCategory.label}
                </h2>
                <p className="mt-2 text-[12px] text-[#8a8a8a]">{activeCategory.tagline}</p>
              </div>
              <Link
                href="/blog"
                className="inline-flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b] transition-colors hover:text-[#8a6d26]"
              >
                <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" className="h-3 w-[18px] rotate-180" aria-hidden>
                  <path d="M0 6 H18 M13 1 L18 6 L13 11" />
                </svg>
                Todo el blog
              </Link>
            </div>

            {activePosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-[14px] text-neutral-400">
                  Aún no hay publicaciones en «{activeCategory.label}».
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {activePosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>
        ) : allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[14px] text-neutral-400">
              Próximamente — estamos preparando contenido increíble.
            </p>
          </div>
        ) : (
          /* ── Vista principal: una sección editorial por categoría ──────── */
          <div className="flex flex-col gap-16">
            {BLOG_CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.slug}
                category={cat}
                posts={byCategory.get(cat.label) ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
