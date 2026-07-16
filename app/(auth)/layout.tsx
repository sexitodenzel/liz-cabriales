export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-ivory px-4 py-8 sm:py-12">
      {children}
    </main>
  )
}
