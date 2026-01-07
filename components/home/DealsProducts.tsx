// components/home/DealsProducts.tsx
import productService from '@/lib/productService'
import ProductCard from '@/components/ui/ProductCard'

export default async function DealsProducts() {
  const res = await productService.list({
    venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
    discounted: true,   // ✅ pulls only products with active discounts
    sort: '-created',   // newest deals first
    limit: 12,
  })

  const products = res.data || []

  if (!products.length) {
    return null
  }

  return (
    <section className="py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <h2
        className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] 
        bg-[length:200%_auto] bg-clip-text text-transparent font-nacelle 
        text-2xl sm:text-3xl md:text-4xl font-semibold text-left mb-3 sm:mb-6"
      >
        Shop Deals
      </h2>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth px-2 scrollbar-hide">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[220px] sm:min-w-[250px] max-w-[250px] flex-shrink-0"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}