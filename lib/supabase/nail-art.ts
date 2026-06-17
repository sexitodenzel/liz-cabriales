import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

function mapRow(row: RawRow): NailArtPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover_image: row.cover_image,
    is_active: row.is_active,
    sort_order: row.sort_order,
    created_at: row.created_at,
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
}

const SELECT_FIELDS = `
  id, title, slug, description, cover_image, is_active, sort_order, created_at,
  nail_art_post_products (
    id, usage_description, sort_order,
    products ( id, name, slug, images )
  )
`

export async function getNailArtPosts(limit = 100): Promise<NailArtPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_FIELDS)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) return []
    return (data as unknown as RawRow[]).map(mapRow)
  } catch {
    return []
  }
}

export async function getNailArtPostBySlug(slug: string): Promise<NailArtPost | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_FIELDS)
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error || !data) return null
    return mapRow(data as unknown as RawRow)
  } catch {
    return null
  }
}

export async function getAllNailArtPostsAdmin(): Promise<NailArtPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("nail_art_posts")
      .select(SELECT_FIELDS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) return []
    return (data as unknown as RawRow[]).map(mapRow)
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
