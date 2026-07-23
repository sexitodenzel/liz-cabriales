import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Hostname de Storage (sin https://). Fallback al proyecto actual si falta env en build. */
function supabaseStorageHostname(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (raw) {
    try {
      return new URL(raw).hostname;
    } catch {
      /* ignore */
    }
  }
  return "qlvslouwkiemsjkggdqq.supabase.co";
}

const supabaseHost = supabaseStorageHostname();

// Content-Security-Policy equilibrada: bloquea clickjacking, inyección de base
// y objetos, pero permite lo que la app usa (Supabase, MercadoPago, Instagram,
// Google OAuth, Cloudflare Turnstile). Se mantienen 'unsafe-inline'/'unsafe-eval'
// porque Next.js y algunos SDK los requieren; endurecerlos rompería el runtime.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://challenges.cloudflare.com https://www.google.com https://apis.google.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.mercadopago.com https://*.mercadolibre.com https://api.mercadopago.com https://graph.instagram.com https://graph.facebook.com https://challenges.cloudflare.com${isDev ? " http://localhost:* ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://*.mercadopago.com https://*.mercadolibre.com https://challenges.cloudflare.com https://www.google.com",
  "media-src 'self' https: blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.mercadopago.com https://*.mercadolibre.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a este proyecto para evitar que Next elija
  // el lockfile de C:\Users\migue como raíz (había múltiples package-lock.json).
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        // public + signed (UGC Nail Art y legacy)
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
