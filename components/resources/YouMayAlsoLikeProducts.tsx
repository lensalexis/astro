'use client'

import { useEffect, useRef, useState } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import type { Product } from '@/types/product'
import { listDispenseProducts } from '@/utils/dispenseClient'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function YouMayAlsoLikeProducts({
  title = 'You may also like',
  limit = 12,
}: {
  title?: string
  limit?: number
}) {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    listDispenseProducts<Product>({ discounted: true, limit }, { signal: ac.signal })
      .then((res) => setItems((res.data || []).filter(Boolean) as Product[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [limit])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  if (!loading && items.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-950">{title}</h2>
      </div>

      <div className="mt-4 relative -mx-4 sm:-mx-6">
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
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="w-[220px] sm:w-[260px] shrink-0 rounded-2xl bg-white p-4 ring-1 ring-black/5"
                  >
                    <div className="h-36 w-full rounded-xl bg-gray-100" />
                    <div className="mt-3 h-4 w-3/4 rounded bg-gray-100" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
                  </div>
                ))
              : items.map((p) => (
                  <div key={String((p as any).id)} className="w-[220px] sm:w-[260px] shrink-0">
                    <ProductCard product={p} />
                  </div>
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
    </section>
  )
}

