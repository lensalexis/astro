'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export type HomeStartHereItem = {
  title: string
  subtitle?: string
  href: string
  image: string
  badge?: string
}

function HorizontalRail({
  items,
  variant = 'card',
}: {
  items: HomeStartHereItem[]
  variant?: 'card' | 'banner'
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = variant === 'banner' ? 380 : 260
    const gap = 16 // gap-4 = 1rem = 16px
    const scrollAmount = cardWidth + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative -mx-4 sm:-mx-6">
      {/* Left arrow (desktop only) */}
      <button
        onClick={() => scroll('left')}
        className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center bg-white rounded-full shadow-md w-10 h-10 hover:bg-gray-100 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* Scrollable container */}
      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-6">
        <div className="flex gap-4 pb-2">
          {items.map((item) => (
            <Link
              key={item.href + item.title}
              href={item.href}
              className={[
                'group relative shrink-0 overflow-hidden bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md',
                variant === 'banner' ? 'w-[340px] sm:w-[380px] rounded-3xl' : 'w-[260px] rounded-3xl',
              ].join(' ')}
              aria-label={item.title}
            >
              <div className={variant === 'banner' ? 'relative h-44 w-full' : 'relative h-40 w-full'}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes={variant === 'banner' ? '380px' : '260px'}
                />
                {item.badge ? (
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-black/5 backdrop-blur">
                    {item.badge}
                  </div>
                ) : null}

                {variant === 'banner' ? (
                  <div className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 ring-1 ring-black/5 backdrop-blur transition group-hover:bg-white">
                    <ArrowRightIcon className="h-5 w-5" />
                  </div>
                ) : null}
              </div>
              {variant === 'banner' ? null : (
                <div className="p-4">
                  <div className="text-base font-bold text-gray-950 line-clamp-2">{item.title}</div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Right arrow (desktop only) */}
      <button
        onClick={() => scroll('right')}
        className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center bg-white rounded-full shadow-md w-10 h-10 hover:bg-gray-100 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  )
}

export default function HomeStartHereContent({
  items,
  variant = 'card',
}: {
  items: HomeStartHereItem[]
  variant?: 'card' | 'banner'
}) {
  return (
    <div className="relative">
      <HorizontalRail items={items} variant={variant} />
    </div>
  )
}

