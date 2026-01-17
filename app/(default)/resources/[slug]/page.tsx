import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildMetadata } from '@/lib/seo'
import { getResourceBySlug, listResourceSlugs, listResources } from '@/lib/resources'
import { withHome } from '@/lib/breadcrumbs'
import BreadcrumbsRegister from '@/components/seo/BreadcrumbsRegister'
import JsonLd from '@/components/seo/JsonLd'
import { breadcrumbListJsonLd } from '@/lib/jsonld'
import { site } from '@/lib/site'
import Link from 'next/link'
import ResourceArticleLayout from '@/components/resources/ResourceArticleLayout'
import ResourcePostCard from '@/components/resources/ResourcePostCard'
import YouMayAlsoLikeProducts from '@/components/resources/YouMayAlsoLikeProducts'

export async function generateStaticParams() {
  return listResourceSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) {
    return buildMetadata({
      pathname: `/resources/${slug}`,
      title: 'Article not found',
      description: 'This resource does not exist.',
      noIndex: true,
    })
  }

  return buildMetadata({
    pathname: `/resources/${slug}`,
    title: resource.metadata.title || slug,
    description: resource.metadata.description || '',
  })
}

export default async function ResourceArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const resource = await getResourceBySlug(slug)
  if (!resource) return notFound()

  const all = await listResources()
  const other = all.filter((x) => x.slug !== slug).slice(0, 3)
  const Content = resource.Content

  const crumbs = withHome([
    { name: 'Resources', href: '/resources' },
    { name: resource.metadata.title || slug, href: `/resources/${slug}` },
  ])

  const title = resource.metadata.title || slug
  const description = resource.metadata.description || ''
  const author = resource.metadata.author || site.name
  const dateLabel = resource.metadata.date
    ? new Date(resource.metadata.date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      })
    : null

  const tags = (resource.metadata.tags || []).filter(Boolean).slice(0, 8)
  const canonicalUrl = `${site.url}/resources/${slug}`
  const shareText = encodeURIComponent(title)
  const shareUrl = encodeURIComponent(canonicalUrl)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar mobile breadcrumbs are driven by this state */}
      <BreadcrumbsRegister crumbs={crumbs} />
      <JsonLd data={breadcrumbListJsonLd(crumbs)} />

      <div
        id="top"
        className="mx-auto max-w-6xl px-4 sm:px-6 pt-[calc(var(--site-nav-h,72px)+16px)] pb-10 sm:py-10"
      >
        {/* Desktop breadcrumb UI */}
        <div className="hidden sm:block">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
              {crumbs.map((c, idx) => {
                const isLast = idx === crumbs.length - 1
                return (
                  <li key={`${c.href}-${idx}`} className="flex items-center gap-x-2">
                    {idx > 0 && <span className="opacity-50">/</span>}
                    {isLast ? (
                      <span aria-current="page" className="text-gray-900">
                        {c.name}
                      </span>
                    ) : (
                      <Link href={c.href} className="hover:text-gray-900">
                        {c.name}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>

        <ResourceArticleLayout>
          <div className="rounded-2xl bg-white p-6 sm:p-10">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Resources
              </span>
              {(resource.metadata.wpCategories || []).slice(0, 2).map((c) => (
                <Link
                  key={c.slug}
                  href={`/resources/category/${c.slug}`}
                  className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  {c.name}
                </Link>
              ))}
              {tags.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {t}
                </span>
              ))}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl">{title}</h1>

            {description ? <p className="mt-3 text-base leading-relaxed text-gray-600">{description}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              <span>
                By <span className="font-semibold text-gray-800">{author}</span>
              </span>
              {dateLabel ? <span className="opacity-60">•</span> : null}
              {dateLabel ? <span>{dateLabel}</span> : null}
            </div>

            <div className="mt-8">
              <div className="prose prose-gray max-w-none break-words prose-headings:scroll-mt-24 prose-a:break-words prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-pre:overflow-x-auto">
                <Content />
              </div>
            </div>

            {/* End-of-article footer: author/date + share */}
            <div className="mt-10 border-t border-black/5 pt-6">
              <div className="text-sm text-gray-600">
                By <span className="font-semibold text-gray-900">{author}</span>
                {dateLabel ? <span className="opacity-60"> • </span> : null}
                {dateLabel ? <span>{dateLabel}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="inline-flex items-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on X
                </a>
                <a
                  className="inline-flex items-center rounded-full bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on LinkedIn
                </a>
                <a
                  className="inline-flex items-center rounded-full bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on Facebook
                </a>
              </div>
            </div>

            <YouMayAlsoLikeProducts />

            {other.length ? (
              <section className="mt-10">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-950">Related posts</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {other.map((x) => (
                    <ResourcePostCard
                      key={x.slug}
                      href={`/resources/${x.slug}`}
                      title={x.metadata.title || x.slug}
                      date={x.metadata.date}
                      categoryLabel={(x.metadata.wpCategories || [])[0]?.name || 'Resources'}
                      imageSrc="/images/default-cover.jpg"
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </ResourceArticleLayout>
      </div>
    </div>
  )
}

