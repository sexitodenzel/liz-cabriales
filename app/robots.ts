import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/perfil",
        "/checkout",
        "/carrito",
        "/orden",
        "/cita",
        "/login",
        "/registrar",
        "/forgot-password",
        "/auth",
        "/wishlist",
        "/buscar",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
