// components/ui/UniversalProductSlider.tsx
'use client'

import { useRef } from 'react'
import ProductCard from '@/components/ui/ProductCard'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ProductSlider({
  products,
  categorySlug,
}: {
  products: any[]
  categorySlug: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!products.length) return null

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = 300
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative">
      {/* Left arrow (desktop only) */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center bg-white rounded-full shadow-md w-8 h-8 hover:bg-gray-100"
      >
        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
      </button>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-2 scrollbar-hide py-2"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[250px] max-w-[250px] flex-shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Right arrow (desktop only) */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden sm:flex items-center justify-center bg-white rounded-full shadow-md w-8 h-8 hover:bg-gray-100"
      >
        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
      </button>
    </div>
  )
}