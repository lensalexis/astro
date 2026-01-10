'use client'

import { useEffect, useState } from 'react'
import { Product } from '@/types/product'
import Image from 'next/image'
import { listDispenseProducts } from '@/utils/dispenseClient'

const DEALS_CATEGORY_ID = 'aeebb7e2a7f046e9'

export default function DealsSection() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await listDispenseProducts<Product>({
          categoryId: DEALS_CATEGORY_ID,
          limit: 10,
          sort: '-created',
        })
        setProducts(res.data || [])
      } catch (err) {
        console.error('Failed to fetch deals:', err)
      }
    }

    fetchDeals()
  }, [])

  return (
    <section className="py-12 px-4">
      <h2 className="text-2xl font-semibold text-white mb-6">Deals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-900 p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            {product.images?.[0]?.url && (
              <Image
                src={product.images[0].url}
                alt={product.name}
                width={300}
                height={300}
                className="rounded mb-3"
              />
            )}
            <h3 className="text-white font-medium">{product.name}</h3>
            <p className="text-sm text-indigo-300">${(product.price || 0) / 100}</p>
            <a
              href={`https://www.kinebudsdispensary.com/menu/${(product.category as any)?.slug || product.category || ''}/${product.id}`}
              className="text-sm text-indigo-400 hover:underline block mt-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Product
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}