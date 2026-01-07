'use client'

import { useEffect } from 'react'

export default function ProductCarouselDeals() {
  useEffect(() => {
    const interval = setInterval(() => {
      const carouselEl = document.getElementById('product-carousel-widget')

      if (carouselEl && typeof window !== 'undefined' && window.dispense) {
        clearInterval(interval)

        window.dispense.ProductCarousel({
          venueId: '83de9c41aa1a3cc5',
          selector: carouselEl,
          productCategory: 'aeebb7e2a7f046e9', // Deals
          sort: '-created',
          onProductClick: (props: any) => {
            window.location.href = `https://www.kinebudsdispensary.com/menu/${props.category}/${props.id}`
          },
        })
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          🔥 Current Deals
        </h2>
        <div id="product-carousel-widget" className="min-h-[200px]"></div>
      </div>
    </section>
  )
}