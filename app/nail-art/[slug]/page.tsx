import Link from "next/link"
import { notFound } from "next/navigation"
import SmoothImage from "@/app/components/shared/SmoothImage"
import {
  getNailArtPostBySlug,
  userLikedPost,
} from "@/lib/supabase/nail-art"
import { nailArtImageApiPath } from "@/lib/nail-art-image"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { getAuthUser } from "@/lib/supabase/auth-server"
import NailArtLikeButton from "../NailArtLikeButton"
import NailArtFavoriteButton from "../NailArtFavoriteButton"

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso))
  } catch {
    return ""
  }
}

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export default async function NailArtDetailPage({ params }: Props) {
  const { slug } = await params
  const post = await getNailArtPostBySlug(slug)
  if (!post) notFound()

  const user = await getAuthUser()
  const liked = user ? await userLikedPost(post.id, user.id) : false
  const author = post.author_display_name || (post.is_editorial ? "Liz Cabriales" : "Usuario")

  return (
    <main className="min-h-screen bg-ivory text-black">
      <div className="site-container pt-5 pb-16">
        <Breadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Nail Art", href: "/nail-art" },
            { label: post.title },
          ]}
        />

        {/* Layout tipo Instagram: imagen grande + meta a la derecha */}
        <div className="mx-auto mt-4 grid max-w-5xl overflow-hidden rounded-2xl border border-neutral-200/80 bg-white lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative min-h-[320px] bg-neutral-100 lg:min-h-[560px]">
            <SmoothImage
              src={nailArtImageApiPath(post.id)}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
            />
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-5">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-[#111]">{author}</p>
                {post.is_editorial && (
                  <span className="mt-1.5 inline-block rounded-full bg-[#fdfaf3] px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a6d26]">
                    Elaborado por Nosotros
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <NailArtFavoriteButton postId={post.id} />
                <NailArtLikeButton
                  postId={post.id}
                  initialCount={post.likes_count}
                  initialLiked={liked}
                  isLoggedIn={Boolean(user)}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-5">
              {post.description && (
                <p className="text-[14px] leading-[1.75] text-[#444]">
                  <span className="font-semibold text-[#111]">{author} </span>
                  {post.description}
                </p>
              )}

              {post.linked_products.length > 0 && (
                <div className="mt-8">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8862f]">
                    Productos usados
                  </p>
                  <ul className="flex flex-col gap-3">
                    {post.linked_products.map((lp) => {
                      const thumbUrl = lp.product.images?.[0] ?? null
                      return (
                        <li key={lp.id} className="flex items-start gap-3">
                          <Link
                            href={`/tienda/${lp.product.slug}`}
                            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100"
                          >
                            <SmoothImage
                              src={thumbUrl || `https://picsum.photos/seed/${lp.product.slug}/64/64`}
                              alt={lp.product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              href={`/tienda/${lp.product.slug}`}
                              className="text-[13px] font-semibold text-[#111] hover:text-[#a8862f]"
                            >
                              {lp.product.name}
                            </Link>
                            {lp.usage_description && (
                              <p className="mt-0.5 text-[12px] text-neutral-500">
                                {lp.usage_description}
                              </p>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-4">
              <time
                dateTime={post.created_at}
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400"
              >
                {formatDate(post.created_at)}
              </time>
              <div className="mt-4">
                <Link
                  href="/nail-art"
                  className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a8a8a] hover:text-[#a8862f]"
                >
                  ← Ver todos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
