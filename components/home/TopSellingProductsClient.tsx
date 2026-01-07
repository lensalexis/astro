'use client'

import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import ProductCard from '@/components/ui/ProductCard'

export default function TopSellingProductsClient({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      {/* Left Arrow - hidden on mobile */}
      <button
        onClick={() => scroll(-300)}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
      >
        <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
      </button>

      {/* Right Arrow - hidden on mobile */}
      <button
        onClick={() => scroll(300)}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
      >
        <ChevronRightIcon className="h-6 w-6 text-gray-800" />
      </button>

     {/* Scrollable product row */}
<div
  ref={scrollRef}
  className="flex gap-4 overflow-x-auto scroll-smooth px-4 sm:px-0 scrollbar-hide"
>
  {products.map((product) => (
    <div key={product.id} className="min-w-[250px] max-w-[250px] flex-shrink-0">
      <ProductCard product={product} />
    </div>
  ))}
</div>
    </div>
  )
}