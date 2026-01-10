import productService from '@/lib/productService'
import TopDiscountedProductsClient from './TopDiscountedProductsClient'

export default async function TopDiscountedProducts() {
  const res = await productService.list({
    venueId: process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
    limit: 50, // fetch more, we’ll sort and slice
  }, { next: { revalidate: 30, tags: ['dispense:products'] } })

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