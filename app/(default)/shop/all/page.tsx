import { Suspense } from 'react'
import ShopAllClient from './shop-all-client'

export default function ShopAllPage() {
  return (
    <Suspense fallback={<section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-gray-600">Loading…</section>}>
      <ShopAllClient />
    </Suspense>
  )
}
