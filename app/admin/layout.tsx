import { redirect } from "next/navigation"

import AdminReceptionistBar from "./components/AdminReceptionistBar"
import AdminNav from "./components/AdminNav"
import { ToastViewport } from "@/app/components/ui/motion/toast-provider"
import { getAuthUser, getUserProfile } from "@/lib/supabase/auth-server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfile(user.id)
  const role = profile?.role

  if (role !== "admin" && role !== "receptionist") {
    redirect("/")
  }

  if (role === "receptionist") {
    return (
      <>
        <AdminReceptionistBar />
        {children}
        <ToastViewport />
      </>
    )
  }

  return (
    <>
      <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] px-6 py-4">
        <AdminNav />
      </header>
      {children}
      <ToastViewport />
    </>
  )
}
