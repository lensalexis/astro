import type { Metadata } from 'next'
import Link from 'next/link'
import ResourcePostCard from '@/components/resources/ResourcePostCard'
import { buildMetadata } from '@/lib/seo'
import { listResourceTags, listResources, filterByTag } from '@/lib/resources'
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
  const tags = await listResourceTags()
  return tags.map((t) => ({ tag: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  const tags = await listResourceTags()
  const active = tags.find((t) => t.slug === tag)
  return buildMetadata({
    pathname: `/resources/tag/${tag}`,
    title: `Resources: ${active?.name || tag}`,
    description: `Cannabis resources tagged with ${active?.name || tag}.`,
  })
}

export default async function ResourcesTagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const all = await listResources()
  const tags = await listResourceTags()
  const active = tags.find((t) => t.slug === tag)
  const posts = filterByTag(all, tag)
  const crumbs = withHome([
    { name: 'Resources', href: '/resources' },
    { name: active?.name || tag, href: `/resources/tag/${tag}` },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbsRegister crumbs={crumbs} />
      <JsonLd data={breadcrumbListJsonLd(crumbs)} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-8">
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
                {active?.name || tag}
              </span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
          {active?.name || tag}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
          Resources tagged with &ldquo;{active?.name || tag}&rdquo;.
        </p>

        <div className="mt-10">
          {posts.length === 0 ? (
            <p className="text-gray-600">No resources found for this tag.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((r) => {
                const primaryCategory = (r.metadata.wpCategories || [])[0]?.name
                return (
                  <ResourcePostCard
                    key={r.slug}
                    href={`/resources/${r.slug}`}
                    title={r.metadata.title || r.slug}
                    date={r.metadata.date}
                    categoryLabel={primaryCategory}
                    imageSrc={pickThumb(r.slug)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
