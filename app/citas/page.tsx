import { redirect } from "next/navigation"

export default function CitasPage() {
  redirect("/servicios")
}

export const dynamic = "force-dynamic"
