'use client'

import { useState, useRef, useEffect, useMemo, ReactNode, type ReactElement } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPinIcon, ChevronDownIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import productService from '@/lib/productService'
import ProductCard from '@/components/ui/ProductCard'
import type { Product } from '@/types/product'
import { ProductType } from '@/types/product'
import FilterNav from '@/components/ui/FilterNav'
import { stores, about } from '@/lib/stores'
import { useParams } from 'next/navigation'
import { routeIntent, type Intent, type ExtractedFilters, EFFECT_KEYWORDS } from '@/lib/intentRouter'

// ============================================================================
// ALPINE IQ SCHEMA FIELD ACCESSORS
// ============================================================================
// Helper functions to access Alpine IQ fields from Product type
// These map the actual API response fields to the Product type structure

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  requestId?: string
}

const CATEGORY_DEFS = [
  { name: 'Flower', slug: 'flower', id: '1af917cd40ce027b' },
  { name: 'Vaporizers', slug: 'vaporizers', id: 'ba607fa13287b679' },
  { name: 'Pre Rolls', slug: 'pre-rolls', id: '873e1156bc94041e' },
  { name: 'Concentrates', slug: 'concentrates', id: 'dd753723f6875d2e' },
  { name: 'Edibles', slug: 'edibles', id: '2f2c05a9bbb5fd43' },
  { name: 'Beverages', slug: 'beverages', id: '45d32b3453f51209' },
  { name: 'Tinctures', slug: 'tinctures', id: '4b9c5820c59418fa' },
]

const CATEGORY_NAME_BY_SLUG = CATEGORY_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.slug] = c.name
  return acc
}, {})

const CATEGORY_NAME_BY_ID = CATEGORY_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.id] = c.name
  return acc
}, {})

const getProductType = (p: Product): string | null => {
  // Map ProductType enum to Alpine IQ productType values
  if (p.type) {
    const typeMap: Record<string, string> = {
      'FLOWER': 'flower',
      'PRE_ROLLS': 'preRoll',
      'VAPORIZERS': 'vape',
      'EDIBLES': 'edible',
      'TINCTURES': 'tincture',
      'BEVERAGES': 'beverage',
      'CONCENTRATES': 'concentrate',
      'TOPICALS': 'topical',
    }
    const mapped = typeMap[p.type]
    if (mapped) return mapped
  }
  
  // Fallback: check category slug/name
  if (p.category) {
    const categoryLower = p.category.toLowerCase()
    if (categoryLower.includes('flower')) return 'flower'
    if (categoryLower.includes('pre') || categoryLower.includes('roll')) return 'preRoll'
    if (categoryLower.includes('vape') || categoryLower.includes('vapor')) return 'vape'
    if (categoryLower.includes('edible')) return 'edible'
    if (categoryLower.includes('tincture')) return 'tincture'
    if (categoryLower.includes('beverage') || categoryLower.includes('drink')) return 'beverage'
    if (categoryLower.includes('concentrate')) return 'concentrate'
    if (categoryLower.includes('topical')) return 'topical'
  }
  
  // Fallback: check subType
  if (p.subType) {
    const subTypeLower = p.subType.toLowerCase()
    if (subTypeLower.includes('flower')) return 'flower'
    if (subTypeLower.includes('pre') || subTypeLower.includes('roll')) return 'preRoll'
    if (subTypeLower.includes('vape')) return 'vape'
    if (subTypeLower.includes('edible')) return 'edible'
    if (subTypeLower.includes('tincture')) return 'tincture'
    if (subTypeLower.includes('beverage')) return 'beverage'
    if (subTypeLower.includes('concentrate')) return 'concentrate'
    if (subTypeLower.includes('topical')) return 'topical'
  }
  
  return null
}

const getCategoryLabel = (p: Product): string | null => {
  if ((p as any)?.categoryId && CATEGORY_NAME_BY_ID[(p as any).categoryId]) {
    return CATEGORY_NAME_BY_ID[(p as any).categoryId]
  }
  const t = getProductType(p)
  if (!t) return null
  const map: Record<string, string> = {
    flower: CATEGORY_NAME_BY_SLUG['flower'] || 'Flower',
    preRoll: CATEGORY_NAME_BY_SLUG['pre-rolls'] || 'Pre Rolls',
    vape: CATEGORY_NAME_BY_SLUG['vaporizers'] || 'Vaporizers',
    concentrate: CATEGORY_NAME_BY_SLUG['concentrates'] || 'Concentrates',
    edible: CATEGORY_NAME_BY_SLUG['edibles'] || 'Edibles',
    beverage: CATEGORY_NAME_BY_SLUG['beverages'] || 'Beverages',
    tincture: CATEGORY_NAME_BY_SLUG['tinctures'] || 'Tinctures',
    topical: 'Topicals',
  }
  return map[t] || null
}

const DEFAULT_CATEGORY_LABELS = [
  'Flower',
  'Vaporizers',
  'Pre Rolls',
  'Concentrates',
  'Edibles',
  'Beverages',
  'Tinctures',
  'Topicals',
]

const getStrainType = (p: Product): string | null => {
  // IMPORTANT:
  // `p.strain` is often a strain *name* (e.g., "Blue Dream") and does NOT include "sativa/indica/hybrid".
  // `p.cannabisType` is the real strain *type*.
  // We must consider BOTH, otherwise filtering by "Sativa/Indica/Hybrid" will return 0 for many products.
  const rawStrain = `${p.cannabisType || ''} ${p.strain || ''}`.toLowerCase()
  if (rawStrain.includes('indica') && rawStrain.includes('lean')) return 'indica-leaning'
  if (rawStrain.includes('sativa') && rawStrain.includes('lean')) return 'sativa-leaning'
  if (rawStrain.includes('indica')) return 'indica'
  if (rawStrain.includes('sativa')) return 'sativa'
  if (rawStrain.includes('hybrid')) return 'hybrid'
  return null
}

const getTags = (p: Product): string[] => {
  // Use effects array as tags
  return (p.effects || []).map(tag => tag.toLowerCase())
}

const getThcTotal = (p: Product, useMax: boolean = true): number | null => {
  // Get THC value - for beginner-friendly, use thc (not thcMax) to be more conservative
  // For other presets, prefer thcMax, fallback to thc
  // NOTE: API fields sometimes come back as string/number; widen the type to avoid TS 'never' paths.
  const thcValue: string | number | null =
    (useMax ? (p.labs?.thcMax ?? p.labs?.thc ?? null) : (p.labs?.thc ?? p.labs?.thcMax ?? null)) as any
  
  // Return null if value is null, undefined, empty string, or empty array
  if (thcValue === null || thcValue === undefined || thcValue === '') return null
  
  // If it's a string, check for ranges (e.g., "22-25%", "22–25")
  if (typeof thcValue === 'string') {
    // Remove percentage signs and whitespace
    const cleaned = thcValue.replace(/%/g, '').trim()
    
    // Check if it contains a range indicator (dash, en-dash, em-dash)
    if (cleaned.includes('-') || cleaned.includes('–') || cleaned.includes('—')) {
      // This is a range - return null (not a single valid number)
      return null
    }
    
    // Try to parse as number
    const numValue = parseFloat(cleaned)
    if (isNaN(numValue)) return null
    return numValue
  }
  
  // If it's already a number, validate it
  if (typeof thcValue === 'number') {
    if (isNaN(thcValue) || !isFinite(thcValue)) return null
    return thcValue
  }
  
  // Any other type is invalid
  return null
}

const getCbdTotal = (p: Product): number | null => {
  // Get CBD value - prefer cbdMax, fallback to cbd
  // NOTE: API fields sometimes come back as string/number; widen the type to avoid TS 'never' paths.
  const cbdValue: string | number | null = (p.labs?.cbdMax ?? p.labs?.cbd ?? null) as any
  
  // Return null if value is null, undefined, empty string, or empty array
  if (cbdValue === null || cbdValue === undefined || cbdValue === '') return null
  
  // If it's a string, check for ranges
  if (typeof cbdValue === 'string') {
    // Remove percentage signs and whitespace
    const cleaned = cbdValue.replace(/%/g, '').trim()
    
    // Check if it contains a range indicator
    if (cleaned.includes('-') || cleaned.includes('–') || cleaned.includes('—')) {
      // This is a range - return null (not a single valid number)
      return null
    }
    
    // Try to parse as number
    const numValue = parseFloat(cleaned)
    if (isNaN(numValue)) return null
    return numValue
  }
  
  // If it's already a number, validate it
  if (typeof cbdValue === 'number') {
    if (isNaN(cbdValue) || !isFinite(cbdValue)) return null
    return cbdValue
  }
  
  // Any other type is invalid
  return null
}

const getOnSale = (p: Product): boolean => {
  // Check for any discount indicators
  return !!(
    p.discounts?.length ||
    p.discountAmountFinal ||
    p.discountValueFinal ||
    p.discountTypeFinal
  )
}


// ============================================================================
// PRESET DEFINITIONS (8 EXACT PRESETS)
// ============================================================================

type PresetId = 
  | 'relax-unwind'
  | 'sleep-support'
  | 'uplifted-energized'
  | 'beginner-friendly'
  | 'strong-high-thc'
  | 'pre-rolls-ready'
  | 'non-smokable'
  | 'best-deals'

interface Preset {
  id: PresetId
  label: string
  description: string
}

const PRESETS: Preset[] = [
  {
    id: 'relax-unwind',
    label: 'Relax and unwind',
    description: 'Indica products perfect for relaxation',
  },
  {
    id: 'sleep-support',
    label: 'Sleep support tonight',
    description: 'Products to help you rest',
  },
  {
    id: 'uplifted-energized',
    label: 'Uplifted and energized',
    description: 'Pure sativa for energy and focus',
  },
  {
    id: 'beginner-friendly',
    label: 'Beginner-friendly, mild THC',
    description: 'Low-THC options for new users',
  },
  {
    id: 'strong-high-thc',
    label: 'Strong high-THC flower',
    description: 'Potent flower for experienced users',
  },
  {
    id: 'pre-rolls-ready',
    label: 'Pre-rolls ready to spark',
    description: 'All pre-rolls in stock',
  },
  {
    id: 'non-smokable',
    label: 'Non-smokable options',
    description: 'Edibles, beverages, tinctures & more',
  },
  {
    id: 'best-deals',
    label: 'Best deals today',
    description: 'All discounted products',
  },
]

