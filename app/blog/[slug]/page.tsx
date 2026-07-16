import Link from "next/link"
import { notFound } from "next/navigation"
import SmoothImage from "@/app/components/shared/SmoothImage"
import RichText from "@/components/shared/RichText"
import { getBlogPostBySlug, getBlogPosts } from "@/lib/supabase/blog"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { getCategoryByLabel } from "@/lib/blog-categories"

export const revalidate = 60

const BLOG_PLACEHOLDERS = [
  "https://picsum.photos/seed/blog1/1200/675",
  "https://picsum.photos/seed/blog2/1200/675",
  "https://picsum.photos/seed/blog3/1200/675",
  "https://picsum.photos/seed/blog4/1200/675",
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

type Props = { params: Promise<{ slug: string }> }

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const category = getCategoryByLabel(post.category)

  // Relacionados: misma categoría, excluyendo el actual.
  const related = (await getBlogPosts({ category: post.category, limit: 4 }))
    .filter((p) => p.id !== post.id)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="site-container pt-5 pb-16">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: post.title },
          ]}
        />

        <article className="mx-auto max-w-[760px]">
          {/* Encabezado */}
          <div className="mb-6 flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${category?.tag ?? "border-neutral-200 bg-neutral-100 text-neutral-500"}`}>
              {post.category}
            </span>
            <span className="text-[12px] text-[#6b6b6b]">{formatDate(post.published_at)}</span>
          </div>

          <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-[-0.01em] text-[#111]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-[16px] leading-[1.7] text-[#6b6b6b]">
              {post.excerpt}
            </p>
          )}

          {/* Portada */}
          <div className="relative mt-8 overflow-hidden rounded-2xl bg-neutral-100" style={{ aspectRatio: "16/9" }}>
            <SmoothImage
              src={post.cover_image || pickPlaceholder(post.slug)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 760px"
              priority
            />
          </div>

          {/* Cuerpo */}
          {post.body && (
            <div className="mt-10">
              <RichText text={post.body} />
            </div>
          )}

          {/* Productos usados */}
          {post.linked_products.length > 0 && (
            <div className="mt-12">
              <div className="mb-5 h-px bg-[#ececec]" aria-hidden />
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d26]">
                Productos que usamos
              </p>
              <div className="flex flex-col gap-4">
                {post.linked_products.map((lp) => {
                  const thumbUrl = lp.product.images?.[0] ?? null
                  return (
                    <div key={lp.id} className="flex items-start gap-4">
                      <Link
                        href={`/tienda/${lp.product.slug}`}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 transition-opacity hover:opacity-80"
                      >
                        <SmoothImage
                          src={thumbUrl || `https://picsum.photos/seed/${lp.product.slug}/64/64`}
                          alt={lp.product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </Link>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <Link
                          href={`/tienda/${lp.product.slug}`}
                          className="text-[13px] font-semibold text-[#111] transition-colors hover:text-[#8a6d26] truncate"
                        >
                          {lp.product.name}
                        </Link>
                        {lp.usage_description && (
                          <p className="text-[12px] leading-relaxed text-[#6b6b6b]">
                            {lp.usage_description}
                          </p>
                        )}
                        <Link
                          href={`/tienda/${lp.product.slug}`}
                          className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#8a6d26] transition-opacity hover:opacity-70"
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
          <div className="mt-12">
            <div className="mb-6 h-px bg-[#ececec]" aria-hidden />
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6b6b6b] transition-colors hover:text-[#8a6d26]"
            >
              <svg viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" className="h-3 w-[18px] rotate-180" aria-hidden>
                <path d="M0 6 H18 M13 1 L18 6 L13 11" />
              </svg>
              Ver todos
            </Link>
          </div>
        </article>

        {/* Relacionados */}
        {related.length > 0 && (
          <div className="mx-auto mt-16 max-w-[1100px]">
            <h2 className="mb-6 font-[family-name:var(--font-playfair),serif] text-[22px] font-medium text-[#111]">
              Más en {post.category}
            </h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col gap-3">
                  <div className="relative overflow-hidden rounded-xl bg-neutral-100" style={{ aspectRatio: "3/2" }}>
                    <SmoothImage
                      src={p.cover_image || pickPlaceholder(p.slug)}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair),serif] text-[16px] font-medium leading-snug text-[#111] transition-colors group-hover:text-[#8a6d26]">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
