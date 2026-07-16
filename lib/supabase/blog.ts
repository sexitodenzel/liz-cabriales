import { createClient } from "@supabase/supabase-js"
import { getDemoBlogPosts, getDemoBlogPostBySlug } from "@/lib/blog-demo"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type BlogLinkedProduct = {
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

export type BlogPost = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string | null
  cover_image: string | null
  body: string | null
  is_active: boolean
  sort_order: number
  published_at: string
  created_at: string
  linked_products: BlogLinkedProduct[]
}

type RawRow = {
  id: string
  title: string
  slug: string
  category: string | null
  excerpt: string | null
  cover_image: string | null
  body: string | null
  is_active: boolean
  sort_order: number
  published_at: string
  created_at: string
  blog_post_products: Array<{
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

function mapRow(row: RawRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category ?? "Nail Art",
    excerpt: row.excerpt,
    cover_image: row.cover_image,
    body: row.body,
    is_active: row.is_active,
    sort_order: row.sort_order,
    published_at: row.published_at,
    created_at: row.created_at,
    linked_products: (row.blog_post_products ?? [])
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
  id, title, slug, category, excerpt, cover_image, body, is_active, sort_order, published_at, created_at,
  blog_post_products (
    id, usage_description, sort_order,
    products ( id, name, slug, images )
  )
`

export async function getBlogPosts(options?: {
  category?: string
  limit?: number
}): Promise<BlogPost[]> {
  try {
    let query = supabaseAdmin
      .from("blog_posts")
      .select(SELECT_FIELDS)
      .eq("is_active", true)

    if (options?.category) query = query.eq("category", options.category)

    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })
      .limit(options?.limit ?? 100)

    if (error) return getDemoBlogPosts(options?.category)
    const rows = (data as unknown as RawRow[]).map(mapRow)
    // Sin artículos reales todavía (tablas vacías o migración pendiente):
    // mostramos los posts de demostración para previsualizar la sección.
    if (rows.length === 0) return getDemoBlogPosts(options?.category)
    return rows
  } catch {
    return getDemoBlogPosts(options?.category)
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select(SELECT_FIELDS)
      .eq("slug", slug)
      .eq("is_active", true)
      .single()

    if (error || !data) return getDemoBlogPostBySlug(slug)
    return mapRow(data as unknown as RawRow)
  } catch {
    return getDemoBlogPostBySlug(slug)
  }
}

export async function getAllBlogPostsAdmin(): Promise<BlogPost[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select(SELECT_FIELDS)
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false })

    if (error) return []
    return (data as unknown as RawRow[]).map(mapRow)
  } catch {
    return []
  }
}

export type CreateBlogInput = {
  title: string
  slug: string
  category: string
  excerpt?: string
  cover_image?: string
  body?: string
  is_active?: boolean
  sort_order?: number
  products: Array<{
    product_id: string
    usage_description?: string
    sort_order?: number
  }>
}

export async function createBlogPost(
  input: CreateBlogInput
): Promise<{ id: string | null; error: string | null }> {
  try {
    const { data: post, error: postError } = await supabaseAdmin
      .from("blog_posts")
      .insert({
        title: input.title,
        slug: input.slug,
        category: input.category,
        excerpt: input.excerpt ?? null,
        cover_image: input.cover_image ?? null,
        body: input.body ?? null,
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 0,
      })
      .select("id")
      .single()

    if (postError || !post) return { id: null, error: postError?.message ?? "Error al crear" }

    if (input.products.length > 0) {
      const { error: prodError } = await supabaseAdmin
        .from("blog_post_products")
        .insert(
          input.products.map((p, i) => ({
            blog_post_id: post.id,
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

export type UpdateBlogInput = Partial<Omit<CreateBlogInput, "products">> & {
  products?: CreateBlogInput["products"]
}

export async function updateBlogPost(
  id: string,
  input: UpdateBlogInput
): Promise<{ error: string | null }> {
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (input.title !== undefined) patch.title = input.title
    if (input.slug !== undefined) patch.slug = input.slug
    if (input.category !== undefined) patch.category = input.category
    if (input.excerpt !== undefined) patch.excerpt = input.excerpt
    if (input.cover_image !== undefined) patch.cover_image = input.cover_image
    if (input.body !== undefined) patch.body = input.body
    if (input.is_active !== undefined) patch.is_active = input.is_active
    if (input.sort_order !== undefined) patch.sort_order = input.sort_order

    const { error: updateError } = await supabaseAdmin
      .from("blog_posts")
      .update(patch)
      .eq("id", id)

    if (updateError) return { error: updateError.message }

    if (input.products !== undefined) {
      await supabaseAdmin
        .from("blog_post_products")
        .delete()
        .eq("blog_post_id", id)

      if (input.products.length > 0) {
        const { error: prodError } = await supabaseAdmin
          .from("blog_post_products")
          .insert(
            input.products.map((p, i) => ({
              blog_post_id: id,
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

export async function deleteBlogPost(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabaseAdmin
      .from("blog_posts")
      .delete()
      .eq("id", id)

    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function searchProductsForBlog(
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
