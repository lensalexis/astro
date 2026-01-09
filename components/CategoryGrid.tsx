'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import productService from '@/lib/productService'
import UniversalProductSlider from '@/components/home/UniversalProductSlider'
import classNames from 'classnames'
import type { Product } from '@/types/product'

const categories = [
  { name: 'Flower', slug: 'flower', id: '1af917cd40ce027b', icon: '/images/icon-cannabis-flower.png' },
  { name: 'Vaporizers', slug: 'vaporizers', id: 'ba607fa13287b679', icon: '/images/icon-cannabis-vape.png' },
  { name: 'Pre Rolls', slug: 'pre-rolls', id: '873e1156bc94041e', icon: '/images/icon-cannabis-preroll.png' },
  { name: 'Concentrates', slug: 'concentrates', id: 'dd753723f6875d2e', icon: '/images/icon-cannabis-concentrate.png' },
  { name: 'Edibles', slug: 'edibles', id: '2f2c05a9bbb5fd43', icon: '/images/icon-cannabis-edibles.png' },
  { name: 'Beverages', slug: 'beverages', id: '45d32b3453f51209', icon: '/images/icon-cannabis-beverage.png' },
  { name: 'Tinctures', slug: 'tinctures', id: '4b9c5820c59418fa', icon: '/images/icon-cannabis-tinctures.png' },
]

// 🎨 Active colors for each category
const activeColors: Record<string, string> = {
  flower: 'bg-green-200 text-green-800',
  vaporizers: 'bg-purple-200 text-purple-800',
  'pre-rolls': 'bg-yellow-200 text-yellow-800',
  concentrates: 'bg-yellow-300 text-yellow-900',
  edibles: 'bg-red-200 text-red-800',
  beverages: 'bg-orange-200 text-orange-800',
  tinctures: 'bg-blue-200 text-blue-800',
}

export default function CategoryGrid() {
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await productService.list({
          venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
          categoryId: activeCategory.id,
          limit: 12,
          quantityMin: 1, // ✅ only in-stock
        })
        setProducts(res.data || [])
      } catch (err) {
        console.error('Error fetching products:', err)
      }
    }

    fetchProducts()
  }, [activeCategory])

  return (
    <section className="">
      <div className="mx-auto max-w-6xl w-full">
        <div className="md:py-1 space-y-4">
          <div className="text-left px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl md:text-3xl font-bold text-black leading-tight break-words">
              Browse across every category.
            </h2>
            {/* <p className="text-black mt-2 text-base sm:text-lg">
              Browse curated selections across every category.
            </p> */}
          </div>
          {/* Category buttons */}
          <div className="overflow-x-auto scrollbar-hide px-2 sm:px-0 py-2">
            <div className="flex gap-3 sm:gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                  className={classNames(
                    "flex-none flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 sm:py-3 transition w-auto focus:outline-none font-bold shadow-md cursor-pointer",
                    activeCategory.slug === cat.slug
                      ? activeColors[cat.slug] || "bg-gray-200 text-gray-800"
                      : "bg-white text-gray-800 hover:shadow-lg"
                  )}
                >
                  <Image src={cat.icon} alt={cat.name} width={20} height={20} />
                  <span className="text-sm sm:text-base leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Slider */}
          <div className="">
            <UniversalProductSlider
              products={products}
              categorySlug={activeCategory.slug} // ✅ Pass slug
            />
          </div>
        </div>
      </div>
    </section>
  )
}
