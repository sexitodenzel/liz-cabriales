const FALLBACK_SITE_URL = "https://lizcabriales.com"

/** URL pública del sitio, sin slash final. Usada por robots.ts y sitemap.ts. */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl.startsWith("http") && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "")
  }
  return FALLBACK_SITE_URL
}
