import type { Metadata } from 'next'
import CategoryLandingPage, { canonicalizeCategorySlug } from '@/components/category/CategoryLandingPage'
import { getCategoryLandingConfig } from '@/lib/categoryLanding'

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const slug = canonicalizeCategorySlug(params.category)
  const cfg = getCategoryLandingConfig(slug)
  if (!cfg) return {}
  return {
    title: `Shop ${cfg.name}`,
    description: `Browse ${cfg.name} with deals, best sellers, and intent-based picks.`,
  }
}

export default function ShopCategoryLandingRoute({ params }: { params: { category: string } }) {
  return <CategoryLandingPage category={params.category} />
}
