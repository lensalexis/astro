'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export type RailItem = {
  title: string
  subtitle?: string
  href: string
  image: string
  badge?: string
}

export default function HorizontalRailWithArrows({
  items,
  variant = 'default',
}: {
  items: RailItem[]
  variant?: 'default' | 'category'
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = variant === 'category' ? 260 : 260
    const gap = 12 // gap-3 = 0.75rem = 12px
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
        <div className="flex gap-3 pb-2">
          {items.map((item) => (
            <Link
              key={item.href + item.title}
              href={item.href}
              className={`group relative shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md ${
                variant === 'category'
                  ? 'basis-[calc(50%_-_6px)] sm:basis-[calc(33.333%_-_8px)] lg:basis-[calc(25%_-_9px)] min-w-[220px]'
                  : 'w-[260px]'
              }`}
            >
              <div className={`relative w-full ${variant === 'category' ? 'h-64' : 'h-40'}`}>
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes={
                    variant === 'category'
                      ? '(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw'
                      : '260px'
                  }
                />
                {variant === 'category' ? (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="text-base font-extrabold tracking-tight text-white">
                        {item.title}
                      </div>
                    </div>
                  </>
                ) : null}
                {item.badge ? (
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-black/5 backdrop-blur">
                    {item.badge}
                  </div>
                ) : null}
              </div>
              {variant === 'category' ? null : (
                <div className="p-4">
                  <div className="text-base font-bold text-gray-950 line-clamp-2">
                    {item.title}
                  </div>
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
