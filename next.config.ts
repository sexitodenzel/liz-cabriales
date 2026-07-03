import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fija la raíz del workspace a este proyecto para evitar que Next elija
  // el lockfile de C:\Users\migue como raíz (había múltiples package-lock.json).
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
