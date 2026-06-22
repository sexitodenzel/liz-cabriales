import { getAnnouncementsCached } from "@/lib/supabase/cache"
import AnnouncementBarClient from "./AnnouncementBarClient"

export default async function AnnouncementBar() {
  const { data } = await getAnnouncementsCached()
  const items = data ?? []
  if (items.length === 0) return null

  return <AnnouncementBarClient items={items} />
}
