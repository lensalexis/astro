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

export async function listResourceTags(): Promise<
  { slug: string; name: string; count: number }[]
> {
  const items = await listResources()
  const map = new Map<string, { name: string; count: number }>()

  for (const it of items) {
    const tags = it.metadata.tags || []
    for (const t of tags) {
      if (!t?.trim()) continue
      const slug = slugifyTag(t)
      const prev = map.get(slug)
      if (prev) {
        prev.count += 1
      } else {
        map.set(slug, { name: t.trim(), count: 1 })
      }
    }
  }

  return Array.from(map.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
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

function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// Aliases so content with either slug matches (e.g. science-and-effects vs science-effects)
const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  'science-effects': ['science-and-effects'],
}

function postHasCategory(item: ResourceArticleListItem, categorySlug: string): boolean {
  const cats = item.metadata.wpCategories || []
  const want = categorySlug.toLowerCase()
  const aliases = CATEGORY_SLUG_ALIASES[want]
  return cats.some((c) => {
    const s = c.slug?.toLowerCase()
    if (s === want) return true
    if (aliases?.includes(s)) return true
    return false
  })
}

function postHasTag(item: ResourceArticleListItem, tagSlugOrName: string): boolean {
  const tags = item.metadata.tags || []
  const slug = slugifyTag(tagSlugOrName)
  return tags.some((t) => slugifyTag(t) === slug || t.toLowerCase() === tagSlugOrName.toLowerCase())
}

function postHasAnyTag(item: ResourceArticleListItem, tagSlugsOrNames: string[]): boolean {
  return tagSlugsOrNames.some((t) => postHasTag(item, t))
}

/** Filter items by category slug. */
export function filterByCategory(
  items: ResourceArticleListItem[],
  categorySlug: string
): ResourceArticleListItem[] {
  return items.filter((p) => postHasCategory(p, categorySlug))
}

/** Filter items that have any of the given tags (by slug or name). */
export function filterByTag(
  items: ResourceArticleListItem[],
  tagSlugOrName: string
): ResourceArticleListItem[] {
  return items.filter((p) => postHasTag(p, tagSlugOrName))
}

/** Filter items in category that also have the given tag. */
export function filterByCategoryAndTag(
  items: ResourceArticleListItem[],
  categorySlug: string,
  tagSlugOrName: string
): ResourceArticleListItem[] {
  return items.filter(
    (p) => postHasCategory(p, categorySlug) && postHasTag(p, tagSlugOrName)
  )
}

/** Filter items in category that have any of the given tags. */
export function filterByCategoryAndAnyTag(
  items: ResourceArticleListItem[],
  categorySlug: string,
  tagSlugsOrNames: string[]
): ResourceArticleListItem[] {
  return items.filter(
    (p) => postHasCategory(p, categorySlug) && postHasAnyTag(p, tagSlugsOrNames)
  )
}

/** Filter items that are in category OR have the tag. */
export function filterByCategoryOrTag(
  items: ResourceArticleListItem[],
  categorySlug: string,
  tagSlugOrName: string
): ResourceArticleListItem[] {
  return items.filter(
    (p) => postHasCategory(p, categorySlug) || postHasTag(p, tagSlugOrName)
  )
}

/** Filter items that have any of the given tags. */
export function filterByAnyTag(
  items: ResourceArticleListItem[],
  tagSlugsOrNames: string[]
): ResourceArticleListItem[] {
  return items.filter((p) => postHasAnyTag(p, tagSlugsOrNames))
}

export type ResourceSectionRule =
  | { type: 'category'; categorySlug: string }
  | { type: 'tag'; tagSlugOrName: string }
  | { type: 'categoryAndTag'; categorySlug: string; tagSlugOrName: string }
  | { type: 'categoryAndAnyTag'; categorySlug: string; tagSlugs: string[] }
  | { type: 'categoryOrTag'; categorySlug: string; tagSlugOrName: string }
  | { type: 'categoryAndAnyTagForTags'; categorySlug: string; tagSlugs: string[] }
  | { type: 'anyTag'; tagSlugs: string[] }
  | { type: 'latest' }

const SECTION_LIMIT = 12

/** Get posts for a section rule, excluding already-used IDs, and return updated used set. */
export function getResourcesForSection(
  rule: ResourceSectionRule,
  allItems: ResourceArticleListItem[],
  excludeSlugs: Set<string>,
  limit: number = SECTION_LIMIT
): ResourceArticleListItem[] {
  let filtered: ResourceArticleListItem[]
  switch (rule.type) {
    case 'category':
      filtered = filterByCategory(allItems, rule.categorySlug)
      break
    case 'tag':
      filtered = filterByTag(allItems, rule.tagSlugOrName)
      break
    case 'categoryAndTag':
      filtered = filterByCategoryAndTag(
        allItems,
        rule.categorySlug,
        rule.tagSlugOrName
      )
      break
    case 'categoryAndAnyTag':
    case 'categoryAndAnyTagForTags':
      filtered = filterByCategoryAndAnyTag(
        allItems,
        rule.categorySlug,
        rule.tagSlugs
      )
      break
    case 'categoryOrTag':
      filtered = filterByCategoryOrTag(
        allItems,
        rule.categorySlug,
        rule.tagSlugOrName
      )
      break
    case 'anyTag':
      filtered = filterByAnyTag(allItems, rule.tagSlugs)
      break
    case 'latest':
      filtered = [...allItems]
      break
    default:
      filtered = []
  }
  const allowed = filtered.filter((p) => !excludeSlugs.has(p.slug))
  return allowed.slice(0, limit)
}

export type ResourceSectionConfig = {
  id: string
  title: string
  description?: string
  rule: ResourceSectionRule
  viewAllHref: string
}

/** Known category slugs (from Resource Center sections) so category pages are always generated and have display names. */
export const KNOWN_CATEGORY_SLUGS: { slug: string; name: string }[] = [
  { slug: 'kine-buds', name: 'About Kine Buds' },
  { slug: 'cannabis-101', name: 'Cannabis 101' },
  { slug: 'wellness-medical', name: 'Wellness & Medical' },
  { slug: 'product-brand-insights', name: 'Product & Brand Insights' },
  { slug: 'science-effects', name: 'Science & Effects' },
  { slug: 'local-news-events', name: 'Local News & Events' },
  { slug: 'culture-and-industry', name: 'Culture & Industry' },
]

/** Section configs for the Resource Library landing page. Sections filter by category only. */
export const RESOURCE_CENTER_SECTIONS: ResourceSectionConfig[] = [
  {
    id: 'kine-buds',
    title: 'Get to know Kine Buds',
    rule: { type: 'category', categorySlug: 'kine-buds' },
    viewAllHref: '/resources/category/kine-buds',
  },
  {
    id: 'beginner-guides',
    title: 'New Jersey cannabis laws & guides',
    rule: { type: 'category', categorySlug: 'cannabis-101' },
    viewAllHref: '/resources/category/cannabis-101',
  },
  {
    id: 'product-guide',
    title: 'Choosing the right product for you',
    rule: { type: 'category', categorySlug: 'wellness-medical' },
    viewAllHref: '/resources/category/wellness-medical',
  },
  {
    id: 'product-brand',
    title: 'Learn about our products and brands',
    rule: { type: 'category', categorySlug: 'product-brand-insights' },
    viewAllHref: '/resources/category/product-brand-insights',
  },
  {
    id: 'science-effects',
    title: 'Science backed cannabis insights',
    rule: { type: 'category', categorySlug: 'science-effects' },
    viewAllHref: '/resources/category/science-effects',
  },
  {
    id: 'local-nj',
    title: 'Local news & more in Maywood, NJ',
    rule: { type: 'category', categorySlug: 'local-news-events' },
    viewAllHref: '/resources/category/local-news-events',
  },
  {
    id: 'industry-trends',
    title: 'Industry trends & market insights',
    rule: { type: 'category', categorySlug: 'culture-and-industry' },
    viewAllHref: '/resources/category/culture-and-industry',
  },
  {
    id: 'faq',
    title: 'What customers are asking most',
    rule: { type: 'anyTag', tagSlugs: ['faq', 'customer-questions'] },
    viewAllHref: '/resources/tag/faq',
  },
]

/** Build section posts with dedupe: each post appears in at most one section on first pass. Sections are always returned; some may have zero posts. */
export async function getResourceCenterSectionPosts(): Promise<
  { section: ResourceSectionConfig; posts: ResourceArticleListItem[] }[]
> {
  const all = await listResources()
  const used = new Set<string>()
  const result: { section: ResourceSectionConfig; posts: ResourceArticleListItem[] }[] = []

  for (const section of RESOURCE_CENTER_SECTIONS) {
    const posts = getResourcesForSection(
      section.rule,
      all,
      used,
      SECTION_LIMIT
    )
    result.push({ section, posts })
    posts.forEach((p) => used.add(p.slug))
  }

  return result
}

