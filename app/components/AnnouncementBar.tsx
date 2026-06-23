import {
  getAnnouncementBarEnabledCached,
  getAnnouncementsCached,
  getOnSaleCountCached,
  type AnnouncementItem,
} from "@/lib/supabase/cache"
import AnnouncementBarClient from "./AnnouncementBarClient"

const ON_SALE_ANNOUNCEMENT_ID = "__on_sale_auto__"

export default async function AnnouncementBar() {
  const [barEnabled, { data: announcements }, { data: onSaleCount }] =
    await Promise.all([
      getAnnouncementBarEnabledCached(),
      getAnnouncementsCached(),
      getOnSaleCountCached(),
    ])

  if (!barEnabled) return null

  const baseItems: AnnouncementItem[] = announcements ?? []
  const items: AnnouncementItem[] = [...baseItems]

  if ((onSaleCount ?? 0) > 0) {
    const label =
      onSaleCount === 1
        ? "1 producto en oferta — Ver"
        : `${onSaleCount} productos en oferta — Ver`
    items.unshift({
      id: ON_SALE_ANNOUNCEMENT_ID,
      label,
      href: "/tienda/ofertas",
    })
  }

  if (items.length === 0) return null

  return <AnnouncementBarClient items={items} />
}
