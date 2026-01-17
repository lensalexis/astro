import type { Metadata } from 'next'
import CategoryLandingPage, { canonicalizeCategorySlug } from '@/components/category/CategoryLandingPage'
import { getCategoryLandingConfig } from '@/lib/categoryLanding'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const slug = canonicalizeCategorySlug(category)
  const cfg = getCategoryLandingConfig(slug)
  if (!cfg) return {}
  return {
    title: `Shop ${cfg.name}`,
    description: `Browse ${cfg.name} with deals, best sellers, and intent-based picks.`,
  }
}

export default async function ShopCategoryLandingRoute({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  return <CategoryLandingPage category={category} />
}
