import fs from 'fs'
import path from 'path'

export type ResourceArticleMetadata = {
  title: string
  description?: string
  date?: string
  updatedDate?: string
  author?: string
  category?: string
  wpCategories?: { name: string; slug: string }[]
  tags?: string[]
  wpId?: string | number
}

export type ResourceArticleListItem = {
  slug: string
  metadata: ResourceArticleMetadata
}

const resourcesDir = path.join(process.cwd(), 'content/resources')

export function listResourceSlugs(): string[] {
  if (!fs.existsSync(resourcesDir)) return []
  return fs
    .readdirSync(resourcesDir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
}

export async function listResources(): Promise<ResourceArticleListItem[]> {
  const slugs = listResourceSlugs()
  const items = await Promise.all(
    slugs.map(async (slug) => {
      const mod = await import(`@/content/resources/${slug}.mdx`)
      return {
        slug,
        metadata: (mod.metadata || {}) as ResourceArticleMetadata,
      }
    })
  )

  // Newest first (fall back to slug)
  return items.sort((a, b) => {
    const ad = a.metadata?.date ? new Date(a.metadata.date).getTime() : 0
    const bd = b.metadata?.date ? new Date(b.metadata.date).getTime() : 0
    if (ad !== bd) return bd - ad
    return a.slug.localeCompare(b.slug)
  })
}

export async function listResourceCategories(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const items = await listResources()
  const map = new Map<string, { slug: string; name: string; count: number }>()

  for (const it of items) {
    const cats = it.metadata.wpCategories || []
    for (const c of cats) {
      if (!c?.slug) continue
      const prev = map.get(c.slug)
      if (prev) {
        prev.count += 1
      } else {
        map.set(c.slug, { slug: c.slug, name: c.name || c.slug, count: 1 })
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export async function getResourceBySlug(slug: string): Promise<{
  slug: string
  metadata: ResourceArticleMetadata
  Content: React.ComponentType
} | null> {
  try {
    const mod = await import(`@/content/resources/${slug}.mdx`)
    return {
      slug,
      metadata: (mod.metadata || {}) as ResourceArticleMetadata,
      Content: mod.default,
    }
  } catch {
    return null
  }
}

