'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { MapPinIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import ProductCard from '@/components/ui/ProductCard'
import type { Product } from '@/types/product'
import FilterNav from '@/components/ui/FilterNav'
import { stores } from '@/lib/stores'
import { routeIntent } from '@/lib/intentRouter'
import { listDispenseProducts } from '@/utils/dispenseClient'
import {
  CATEGORY_DEFS,
  applyProductFilters,
  buildFacetCounts,
  buildFacetOptions,
  getCategoryLabel,
  getStrainType,
  getTags,
  type FacetedFilters,
} from '@/lib/catalog'

// Category tiles metadata
const CATEGORY_TILE_META: Record<
  string,
  {
    image: string
    className: string
  }
> = {
  flower: {
    image: '/images/post-thumb-03.jpg',
    className: 'bg-emerald-700 text-white',
  },
  vaporizers: {
    image: '/images/post-thumb-04.jpg',
    className: 'bg-purple-700 text-white',
  },
  'pre-rolls': {
    image: '/images/post-thumb-05.jpg',
    className: 'bg-red-700 text-white',
  },
  concentrates: {
    image: '/images/post-thumb-06.jpg',
    className: 'bg-amber-700 text-white',
  },
  edibles: {
    image: '/images/post-thumb-07.jpg',
    className: 'bg-rose-700 text-white',
  },
  beverages: {
    image: '/images/post-thumb-08.jpg',
    className: 'bg-orange-700 text-white',
  },
  tinctures: {
    image: '/images/post-thumb-09.jpg',
    className: 'bg-blue-700 text-white',
  },
}

// AI Mode prompts
const AI_MODE_PROMPTS = [
  { id: 'recommend-flower', label: 'Recommend the best flower for relaxation', query: 'recommend best indica flower for relaxation', category: 'Flower', image: '/images/post-thumb-03.jpg' },
  { id: 'recommend-vape', label: 'Recommend a vape for beginners', query: 'recommend beginner friendly vape cartridges', category: 'Vaporizers', image: '/images/post-thumb-04.jpg' },
  { id: 'recommend-edible', label: 'Recommend edibles for sleep', query: 'recommend edibles that help with sleep', category: 'Edibles', image: '/images/post-thumb-05.jpg' },
  { id: 'recommend-deals', label: 'Recommend the best deals today', query: 'show me discounted products with best value', category: null, image: '/images/post-thumb-06.jpg' },
  { id: 'how-choose-strain', label: 'How do I choose between indica and sativa?', query: 'how to choose between indica sativa hybrid strains', category: null, image: '/images/post-thumb-07.jpg' },
  { id: 'how-use-tincture', label: 'How do I use tinctures effectively?', query: 'how to use tinctures properly dosage instructions', category: 'Tinctures', image: '/images/post-thumb-08.jpg' },
  { id: 'how-start-edibles', label: 'How do I start with edibles safely?', query: 'how to start with edibles beginner guide safe dosage', category: 'Edibles', image: '/images/post-thumb-09.jpg' },
  { id: 'plan-evening', label: 'Plan a relaxing evening with cannabis', query: 'plan relaxing evening indica products edibles beverages', category: null, image: '/images/post-thumb-10.jpg' },
  { id: 'plan-party', label: 'Plan products for a social gathering', query: 'plan products for party social gathering sativa hybrid', category: null, image: '/images/post-thumb-03.jpg' },
  { id: 'plan-workout', label: 'Plan products for post-workout recovery', query: 'plan products for post workout recovery cbd topicals', category: null, image: '/images/post-thumb-04.jpg' },
  { id: 'browse-concentrates', label: 'Show me all concentrates', query: 'show me concentrates wax rosin shatter', category: 'Concentrates', image: '/images/post-thumb-05.jpg' },
  { id: 'browse-beverages', label: 'Show me cannabis beverages', query: 'show me beverages drinks sodas teas', category: 'Beverages', image: '/images/post-thumb-06.jpg' },
  { id: 'browse-pre-rolls', label: 'Show me pre-rolls ready to smoke', query: 'show me pre rolls joints ready to smoke', category: 'Pre Rolls', image: '/images/post-thumb-07.jpg' },
]

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  requestId?: string
}

