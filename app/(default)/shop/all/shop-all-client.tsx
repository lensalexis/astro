"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

import ProductCard from "@/components/ui/ProductCard"
import FilterNav from "@/components/ui/FilterNav"
import { listDispenseProducts } from "@/utils/dispenseClient"
import { applyProductFilters, buildFacetCounts, buildFacetOptions, type FacetedFilters } from "@/lib/catalog"

function decodeMulti(input: string) {
  let out = input
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(out)
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}

function parseCommaList(raw: string | null) {
  if (!raw) return []
  const decoded = decodeMulti(raw)
  return decoded
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function ShopAllClient() {
  const sp = useSearchParams()
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

  // Fetch products (all)
  useEffect(() => {
    const ac = new AbortController()
    async function fetchAll() {
      setLoading(true)
      try {
        const res = await listDispenseProducts({ limit: 200, quantityMin: 1 }, { signal: ac.signal })
        setProducts(res.data || [])
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    return () => ac.abort()
  }, [])

  // Initialize filters from query params (brand/categories/sale/q from banner links)
  useEffect(() => {
    const brandsRaw = parseCommaList(sp.get("brand") || sp.get("brands"))
    // Normalize brand names to match FilterNav's lowercase comparison
    const brands = brandsRaw.map((b) => b.toLowerCase().trim()).filter(Boolean)
    const categoriesRaw = parseCommaList(sp.get("categories") || sp.get("category"))
    // Normalize category names (they should match CATEGORY_DEFS names)
    const categories = categoriesRaw.map((c) => c.trim()).filter(Boolean)
    const sale = (sp.get("sale") || sp.get("discounted") || "").toLowerCase()
    const saleOnly = sale === "1" || sale === "true" || sale === "yes"

    setFilters((prev) => {
      const next: FacetedFilters = { ...prev }
      if (brands.length) next.brands = brands
      if (categories.length) next.categories = categories
      if (saleOnly) next.saleOnly = true
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp])

  const q = (sp.get("q") || "").trim().toLowerCase()
  const filteredProducts = useMemo(() => {
    const base = q
      ? products.filter((p: any) => {
          const blob = `${p?.name || ""} ${p?.description || ""}`.toLowerCase()
          return blob.includes(q)
        })
      : products
    return applyProductFilters(base, filters)
  }, [products, filters, q])

  const facets = useMemo(() => buildFacetOptions(products), [products])
  const facetCounts = useMemo(() => buildFacetCounts(products), [products])

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-950">All products</h1>
          <div className="text-sm text-gray-600">Browse everything in stock.</div>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          New search →
        </Link>
      </div>

      <FilterNav
        categories={facets.categories}
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
