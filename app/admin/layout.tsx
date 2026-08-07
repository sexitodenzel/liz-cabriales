import { redirect } from "next/navigation"

import AdminReceptionistBar from "./components/AdminReceptionistBar"
import AdminSidebar from "./components/AdminSidebar"
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

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "Admin"

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AdminSidebar userName={userName} />
      <div className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</div>
      <ToastViewport />
    </div>
  )
}
