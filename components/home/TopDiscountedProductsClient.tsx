'use client'

import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import ProductCard from '@/components/ui/ProductCard'

export default function TopDiscountedProductsClient({ products }: { products: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  return (
    <section className="my-12 px-4 relative">
      <h2
        className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-green-700),var(--color-gray-50),var(--color-green-600),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-transparent text-left md:text-center mb-6"
        data-aos="fade-up"
      >
        🔥 Top Discounts
      </h2>

      <div className="relative -mx-4 sm:-mx-6">
        {/* Left Arrow (hidden on mobile) */}
        <button
          onClick={() => scroll(-350)}
          className="hidden md:flex absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-white rounded-full shadow-md w-10 h-10 hover:bg-gray-100 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-4 sm:px-6 py-2"
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-full max-w-full flex-shrink-0"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right Arrow (hidden on mobile) */}
        <button
          onClick={() => scroll(350)}
          className="hidden md:flex absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-white rounded-full shadow-md w-10 h-10 hover:bg-gray-100 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    </section>
  )
}

