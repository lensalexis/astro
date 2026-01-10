import productService from '@/lib/productService'
import TopSellingProductsClient from './TopSellingProductsClient'

export default async function TopSellingProducts() {
  const res = await productService.list({
    venueId: process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
    limit: 12,
    sort: '-totalSold',
  }, { next: { revalidate: 30, tags: ['dispense:products'] } })

  const products = res.data || []

  return (
    <section className="py-6 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <h2
        className="animate-[gradient_6s_linear_infinite] 
        bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] 
        bg-[length:200%_auto] bg-clip-text text-transparent font-nacelle 
        text-2xl sm:text-3xl md:text-4xl font-semibold text-left mb-3 sm:mb-6"
      >
        Shop Best Sellers
      </h2>

      <TopSellingProductsClient products={products} />
    </section>
  )
}