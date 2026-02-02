'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import ResourcePostCard from '@/components/resources/ResourcePostCard'
import type { ResourceArticleListItem } from '@/lib/resources'

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

type Props = {
  title: string
  description?: string
  posts: ResourceArticleListItem[]
  viewAllHref: string
  sectionId?: string
}

export default function PostCarouselSection({
  title,
  description,
  posts,
  viewAllHref,
  sectionId,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 2
    )
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState)
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
    }
  }, [posts.length])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    // Scroll by ~2 cards (card width + gap); desktop ~3 in view
    const cardWidth = 280
    const gap = 16
    const amount = (cardWidth + gap) * 2
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id={sectionId}
      className="scroll-mt-6"
      aria-labelledby={sectionId ? `${sectionId}-heading` : undefined}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2
            id={sectionId ? `${sectionId}-heading` : undefined}
            className="text-xl font-extrabold tracking-tight text-gray-950 sm:text-2xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-semibold text-gray-900 underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 rounded"
        >
          View all
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No posts in this category yet.
        </p>
      ) : (
      <div className="relative mt-4 -mr-4 sm:-mr-6">
        <button
          type="button"
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          aria-label="Scroll carousel left"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide pl-0 pr-4 sm:pr-6 py-2 snap-x snap-mandatory"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
          role="region"
          aria-label={`${title} carousel`}
        >
          {posts.map((post) => {
            const primaryCategory = (post.metadata.wpCategories || [])[0]?.name
            return (
              <div
                key={post.slug}
                className="min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] flex-shrink-0 snap-start"
              >
                <ResourcePostCard
                  href={`/resources/${post.slug}`}
                  title={post.metadata.title || post.slug}
                  date={post.metadata.date}
                  categoryLabel={primaryCategory}
                  imageSrc={pickThumb(post.slug)}
                />
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          aria-label="Scroll carousel right"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      )}
    </section>
  )
}
