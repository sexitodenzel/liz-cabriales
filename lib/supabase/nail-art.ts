import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NailArtStatus = "pending" | "approved" | "rejected"

export type NailArtLinkedProduct = {
  id: string
  usage_description: string | null
  sort_order: number
  product: {
    id: string
    name: string
    slug: string
    images: string[] | null
  }
}

export type NailArtPost = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  /** Solo contextos admin/servidor; nunca en JSON público. */
  user_id?: string | null
  author_display_name: string | null
  status: NailArtStatus
  is_editorial: boolean
  likes_count: number
  linked_products: NailArtLinkedProduct[]
}

type RawRow = {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  user_id?: string | null
  author_display_name?: string | null
  status?: NailArtStatus | null
  is_editorial?: boolean | null
  likes_count?: number | null
  nail_art_post_products: Array<{
    id: string
    usage_description: string | null
    sort_order: number
    products: {
      id: string
      name: string
      slug: string
      images: string[] | null
    } | null
  }>
}

function mapRow(row: RawRow, opts?: { includeUserId?: boolean }): NailArtPost {
  const post: NailArtPost = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover_image: row.cover_image,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
    author_display_name: row.author_display_name ?? null,
    status: row.status ?? "approved",
    is_editorial: Boolean(row.is_editorial),
    likes_count: Number(row.likes_count ?? 0),
    linked_products: (row.nail_art_post_products ?? [])
      .filter((p) => p.products !== null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({
        id: p.id,
        usage_description: p.usage_description,
        sort_order: p.sort_order,
        product: p.products!,
      })),
  }
  if (opts?.includeUserId) {
    post.user_id = row.user_id ?? null
  }
  return post
}

/** Quita campos sensibles antes de enviar al cliente / APIs públicas. */
export function toPublicNailArtPost(post: NailArtPost): Omit<NailArtPost, "user_id"> {
  const { user_id: _omit, ...rest } = post
  return rest
}

export function toPublicNailArtPosts(posts: NailArtPost[]) {
  return posts.map(toPublicNailArtPost)
}

/** Campos públicos (sin user_id). */
const SELECT_PUBLIC = `
  id, title, slug, description, cover_image, is_active, sort_order, created_at,
  author_display_name, status, is_editorial, likes_count,
  nail_art_post_products (
    id, usage_description, sort_order,
    products ( id, name, slug, images )
  )
`

/** Admin: incluye user_id solo para panel / lógica servidor. */
const SELECT_ADMIN = `
  id, title, slug, description, cover_image, is_active, sort_order, created_at,
  user_id, author_display_name, status, is_editorial, likes_count,
  nail_art_post_products (
    id, usage_description, sort_order,
    products ( id, name, slug, images )
  )
`

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const clean = slugify(base) || "inspiracion"
  let candidate = clean
  for (let i = 0; i < 12; i++) {
    const { data } = await supabaseAdmin
      .from("nail_art_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
    candidate = `${clean}-${Math.random().toString(36).slice(2, 7)}`
  }
  return `${clean}-${Date.now().toString(36)}`
}

export type NailArtSort = "featured" | "likes" | "recent"

/** Galería pública: solo aprobadas y activas. */
export async function getNailArtPosts(
  limit = 100,
  sort: NailArtSort = "featured"
): Promise<NailArtPost[]> {
  try {
    let query = supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_PUBLIC)
      .eq("is_active", true)
      .eq("status", "approved")

    if (sort === "likes") {
      query = query
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: false })
    } else if (sort === "recent") {
      query = query.order("created_at", { ascending: false })
    } else {
      // Destacados: editorial primero vía sort_order, luego fecha
      query = query
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      // Fallback si aún no corrió la migración UGC (sin columna status).
      if (error.code === "42703") {
        const legacy = await supabaseAdmin
          .from("nail_art_posts")
          .select(
            `id, title, slug, description, cover_image, is_active, sort_order, created_at,
             nail_art_post_products ( id, usage_description, sort_order, products ( id, name, slug, images ) )`
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(limit)
        if (legacy.error) return []
        return (legacy.data as unknown as RawRow[]).map((row) => mapRow(row))
      }
      return []
    }

    let posts = (data as unknown as RawRow[]).map((row) => mapRow(row))
    if (sort === "featured") {
      posts = [...posts].sort((a, b) => {
        if (a.is_editorial !== b.is_editorial) return a.is_editorial ? -1 : 1
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    }
    return posts
  } catch {
    return []
  }
}

export async function getNailArtPostBySlug(slug: string): Promise<NailArtPost | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_PUBLIC)
      .eq("slug", slug)
      .eq("is_active", true)
      .eq("status", "approved")
      .single()

    if (error || !data) {
      if (error?.code === "42703") {
        const legacy = await supabaseAdmin
          .from("nail_art_posts")
          .select(
            `id, title, slug, description, cover_image, is_active, sort_order, created_at,
             nail_art_post_products ( id, usage_description, sort_order, products ( id, name, slug, images ) )`
          )
          .eq("slug", slug)
          .eq("is_active", true)
          .single()
        if (legacy.error || !legacy.data) return null
        return mapRow(legacy.data as unknown as RawRow)
      }
      return null
    }
    return mapRow(data as unknown as RawRow)
  } catch {
    return null
  }
}