// Category lookup (same IDs as CategoryGrid) with comprehensive synonyms
const CATEGORY_KEYWORDS: { id: string; labels: string[] }[] = [
  { 
    id: '1af917cd40ce027b', 
    labels: ['flower', 'flowers', 'bud', 'buds', 'weed', 'cannabis'] 
  },
  { 
    id: 'ba607fa13287b679', 
    labels: ['vaporizer', 'vaporizers', 'vape', 'vapes', 'cart', 'carts', 'cartridge', 'cartridges', 'pen', 'pens', 'vape pen', 'vape pens'] 
  },
  { 
    id: '873e1156bc94041e', 
    labels: ['pre roll', 'pre-roll', 'pre rolls', 'pre-rolls', 'preroll', 'prerolls', 'prerolled', 'pre-rolled', 'joint', 'joints'] 
  },
  { 
    id: 'dd753723f6875d2e', 
    labels: ['concentrate', 'concentrates', 'wax', 'rosin', 'live rosin', 'resin', 'live resin', 'shatter', 'sugar', 'badder', 'budder', 'crumble', 'dabs', 'dab'] 
  },
  { 
    id: '2f2c05a9bbb5fd43', 
    labels: ['edible', 'edibles', 'gummy', 'gummies', 'chocolate', 'chocolates', 'candy', 'candies'] 
  },
  { 
    id: '45d32b3453f51209', 
    labels: ['beverage', 'beverages', 'drink', 'drinks'] 
  },
  { 
    id: '4b9c5820c59418fa', 
    labels: ['tincture', 'tinctures', 'drops', 'drop'] 
  },
]

// ============================================================================
// PRESET FILTER FUNCTIONS
// ============================================================================

const filterByPreset = (products: Product[], presetId: PresetId): Product[] => {
  let filtered = [...products]

  switch (presetId) {
    case 'relax-unwind': {
      // Show all hybrid and indica products across all categories
      // strainType: "indica", "indica-leaning", "hybrid"
      // OR tags includes "relax" or "calm"
      filtered = filtered.filter((p) => {
        const strainType = getStrainType(p)
        const tags = getTags(p)
        
        // Include indica, indica-leaning, and hybrid products
        if (strainType) {
          return (
            strainType === 'indica' ||
            strainType === 'indica-leaning' ||
            strainType === 'hybrid'
          )
        }
        
        // If no strain info but has relax/calm tags, include it
        if (tags.length > 0) {
          return (
            tags.includes('relax') ||
            tags.includes('calm')
          )
        }
        
        // If no strain or tags info, exclude (we need at least one indicator)
        return false
      })
      break
    }

    case 'sleep-support': {
      // Only indica products across all categories
      // strainType: "indica" OR "indica-leaning"
      // OR tags includes "sleep" OR "night"
      // Exclude sativa and hybrid
      filtered = filtered.filter((p) => {
        const strainType = getStrainType(p)
        const tags = getTags(p)
        
        // Exclude sativa and hybrid (only pure indica)
        if (strainType === 'sativa' || strainType === 'sativa-leaning' || strainType === 'hybrid') {
          return false
        }
        
        // Include indica or indica-leaning
        if (strainType === 'indica' || strainType === 'indica-leaning') {
          return true
        }
        
        // If no strain info but has sleep/night tags, include it
        if (tags.length > 0) {
          return (
            tags.includes('sleep') ||
            tags.includes('night')
          )
        }
        
        // If no strain or tags info, exclude
        return false
      })
      break
    }

    case 'uplifted-energized': {
      // strainType MUST be "sativa" OR "sativa-leaning"
      // Do NOT include hybrids
      // Allowed product types: any
      filtered = filtered.filter((p) => {
        const strainType = getStrainType(p)
        // Only include if we have strain info and it's sativa
        if (!strainType) return false
        return (
          strainType === 'sativa' ||
          strainType === 'sativa-leaning'
        )
      })
      break
    }

    case 'beginner-friendly': {
      // Filter: Include products with low/no THC
      // Products are already sorted by THC_POTENCY_LOW_TO_HIGH from API
      // Include products that don't have THC listed (null/undefined)
      filtered = filtered.filter((p) => {
        const thc = getThcTotal(p, false) // false = use thc instead of thcMax
        const cbd = getCbdTotal(p)
        
        // Include products with no THC data (null/undefined)
        if (thc === null) {
          return true
        }
        
        // Include products with THC <= 20
        if (thc <= 20) {
          return true
        }
        
        // Include products with CBD > 0 even if THC is slightly higher
        if (cbd !== null && cbd > 0 && thc <= 25) {
          return true
        }
        
        // Exclude high-THC products (> 25%)
        return false
      })
      break
    }

    case 'strong-high-thc': {
      // productType = "flower"
      // thc.total >= 25%
      // Exclude pre-rolls, vapes, edibles
      filtered = filtered.filter((p) => {
        const productType = getProductType(p)
        if (productType !== 'flower') return false
        
        const thc = getThcTotal(p)
        // Must have THC data and be >= 25%
        return thc !== null && thc >= 25
      })
      break
    }

    case 'pre-rolls-ready': {
      // productType = "preRoll"
      // Must return all in-stock pre-rolls
      filtered = filtered.filter((p) => {
        const productType = getProductType(p)
        // Check both productType and also check if category matches (fallback)
        const categoryLower = (p.category || '').toLowerCase()
        const isPreRollCategory = /pre[\s-]?roll/.test(categoryLower)
        const isPreRoll =
          productType === 'preRoll' ||
                         p.type === ProductType.PRE_ROLLS ||
          isPreRollCategory
        
        if (!isPreRoll) return false
        
        // Check if in stock (lenient - if no quantity info, assume in stock)
        const quantity = p.quantityTotal ?? p.quantity ?? 0
        return quantity > 0 || quantity === undefined
      })
      break
    }

    case 'non-smokable': {
      // Include everything that is NOT smokable: exclude flower, pre-rolls, vapes, concentrates.
      // If productType is unknown, include it (better to show than hide).
      const excludedTypes = ['flower', 'preRoll', 'vape', 'concentrate']
      filtered = filtered.filter((p) => {
        const productType = getProductType(p)
        if (!productType) return true
        return !excludedTypes.includes(productType)
      })
      break
    }

    case 'best-deals': {
      // onSale = true
      // Sort by highest discount or lowest price
      filtered = filtered.filter((p) => getOnSale(p))
      
      // Sort by discount percentage (highest first)
      filtered.sort((a, b) => {
        const getDiscountPercent = (p: Product): number => {
          if (p.discountValueFinal) return p.discountValueFinal
          if (p.discounts?.[0]?.value) return p.discounts[0].value
          const basePrice = p.price ?? 0
          const finalPrice = basePrice - (p.discountAmountFinal ?? 0)
          if (basePrice > 0 && finalPrice < basePrice) {
            return (basePrice - finalPrice) / basePrice
          }
          return 0
        }
        return getDiscountPercent(b) - getDiscountPercent(a)
      })
      break
    }
  }

  return filtered
}

// ============================================================================
// PAGINATION HELPER
// ============================================================================

const fetchAllProducts = async (params: any): Promise<Product[]> => {
  const allProducts: Product[] = []
  let cursor: string | undefined = undefined
  let hasMore = true
  let pageCount = 0
  const maxPages = 50 // Safety limit (categories can be large)
  let lastCursor: string | undefined = undefined

  while (hasMore && pageCount < maxPages) {
    const requestParams = {
      ...params,
      limit: 100, // Fetch in batches
    }
    
    // Only add cursor if we have one
    if (cursor) {
      requestParams.cursor = cursor
    }

    const res = await productService.list(requestParams)
    const products = res.data || []
    allProducts.push(...products)

    // Check for next cursor in response
    const responseAny = res as any
    cursor = responseAny.nextCursor || responseAny.next_cursor || responseAny.pagination?.nextCursor
    
    // Pagination rules:
    // - Continue if API returned a cursor (even if this page is < limit)
    // - Stop if cursor is missing OR cursor did not change OR the page returned 0 items
    if (!cursor) {
      hasMore = false
    } else if (cursor === lastCursor) {
      hasMore = false
    } else if (!products.length) {
      hasMore = false
    } else {
      hasMore = true
    }
    lastCursor = cursor
    pageCount++
  }

  return allProducts
}

// ============================================================================
// COMPONENT
// ============================================================================
type AIProductSearchProps = {
  onResultsVisibleChange?: (visible: boolean) => void
  customChips?: ReactNode
  currentStoreId?: string
}

