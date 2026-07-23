import { getNailArtPosts, userLikedPostIds } from "@/lib/supabase/nail-art"
import Breadcrumb from "@/components/shared/Breadcrumb"
import { getAuthUser } from "@/lib/supabase/auth-server"
import NailArtGallery from "./NailArtGallery"

export const revalidate = 60

export default async function NailArtPage() {
  const [posts, user] = await Promise.all([getNailArtPosts(48, "featured"), getAuthUser()])
  const likedIds = user
    ? await userLikedPostIds(
        user.id,
        posts.map((p) => p.id)
      )
    : new Set<string>()

  return (
    <main className="min-h-screen bg-ivory text-black">
      <div className="site-container pt-5 pb-16">
        <Breadcrumb
          items={[{ label: "Inicio", href: "/" }, { label: "Nail Art" }]}
        />

        <div className="mt-4">
          <NailArtGallery
            posts={posts}
            isLoggedIn={Boolean(user)}
            likedIds={[...likedIds]}
          />
        </div>
      </div>
    </main>
  )
}