/** Admin: todas (editoriales + UGC). */
export async function getAllNailArtPostsAdmin(): Promise<NailArtPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_ADMIN)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) return []
    return (data as unknown as RawRow[]).map((row) => mapRow(row, { includeUserId: true }))
  } catch {
    return []
  }
}

export async function listPendingInspirations(): Promise<NailArtPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_ADMIN)
      .eq("status", "pending")
      .eq("is_editorial", false)
      .order("created_at", { ascending: true })

    if (error) return []
    return (data as unknown as RawRow[]).map((row) => mapRow(row, { includeUserId: true }))
  } catch {
    return []
  }
}

/** Publicaciones UGC del usuario (cualquier status), para perfil. */
export async function listNailArtPostsForUser(
  userId: string,
  limit = 50
): Promise<NailArtPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_PUBLIC)
      .eq("user_id", userId)
      .eq("is_editorial", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) return []
    return (data as unknown as RawRow[]).map((row) => mapRow(row))
  } catch {
    return []
  }
}

export type CreateNailArtInput = {
  title: string
  slug: string
  description?: string
  cover_image?: string
  is_active?: boolean
  sort_order?: number
  products: Array<{
    product_id: string
    usage_description?: string
    sort_order?: number
  }>
}

export async function createNailArtPost(
  input: CreateNailArtInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    const { data: post, error: postError } = await supabaseAdmin
      .from("nail_art_posts")
      .insert({
        title: input.title,
        slug: input.slug,
        description: input.description ?? null,
        cover_image: input.cover_image ?? null,
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 0,
        status: "approved",
        is_editorial: true,
        author_display_name: "Liz Cabriales",
        user_id: null,
      })
      .select("id")
      .single()

    if (postError || !post) return { id: null, error: postError?.message ?? "Error al crear" }

    if (input.products.length > 0) {
      const { error: prodError } = await supabaseAdmin
        .from("nail_art_post_products")
        .insert(
          input.products.map((p, i) => ({
            nail_art_post_id: post.id,
            product_id: p.product_id,
            usage_description: p.usage_description ?? null,
            sort_order: p.sort_order ?? i,
          }))
        )
      if (prodError) return { id: null, error: prodError.message }
    }

    return { id: post.id, error: null }
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export type UpdateNailArtInput = Partial<Omit<CreateNailArtInput, "products">> & {
  products?: CreateNailArtInput["products"]
}

export async function updateNailArtPost(
  id: string,
  input: UpdateNailArtInput
): Promise<{ error: string | null }> {
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.title !== undefined) patch.title = input.title
    if (input.slug !== undefined) patch.slug = input.slug
    if (input.description !== undefined) patch.description = input.description
    if (input.cover_image !== undefined) patch.cover_image = input.cover_image
    if (input.is_active !== undefined) patch.is_active = input.is_active
    if (input.sort_order !== undefined) patch.sort_order = input.sort_order

    const { error: updateError } = await supabaseAdmin
      .from("nail_art_posts")
      .update(patch)
      .eq("id", id)

    if (updateError) return { error: updateError.message }

    if (input.products !== undefined) {
      await supabaseAdmin
        .from("nail_art_post_products")
        .delete()
        .eq("nail_art_post_id", id)

      if (input.products.length > 0) {
        const { error: prodError } = await supabaseAdmin
          .from("nail_art_post_products")
          .insert(
            input.products.map((p, i) => ({
              nail_art_post_id: id,
              product_id: p.product_id,
              usage_description: p.usage_description ?? null,
              sort_order: p.sort_order ?? i,
            }))
          )
        if (prodError) return { error: prodError.message }
      }
    }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function deleteNailArtPost(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from("nail_art_posts")
      .delete()
      .eq("id", id)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export type SubmitInspirationInput = {
  userId: string
  authorDisplayName: string
  description: string
  coverImage: string
  productIds: string[]
  /** Admin: publica de inmediato como editorial (badge Elaborado por Nosotros). */
  asEditorial?: boolean
}

export async function submitNailArtInspiration(
  input: SubmitInspirationInput
): Promise<{
  id: string | null
  slug: string | null
  published: boolean
  error: string | null
}> {
  try {
    if (!input.coverImage?.trim()) {
      return { id: null, slug: null, published: false, error: "La imagen es requerida" }
    }
    if (!input.description?.trim()) {
      return { id: null, slug: null, published: false, error: "La descripción es requerida" }
    }
    if (!Array.isArray(input.productIds) || input.productIds.length < 1) {
      return {
        id: null,
        slug: null,
        published: false,
        error: "Selecciona al menos un producto de la tienda",
      }
    }

    const uniqueIds = Array.from(new Set(input.productIds.filter(Boolean)))
    const { data: products, error: prodCheckError } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("is_active", true)
      .in("id", uniqueIds)

    if (prodCheckError) {
      return { id: null, slug: null, published: false, error: prodCheckError.message }
    }
    if (!products || products.length !== uniqueIds.length) {
      return {
        id: null,
        slug: null,
        published: false,
        error: "Uno o más productos no son válidos o no están activos",
      }
    }

    const asEditorial = Boolean(input.asEditorial)
    const titleBase =
      input.description.trim().slice(0, 60).replace(/\s+/g, " ") || "Inspiración"
    const slug = await ensureUniqueSlug(
      asEditorial ? `liz-${titleBase}` : `inspiracion-${titleBase}`
    )

    const { data: post, error: postError } = await supabaseAdmin
      .from("nail_art_posts")
      .insert({
        title: titleBase,
        slug,
        description: input.description.trim(),
        cover_image: input.coverImage.trim(),
        is_active: asEditorial,
        sort_order: 0,
        status: asEditorial ? "approved" : "pending",
        is_editorial: asEditorial,
        user_id: input.userId,
        author_display_name: asEditorial
          ? "Liz Cabriales"
          : input.authorDisplayName.trim() || "Usuario",
        likes_count: 0,
        ...(asEditorial
          ? {
              moderated_at: new Date().toISOString(),
              moderated_by: input.userId,
            }
          : {}),
      })
      .select("id, slug")
      .single()

    if (postError || !post) {
      return {
        id: null,
        slug: null,
        published: false,
        error: postError?.message ?? "Error al crear",
      }
    }

    const { error: linkError } = await supabaseAdmin
      .from("nail_art_post_products")
      .insert(
        uniqueIds.map((productId, i) => ({
          nail_art_post_id: post.id,
          product_id: productId,
          usage_description: null,
          sort_order: i,
        }))
      )

    if (linkError) {
      await supabaseAdmin.from("nail_art_posts").delete().eq("id", post.id)
      return { id: null, slug: null, published: false, error: linkError.message }
    }

    return {
      id: post.id,
      slug: post.slug,
      published: asEditorial,
      error: null,
    }
  } catch (err) {
    return {
      id: null,
      slug: null,
      published: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}

export async function moderateInspiration(
  id: string,
  action: "approve" | "reject",
  moderatorId: string,
  rejectionReason?: string
): Promise<{ error: string | null }> {
  try {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      moderated_at: new Date().toISOString(),
      moderated_by: moderatorId,
    }

    if (action === "approve") {
      patch.status = "approved"
      patch.is_active = true
      patch.rejection_reason = null
    } else {
      patch.status = "rejected"
      patch.is_active = false
      patch.rejection_reason = rejectionReason?.trim() || null
    }

    const { data: updated, error } = await supabaseAdmin
      .from("nail_art_posts")
      .update(patch)
      .eq("id", id)
      .eq("status", "pending")
      .eq("is_editorial", false)
      .select("id")
      .maybeSingle()

    if (error) return { error: error.message }
    if (!updated) return { error: "Publicación no encontrada o ya moderada" }

    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function toggleNailArtLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likes_count: number; error: string | null }> {
  try {
    const { data: post } = await supabaseAdmin
      .from("nail_art_posts")
      .select("id, likes_count, status, is_active")
      .eq("id", postId)
      .maybeSingle()

    if (!post || post.status !== "approved" || !post.is_active) {
      return { liked: false, likes_count: 0, error: "Publicación no disponible" }
    }

    const { data: existing } = await supabaseAdmin
      .from("nail_art_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin
        .from("nail_art_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
      if (error) return { liked: true, likes_count: post.likes_count ?? 0, error: error.message }
    } else {
      const { error } = await supabaseAdmin
        .from("nail_art_likes")
        .insert({ post_id: postId, user_id: userId })
      if (error) return { liked: false, likes_count: post.likes_count ?? 0, error: error.message }
    }

    const { data: refreshed } = await supabaseAdmin
      .from("nail_art_posts")
      .select("likes_count")
      .eq("id", postId)
      .single()

    return {
      liked: !existing,
      likes_count: Number(refreshed?.likes_count ?? 0),
      error: null,
    }
  } catch (err) {
    return {
      liked: false,
      likes_count: 0,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}

export async function userLikedPost(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from("nail_art_likes")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()
    return Boolean(data)
  } catch {
    return false
  }
}

/** Likes del usuario para un lote de posts (galería). */
export async function userLikedPostIds(
  userId: string,
  postIds: string[]
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set()
  try {
    const { data } = await supabaseAdmin
      .from("nail_art_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds)
    return new Set((data ?? []).map((r) => r.post_id as string))
  } catch {
    return new Set()
  }
}

export async function setNailArtFavorite(
  postId: string,
  userId: string,
  favorited: boolean
): Promise<{ favorited: boolean; error: string | null }> {
  try {
    const { data: post } = await supabaseAdmin
      .from("nail_art_posts")
      .select("id, status, is_active")
      .eq("id", postId)
      .maybeSingle()

    if (!post || post.status !== "approved" || !post.is_active) {
      return { favorited: false, error: "Publicación no disponible" }
    }

    if (favorited) {
      const { error } = await supabaseAdmin.from("nail_art_favorites").upsert(
        { post_id: postId, user_id: userId },
        { onConflict: "post_id,user_id", ignoreDuplicates: true }
      )
      if (error) return { favorited: false, error: error.message }
      return { favorited: true, error: null }
    }

    const { error } = await supabaseAdmin
      .from("nail_art_favorites")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
    if (error) return { favorited: true, error: error.message }
    return { favorited: false, error: null }
  } catch (err) {
    return {
      favorited: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}

/** @deprecated Prefer setNailArtFavorite with desired state */
export async function toggleNailArtFavorite(
  postId: string,
  userId: string
): Promise<{ favorited: boolean; error: string | null }> {
  try {
    const { data: existing } = await supabaseAdmin
      .from("nail_art_favorites")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()
    return setNailArtFavorite(postId, userId, !existing)
  } catch (err) {
    return {
      favorited: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    }
  }
}

export async function userFavoritedPostIds(
  userId: string,
  postIds?: string[]
): Promise<Set<string>> {
  try {
    let query = supabaseAdmin
      .from("nail_art_favorites")
      .select("post_id")
      .eq("user_id", userId)

    if (postIds && postIds.length > 0) {
      query = query.in("post_id", postIds)
    } else if (postIds && postIds.length === 0) {
      return new Set()
    }

    const { data } = await query
    return new Set((data ?? []).map((r) => r.post_id as string))
  } catch {
    return new Set()
  }
}

export async function getNailArtPostsByIds(ids: string[]): Promise<NailArtPost[]> {
  if (ids.length === 0) return []
  try {
    const unique = Array.from(new Set(ids))
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_PUBLIC)
      .in("id", unique)
      .eq("is_active", true)
      .eq("status", "approved")

    if (error || !data) return []

    const byId = new Map(
      (data as unknown as RawRow[]).map((row) => [row.id, mapRow(row)])
    )
    return unique.map((id) => byId.get(id)).filter((p): p is NailArtPost => Boolean(p))
  } catch {
    return []
  }
}

/** Favoritos del usuario con datos de publicación (wishlist / DB). */
export async function listFavoritedNailArtPosts(
  userId: string,
  limit = 48
): Promise<NailArtPost[]> {
  try {
    const { data: favs, error: favError } = await supabaseAdmin
      .from("nail_art_favorites")
      .select("post_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (favError || !favs?.length) return []

    const ids = favs.map((f) => f.post_id as string)
    return getNailArtPostsByIds(ids)
  } catch {
    return []
  }
}

export async function searchProductsForNailArt(
  q: string,
  limit = 20
): Promise<Array<{ id: string; name: string; slug: string; images: string[] | null }>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, slug, images")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(limit)

    if (error) return []
    return (data ?? []) as Array<{ id: string; name: string; slug: string; images: string[] | null }>
  } catch {
    return []
  }
}
