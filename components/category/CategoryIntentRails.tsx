'use client'

import { useEffect, useMemo, useState } from 'react'
import Section from '@/components/ui/Section'
import UniversalProductSlider from '@/components/home/UniversalProductSlider'
import { computeFinalPrice, pickDisplayNode } from '@/components/ui/ProductCard'
import { listDispenseProducts } from '@/utils/dispenseClient'
import { applyProductFilters, getThcTotal, isOnSale, CATEGORY_DEFS, type FacetedFilters } from '@/lib/catalog'
import type { CategoryIntentKey } from '@/lib/categoryLanding'

type Product = any

function normalizeCategoryNoun(slug: string, name: string) {
  const s = slug.toLowerCase()
  if (s === 'vaporizers') return 'vapes'
  if (s === 'pre-rolls') return 'pre-rolls'
  return name.toLowerCase()
}

function getDiscountPercent(p: Product) {
  const v = (p as any)?.discountValueFinal
  if (typeof v === 'number' && v > 0) return v
  const first = (p as any)?.discounts?.[0]?.value
  if (typeof first === 'number' && first > 0) return first
  return 0
}

function getFinalPrice(p: Product) {
  const { basePrice, discountType, discountAmountFinal, discountValueFinal, discounts } = pickDisplayNode(p)
  return computeFinalPrice(basePrice, discountType, discountAmountFinal, discountValueFinal, discounts)
}

export default function CategoryIntentRails({
  categorySlug,
  categoryName,
  intentOrder,
}: {
  categorySlug: string
  categoryName: string
  intentOrder: CategoryIntentKey[]
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      const def = CATEGORY_DEFS.find((c) => c.slug === categorySlug)
      if (!def) {
        setProducts([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await listDispenseProducts({
          categoryId: def.id,
          limit: 120,
          quantityMin: 1,
        })
        if (!cancelled) setProducts(res.data || [])
      } catch (e) {
        console.error('Error fetching category products:', e)
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => {
      cancelled = true
    }
  }, [categorySlug])

  const noun = useMemo(() => normalizeCategoryNoun(categorySlug, categoryName), [categorySlug, categoryName])

  const bestSellers = useMemo(() => products.slice(0, 24), [products])

  const bestDeals = useMemo(() => {
    const onSale = products.filter((p) => isOnSale(p))
    return onSale
      .slice()
      .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a) || getFinalPrice(a) - getFinalPrice(b))
      .slice(0, 24)
  }, [products])

  const budgetPicks = useMemo(() => {
    return products
      .slice()
      .sort((a, b) => getFinalPrice(a) - getFinalPrice(b))
      .slice(0, 24)
  }, [products])

  const highThc = useMemo(() => {
    return products
      .slice()
      .sort((a, b) => (getThcTotal(b) || 0) - (getThcTotal(a) || 0))
      .slice(0, 24)
  }, [products])

  const byStrain = (strain: string) => {
    const filters: FacetedFilters = { strains: [strain] }
    return applyProductFilters(products, filters).slice(0, 24)
  }

  const railsByKey: Record<CategoryIntentKey, { title: string; items: Product[] }> = useMemo(
    () => ({
      bestSellers: { title: `Best selling in ${noun}`, items: bestSellers },
      bestDeals: { title: `Best deals in ${noun}`, items: bestDeals },
      budgetPicks: { title: `Budget picks in ${noun}`, items: budgetPicks },
      highThc: { title: `High THC picks in ${noun}`, items: highThc },
      indica: { title: `Indica ${noun}`, items: byStrain('Indica') },
      sativa: { title: `Sativa ${noun}`, items: byStrain('Sativa') },
      hybrid: { title: `Hybrid ${noun}`, items: byStrain('Hybrid') },
    }),
    [noun, bestSellers, bestDeals, budgetPicks, highThc, products]
  )

  if (loading) {
    return (
      <div className="space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`rail-skel-${i}`} className="space-y-4">
            <div className="h-7 w-64 rounded bg-gray-100 animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={`card-skel-${i}-${j}`} className="h-72 w-[250px] rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {intentOrder.map((key) => {
        const rail = railsByKey[key]
        if (!rail || rail.items.length === 0) return null
        return (
          <Section key={key} title={rail.title}>
            <UniversalProductSlider products={rail.items} categorySlug={categorySlug} />
          </Section>
        )
      })}
    </div>
  )
}

