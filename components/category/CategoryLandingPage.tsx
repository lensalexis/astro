import Image from 'next/image'
import { notFound } from 'next/navigation'
import AIProductSearch from '@/components/AIProductSearch'
import HomeStartHereContent from '@/components/home/HomeStartHereContent'
import CategoryIntentRails from '@/components/category/CategoryIntentRails'
import Section from '@/components/ui/Section'
import { getCategoryLandingConfig } from '@/lib/categoryLanding'
import { stores } from '@/lib/stores'

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-').trim()
}

export function canonicalizeCategorySlug(raw: string) {
  const norm = normalizeSlug(raw)
  if (norm === 'vapes') return 'vaporizers'
  if (norm === 'prerolls' || norm === 'pre-roll') return 'pre-rolls'
  return norm
}

export default function CategoryLandingPage({ category }: { category: string }) {
  const slug = canonicalizeCategorySlug(category)
  const cfg = getCategoryLandingConfig(slug)
  if (!cfg) return notFound()

  const defaultStoreId = stores[0]?.id
  const resultsPortalId = `category-${cfg.slug}-results`

  return (
    <div className="min-h-screen">
      {/* Static hero (no animated slider on category pages) */}
      <section className="relative w-full overflow-hidden">
        <div className="relative h-[640px] w-full md:h-[520px]">
          <Image
            src={cfg.heroImage}
            alt={`${cfg.name} hero`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-black/10" />

          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="pointer-events-auto mx-auto h-full w-full max-w-6xl px-4 sm:px-6">
              <div className="flex h-full w-full items-start pt-16 pb-4 sm:items-end sm:pt-0 sm:pb-6">
                <AIProductSearch
                  forceAIMode={true}
                  heroOnly={true}
                  heroVariant="viator"
                  heroTitle={cfg.heroTitle}
                  hideHeroQuickPrompts={true}
                  initialHeroCategory={cfg.name}
                  homeResultsPortalId={resultsPortalId}
                  currentStoreId={defaultStoreId}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 space-y-12">
        <Section title={`Featured in ${cfg.name}`}>
          <HomeStartHereContent items={cfg.banners} resultsPortalId={resultsPortalId} />
        </Section>

        <CategoryIntentRails
          categorySlug={cfg.slug}
          categoryName={cfg.name}
          intentOrder={cfg.intentOrder}
        />
      </main>
    </div>
  )
}