export default function AIProductSearch(props: AIProductSearchProps = {}): ReactElement {
  const { onResultsVisibleChange, customChips, currentStoreId } = props
  const { user } = useUser()
  const router = useRouter()
  const params = useParams<{ storeId?: string }>()
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null)
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [baseProducts, setBaseProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchDescription, setSearchDescription] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const initialLocation = params?.storeId || currentStoreId || ''
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const enablePresetDropdown = !!customChips
  const [phraseIndex, setPhraseIndex] = useState(0)
  const phrases = ['vape', 'pre roll', 'edible', 'concentrate', 'brand', 'tincture']
  const CATEGORY_CHIPS = [
    { id: 'cat-flower', label: 'Flower', category: 'flower' },
    { id: 'cat-vapes', label: 'Vaporizers', category: 'vaporizers' },
    { id: 'cat-pre-rolls', label: 'Pre Rolls', category: 'pre-rolls' },
    { id: 'cat-concentrates', label: 'Concentrates', category: 'concentrates' },
    { id: 'cat-edibles', label: 'Edibles', category: 'edibles' },
    { id: 'cat-beverages', label: 'Beverages', category: 'beverages' },
    { id: 'cat-tinctures', label: 'Tinctures', category: 'tinctures' },
  ]
  const PRE_PROMPTS = [
    { id: 'store-info', label: 'I want store information', type: 'store-info' as const, category: null },
    { id: 'best-sellers', label: 'Show me best sellers', type: 'curated' as const, category: null },
    { id: 'deals', label: 'Show discounted deals', type: 'curated' as const, category: null },
    { id: 'browse-vapes', label: 'Browse vapes', type: 'browse' as const, category: 'Vaporizers' },
    { id: 'browse-edibles', label: 'Browse edibles', type: 'browse' as const, category: 'Edibles' },
  ]
  const bannerSlides = [
    { id: 's1', img: '/images/post-thumb-13.jpg', title: 'Up to 60% Off', cta: '/shop/flower' },
    { id: 's2', img: '/images/post-thumb-14.jpg', title: 'Fresh Drops Today', cta: '/shop/vaporizers' },
    { id: 's3', img: '/images/post-thumb-07.jpg', title: 'Weekend Deals', cta: '/shop/edibles' },
  ]
  const [bannerIndex, setBannerIndex] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatMode, setIsChatMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allProductsGlobal, setAllProductsGlobal] = useState<Product[]>([])
  const [showPrePrompts, setShowPrePrompts] = useState(true)
  const [categoryCountsByApi, setCategoryCountsByApi] = useState<Record<string, number>>({})
  const [activeFilters, setActiveFilters] = useState<{
    categories?: string[]
    brands?: string[]
    strains?: string[]
    terpenes?: string[]
    weights?: string[]
    thcRanges?: string[]
    saleOnly?: boolean
  }>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastProcessedQueryRef = useRef<string>('')
  const processingRef = useRef<boolean>(false)
  const inFlightRequestIds = useRef<Set<string>>(new Set())
  const messageIdsRef = useRef<Set<string>>(new Set())
  const lastStoreInfoRef = useRef<{ id: string | null; ts: number }>({ id: null, ts: 0 })
  const lastSubmitRef = useRef<{ key: string; ts: number } | null>(null)
  const [isListening, setIsListening] = useState(false)
  // Web Speech API types aren't always included in TS lib config; keep this as `any`.
  const recognitionRef = useRef<any>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [guidedPrompt, setGuidedPrompt] = useState<{
    active: boolean
    requestId: string | null
    feel?: string | null
    modality?: string | null
  }>({ active: false, requestId: null, feel: null, modality: null })
  const [storeInfoPrompt, setStoreInfoPrompt] = useState<{
    active: boolean
    requestId: string | null
  }>({ active: false, requestId: null })

  const log = (label: string, payload: Record<string, any>) => {
    console.log(`[CHAT] ${label}`, { ts: Date.now(), ...payload })
  }

  // Speech-to-text setup
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recog = new SpeechRecognition()
    recog.continuous = false
    recog.interimResults = false
    recog.lang = 'en-US'
    recog.onresult = (e: any) => {
      const transcript = Array.from(e.results as any).map((r: any) => r[0]?.transcript || '').join(' ')
      setQuery(prev => prev ? `${prev} ${transcript}` : transcript)
      setIsListening(false)
    }
    recog.onerror = () => setIsListening(false)
    recog.onend = () => setIsListening(false)
    recognitionRef.current = recog
  }, [])

  useEffect(() => {
    // Autofocus the chat input on mount
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadAll = async () => {
      try {
        // Fetch full catalog (no quantityMin) so facets reflect all inventory
        let res = await fetchAllProducts({
          venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
        })
        // Fallback to in-stock only if empty
        if ((!res || res.length === 0) && process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID) {
          res = await fetchAllProducts({
            venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
            quantityMin: 1,
          })
        }
        if (!cancelled) {
          setAllProductsGlobal(res || [])
          // Seed base products so filters work before a search
          if (!baseProducts.length && res?.length) {
            setBaseProducts(res)
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

  // Fetch category counts using same API pattern as CategoryGrid
  useEffect(() => {
    let cancelled = false
    const fetchCategoryCounts = async () => {
      const counts: Record<string, number> = {}
      try {
        await Promise.all(
          CATEGORY_DEFS.map(async (cat) => {
            try {
              // Fetch with higher limit to get accurate count, same as CategoryGrid pattern
              const res = await productService.list({
                venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
                categoryId: cat.id,
                limit: 200, // Fetch enough to get accurate count
                quantityMin: 1,
              })
              // Use data length as count (API may paginate, but we get what's available)
              const count = res.data?.length || 0
              // Check for pagination info if available
              const total = (res as any)?.total || (res as any)?.count || count
              counts[cat.name] = total
            } catch (err) {
              console.warn(`Failed to fetch count for ${cat.name}`, err)
              counts[cat.name] = 0
            }
          })
        )
        if (!cancelled) {
          setCategoryCountsByApi(counts)
        }
      } catch (err) {
        console.warn('Failed to fetch category counts', err)
      }
    }
    fetchCategoryCounts()
    return () => {
      cancelled = true
    }
  }, [])

  const appendUserMessage = (content: string, requestId: string) => {
    const msgKey = `user-${requestId}`
    if (messageIdsRef.current.has(msgKey)) return
    // Mark immediately to avoid race if called twice before setState runs
    messageIdsRef.current.add(msgKey)
    // Hide pre-prompts when user message is added
    setShowPrePrompts(false)
    setChatMessages(prev => {
      if (prev.some(m => m.requestId === requestId && m.role === 'user')) return prev
      const userMessage: ChatMessage = { role: 'user', content, timestamp: new Date(), requestId }
      log('appendUser', { requestId, content })
      return [...prev, userMessage]
    })
  }

  const appendAssistantMessage = (content: string, requestId: string) => {
    const msgKey = `assistant-${requestId}`
    if (messageIdsRef.current.has(msgKey)) return
    // Mark immediately to avoid race
    messageIdsRef.current.add(msgKey)
    // Hide pre-prompts when assistant message is added
    setShowPrePrompts(false)
    setChatMessages(prev => {
      if (prev.some(m => m.requestId === requestId && m.role === 'assistant')) return prev
      const assistantMessage: ChatMessage = { role: 'assistant', content, timestamp: new Date(), requestId }
      log('appendAssistant', { requestId, content })
      return [...prev, assistantMessage]
    })
  }

  const displayName =
    (user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.name) ||
    user?.email ||
    ''
  const avatarUrl = user?.avatar || user?.photoUrl || user?.image
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '👤'

  // Notify parent when results visibility changes (for layout coordination)
  useEffect(() => {
    onResultsVisibleChange?.(showResults)
  }, [showResults, onResultsVisibleChange])

  // Auto-scroll disabled - users can manually scroll to see messages
  // Removed auto-scroll to prevent unwanted page movement after prompts

  // Rotate title phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [phrases.length])

  // Banner rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [bannerSlides.length])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Search by preset (deterministic, no LLM)
  const searchByPreset = async (presetId: PresetId) => {
    setLoading(true)
    setShowResults(true)
    setSelectedPreset(presetId)
    setQuery('')
    setSearchDescription('')

    try {
      const preset = PRESETS.find(p => p.id === presetId)
      if (!preset) return

      // Build API params - fetch ALL products, filter client-side
      // Don't use categoryId filters as they might conflict with productType filtering
      const params: any = {
        venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
        quantityMin: 1, // Only in-stock
        limit: 200, // Fetch more products initially
      }

      // Add sorting for beginner-friendly preset
      if (presetId === 'beginner-friendly') {
        params.sort = 'labs.thcMax' // Sort by THC low to high (ascending)
      }

      // Fetch products (try pagination, but if it fails, use single request)
      let allProducts: Product[] = []
      try {
        allProducts = await fetchAllProducts(params)
      } catch (err) {
        // If pagination fails, try single request
        console.warn('Pagination failed, trying single request:', err)
        const res = await productService.list(params)
        allProducts = res.data || []
      }
      
      // If still no products, try without quantityMin filter
      if (allProducts.length === 0 && presetId !== 'pre-rolls-ready') {
        const fallbackParams = { ...params }
        delete fallbackParams.quantityMin
        const res = await productService.list(fallbackParams)
        allProducts = res.data || []
      }

      // Apply strict preset filtering
      const filteredProducts = filterByPreset(allProducts, presetId)

      // Debug logging (remove in production)
      console.log(`Preset: ${presetId}`, {
        totalProducts: allProducts.length,
        filteredProducts: filteredProducts.length,
        sampleProduct: allProducts[0] ? {
          type: allProducts[0].type,
          category: allProducts[0].category,
          productType: getProductType(allProducts[0]),
          strain: allProducts[0].strain,
          cannabisType: allProducts[0].cannabisType,
          effects: allProducts[0].effects,
        } : null,
      })

      setProducts(filteredProducts)
      setBaseProducts(filteredProducts)
      setSearchDescription(
        filteredProducts.length > 0
          ? `${preset.description} - Found ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`
          : `No products available matching this preset. (Searched ${allProducts.length} products)`
      )
    } catch (err) {
      console.error('Error searching products:', err)
      setProducts([])
      setBaseProducts([])
      setSearchDescription('Sorry, there was an error searching for products.')
    } finally {
      setLoading(false)
    }
  }

  // Check if query is product-related or general question
  const isProductQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase().trim()
    
    // First, check if it's clearly an informational question
    const questionPatterns = [
      /^what (is|are|does|do|can|will|should|would|was|were)/i,
      /^how (does|do|can|will|should|would|is|are|was|were)/i,
      /^why (does|do|can|will|should|would|is|are|was|were)/i,
      /^when (does|do|can|will|should|would|is|are|was|were)/i,
      /^where (does|do|can|will|should|would|is|are|was|were)/i,
      /^who (is|are|does|do|can|will|should|would|was|were)/i,
      /^tell me (about|what|how|why)/i,
      /^explain (what|how|why|when|where|who)/i,
      /^can you (explain|tell|describe|help)/i,
      /^could you (explain|tell|describe|help)/i,
      /^i want to know (about|what|how|why)/i,
      /^what's the (difference|meaning|definition)/i,
      /^what does (it|this|that|.*) mean/i,
      /^difference between/i,
    ]
    
    // If it matches a question pattern, it's NOT a product query (route to ChatGPT)
    if (questionPatterns.some(pattern => pattern.test(lowerQuery))) {
      return false
    }
    
    // Check for explicit product search intent - prioritize these patterns
    const productSearchPatterns = [
      // Explicit search commands with product types
      /^(show|find|search|get|need|want|looking for|buy|purchase|shop).*(product|products|item|items|flower|vape|edible|pre-roll|preroll|concentrate|tincture|beverage|topical)/i,
      // Explicit search commands with strain types
      /^(show|find|search|get|need|want|looking for|buy|purchase|shop).*(indica|sativa|hybrid|strain|strains|brand|brands)/i,
      // "show me", "find me", etc. with products
      /^(show me|find me|get me|search for|looking for|shop for).*(product|products|item|items|flower|vape|edible|pre-roll|preroll|concentrate|tincture|beverage|topical|indica|sativa|hybrid|strain|strains)/i,
      // Price/deal searches
      /^(show|find|search|get|need|want|looking for|buy|purchase|shop).*(price|cost|discount|sale|deal|deals|cheap|affordable)/i,
      // Any query that explicitly says "products" or "items"
      /.*\b(product|products|item|items)\b.*/i,
    ]
    
    // If it matches a product search pattern, it IS a product query
    if (productSearchPatterns.some(pattern => pattern.test(lowerQuery))) {
      return true
    }
    
    // Check for standalone product keywords (only if not a question)
    const productKeywords = [
      'flower', 'vape', 'edible', 'pre-roll', 'preroll', 'concentrate', 'tincture', 'beverage', 'topical',
      'indica', 'sativa', 'hybrid', 'thc', 'cbd', 'strain', 'brand', 'product', 'products', 'buy', 'purchase', 'shop',
      'price', 'cost', 'discount', 'sale', 'deal', 'deals'
    ]
    
    // If it contains product keywords and has search intent words, treat as product query
    const searchIntentWords = ['show', 'find', 'search', 'get', 'need', 'want', 'looking', 'buy', 'purchase', 'shop', 'see', 'display', 'list']
    const hasSearchIntent = searchIntentWords.some(word => lowerQuery.includes(word))
    const hasProductKeyword = productKeywords.some(keyword => lowerQuery.includes(keyword))
    
    if (hasSearchIntent && hasProductKeyword) {
      return true
    }
    
    // If it contains product keywords but is very short (likely a category search), treat as product query
    if (lowerQuery.split(/\s+/).length <= 3 && hasProductKeyword) {
      return true
    }
    
    // Default: if it's a longer query with product keywords but no clear search intent, treat as informational
    return false
  }

  // Call OpenAI API for chat responses
  const callOpenAI = async (userMessage: string, concise: boolean = false, requestId?: string): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }
    const systemPrompt = concise
      ? `You are a helpful assistant for a cannabis dispensary called "Just A Little Higher" (JALH) in New York. Provide concise, educational answers (2-4 sentences maximum). Be friendly, knowledgeable, and compliant with cannabis regulations. Keep responses brief and to the point.

About JALH: ${about.summary}

Available Locations:
${stores.map(s => `- ${s.name}: ${s.address || `${s.addressLine1}, ${s.addressLine2}`}${s.status === 'coming_soon' ? ' (Coming Soon)' : ''}${s.phone ? ` | Phone: ${s.phone}` : ''}${s.hoursDisplay ? ` | Hours: ${s.hoursDisplay}` : ''}`).join('\n')}

If asked about specific products, you can mention that the customer can search for them using the product search feature. If asked about store locations, hours, or contact info, provide accurate information from the list above.`
      : `You are a helpful assistant for a cannabis dispensary called "Just A Little Higher" (JALH) in New York. You help customers with questions about cannabis products, effects, usage, and general information. Be friendly, knowledgeable, and compliant with cannabis regulations.

About JALH: ${about.summary}

Available Locations:
${stores.map(s => `- ${s.name}: ${s.address || `${s.addressLine1}, ${s.addressLine2}`}${s.status === 'coming_soon' ? ' (Coming Soon)' : ''}${s.phone ? ` | Phone: ${s.phone}` : ''}${s.hoursDisplay ? ` | Hours: ${s.hoursDisplay}` : ''}`).join('\n')}

If asked about specific products, you can mention that the customer can search for them using the product search feature. If asked about store locations, hours, or contact info, provide accurate information from the list above.`
    
    try {
      log('openai-call', { requestId, userMessage, concise })
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...chatMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      log('openai-response', { requestId, usage: data?.usage })
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      return 'Sorry, I encountered an error. Please try again.'
    }
  }

  // Helper functions for category ID lookup (must be defined before use)
  const findCategoryIdFromQuery = (text: string): string | null => {
    const lower = text.toLowerCase().trim()
    
    // First check category keywords (synonyms)
    for (const entry of CATEGORY_KEYWORDS) {
      if (entry.labels.some((label) => lower === label || lower.includes(label))) {
        return entry.id
      }
    }
    
    // Then check official category names
    for (const cat of CATEGORY_DEFS) {
      if (lower === cat.name.toLowerCase() || lower === cat.slug || lower.includes(cat.name.toLowerCase())) {
        return cat.id
      }
    }
    
    return null
  }
  
  const findCategoryIdFromCategoryName = (categoryName: string): string | null => {
    // Map category name to ID
    const cat = CATEGORY_DEFS.find((c) => c.name === categoryName)
    return cat?.id || null
  }

  // Helper to generate filter description for messages
  function getFilterDescription(filters: ExtractedFilters): string {
    const parts: string[] = []
    
    if (filters.strainType) {
      parts.push(filters.strainType.toLowerCase())
    }
    if (filters.category) {
      parts.push(filters.category.toLowerCase())
    }
    if (filters.terpenes && filters.terpenes.length > 0) {
      parts.push(`${filters.terpenes[0].toLowerCase()}-containing`)
    }
    if (filters.discountedOnly) {
      parts.push('discounted')
    }
    if (filters.brand) {
      parts.push(`${filters.brand} brand`)
    }
    
    if (parts.length === 0) {
      return 'product'
    }
    
    return parts.join(' ')
  }

  // Enhanced product search with filters (pure: no chat appends)
  type SearchFilters = ExtractedFilters & { guidedModality?: 'smoke-free' | 'inhalable' }

  const searchProductsWithFilters = async (
    filters: SearchFilters,
    userQuery: string,
    requestId?: string
  ): Promise<{ products: Product[]; summary: string }> => {
    if (!userQuery.trim()) return { products: [], summary: '' }

    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    if (inFlightRequestIds.current.has(rid)) {
      log('skip-inflight', { requestId: rid, query: userQuery })
      return { products: [], summary: '' }
    }
    inFlightRequestIds.current.add(rid)
    // Prevent duplicate processing - check if we're already processing this exact query
    const queryKey = `${userQuery.trim()}-${JSON.stringify(filters)}`
    if (processingRef.current && lastProcessedQueryRef.current === queryKey) {
      log('skip-duplicate-query', { requestId: rid, query: userQuery })
      inFlightRequestIds.current.delete(rid)
      return { products: [], summary: '' }
    }

    processingRef.current = true
    lastProcessedQueryRef.current = queryKey
    log('search-start', { requestId: rid, query: userQuery, filters })

    setLoading(true)
    setShowResults(true)
    setSelectedPreset(null)
    setSearchDescription('')
    // Hide pre-prompts when search starts
    setShowPrePrompts(false)

    try {
      // Build search params (server-side filtering where possible)
      const params: any = {
        venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
        limit: 200,
        quantityMin: 1,
      }

      // Category - use same API pattern as FilterNav/CategoryGrid
      if (filters.category) {
        // Try official category name first (from intentRouter)
        let categoryId = findCategoryIdFromCategoryName(filters.category)
        // Fallback to query-based lookup for synonyms
        if (!categoryId) {
          categoryId = findCategoryIdFromQuery(filters.category.toLowerCase())
        }
        if (categoryId) {
          params.categoryId = categoryId
          // Use same pattern as CategoryGrid: fetch with categoryId
          log('category-filter', { categoryName: filters.category, categoryId, requestId: rid })
        }
      }
      // Strain type
      if (filters.strainType) params.strainType = filters.strainType
      // Terpenes
      if (filters.terpenes && filters.terpenes.length) params.terpenes = filters.terpenes
      // Price
      if (filters.priceMin) params.priceMin = filters.priceMin
      if (filters.priceMax) params.priceMax = filters.priceMax
      // Discounted
      if (filters.discountedOnly) params.discountedOnly = true
      // Brand
      if (filters.brand) params.brand = filters.brand
      // Weight
      if (filters.weight) params.weight = filters.weight
      // THC max (low potency intent)
      if (filters.maxThc) params.thcMax = filters.maxThc
      // Free-text query as fallback
      if (filters.query) params.q = filters.query

      // Fetch products
      // If effectIntent is detected, fetch ALL products via pagination to ensure comprehensive results
      let allProducts: Product[] = []
      if (filters.effectIntent) {
        try {
          allProducts = await fetchAllProducts(params)
        } catch (err) {
          console.warn('Pagination failed for effect intent, trying single request:', err)
          const res = await productService.list(params)
          allProducts = res.data || []
        }
      } else {
        const res = await productService.list(params)
        allProducts = res.data || []
      }

      // Apply client-side filters
      // Priority 1: Strain type filtering (primary filter when effectIntent is detected)
      // BUT: If effectIntent is present, be more lenient - don't exclude products without strain data
      if (filters.strainType) {
        const targetStrain = filters.strainType.toLowerCase()
        const hasEffectIntent = !!filters.effectIntent
        
        // First, try strict filtering
        let filteredByStrain = allProducts.filter((p: Product) => {
          const strainType = getStrainType(p)
          if (!strainType) return false
          const strainLower = strainType.toLowerCase()
          // Match exact or leaning variants
          if (targetStrain === 'sativa') {
            return strainLower === 'sativa' || strainLower === 'sativa-leaning'
          }
          if (targetStrain === 'indica') {
            return strainLower === 'indica' || strainLower === 'indica-leaning'
          }
          if (targetStrain === 'hybrid') {
            return strainLower === 'hybrid'
          }
          return false
        })
        
        // If we have effectIntent and strict filtering returned few/no results, be more lenient
        if (hasEffectIntent && filteredByStrain.length < 10) {
          log('strain-filter-lenient', { 
            requestId: rid, 
            strictCount: filteredByStrain.length, 
            totalCount: allProducts.length,
            effectIntent: filters.effectIntent 
          })
          // Include products that match strain type OR products without strain data (they might still match effects)
          filteredByStrain = allProducts.filter((p: Product) => {
            const strainType = getStrainType(p)
            // If no strain type data, include it (will be filtered by effects if available)
            if (!strainType) return true
            const strainLower = strainType.toLowerCase()
            // Match exact or leaning variants
            if (targetStrain === 'sativa') {
              return strainLower === 'sativa' || strainLower === 'sativa-leaning'
            }
            if (targetStrain === 'indica') {
              return strainLower === 'indica' || strainLower === 'indica-leaning'
            }
            if (targetStrain === 'hybrid') {
              return strainLower === 'hybrid'
            }
            return false
          })
        } else {
          log('strain-filter-strict', { 
            requestId: rid, 
            filteredCount: filteredByStrain.length, 
            totalCount: allProducts.length,
            hasEffectIntent 
          })
        }
        
        allProducts = filteredByStrain
      }

      // Priority 2: Effect intent filtering (optional - only if products have effects data)
      // This is a secondary filter that enhances results but doesn't exclude products without effects
      if (filters.effectIntent) {
        const effectIntent = filters.effectIntent.toLowerCase()
        const effectKeywords = EFFECT_KEYWORDS[effectIntent as keyof typeof EFFECT_KEYWORDS]
        
        if (effectKeywords && effectKeywords.preferredEffects) {
          const preferredEffects = effectKeywords.preferredEffects.map((e: string) => e.toLowerCase())
          
          // Separate products with effects data from those without
          const productsWithEffects: Product[] = []
          const productsWithoutEffects: Product[] = []
          
          allProducts.forEach((p: Product) => {
            const productEffects = getTags(p) // Returns lowercase effects array
            if (productEffects.length > 0) {
              // Product has effects data - check if it matches
              const matches = preferredEffects.some((effect: string) => 
                productEffects.some((pe: string) => pe.includes(effect) || effect.includes(pe))
              )
              if (matches) {
                productsWithEffects.push(p)
              }
            } else {
              // Product doesn't have effects data - include it if it matches strain type
              // OR if we don't have strain type data (be lenient for effect-based searches)
              const strainType = getStrainType(p)
              if (!strainType || (filters.strainType && getStrainType(p)?.toLowerCase().includes(filters.strainType.toLowerCase()))) {
                productsWithoutEffects.push(p)
              }
            }
          })
          
          // Prioritize products with matching effects, but also include products without effects data
          // that match the strain type (since effect detection already set the correct strain type)
          // If we have products with effects, use those; otherwise fall back to all products
          if (productsWithEffects.length > 0) {
            allProducts = [...productsWithEffects, ...productsWithoutEffects]
            log('effect-filter-with-effects', { 
              requestId: rid, 
              withEffects: productsWithEffects.length, 
              withoutEffects: productsWithoutEffects.length,
              total: allProducts.length 
            })
          } else if (productsWithoutEffects.length > 0) {
            // No products with effects, but we have products without effects data - include them
            allProducts = productsWithoutEffects
            log('effect-filter-no-effects', { 
              requestId: rid, 
              withoutEffects: productsWithoutEffects.length,
              total: allProducts.length 
            })
          } else {
            // If both are empty, but we have effectIntent, show all products that passed strain filter
            // (fallback - better to show something than nothing)
            log('effect-filter-empty-fallback', { 
              requestId: rid, 
              originalCount: allProducts.length,
              effectIntent: filters.effectIntent 
            })
            // allProducts already contains strain-filtered products, so keep them
          }
        }
      }

      // Filter by terpenes if specified
      if (filters.terpenes && filters.terpenes.length > 0) {
        allProducts = allProducts.filter((p: Product) => {
          const productTerpenes = (p.labs?.terpenes || []).map((t: string) => t.toLowerCase())
          return filters.terpenes!.some(terp => 
            productTerpenes.some((pt: string) => pt.includes(terp.toLowerCase()))
          )
        })
      }

      // Guided modality filter (smoke-free vs inhalable)
      if (filters.guidedModality === 'smoke-free') {
        const excludedTypes = ['flower', 'preRoll', 'vape', 'concentrate']
        allProducts = allProducts.filter((p: Product) => {
          const t = getProductType(p)
          if (!t) return true
          return !excludedTypes.includes(t)
        })
      }
      if (filters.guidedModality === 'inhalable') {
        const allowedTypes = ['flower', 'preRoll', 'vape', 'concentrate']
        allProducts = allProducts.filter((p: Product) => {
          const t = getProductType(p)
          return !!t && allowedTypes.includes(t)
        })
      }

      // Filter by max THC (low potency)
      if (filters.maxThc) {
        allProducts = allProducts.filter((p: Product) => {
          const thcVal = getThcTotal(p, true)
          return thcVal === null || thcVal <= filters.maxThc!
        })
      }

      // Final safeguard: If we have effectIntent but 0 products, log and try fallback
      if (filters.effectIntent && allProducts.length === 0) {
        log('effect-filter-zero-results', { 
          requestId: rid, 
          effectIntent: filters.effectIntent,
          strainType: filters.strainType,
          originalParams: params,
          totalFetched: allProducts.length
        })
        // Try fetching again without strict filters to see if products exist
        try {
          const fallbackParams = { ...params }
          delete fallbackParams.categoryId // Remove category filter
          const fallbackRes = await productService.list(fallbackParams)
          const fallbackProducts = fallbackRes.data || []
          log('effect-filter-fallback-fetch', { 
            requestId: rid, 
            fallbackCount: fallbackProducts.length 
          })
          // If we got products, use them (user will see something rather than nothing)
          if (fallbackProducts.length > 0) {
            allProducts = fallbackProducts
          }
        } catch (err) {
          console.warn('Fallback fetch failed:', err)
        }
      }

      // Filter by price
      if (filters.priceMax) {
        allProducts = allProducts.filter((p: Product) => {
          const price = (p as any).priceFinal || p.price || 0
          return price <= filters.priceMax!
        })
      }
      if (filters.priceMin) {
        allProducts = allProducts.filter((p: Product) => {
          const price = (p as any).priceFinal || p.price || 0
          return price >= filters.priceMin!
        })
      }

      // Filter by discount
      if (filters.discountedOnly) {
        allProducts = allProducts.filter((p: Product) => getOnSale(p))
      }

      // Filter by brand if specified
      if (filters.brand) {
        const brandLower = filters.brand.toLowerCase()
        allProducts = allProducts.filter((p: Product) => {
          const brandName = (p.brand?.name || '').toLowerCase()
          return brandName.includes(brandLower)
        })
      }

      // Parse numeric THC/CBD queries like "thc 30" or "cbd 10"
      const thcQueryMatch = (filters.query || '').toLowerCase().match(/thc\\s*(\\d+(?:\\.\\d+)?)/)
      const cbdQueryMatch = (filters.query || '').toLowerCase().match(/cbd\\s*(\\d+(?:\\.\\d+)?)/)
      if (thcQueryMatch) {
        const thcThreshold = parseFloat(thcQueryMatch[1])
        allProducts = allProducts.filter((p: Product) => {
          const thcVal = getThcTotal(p, true)
          return thcVal !== null && thcVal >= thcThreshold
        })
      }
      if (cbdQueryMatch) {
        const cbdThreshold = parseFloat(cbdQueryMatch[1])
        allProducts = allProducts.filter((p: Product) => {
          const cbdVal = getCbdTotal(p)
          return cbdVal !== null && cbdVal >= cbdThreshold
        })
      }

      // Filter by THC range if specified
      if (filters.thcRange) {
        allProducts = allProducts.filter((p: Product) => {
          const thcVal = getThcTotal(p, true)
          if (thcVal === null) return false
          
          const range = filters.thcRange!
          if (range === '0-10%') {
            return thcVal >= 0 && thcVal < 10
          } else if (range === '10-20%') {
            return thcVal >= 10 && thcVal < 20
          } else if (range === '20-30%') {
            return thcVal >= 20 && thcVal < 30
          } else if (range === '30-40%') {
            return thcVal >= 30 && thcVal < 40
          } else if (range === '40%+') {
            return thcVal >= 40
          }
          return false
        })
      }

      // Keyword refinement across name/description/brand/strain/effects
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase()
        const words = lowerQuery.split(/\\s+/).filter(Boolean)
        allProducts = allProducts.filter((p: Product) => {
          const brandName = (p.brand?.name || '').toLowerCase()
          const strain = (p.strain || p.cannabisType || '').toLowerCase()
          const effects = (p.effects || []).join(' ').toLowerCase()
          const searchableText = `${p.name} ${p.description || ''} ${brandName} ${strain} ${effects}`.toLowerCase()
          // match any word
          return words.some(w => searchableText.includes(w))
      })
      }

      // Update active filters to sync with FilterNav
      const newActiveFilters: typeof activeFilters = {
        categories: filters.category ? [filters.category] : [],
        strains: filters.strainType ? [filters.strainType] : [],
        terpenes: filters.terpenes || [],
        thcRanges: filters.thcRange ? [filters.thcRange] : [],
        saleOnly: filters.discountedOnly || false,
      }
      setActiveFilters(newActiveFilters)

      // Limit results
      const sliced = allProducts.slice(0, 100)
      setProducts(sliced)
      setBaseProducts(sliced)
      setIsChatMode(false)
      // Hide pre-prompts when products are displayed
      setShowPrePrompts(false)

      // Generate descriptive summary
      const parts: string[] = []
      if (filters.category) {
        parts.push(filters.category)
      }
      if (filters.strainType) {
        parts.push(filters.strainType.toLowerCase())
      }
      if (filters.terpenes && filters.terpenes.length) {
        parts.push(`${filters.terpenes[0].toLowerCase()}-containing`)
      }
      if (filters.discountedOnly) {
        parts.push('discounted')
      }
      if (filters.brand) {
        parts.push(`${filters.brand} brand`)
      }
      
      const filterDesc = parts.length > 0 ? parts.join(' ') : 'products'
      const summary = sliced.length > 0 
        ? `${filterDesc.charAt(0).toUpperCase() + filterDesc.slice(1)} - Found ${sliced.length} product${sliced.length !== 1 ? 's' : ''}`
        : `No ${filterDesc} available.`
      
      return { products: sliced, summary }
    } catch (err) {
      console.error('Error searching products:', err)
      setProducts([])
      setBaseProducts([])
      setIsChatMode(false)
      return { products: [], summary: '' }
    } finally {
      setLoading(false)
      // Reset processing flag after a short delay to allow for async operations
      setTimeout(() => {
        processingRef.current = false
      }, 500)
      inFlightRequestIds.current.delete(rid)
    }
  }

  // Legacy search function (kept for compatibility)
  const searchProducts = async (searchQuery: string) => {
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    const intentResult = routeIntent(searchQuery)
    await searchProductsWithFilters(intentResult.extracted, searchQuery, requestId)
  }

  // Handle store info queries
  const handleStoreInfo = (intentResult: ReturnType<typeof routeIntent>, userQuery: string, requestId?: string) => {
    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    let response = ''
    const lowerQuery = userQuery.toLowerCase()

    if (intentResult.needsStoreDisambiguation) {
      // List all stores
      response = 'Which location would you like information about?\n\n'
      stores.forEach((store, idx) => {
        response += `${idx + 1}. ${store.name}\n   ${store.address || `${store.addressLine1}, ${store.addressLine2}`}\n`
      })
    } else {
      // Find specific store
      const storeId = intentResult.storeIdGuess
      const store = stores.find(s => s.id === storeId)

      if (store) {
        response = `**${store.name}**\n\n`
        response += `📍 Address: ${store.address || `${store.addressLine1}, ${store.addressLine2}`}\n`
        
        if (store.phone) {
          response += `📞 Phone: ${store.phone}\n`
        }
        
        if (store.ocm) {
          response += `📋 OCM License: ${store.ocm}\n`
        }
        
        if (store.status === 'coming_soon') {
          response += `\n🚧 **Coming Soon**\n`
          response += `Hours are not yet available for this location.`
        } else if (store.hoursDisplay) {
          response += `\n🕐 Hours: ${store.hoursDisplay}\n`
        } else {
          response += `\n🕐 Hours: Not listed yet.\n`
        }
        
        if (store.services && store.services.length > 0) {
          response += `\n✅ Services: ${store.services.join(', ')}\n`
        }
      } else {
        response = 'I couldn\'t find that location. Which location would you like information about?\n\n'
        stores.slice(0, 3).forEach((store, idx) => {
          response += `${idx + 1}. ${store.name}\n   ${store.address || `${store.addressLine1}, ${store.addressLine2}`}\n`
        })
      }
    }

    appendAssistantMessage(response, rid)
    setIsChatMode(true)
    setShowResults(false)
  }

  // Handle EDUCATION_WITH_PRODUCTS: single-turn response with explanation + products
  const handleEducationWithProducts = async (userQuery: string, filters: ExtractedFilters, requestId?: string) => {
    if (!userQuery.trim()) return

    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`

    setLoading(true)
    setIsChatMode(true)
    setShowResults(true)

    try {
      // Step 1: Get concise explanation
      const explanation = await callOpenAI(userQuery, true, rid)
      
      // Step 2: Search products (pure search, no message appends)
      const { products } = await searchProductsWithFilters(filters, userQuery, rid)
      
      // Step 3: Generate CTA line
      const filterDesc = getFilterDescription(filters)
      const ctaLine = filterDesc 
        ? `We carry ${filterDesc} options too — here are some available now.`
        : `Here are some options available now.`
      
      // Step 4: Create single assistant message with explanation + CTA
      const combinedContent = `${explanation}\n\n${ctaLine}`
      appendAssistantMessage(combinedContent, rid)
      
      setIsChatMode(false)
    } catch (error) {
      console.error('Error in education with products:', error)
      appendAssistantMessage('Sorry, I encountered an error. Please try again.', rid)
      setIsChatMode(true)
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle chat query (non-product questions)
  const handleChatQuery = async (userQuery: string, concise: boolean = false, requestId?: string) => {
    if (!userQuery.trim()) return

    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    setLoading(true)
    setIsChatMode(true)
    setShowResults(false)
    setProducts([])
    setBaseProducts([])

    try {
      const aiResponse = await callOpenAI(userQuery, concise, rid)
      appendAssistantMessage(aiResponse, rid)
    } catch (error) {
      console.error('Error in chat query:', error)
      appendAssistantMessage('Sorry, I encountered an error. Please try again.', rid)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChip = (category: string) => {
    setHasInteracted(true)
    setShowDropdown(false)
    // Reuse searchProducts to run through intent router and append user message
    searchProducts(category)
  }

  const runGuidedSearch = async (feel?: string | null, modality?: string | null, requestId?: string) => {
    const rid =
      requestId || guidedPrompt.requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    const queryParts = [feel, modality].filter(Boolean).join(' ')

    // Keep guided state active so user can refine
    setGuidedPrompt({
      active: true,
      requestId: rid,
      feel: feel ?? guidedPrompt.feel ?? null,
      modality: modality ?? guidedPrompt.modality ?? null,
    })

    appendAssistantMessage(
      `Here are some picks${feel ? ` for ${feel}` : ''}${modality ? ` (${modality})` : ''}.`,
      rid
    )
    const guidedModality =
      modality === 'Smoke-free' ? 'smoke-free' : modality === 'Inhalable' ? 'inhalable' : undefined
    await searchProductsWithFilters(
      { query: queryParts, guidedModality },
      queryParts || 'find what fits me',
      rid
    )
  }

  const getActiveStoreId = () => {
    return selectedLocation || currentStoreId || params?.storeId || ''
  }

  const formatStoreInfo = (store: (typeof stores)[number]) => {
    const statusLabel = store.status === 'coming_soon' ? 'Coming Soon' : 'Open'
    const hours = store.hoursDisplay || 'Not listed yet'
    const phone = store.phone || 'Not listed yet'
    const license = store.ocm || 'Not listed yet'
    const address = store.address || `${store.addressLine1}, ${store.addressLine2}`
    return `${store.name} (${statusLabel})
${address}
Hours: ${hours}
Phone: ${phone}
License: ${license}`
  }

  const handleStoreInfoPrompt = (requestId: string, storeId?: string) => {
    const sid = storeId || getActiveStoreId()
    const store = stores.find((s) => s.id === sid)
    if (store) {
      const now = Date.now()
      if (lastStoreInfoRef.current.id === store.id && now - lastStoreInfoRef.current.ts < 1200) {
        return
      }
      lastStoreInfoRef.current = { id: store.id, ts: now }
      const lines = formatStoreInfo(store).split('\n')
      lines.forEach((line, idx) => {
        appendAssistantMessage(line, `${requestId}-line-${idx}`)
      })
      setStoreInfoPrompt({ active: false, requestId: null })
      return
    }
    // Ask for location selection
    appendAssistantMessage('Which location do you want info for?', requestId)
    setStoreInfoPrompt({ active: true, requestId })
  }

  const handleQuickPromptClick = async (promptId: string) => {
    setHasInteracted(true)
    setShowPrePrompts(false)
    setShowDropdown(false)
    const rid = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    
    const prompt = PRE_PROMPTS.find((p) => p.id === promptId)
    if (!prompt) return

    if (prompt.type === 'store-info') {
      handleStoreInfoPrompt(rid)
      return
    }

    if (prompt.type === 'browse') {
      // Category-specific browse (e.g., "Browse vapes")
      if (prompt.category) {
        const categoryId = findCategoryIdFromCategoryName(prompt.category)
        if (categoryId) {
          appendAssistantMessage(`Browsing ${prompt.category.toLowerCase()}...`, rid)
          await searchProductsWithFilters({ category: prompt.category }, `browse ${prompt.category.toLowerCase()}`, rid)
        } else {
          appendAssistantMessage('Browsing across all categories...', rid)
          await searchProductsWithFilters({}, 'show me options', rid)
        }
      } else {
        // General browse (all categories)
        appendAssistantMessage('Browsing across all categories...', rid)
        await searchProductsWithFilters({}, 'show me options', rid)
      }
      return
    }

    if (prompt.type === 'curated') {
      if (prompt.id === 'best-sellers') {
        appendAssistantMessage('Here are our best sellers right now.', rid)
        await searchProductsWithFilters({ discountedOnly: false }, 'show me best sellers', rid)
        return
      }

      appendAssistantMessage('Here are a few standout picks right now.', rid)
      await searchProductsWithFilters({ discountedOnly: true }, 'what’s good right now', rid)
      return
    }
  }

  const handleGuidedSelection = async (field: 'feel' | 'modality', value: string) => {
    if (!guidedPrompt.active || !guidedPrompt.requestId) return
    const next = { ...guidedPrompt, [field]: value }
    setGuidedPrompt(next)
    // If both answered, run; otherwise keep waiting for the second answer
    if (next.feel && next.modality) {
      await runGuidedSearch(next.feel, next.modality, next.requestId || undefined)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setHasInteracted(true)
    setShowPrePrompts(false)
    // Map text prompts to presets
    const promptMap: Record<string, PresetId> = {
      'relax and unwind': 'relax-unwind',
      'relax': 'relax-unwind',
      'sleep support': 'sleep-support',
      'sleep': 'sleep-support',
      'uplifted': 'uplifted-energized',
      'energized': 'uplifted-energized',
      'sativa': 'uplifted-energized',
      'beginner': 'beginner-friendly',
      'mild': 'beginner-friendly',
      'low thc': 'beginner-friendly',
      'high thc': 'strong-high-thc',
      'strong': 'strong-high-thc',
      'pre-rolls': 'pre-rolls-ready',
      'preroll': 'pre-rolls-ready',
      'non-smokable': 'non-smokable',
      'edibles': 'non-smokable',
      'best deals': 'best-deals',
      'deals': 'best-deals',
      'sale': 'best-deals',
    }

    // Note: Preset mapping removed - now using filter-based search system
    // Fallback to free-text search
    setQuery(prompt)
    searchProducts(prompt)
  }

  // Clear/reset chat function
  const handleClearChat = () => {
    setChatMessages([])
    setProducts([])
    setBaseProducts([])
    setShowResults(false)
    setIsChatMode(false)
    setShowPrePrompts(true)
    setQuery('')
    setSelectedPreset(null)
    setSearchDescription('')
    setActiveFilters({})
    setLoading(false)
    setShowDropdown(false)
    setStoreInfoPrompt({ active: false, requestId: null })
    setGuidedPrompt({ active: false, requestId: null, feel: null, modality: null })
    setHasInteracted(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSubmitting) return

    const trimmedQuery = query.trim()
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    log('submit', { requestId, query: trimmedQuery })
    setHasInteracted(true)
    
    // Prevent duplicate submissions - check if this exact query was just processed
    const now = Date.now()
    const recent = lastSubmitRef.current
    const submitKey = trimmedQuery
    if (recent && recent.key === submitKey && now - recent.ts < 2000) {
      log('prevent-duplicate-submit', { requestId, query: trimmedQuery })
      return
    }
    lastSubmitRef.current = { key: submitKey, ts: now }

    setIsSubmitting(true)
    
    // Route intent using the intent router
    const intentResult = routeIntent(trimmedQuery)
    
    // Append user once per submit (all intents)
    appendUserMessage(trimmedQuery, requestId)
    
    // Hide pre-prompts when user submits a query
    setShowPrePrompts(false)

    try {
      switch (intentResult.intent) {
        case 'STORE_INFO':
          handleStoreInfo(intentResult, trimmedQuery, requestId)
          break
          
        case 'PRODUCT_SHOPPING': {
          await searchProductsWithFilters(intentResult.extracted, trimmedQuery, requestId)
          break
        }
          
        case 'PRODUCT_INFO': {
          await searchProductsWithFilters(intentResult.extracted, trimmedQuery, requestId)
          break
        }
          
        case 'EDUCATION_WITH_PRODUCTS':
          await handleEducationWithProducts(trimmedQuery, intentResult.extracted, requestId)
          break
          
        case 'MIXED':
          await handleChatQuery(trimmedQuery, false, requestId)
          setTimeout(async () => {
            await searchProductsWithFilters(intentResult.extracted, trimmedQuery, requestId)
          }, 500)
          break
          
        case 'GENERAL_EDUCATION':
          await handleChatQuery(trimmedQuery, false, requestId)
          if (hasShoppableFilters(intentResult.extracted)) {
            setTimeout(() => {
              const filterDesc = getFilterDescription(intentResult.extracted)
              if (filterDesc) {
                appendAssistantMessage(`Want me to pull ${filterDesc} options from the menu?`, requestId)
              }
            }, 1500)
          }
          break
          
        default:
          await handleChatQuery(trimmedQuery, false, requestId)
          break
      }
    } finally {
      setQuery('')
      setIsSubmitting(false)
      // Safety: ensure loading is cleared even if any nested path missed it
      setLoading(false)
    }
  }

  // Helper to check if filters are shoppable
  function hasShoppableFilters(filters: ExtractedFilters): boolean {
    return !!(
      filters.strainType ||
      filters.category ||
      (filters.terpenes && filters.terpenes.length > 0) ||
      filters.discountedOnly ||
      filters.brand
    )
  }

  const chipEmoji: Record<PresetId, string> = {
    'relax-unwind': '🌿',
    'sleep-support': '🛌',
    'uplifted-energized': '⚡️',
    'beginner-friendly': '🙂',
    'strong-high-thc': '🚀',
    'pre-rolls-ready': '🔥',
    'non-smokable': '🍬',
    'best-deals': '💸',
  }

  const getFacetOptions = (items: Product[]) => {
    const categories = new Set<string>()
    const brands = new Set<string>()
    const strains = new Set<string>()
    const terpenes = new Set<string>()
    const weights = new Set<string>()

    items.forEach((p) => {
      const name = getCategoryLabel(p)
      if (name) categories.add(name)
      if (p.brand?.name) brands.add(p.brand.name)
      if (p.strain) strains.add(p.strain)
      if (p.cannabisType) strains.add(p.cannabisType)
      p.labs?.terpenes?.forEach((t) => terpenes.add(t))
      const weightLabel =
        p.weightFormatted ||
        (p.weight ? `${p.weight}${p.weightUnit ? ` ${p.weightUnit.toLowerCase()}` : ''}` : null)
      if (weightLabel) weights.add(weightLabel)
    })

    const sortFn = (a: string, b: string) => a.localeCompare(b)

    // Force official category ordering
    const orderedCategories = CATEGORY_DEFS.map((c) => c.name).filter((name) => categories.has(name))

    return {
      categories: orderedCategories,
      brands: Array.from(brands).sort(sortFn),
      strains: Array.from(strains).sort(sortFn),
      terpenes: Array.from(terpenes).sort(sortFn),
      weights: Array.from(weights).sort(sortFn),
    }
  }

  const getFacetCounts = (items: Product[]) => {
    const categoryCounts: Record<string, number> = {}
    const brandCounts: Record<string, number> = {}
    const strainCounts: Record<string, number> = {}
    const terpeneCounts: Record<string, number> = {}
    const weightCounts: Record<string, number> = {}

    items.forEach((p) => {
      const name = getCategoryLabel(p)
      if (name) categoryCounts[name] = (categoryCounts[name] || 0) + 1
      const brandName = p.brand?.name
      if (brandName) brandCounts[brandName] = (brandCounts[brandName] || 0) + 1

      const strainVal = (p.strain || p.cannabisType)?.trim()
      if (strainVal) strainCounts[strainVal] = (strainCounts[strainVal] || 0) + 1

      const weightLabel =
        p.weightFormatted ||
        (p.weight ? `${p.weight}${p.weightUnit ? ` ${p.weightUnit.toLowerCase()}` : ''}` : '')
      if (weightLabel) weightCounts[weightLabel] = (weightCounts[weightLabel] || 0) + 1

      p.labs?.terpenes?.forEach((t) => {
        if (t) terpeneCounts[t] = (terpeneCounts[t] || 0) + 1
      })
    })

    // Ensure every official category key exists
    CATEGORY_DEFS.forEach((c) => {
      if (!(c.name in categoryCounts)) categoryCounts[c.name] = 0
    })

    return { categories: categoryCounts, brands: brandCounts, strains: strainCounts, terpenes: terpeneCounts, weights: weightCounts }
  }

  const isOnSale = (p: Product) =>
    !!(
      p.discountAmountFinal ||
      p.discountValueFinal ||
      (p.discounts && p.discounts.length > 0)
    )

  const applyFilters = (items: Product[], filters: { categories?: string[]; brands: string[]; strains: string[]; terpenes: string[]; weights: string[]; thcRanges?: string[]; saleOnly: boolean }) => {
    return items.filter((p) => {
      if (filters.categories && filters.categories.length) {
        const cat = getCategoryLabel(p)
        if (!cat || !filters.categories.includes(cat)) return false
      }

      if (filters.saleOnly && !isOnSale(p)) return false

      if (filters.brands.length) {
        const brandName = p.brand?.name || ''
        if (!filters.brands.includes(brandName)) return false
      }

      if (filters.strains.length) {
        // Support BOTH:
        // - strain names (e.g. "Blue Dream")
        // - strain types (Sativa/Indica/Hybrid) incl. leaning variants
        const selected = filters.strains.map((s) => (s || '').toLowerCase().trim()).filter(Boolean)
        const strainName = ((p.strain || '').trim() || '').toLowerCase()
        const cannabisType = ((p.cannabisType || '').trim() || '').toLowerCase()
        const strainType = (getStrainType(p) || '').toLowerCase() // sativa / indica / hybrid / sativa-leaning / indica-leaning
        const blob = `${p.name || ''} ${p.description || ''} ${cannabisType} ${strainName}`.toLowerCase()

        const matches = selected.some((sel) => {
          // Exact matches for names/types coming from data
          if (sel === strainName || sel === cannabisType || sel === strainType) return true
          // If user picked "sativa", also match "sativa-leaning"
          if (sel === 'sativa') {
            return (
              strainType === 'sativa' ||
              strainType === 'sativa-leaning' ||
              cannabisType.includes('sativa') ||
              blob.includes('sativa')
            )
          }
          if (sel === 'indica') {
            return (
              strainType === 'indica' ||
              strainType === 'indica-leaning' ||
              cannabisType.includes('indica') ||
              blob.includes('indica')
            )
          }
          if (sel === 'hybrid') {
            return strainType === 'hybrid' || cannabisType.includes('hybrid') || blob.includes('hybrid')
          }
          return false
        })

        if (!matches) return false
      }

      if (filters.weights.length) {
        const weightLabel =
          p.weightFormatted ||
          (p.weight ? `${p.weight}${p.weightUnit ? ` ${p.weightUnit.toLowerCase()}` : ''}` : '')
        if (!weightLabel || !filters.weights.includes(weightLabel)) return false
      }

      if (filters.terpenes.length) {
        const terpList = p.labs?.terpenes || []
        if (!terpList.some((t) => filters.terpenes.includes(t))) return false
      }

      if (filters.thcRanges && filters.thcRanges.length > 0) {
        const thcVal = getThcTotal(p, true)
        if (thcVal === null) return false
        
        const matchesRange = filters.thcRanges.some((range) => {
          if (range === '0-10%') {
            return thcVal >= 0 && thcVal < 10
          } else if (range === '10-20%') {
            return thcVal >= 10 && thcVal < 20
          } else if (range === '20-30%') {
            return thcVal >= 20 && thcVal < 30
          } else if (range === '30-40%') {
            return thcVal >= 30 && thcVal < 40
          } else if (range === '40%+') {
            return thcVal >= 40
          }
          return false
        })
        if (!matchesRange) return false
      }

      return true
    })
  }

  const mergedFacetSource = useMemo(() => {
    const map = new Map<string, Product>()
    ;[...allProductsGlobal, ...baseProducts, ...products].forEach((p) => {
      if (p?.id) map.set(p.id, p)
    })
    return Array.from(map.values())
  }, [allProductsGlobal, baseProducts, products])

  const facetSource = mergedFacetSource.length
    ? mergedFacetSource
    : allProductsGlobal.length
    ? allProductsGlobal
    : baseProducts.length
    ? baseProducts
    : products

  const facets = getFacetOptions(facetSource)
  const facetCounts = getFacetCounts(facetSource)
  
  // Merge API-fetched category counts (more accurate) with computed counts
  const mergedCategoryCounts = useMemo(() => {
    const merged = { ...facetCounts.categories }
    Object.keys(categoryCountsByApi).forEach((catName) => {
      if (categoryCountsByApi[catName] > 0) {
        merged[catName] = categoryCountsByApi[catName]
      }
    })
    return merged
  }, [facetCounts.categories, categoryCountsByApi])
  
  // Always show all official categories in order
  const categoryOptions = CATEGORY_DEFS.map((c) => c.name)
  
  // Merge counts with API-fetched category counts
  const finalFacetCounts = {
    ...facetCounts,
    categories: mergedCategoryCounts,
  }

  const handleFiltersChange = async (f: any) => {
    const hasOtherFacetFilters = !!(
      f.brands?.length ||
      f.strains?.length ||
      f.terpenes?.length ||
      f.weights?.length ||
      f.thcRanges?.length ||
      f.saleOnly
    )

    // When categories are selected (with or without other filters), always fetch category products first
    // Then apply other filters client-side to ensure we don't miss matches
    if (f.categories && f.categories.length > 0) {
      const selectedCategories = CATEGORY_DEFS.filter((c) => f.categories.includes(c.name))
      if (selectedCategories.length > 0) {
        setLoading(true)
        try {
          // IMPORTANT: don't cap at 200. Multi-filtering (e.g. Flower + Sativa) can easily
          // miss matches if they aren't in the first page. Pull the full category set (paged)
          // then apply remaining filters client-side.
          const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!
          const lists = await Promise.all(
            selectedCategories.map((cat) =>
              fetchAllProducts({
                venueId,
                categoryId: cat.id,
                quantityMin: 1,
              })
            )
          )
          const combined = lists.flat()
          // Deduplicate by product id
          const byId = new Map<string, Product>()
          combined.forEach((p: any) => {
            if (p?.id) byId.set(p.id, p)
          })
          let categoryProducts: Product[] = Array.from(byId.values())
          
          // If there are other filters (strains, brands, etc.), apply them to category products
          // IMPORTANT: Don't check categories again since we already fetched by categoryId
          if (hasOtherFacetFilters) {
            // Create filters without categories to avoid double-filtering
            // Explicitly set categories to empty array so applyFilters skips category check
            const filtersWithoutCategories = {
              categories: [],
              brands: f.brands || [],
              strains: f.strains || [],
              terpenes: f.terpenes || [],
              weights: f.weights || [],
              thcRanges: f.thcRanges || [],
              saleOnly: f.saleOnly || false
            }
            console.log('Applying filters to category products:', {
              categoryProductsCount: categoryProducts.length,
              filters: filtersWithoutCategories,
              selectedCategories: selectedCategories.map(c => c.name)
            })
            const beforeCount = categoryProducts.length
            categoryProducts = applyFilters(categoryProducts, filtersWithoutCategories)
            console.log('After applying filters:', {
              beforeCount,
              afterCount: categoryProducts.length,
              sampleProduct: categoryProducts[0] ? {
                name: categoryProducts[0].name,
                strain: categoryProducts[0].strain,
                cannabisType: categoryProducts[0].cannabisType,
                categoryLabel: getCategoryLabel(categoryProducts[0])
              } : null
            })
          }
          
          setProducts(categoryProducts)
          setBaseProducts(categoryProducts)
          setShowResults(true)
          setActiveFilters(f)
          setSearchDescription(
            categoryProducts.length
              ? `${selectedCategories.length === 1 ? selectedCategories[0].name : 'Selected categories'}${hasOtherFacetFilters ? ' with filters' : ''} - Found ${categoryProducts.length} product${categoryProducts.length !== 1 ? 's' : ''}`
              : `No products available for these category + filter selections.`
          )
        } catch (err) {
          console.error('Error fetching category products:', err)
          setProducts([])
          setSearchDescription('Error loading products.')
        } finally {
          setLoading(false)
        }
        return
      }
    }
    
    // For non-category filters, use existing logic
    const source = mergedFacetSource.length
      ? mergedFacetSource
      : allProductsGlobal.length
      ? allProductsGlobal
      : baseProducts.length
      ? baseProducts
      : products
    const filtered = applyFilters(source, f)
    setProducts(filtered)
    setShowResults(true)
    setActiveFilters(f)
    setSearchDescription(
      filtered.length
        ? `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`
        : 'No products available for these filters.'
    )
  }

  const hasFacetData = facetSource.length > 0

  return (
    <section id="ai-search-anchor" className="relative title-padding-top">
      <div className="mx-auto max-w-6xl w-full">
        {/* Title removed per request; restore if needed */}

        {/* Banner moved above the search box */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm mb-4">
          <div className="relative h-40 sm:h-48">
            <Image
              src={bannerSlides[bannerIndex].img}
              alt={bannerSlides[bannerIndex].title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white px-6 text-center">
              <p className="text-xl sm:text-2xl font-semibold drop-shadow">{bannerSlides[bannerIndex].title}</p>
              <Link
                href={bannerSlides[bannerIndex].cta}
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-purple-700 shadow hover:bg-white"
              >
                Shop Deals
              </Link>
            </div>
          </div>
        </div>

        {/* Title - separated above chat input */}
        <div className="mx-auto max-w-6xl w-full mb-4">
          <div className="flex items-center gap-2 text-left text-[20px] sm:text-[26px] font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="titleSparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path
                fill="url(#titleSparkGradient)"
                d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
              />
            </svg>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-green-400 bg-clip-text text-transparent">
                Find your next favorite
              </span>
              <span className="relative h-[32px] overflow-hidden inline-flex items-center">
                <span
                  key={phrases[phraseIndex]}
                  className="animate-vertical-scroll inline-block text-[18px] sm:text-[22px] text-purple-700 font-semibold"
                >
                  {phrases[phraseIndex]}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Standalone chat input container with FilterNav integrated */}
        <div className="mx-auto max-w-6xl w-full">
          <div className="border border-purple-200 bg-white rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.06)] px-4 py-4">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700 transition"
                  aria-label="Submit search"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
                <input
                  id="ai-search-input"
                  ref={inputRef}
                  type="text"
                  value={query}
                  onFocus={() => {
                    if (enablePresetDropdown) setShowDropdown(true)
                  }}
                  onClick={() => {
                    if (enablePresetDropdown) setShowDropdown(true)
                  }}
                  placeholder="Search by mood, product, brands, or preference"
                  className="w-full pl-10 pr-16 py-4 bg-transparent border-none text-base text-black placeholder-gray-500 rounded-[16px] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                  onChange={(e) => {
                    setHasInteracted(true)
                    setQuery(e.target.value)
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (recognitionRef.current) {
                      try {
                        setIsListening(true)
                        recognitionRef.current.start()
                      } catch {
                        setIsListening(false)
                      }
                    }
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 transition"
                  aria-label="Start voice input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2z"/>
                    <path d="M13 19.95a7.001 7.001 0 0 0 5.995-5.992L19 13h-2a5 5 0 0 1-9.995.217L7 13H5l.005.958A7.001 7.001 0 0 0 11 19.95V22h2v-2.05z"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* FilterNav integrated inside search box */}
            <div className="mt-3 pt-3 border-t border-purple-100">
              <div className="overflow-x-auto overflow-y-visible scrollbar-hide">
                <div className="min-w-max overflow-visible">
                  <FilterNav
                    categories={categoryOptions}
                    brands={facets.brands}
                    strains={facets.strains}
                    terpenes={facets.terpenes}
                    weights={facets.weights}
                    counts={finalFacetCounts}
                    onChange={handleFiltersChange}
                    initialFilters={activeFilters}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store info and guided prompts - moved outside chat container */}
        <div className="mx-auto max-w-6xl w-full mt-4">
          <div className="px-4">

            {storeInfoPrompt.active && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">Select a location</div>
                <div className="flex flex-wrap gap-2">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleStoreInfoPrompt(storeInfoPrompt.requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, s.id)}
                      className="px-3 py-2 rounded-full border text-sm bg-white text-gray-800 hover:bg-purple-50"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedPrompt.active && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-700">How do you want to feel?</div>
                <div className="flex flex-wrap gap-2">
                  {['Calm', 'Uplifted', 'Focused', 'Balanced'].map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => handleGuidedSelection('feel', mood)}
                      className={`px-3 py-2 rounded-full border text-sm ${
                        guidedPrompt.feel === mood ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
                <div className="text-sm font-semibold text-gray-700">Smoke-free or inhalable?</div>
                <div className="flex flex-wrap gap-2">
                  {['Smoke-free', 'Inhalable', 'Either'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleGuidedSelection('modality', opt)}
                      className={`px-3 py-2 rounded-full border text-sm ${
                        guidedPrompt.modality === opt ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Pre-prompts below search, bubble style */}
        {showPrePrompts && (
          <div className="mx-auto max-w-6xl w-full px-0 sm:px-0 mt-4 flex flex-col items-start gap-3">
            {PRE_PROMPTS.map((pp) => (
              <button
                key={pp.id}
                onClick={() => handleQuickPromptClick(pp.id)}
                className="inline-flex items-center gap-3 rounded-2xl bg-blue-500 px-4 py-3 text-white text-sm font-medium shadow-sm hover:brightness-95 cursor-pointer"
              >
                <span>{pp.label}</span>
                <ArrowUturnLeftIcon className="h-4 w-4 text-white" />
              </button>
            ))}
          </div>
        )}

        {/* Results and chat stream below the search box */}
        <div className="mx-auto max-w-6xl w-full px-0 sm:px-0 mt-6 space-y-4">
          {/* Clear button - show when there are messages or results */}
          {(chatMessages.length > 0 || showResults || products.length > 0) && (
            <div className="flex justify-end px-4 sm:px-0">
              <button
                onClick={handleClearChat}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors"
                aria-label="Clear chat and reset"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          )}
          
          {chatMessages.length > 0 && (
            <div className="w-full space-y-3 px-4 sm:px-0">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-blue-500 text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {loading && (
            <div className="flex justify-start px-4 sm:px-0">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <p className="text-sm text-gray-600">
                    {isChatMode ? 'Thinking...' : 'Searching products...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showResults && !loading && products.length > 0 && (
            <div className="px-0 sm:px-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2 text-center">
                This feature is still in Beta and may make mistakes.
              </p>
            </div>
          )}

          {showResults && !loading && products.length === 0 && (
            <div className="text-center py-8 px-4 sm:px-0">
              <p className="text-black mb-4">No products available matching this search.</p>
              <button
                type="button"
                onClick={() => {
                  setShowResults(false)
                  setQuery('')
                  setProducts([])
                  setSelectedPreset(null)
                  setShowDropdown(true)
                }}
                className="px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium transition"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
