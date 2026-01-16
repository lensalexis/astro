"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import ProductCard from "@/components/ui/ProductCard"
import FilterNav from "@/components/ui/FilterNav"
import { listDispenseProducts } from "@/utils/dispenseClient"
import {
  CATEGORY_DEFS,
  applyProductFilters,
  buildFacetCounts,
  buildFacetOptions,
  type FacetedFilters,
} from "@/lib/catalog"

const CATEGORY_ICONS: Record<string, string> = {
  flower: "/images/icon-cannabis-flower.png",
  vaporizers: "/images/icon-cannabis-vape.png",
  "pre-rolls": "/images/icon-cannabis-preroll.png",
  concentrates: "/images/icon-cannabis-concentrate.png",
  edibles: "/images/icon-cannabis-edibles.png",
  beverages: "/images/icon-cannabis-beverage.png",
  tinctures: "/images/icon-cannabis-tinctures.png",
}

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  vaporizers: ["vapes"],
  "pre-rolls": ["prerolls", "pre rolls"],
}

const categories = CATEGORY_DEFS.map((cat) => ({
  ...cat,
  icon: CATEGORY_ICONS[cat.slug] || "/images/icon-cannabis-flower.png",
  synonyms: CATEGORY_SYNONYMS[cat.slug] || [],
}))

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-").trim()
}

function findCategory(raw: string | undefined) {
  if (!raw) return null
  const norm = normalizeSlug(raw)
  let found = categories.find((c) => c.slug === norm)
  if (found) return found
  return categories.find((c) => c.synonyms?.some((syn) => normalizeSlug(syn) === norm))
}

export default function CategoryAllPage() {
  const params = useParams()
  const rawCategory = (params as any)?.category
  const slug = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory || ""
  const selectedCategory = findCategory(slug)

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState<FacetedFilters>({
    categories: [],
    brands: [],
    strains: [],
    terpenes: [],
    weights: [],
    effects: [],
    saleOnly: false,
  })

  useEffect(() => {
    async function fetchProducts() {
      if (!selectedCategory) return
      setLoading(true)
      try {
        const res = await listDispenseProducts({
          categoryId: selectedCategory.id,
          limit: 200,
          quantityMin: 1,
        })
        setProducts(res.data || [])
      } catch (err) {
        console.error("Error fetching products:", err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [selectedCategory])

  const normalizedFilters = useMemo<FacetedFilters>(() => {
    const base: FacetedFilters = { ...filters }
    if ((!base.categories || base.categories.length === 0) && selectedCategory) {
      base.categories = [selectedCategory.name]
    }
    return base
  }, [filters, selectedCategory])

  const filteredProducts = useMemo(() => {
    return applyProductFilters(products, normalizedFilters)
  }, [products, normalizedFilters])

  if (!selectedCategory) {
    return (
      <section className="min-h-screen px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Category not found</h2>
        <p className="text-gray-600">Try: {categories.map((c) => c.slug).join(", ")}.</p>
      </section>
    )
  }

  const facets = useMemo(() => buildFacetOptions(products), [products])
  const facetCounts = useMemo(() => buildFacetCounts(products), [products])

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src={selectedCategory.icon} alt={selectedCategory.name} width={36} height={36} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">{selectedCategory.name}</h1>
            <div className="text-sm text-gray-600">Browse all {selectedCategory.name.toLowerCase()} products.</div>
          </div>
        </div>
        <Link
          href={`/shop/${selectedCategory.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Back to {selectedCategory.name} →
        </Link>
      </div>

      <FilterNav
        categories={categories.map((c) => c.name)}
        brands={facets.brands}
        strains={facets.strains}
        terpenes={facets.terpenes}
        weights={facets.weights}
        effects={facets.effects}
        counts={facetCounts}
        initialFilters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
      />

      {loading ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-white rounded-2xl p-3 md:p-4 shadow-md flex flex-col gap-2 md:gap-3"
            >
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ height: "192px" }} />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <p className="mt-6 text-gray-500">No products found with these filters.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}