export default function AIModePage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useParams<{ storeId?: string }>()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [baseProducts, setBaseProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showPrePrompts, setShowPrePrompts] = useState(true)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [showFilterNavInAiMode, setShowFilterNavInAiMode] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FacetedFilters>({})
  const aiModeInputRef = useRef<HTMLInputElement>(null)
  const aiModeScrollRef = useRef<HTMLDivElement>(null)
  const initialLocation = params?.storeId || ''
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)

  // Fetch all products for facets
  const [allProductsGlobal, setAllProductsGlobal] = useState<Product[]>([])
  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      try {
        let res = await listDispenseProducts<Product>({ limit: 200 })
        if ((!res || res.data?.length === 0)) {
          res = await listDispenseProducts<Product>({ limit: 200, quantityMin: 1 })
        }
        if (!cancelled) {
          setAllProductsGlobal(res.data || [])
          if (!baseProducts.length && res.data?.length) {
            setBaseProducts(res.data)
          }
        }
      } catch (err) {
        console.warn('Failed to load all products for facets', err)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [])

  // Build facets from products
  const facetSource = allProductsGlobal.length ? allProductsGlobal : baseProducts.length ? baseProducts : products
  const facets = buildFacetOptions(facetSource)
  const facetCounts = buildFacetCounts(facetSource)
  const categoryOptions = CATEGORY_DEFS.map((c) => c.name)
  const finalFacetCounts = {
    ...facetCounts,
    categories: facetCounts.categories,
  }

  // Toggle category tile
  const toggleCategoryTile = (categoryName: string) => {
    const current = activeFilters.categories || []
    const isSelected = current.some((v) => v.toLowerCase() === categoryName.toLowerCase())
    const updated = isSelected
      ? current.filter((v) => v.toLowerCase() !== categoryName.toLowerCase())
      : [...current, categoryName]

    const next: FacetedFilters = {
      ...activeFilters,
      categories: updated.length ? updated : undefined,
    }
    handleFiltersChange(next)
  }

  // Handle filters change
  const handleFiltersChange = async (f: FacetedFilters) => {
    setLoading(true)
    try {
      const selectedCategories = f.categories || []
      if (selectedCategories.length > 0) {
        const categories = CATEGORY_DEFS.filter((c) => selectedCategories.includes(c.name))
        const lists = await Promise.all(
          categories.map((cat) =>
            listDispenseProducts<Product>({
              categoryId: cat.id,
              quantityMin: 1,
              limit: 200,
            })
          )
        )
        const combined = lists.flatMap((res) => res.data || [])
        const byId = new Map<string, Product>()
        combined.forEach((p: any) => {
          if (p?.id) byId.set(p.id, p)
        })
        let categoryProducts: Product[] = Array.from(byId.values())

        if (f.brands?.length || f.strains?.length || f.terpenes?.length || f.weights?.length || f.effects?.length || f.saleOnly) {
          categoryProducts = applyProductFilters(categoryProducts, {
            categories: [],
            brands: f.brands || [],
            strains: f.strains || [],
            terpenes: f.terpenes || [],
            weights: f.weights || [],
            effects: f.effects || [],
            saleOnly: f.saleOnly || false,
          })
        }

        setProducts(categoryProducts)
        setBaseProducts(categoryProducts)
        setShowResults(true)
        setActiveFilters(f)
      } else {
        const filtered = applyProductFilters(facetSource, f)
        setProducts(filtered)
        setShowResults(true)
        setActiveFilters(f)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Handle search submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setShowPrePrompts(false)
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    
    setChatMessages((prev) => [...prev, { role: 'user', content: query, timestamp: new Date(), requestId }])

    try {
      const intentResult = routeIntent(query)
      if (intentResult.intent === 'PRODUCT_SHOPPING') {
        // Search products
        const filters = intentResult.extracted
        await handleFiltersChange({
          categories: filters.category ? [filters.category] : [],
          brands: filters.brand ? [filters.brand] : [],
          strains: filters.strainType ? [filters.strainType] : [],
          terpenes: filters.terpenes || [],
          weights: filters.weight ? [filters.weight] : [],
          effects: [],
          saleOnly: filters.discountedOnly || false,
        })
      }
    } catch (error) {
      console.error('Error processing search:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle AI mode prompt
  const handleAiModePrompt = async (prompt: typeof AI_MODE_PROMPTS[0]) => {
    setQuery(prompt.query)
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    setChatMessages((prev) => [...prev, { role: 'user', content: prompt.query, timestamp: new Date(), requestId }])
    setShowPrePrompts(false)
    try {
      const intentResult = routeIntent(prompt.query)
      if (intentResult.intent === 'PRODUCT_SHOPPING') {
        const filters = intentResult.extracted
        await handleFiltersChange({
          categories: filters.category ? [filters.category] : [],
          brands: filters.brand ? [filters.brand] : [],
          strains: filters.strainType ? [filters.strainType] : [],
          terpenes: filters.terpenes || [],
          weights: filters.weight ? [filters.weight] : [],
          effects: [],
          saleOnly: filters.discountedOnly || false,
        })
      }
    } catch (error) {
      console.error('Error processing AI mode prompt:', error)
    }
  }

  // Filter pills
  const filterPills = useMemo(() => {
    const pills: Array<{ key: keyof FacetedFilters | 'saleOnly'; value?: string; label: string }> = []
    activeFilters.categories?.forEach((category) => {
      pills.push({ key: 'categories', value: category, label: category })
    })
    activeFilters.brands?.forEach((brand) => {
      pills.push({ key: 'brands', value: brand, label: brand })
    })
    if (activeFilters.saleOnly) {
      pills.push({ key: 'saleOnly', label: 'On sale' })
    }
    return pills
  }, [activeFilters])

  const handleRemovePill = (pill: { key: keyof FacetedFilters | 'saleOnly'; value?: string }) => {
    const cloneValues = (arr?: string[]) => (arr ? [...arr] : undefined)
    const next: FacetedFilters = {
      categories: cloneValues(activeFilters.categories),
      brands: cloneValues(activeFilters.brands),
      strains: cloneValues(activeFilters.strains),
      terpenes: cloneValues(activeFilters.terpenes),
      weights: cloneValues(activeFilters.weights),
      effects: cloneValues(activeFilters.effects),
      saleOnly: activeFilters.saleOnly ?? false,
    }

    if (pill.key === 'saleOnly') {
      next.saleOnly = false
    } else if (pill.value) {
      const key = pill.key as Exclude<keyof FacetedFilters, 'saleOnly'>
      const current = next[key] ? [...next[key]!] : []
      const updated = current.filter((val) => val.toLowerCase() !== pill.value!.toLowerCase())
      next[key] = updated.length ? updated : undefined
    }

    handleFiltersChange(next)
  }

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (aiModeInputRef.current) {
        aiModeInputRef.current.focus({ preventScroll: true })
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Search box */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="max-w-2xl mx-auto">
          {/* Location modal */}
          {showLocationDropdown && (
            <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm">
              <div className="max-w-2xl mx-auto h-full flex flex-col">
                <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-base font-semibold text-gray-900">Select a location</div>
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(false)}
                    className="p-2 text-gray-600 hover:text-black"
                    aria-label="Close location picker"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocation(store.id)
                          setShowLocationDropdown(false)
                          if (typeof window !== 'undefined') {
                            router.push(`/stores/${store.id}`)
                          }
                        }}
                        className={[
                          'w-full text-left rounded-xl border px-4 py-3',
                          'hover:bg-gray-50 transition',
                          selectedLocation === store.id ? 'border-black/30 bg-gray-50' : 'border-gray-200 bg-white',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{store.name}</div>
                            {store.address || store.addressLine1 ? (
                              <div className="text-xs text-gray-600 mt-1">
                                {store.address ||
                                  [store.addressLine1, store.addressLine2].filter(Boolean).join(', ')}
                              </div>
                            ) : null}
                          </div>
                          {selectedLocation === store.id && (
                            <div className="text-xs font-semibold text-gray-700">Selected</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(false)}
                    className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filter modal */}
          <FilterNav
            categories={categoryOptions}
            brands={facets.brands}
            strains={facets.strains}
            terpenes={facets.terpenes}
            weights={facets.weights}
            effects={facets.effects}
            counts={finalFacetCounts}
            onChange={handleFiltersChange}
            initialFilters={activeFilters}
            showTrigger={false}
            open={showFilterNavInAiMode}
            onOpenChange={setShowFilterNavInAiMode}
          />

          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center gap-2">
              {/* Location icon */}
              <button
                type="button"
                onClick={() => {
                  setShowLocationDropdown(true)
                  setShowFilterNavInAiMode(false)
                }}
                className="flex items-center justify-center text-gray-700 hover:text-gray-900 transition"
                aria-label="Choose location"
              >
                <MapPinIcon className="h-6 w-6" />
              </button>

              {/* Search input */}
              <div className="relative flex-1 flex items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <button
                  type="submit"
                  className="absolute left-4 text-gray-500 hover:text-gray-700 transition"
                  aria-label="Submit search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                <input
                  ref={aiModeInputRef}
                  type="text"
                  value={query}
                  placeholder="Search by mood, product, brands, or preference"
                  className="w-full pl-12 pr-12 py-3 bg-transparent border-none text-base text-black placeholder-gray-500 rounded-full focus:outline-none focus-visible:outline-none"
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 text-gray-500 hover:text-gray-700 transition"
                  aria-label="Start voice input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2z"/>
                    <path d="M13 19.95a7.001 7.001 0 0 0 5.995-5.992L19 13h-2a5 5 0 0 1-9.995.217L7 13H5l.005.958A7.001 7.001 0 0 0 11 19.95V22h2v-2.05z"/>
                  </svg>
                </button>
              </div>

              {/* Filter icon */}
              <button
                type="button"
                onClick={() => {
                  setShowFilterNavInAiMode(true)
                  setShowLocationDropdown(false)
                }}
                className="flex items-center justify-center text-gray-700 hover:text-gray-900 transition"
                aria-label="Open filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                  <line x1="3" y1="9" x2="21" y2="9" strokeLinecap="round" />
                  <circle cx="12" cy="9" r="2.5" fill="none" />
                  <line x1="3" y1="15" x2="21" y2="15" strokeLinecap="round" />
                  <circle cx="12" cy="15" r="2.5" fill="none" />
                </svg>
              </button>
            </div>
          </form>

          {/* Category tiles */}
          <div className="mt-4">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-1">
                {CATEGORY_DEFS.map((cat) => {
                  const selected = (activeFilters.categories || []).some(
                    (v) => v.toLowerCase() === cat.name.toLowerCase()
                  )
                  const meta = CATEGORY_TILE_META[cat.slug] || {
                    image: '/images/post-thumb-03.jpg',
                    className: 'bg-gray-200 text-gray-900',
                  }

                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => toggleCategoryTile(cat.name)}
                      className={[
                        'flex-none',
                        'rounded-2xl overflow-hidden',
                        'flex items-center',
                        'shadow-sm transition',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30',
                        meta.className,
                        selected ? 'ring-2 ring-white/70 brightness-110' : 'opacity-90 hover:opacity-100',
                      ].join(' ')}
                      aria-pressed={selected}
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image 
                          src={meta.image} 
                          alt={cat.name} 
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <span className="text-left px-3 py-1.5 whitespace-nowrap">
                        <span className="block text-sm font-semibold leading-tight">{cat.name}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div 
        ref={aiModeScrollRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'auto'
        }}
      >
        <div className="max-w-2xl mx-auto">
          {filterPills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filterPills.map((pill) => (
                <button
                  key={`${pill.key}-${pill.value || 'sale'}`}
                  onClick={() => handleRemovePill(pill)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/70 bg-gray-100/70 text-sm text-gray-700 px-3 py-1.5 hover:bg-gray-200 transition"
                >
                  <span>{pill.label}</span>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-start mb-6">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-gray-600">Searching products...</p>
                </div>
              </div>
            </div>
          )}

          {showResults && !loading && products.length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {showResults && !loading && products.length === 0 && (
            <div className="text-center py-8">
              <p className="text-black mb-4">No products available matching this search.</p>
              <button
                type="button"
                onClick={() => {
                  setShowResults(false)
                  setQuery('')
                  setProducts([])
                }}
                className="px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium transition"
              >
                Start Over
              </button>
            </div>
          )}

          {chatMessages.length > 0 && (
            <div className="mb-6 space-y-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showPrePrompts && !showResults && chatMessages.length === 0 && (
            <div className="space-y-3">
              {AI_MODE_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleAiModePrompt(prompt)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                >
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                    <Image
                      src={prompt.image}
                      alt={prompt.label}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                      {prompt.label}
                    </p>
                    {prompt.category && (
                      <p className="text-xs text-gray-500 mt-1">{prompt.category}</p>
                    )}
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors flex-shrink-0">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
