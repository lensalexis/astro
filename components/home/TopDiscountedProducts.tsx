'use client'

import { useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import productService from '@/lib/productService'
import ProductCard from '@/components/ui/ProductCard'

export default async function TopDiscountedProducts() {
  const res = await productService.list({
    venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
    limit: 50, // fetch more, we’ll sort and slice
  })

  const products = (res.data || [])
    .filter(
      (p: any) =>
        (p.discountValueFinal && p.discountValueFinal > 0) ||
        (p.discountAmountFinal && p.discountAmountFinal > 0) ||
        (p.discounts && p.discounts.length > 0)
    )
    .sort((a: any, b: any) => {
      const aPct = a.discountValueFinal || a.discounts?.[0]?.value || 0
      const bPct = b.discountValueFinal || b.discounts?.[0]?.value || 0
      return bPct - aPct
    })
    .slice(0, 6)

  return <TopDiscountedProductsClient products={products} />
}

function TopDiscountedProductsClient({ products }: { products: any[] }) {
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

      <div className="relative">
        {/* Left Arrow (hidden on mobile) */}
        <button
          onClick={() => scroll(-350)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-800" />
        </button>

        {/* Right Arrow (hidden on mobile) */}
        <button
          onClick={() => scroll(350)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-2 hover:bg-gray-100"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-800" />
        </button>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-8"
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
      </div>
    </section>
  )
}