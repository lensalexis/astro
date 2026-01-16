import type { Metadata } from 'next'
import CategoryLandingPage, { canonicalizeCategorySlug } from '@/components/category/CategoryLandingPage'
import { getCategoryLandingConfig } from '@/lib/categoryLanding'

export const metadata: Metadata = (() => {
  const slug = canonicalizeCategorySlug('flower')
  const cfg = getCategoryLandingConfig(slug)
  return {
    title: cfg ? `Shop ${cfg.name}` : 'Shop Flower',
    description: cfg ? `Browse ${cfg.name} with deals, best sellers, and intent-based picks.` : undefined,
  }
})()

export default function ShopFlowerPage() {
  return <CategoryLandingPage category="flower" />
}

