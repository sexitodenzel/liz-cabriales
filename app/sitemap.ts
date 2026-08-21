import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"
import { getProducts } from "@/lib/supabase/products"
import { getPublishedCourses } from "@/lib/supabase/courses"
import { getBlogPosts } from "@/lib/supabase/blog"
import { getNailArtPosts } from "@/lib/supabase/nail-art"

const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/tienda", changeFrequency: "daily", priority: 0.9 },
  { path: "/tienda/mas-vendidos", changeFrequency: "daily", priority: 0.7 },
  { path: "/tienda/nuevos", changeFrequency: "daily", priority: 0.7 },
  { path: "/tienda/ofertas", changeFrequency: "daily", priority: 0.7 },
  { path: "/academia", changeFrequency: "weekly", priority: 0.9 },
  { path: "/marcas", changeFrequency: "monthly", priority: 0.6 },
  { path: "/servicios", changeFrequency: "monthly", priority: 0.8 },
  { path: "/servicios/agendar", changeFrequency: "monthly", priority: 0.7 },
  { path: "/servicios/resenas", changeFrequency: "weekly", priority: 0.5 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/nail-art", changeFrequency: "daily", priority: 0.7 },
  { path: "/sobre-liz", changeFrequency: "monthly", priority: 0.6 },
  { path: "/aviso-de-privacidad", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terminos-y-condiciones", changeFrequency: "yearly", priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const [productsResult, coursesResult, blogPosts, nailArtPosts] = await Promise.all([
    getProducts({}),
    getPublishedCourses(),
    getBlogPosts({ limit: 1000 }),
    getNailArtPosts(1000, "recent"),
  ])

  const productEntries: MetadataRoute.Sitemap = (productsResult.data ?? []).map(
    (product) => ({
      url: `${siteUrl}/tienda/${product.slug}`,
      lastModified: product.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  )

  // Los cursos históricos (98 de 106 hoy) siguen siendo páginas válidas y se
  // muestran marcadas como "pasado", pero no compiten con los próximos: van con
  // prioridad baja para que el rastreo se concentre en lo que sí se puede tomar.
  const now = Date.now()
  const courseEntries: MetadataRoute.Sitemap = (coursesResult.data ?? []).map(
    (course) => {
      const isUpcoming = new Date(course.start_date).getTime() >= now
      return {
        url: `${siteUrl}/academia/${course.id}`,
        lastModified: course.updated_at ?? undefined,
        changeFrequency: isUpcoming ? "weekly" : "yearly",
        priority: isUpcoming ? 0.8 : 0.3,
      }
    }
  )

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.published_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  const nailArtEntries: MetadataRoute.Sitemap = nailArtPosts.map((post) => ({
    url: `${siteUrl}/nail-art/${post.slug}`,
    lastModified: post.created_at ?? undefined,
    changeFrequency: "monthly",
    priority: 0.4,
  }))

  return [
    ...staticEntries,
    ...productEntries,
    ...courseEntries,
    ...blogEntries,
    ...nailArtEntries,
  ]
}
