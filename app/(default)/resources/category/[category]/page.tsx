import type { Metadata } from 'next'
import Link from 'next/link'
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import ResourcePostCard from '@/components/resources/ResourcePostCard'
import { buildMetadata } from '@/lib/seo'
import { listResourceCategories, listResources } from '@/lib/resources'
import { withHome } from '@/lib/breadcrumbs'
import BreadcrumbsRegister from '@/components/seo/BreadcrumbsRegister'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbListJsonLd } from '@/lib/jsonld'

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

export async function generateStaticParams() {
  const cats = await listResourceCategories()
  return cats.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  return buildMetadata({
    pathname: `/resources/category/${category}`,
    title: `Resources: ${category}`,
    description: `Cannabis resources in the ${category} category.`,
  })
}

export default async function ResourcesCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const all = await listResources()
  const cats = await listResourceCategories()
  const active = cats.find((c) => c.slug === category)
  const crumbs = withHome([
    { name: 'Resources', href: '/resources' },
    { name: active?.name || category, href: `/resources/category/${category}` },
  ])

  const posts = all.filter((p) => (p.metadata.wpCategories || []).some((c) => c.slug === category))
  const grid = posts.slice(0, 9)

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbsRegister crumbs={crumbs} />
      <JsonLd data={breadcrumbListJsonLd(crumbs)} />
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
              <Link href="/resources" className="hover:text-gray-900">
                Resources
              </Link>
            </li>
            <li className="flex items-center gap-x-2">
              <span className="opacity-50">/</span>
              <span aria-current="page" className="text-gray-900">
                {active?.name || category}
              </span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
          {active?.name || category}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">Browse resources in this category.</p>

        {/* Filters (pill-style) */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/resources"
              className="inline-flex h-12 items-center rounded-full border-2 border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 hover:border-gray-300"
            >
              Latest Article
            </Link>
            {cats.map((c) => (
              <Link
                key={c.slug}
                href={`/resources/category/${c.slug}`}
                className={[
                  'inline-flex h-12 items-center rounded-full border-2 bg-white px-5 text-sm font-semibold',
                  c.slug === category ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-900 hover:border-gray-300',
                ].join(' ')}
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

        <div className="mt-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {grid.map((r) => (
              <ResourcePostCard
                key={r.slug}
                href={`/resources/${r.slug}`}
                title={r.metadata.title || r.slug}
                date={r.metadata.date}
                categoryLabel={active?.name}
                imageSrc={pickThumb(r.slug)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

