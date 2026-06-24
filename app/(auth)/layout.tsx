import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-white px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="mb-6 transition-opacity hover:opacity-80"
        aria-label="Ir al inicio"
      >
        <Image
          src="/images/logo.png"
          alt="Liz Cabriales"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </Link>
      {children}
    </main>
  )
}
