import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 py-10">
      <Link href="/" className="mb-6 transition-opacity hover:opacity-80" aria-label="Ir al inicio">
        <Image
          src="/images/logo.png"
          alt="Liz Cabriales"
          width={140}
          height={140}
          className="object-contain"
          priority
        />
      </Link>
      {children}
    </main>
  )
}
