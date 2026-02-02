import type { Metadata } from 'next'
import Link from 'next/link'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import ResourcePostCard from '@/components/resources/ResourcePostCard'
import { buildMetadata } from '@/lib/seo'
import { listResourceCategories, listResources } from '@/lib/resources'

export const metadata: Metadata = buildMetadata({
  pathname: '/learn/resources',
  title: 'Resource Library',
  description:
    'In-depth cannabis resources: laws, safety, dosing basics, product education, and practical guidance (educational, non-medical).',
})

function pickThumb(slug: string) {
  const thumbs = [
    '/images/post-thumb-01.jpg',
    '/images/post-thumb-02.jpg',
    '/images/post-thumb-03.jpg',
    '/images/post-thumb-04.jpg',
    '/images/post-thumb-05.jpg',
    '/images/post-thumb-06.jpg',
    '/images/post-thumb-07.jpg',
    '/images/post-thumb-08.jpg',
    '/images/post-thumb-09.jpg',
    '/images/post-thumb-10.jpg',
    '/images/post-thumb-11.jpg',
    '/images/post-thumb-12.jpg',
    '/images/post-thumb-13.jpg',
    '/images/post-thumb-14.jpg',
    '/images/post-thumb-15.jpg',
  ]
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return thumbs[h % thumbs.length]
}

export default async function LearnResourcesIndexPage() {
  const resources = await listResources()
  const categories = await listResourceCategories()
  const grid = resources.slice(0, 9)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-5">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-x-2">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-x-2">
              <span className="opacity-50">/</span>
              <Link href="/learn" className="hover:text-gray-900">
                Learn
              </Link>
            </li>
            <li className="flex items-center gap-x-2">
              <span className="opacity-50">/</span>
              <span aria-current="page" className="text-gray-900">
                Resources
              </span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
          Resource Library
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
          Long-form, source-heavy cannabis articles built for clarity and confidence.
        </p>

        {/* Filters (pill-style like example) */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/learn/resources"
              className="inline-flex h-12 items-center rounded-full border-2 border-gray-900 bg-white px-5 text-sm font-semibold text-gray-900"
            >
              Latest Article
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/learn/resources/category/${c.slug}`}
                className="inline-flex h-12 items-center rounded-full border-2 border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 hover:border-gray-300"
              >
                {c.name}
              </Link>
            ))}
            <span className="mx-1 hidden h-8 w-px bg-gray-200 sm:block" />
            <button
              type="button"
              className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 hover:border-gray-300"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-700" />
              Filters
            </button>
          </div>
        </div>

        {/* Results grid */}
        <div className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((r) => {
              const primaryCategory = (r.metadata.wpCategories || [])[0]?.name
              return (
                <ResourcePostCard
                  key={r.slug}
                  href={`/learn/resources/${r.slug}`}
                  title={r.metadata.title || r.slug}
                  date={r.metadata.date}
                  categoryLabel={primaryCategory}
                  imageSrc={pickThumb(r.slug)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

