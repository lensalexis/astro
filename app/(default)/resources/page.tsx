import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { getResourceCenterSectionPosts } from '@/lib/resources'
import { withHome } from '@/lib/breadcrumbs'
import BreadcrumbsRegister from '@/components/seo/BreadcrumbsRegister'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbListJsonLd } from '@/lib/jsonld'
import PostCarouselSection from '@/components/resources/PostCarouselSection'
import ResourcesHero from '@/components/resources/ResourcesHero'

export const metadata: Metadata = buildMetadata({
  pathname: '/resources',
  title: 'Resource Library',
  description:
    'Long-form, source-heavy cannabis articles built for clarity and confidence.',
})

const RESOURCE_CENTER_TABS = [
  { label: 'All Resources', href: '/resources' },
  { label: 'About Kine Buds', href: '/resources/category/kine-buds' },
  { label: 'Cannabis 101', href: '/resources/category/cannabis-101' },
  { label: 'Product & Brand Insights', href: '/resources/category/product-brand-insights' },
  { label: 'Science & Effects', href: '/resources/category/science-effects' },
  { label: 'Wellness & Medical', href: '/resources/category/wellness-medical' },
  { label: 'Local News & Events', href: '/resources/category/local-news-events' },
  { label: 'Culture & Industry', href: '/resources/category/culture-and-industry' },
]

export default async function ResourcesIndexPage() {
  const sectionPosts = await getResourceCenterSectionPosts()
  const crumbs = withHome([{ name: 'Resources', href: '/resources' }])

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbsRegister crumbs={crumbs} />
      <JsonLd data={breadcrumbListJsonLd(crumbs)} />
      {/* Hero: breadcrumbs above title, title, subtitle, category pills with blur bg */}
      <ResourcesHero breadcrumbCrumbs={crumbs} categoryTabs={RESOURCE_CENTER_TABS} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
        {/* Editorial sections (carousels) */}
        <div className="mt-12 space-y-14">
          {sectionPosts.map(({ section, posts }) => (
            <PostCarouselSection
              key={section.id}
              sectionId={section.id}
              title={section.title}
              description={section.description}
              posts={posts}
              viewAllHref={section.viewAllHref}
            />
          ))}
        </div>

        {sectionPosts.length === 0 ? (
          <p className="mt-10 text-gray-600">
            No resource sections available yet. Add posts with categories and tags to see curated sections.
          </p>
        ) : null}
      </div>
    </div>
  )
}
