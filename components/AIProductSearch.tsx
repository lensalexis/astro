'use client'

import { useState, useRef, useEffect, useMemo, ReactNode, type ReactElement } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { MapPinIcon, FunnelIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import productService from '@/lib/productService'
import ProductCard from '@/components/ui/ProductCard'
import type { Product } from '@/types/product'
import { ProductType } from '@/types/product'
import FilterNav from '@/components/ui/FilterNav'
import { stores, about } from '@/lib/stores'
import { useParams } from 'next/navigation'
import { routeIntent, type Intent, type ExtractedFilters, EFFECT_KEYWORDS } from '@/lib/intentRouter'
import {
  CATEGORY_DEFS,
  DEFAULT_CATEGORY_LABELS,
  applyProductFilters,
  buildFacetCounts,
  buildFacetOptions,
  getCategoryLabel,
  getProductType,
  getStrainType,
  getTags,
  getThcTotal,
  getCbdTotal,
  isOnSale,
  type FacetedFilters,
} from '@/lib/catalog'

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

type FilterPill = {
  key: keyof FacetedFilters | 'saleOnly'
  value?: string
  label: string
}

type FacetValueKey = Exclude<keyof FacetedFilters, 'saleOnly'>


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

// Category tiles under the main search bar (image left, label right).
// Uses the same category names as FilterNav (CATEGORY_DEFS.name) so toggling stays consistent.
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
      filtered = filtered.filter((p) => isOnSale(p))
      
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
  /** If true, AI mode is always open and storefront view is hidden */
  forceAIMode?: boolean
}

export default function AIProductSearch(props: AIProductSearchProps = {}): ReactElement {
  const { onResultsVisibleChange, customChips, currentStoreId, forceAIMode = false } = props
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
  const aiModeInputRef = useRef<HTMLInputElement>(null)
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
  // AI Mode prompts - Updated list with new categories
  const AI_MODE_PROMPTS = [
    { id: 'recommend-deals', label: "What's on sale today", query: 'show me discounted products with best value', category: 'Deals/Promotions', image: '/images/post-thumb-06.jpg', promptType: 'deals' },
    { id: 'recommend-flower', label: 'Recommend the best flower for relaxation', query: 'recommend best indica flower for relaxation', category: 'Flower', image: '/images/post-thumb-03.jpg', promptType: 'product' },
    { id: 'store-info', label: 'What are your current store hours and location?', query: 'what are your current store hours and location', category: 'Store Information', image: '/images/post-thumb-03.jpg', promptType: 'store_info' },
    { id: 'best-sellers', label: 'Show me best sellers this week', query: 'show me bestselling products this week', category: 'Best Sellers', image: '/images/post-thumb-05.jpg', promptType: 'bestsellers' },
    { id: 'recommend-vape', label: 'Recommend a vape for beginners', query: 'recommend beginner friendly vape cartridges', category: 'Vaporizers', image: '/images/post-thumb-04.jpg', promptType: 'product' },
    { id: 'recommend-edible', label: 'Best cannabis strains for creativity, focus, and energy', query: 'recommend sativa and hybrid_sativa products for creativity focus and energy', category: 'Strains', image: '/images/post-thumb-05.jpg', promptType: 'product' },
  ]
  const PRODUCT_PROMPT_SUGGESTIONS = [
    'Show me relaxing indica flower',
    'Find discounted vape carts',
    'Recommend edibles that help with sleep',
  ]
  const formatEffectLabel = (intent: string) => {
    if (!intent) return ''
    return intent
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatMode, setIsChatMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allProductsGlobal, setAllProductsGlobal] = useState<Product[]>([])
  const [showPrePrompts, setShowPrePrompts] = useState(true)
  const [categoryCountsByApi, setCategoryCountsByApi] = useState<Record<string, number>>({})
  const [aiModeOpen, setAiModeOpen] = useState(forceAIMode)
  const [showFilterNav, setShowFilterNav] = useState(false)
  const [showFilterNavInAiMode, setShowFilterNavInAiMode] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FacetedFilters>({})
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const aiModeScrollRef = useRef<HTMLDivElement>(null)
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
  const [storeInfoDisplay, setStoreInfoDisplay] = useState<{
    active: boolean
    store: (typeof stores)[number] | null
    requestId: string | null
  }>({ active: false, store: null, requestId: null })

  const filterPills = useMemo<FilterPill[]>(() => {
    const pills: FilterPill[] = []
    const seen = new Set<string>() // Track seen values case-insensitively
    
    // Helper to check if value already exists (case-insensitive)
    const isDuplicate = (key: string, value: string) => {
      const keyValue = `${key}:${value.toLowerCase()}`
      if (seen.has(keyValue)) return true
      seen.add(keyValue)
      return false
    }
    
    activeFilters.categories?.forEach((category) => {
      if (!isDuplicate('categories', category)) {
        pills.push({ key: 'categories', value: category, label: category })
      }
    })
    activeFilters.brands?.forEach((brand) => {
      if (!isDuplicate('brands', brand)) {
        pills.push({ key: 'brands', value: brand, label: brand })
      }
    })
    activeFilters.strains?.forEach((strain) => {
      if (!isDuplicate('strains', strain)) {
        pills.push({ key: 'strains', value: strain, label: strain })
      }
    })
    activeFilters.terpenes?.forEach((terp) => {
      if (!isDuplicate('terpenes', terp)) {
        pills.push({ key: 'terpenes', value: terp, label: terp })
      }
    })
    activeFilters.weights?.forEach((weight) => {
      if (!isDuplicate('weights', weight)) {
        pills.push({ key: 'weights', value: weight, label: weight })
      }
    })
    activeFilters.effects?.forEach((effect) => {
      if (!isDuplicate('effects', effect)) {
        pills.push({ key: 'effects', value: effect, label: effect })
      }
    })
    if (activeFilters.saleOnly) {
      pills.push({ key: 'saleOnly', label: 'On sale' })
    }
    return pills
  }, [activeFilters])

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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
    if (filters.effectIntent) {
      parts.push(formatEffectLabel(filters.effectIntent).toLowerCase())
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

  const RELAXATION_PLAN: Array<{ key: keyof FacetedFilters; label: string }> = [
    { key: 'effects', label: 'effects' },
    { key: 'terpenes', label: 'terpenes' },
    { key: 'weights', label: 'weights' },
    { key: 'strains', label: 'strains' },
    { key: 'brands', label: 'brands' },
    { key: 'saleOnly', label: 'discounts' },
    { key: 'categories', label: 'category' },
  ]

  const tokenizeQuery = (text: string) =>
    text.toLowerCase().split(/\s+/).map((token) => token.trim()).filter(Boolean)

  const computeRelevanceScore = (product: Product, filters: FacetedFilters, query: string) => {
    let score = 0
    const category = (getCategoryLabel(product) || '').toLowerCase()
    const strainType = (getStrainType(product) || '').toLowerCase()
    const strainName = (product.strain || product.cannabisType || '').toLowerCase()
    const brand = (product.brand?.name || '').toLowerCase()
    const tagList = getTags(product)

    if (filters.categories?.length) {
      const matches = filters.categories.some((cat) => category === cat.toLowerCase())
      if (matches) score += 3
    }
    if (filters.strains?.length) {
      const matches = filters.strains.some((target) => {
        const norm = target.toLowerCase()
        return strainType.includes(norm) || strainName.includes(norm)
      })
      if (matches) score += 2
    }
    if (filters.brands?.length) {
      const matches = filters.brands.some((target) => brand.includes(target.toLowerCase()))
      if (matches) score += 1.5
    }
    if (filters.saleOnly && isOnSale(product)) {
      score += 1
    }
    if (filters.terpenes?.length) {
      const terpList = (product.labs?.terpenes || []).map((t) => (t || '').toLowerCase())
      const matches = filters.terpenes.some((target) => terpList.includes(target.toLowerCase()))
      if (matches) score += 1
    }
    if (filters.weights?.length) {
      const weight = (product.weightFormatted || product.size || '').toLowerCase()
      if (weight && filters.weights.some((target) => weight.includes(target.toLowerCase()))) {
        score += 0.5
      }
    }
    if (filters.effects?.length && tagList.length) {
      const matches = filters.effects.some((effect) =>
        tagList.some((tag) => tag.includes(effect.toLowerCase()))
      )
      if (matches) score += 1
    }

    if (query) {
      const tokens = tokenizeQuery(query)
      if (tokens.length) {
        const haystack = `${product.name} ${product.description || ''} ${brand} ${strainName}`.toLowerCase()
        const matches = tokens.filter((token) => haystack.includes(token)).length
        score += matches * 0.4
      }
    }

    return score
  }

  const rankProductsByProbability = (products: Product[], filters: FacetedFilters, query: string) => {
    return products
      .map((product) => ({
        product,
        score: computeRelevanceScore(product, filters, query),
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product)
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
      // NOTE (root cause for "filters checked but no results" from search input):
      // `intentRouter` always sets `filters.query = message`.
      // If we always pass that into API `q` and/or hard-filter products by those tokens,
      // natural-language prompts like "show me on sale" / "best value" can eliminate everything.
      // Manual FilterNav works because it applies faceted filters only (no text query).
      //
      // Fix:
      // - Only use API `q` + keyword refinement when there are NO explicit facet filters.
      // - Prefer ranking for natural-language prompts instead of hard-filtering by stopwords.
      const STOPWORDS = new Set([
        'a','an','and','are','as','at','be','best','by','can','cheap','deals','deal','discount','discounted','do','for',
        'from','get','i','in','is','it','me','my','of','on','or','please','recommend','sale','search','show','the','to',
        'today','value','want','with','you','your',
      ])
      const getMeaningfulTokens = (q: string) =>
        (q || '')
          .toLowerCase()
          .split(/\s+/)
          .map((t) => t.replace(/[^a-z0-9\-]/g, '').trim())
          .filter((t) => t.length >= 3 && !STOPWORDS.has(t))

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
      // Terpenes - filter client-side only (API doesn't support terpenes parameter)
      // if (filters.terpenes && filters.terpenes.length) params.terpenes = filters.terpenes
      // Price
      if (filters.priceMin) params.priceMin = filters.priceMin
      if (filters.priceMax) params.priceMax = filters.priceMax
      // Discounted - API expects "discounted" parameter
      if (filters.discountedOnly) params.discounted = true
      // Brand
      if (filters.brand) params.brand = filters.brand
      // Weight
      if (filters.weight) params.weight = filters.weight
      // THC max (low potency intent)
      if (filters.maxThc) params.thcMax = filters.maxThc
      const hasFacetFilters = !!(
        filters.category ||
        filters.strainType ||
        (filters.terpenes && filters.terpenes.length) ||
        filters.brand ||
        filters.weight ||
        filters.discountedOnly ||
        filters.effectIntent ||
        filters.maxThc
      )
      const meaningfulTokens = getMeaningfulTokens(filters.query || userQuery)
      // Only apply API text-search when there are no facet filters and the query has meaningful tokens.
      if (!hasFacetFilters && meaningfulTokens.length > 0) params.q = filters.query || userQuery

      const shouldFetchFullCategory = !!filters.category
      // If discount filter is active without category, fetch full catalog to ensure we get all discounted products
      // This matches the behavior when manually toggling FilterNav which uses mergedFacetSource
      // Also fetch full catalog for any facet-filtered query (limit=200 can miss matches).
      const useFullCatalog =
        !!filters.effectIntent ||
        shouldFetchFullCategory ||
        !!filters.discountedOnly ||
        !!filters.strainType ||
        !!filters.brand ||
        !!filters.weight ||
        !!(filters.terpenes && filters.terpenes.length) ||
        !!filters.maxThc
      let allProducts: Product[] = []
      if (useFullCatalog) {
        try {
          allProducts = await fetchAllProducts(params)
        } catch (err) {
          console.warn('Pagination failed, falling back to single request:', err)
          const res = await productService.list(params)
          allProducts = res.data || []
        }
      } else {
        const res = await productService.list(params)
        allProducts = res.data || []
      }

      // Preserve original allProducts before filtering (for fallback if filtering removes all products)
      const originalAllProducts = [...allProducts]

      // Apply client-side filters
      // Priority 1: Strain type filtering (primary filter when effectIntent is detected)
      // Use lenient matching similar to applyProductFilters to avoid excluding products
      // that have strain info in name/description but not in structured fields
      // Check both filters.strainType (from intent router) and appliedFilters.strains (from FilterNav)
      const strainFiltersToCheck: string[] = []
      if (filters.strainType) {
        strainFiltersToCheck.push(filters.strainType)
      }
      // Also check appliedFilters.strains if it exists (for when Hybrid is added via FilterNav)
      // Note: appliedFilters is created later, so we'll check it after it's created
      
      if (strainFiltersToCheck.length > 0) {
        const hasEffectIntent = !!filters.effectIntent
        
        // Special handling: For sleep/relaxation queries, include both Indica and Hybrid
        // Hybrid products are also good for sleep and relaxation
        const includeHybridForSleep = (
          filters.effectIntent === 'sleep' || 
          filters.effectIntent === 'relaxation' ||
          (strainFiltersToCheck.some(s => s.toLowerCase() === 'indica') && hasEffectIntent && (filters.effectIntent === 'sleep' || filters.effectIntent === 'relaxation'))
        )
        
        // Use lenient filtering that matches applyProductFilters logic
        // This checks strain, cannabisType, getStrainType, and name/description
        let filteredByStrain = allProducts.filter((p: Product) => {
          const strainName = (p.strain || '').toLowerCase()
          const cannabisType = (p.cannabisType || '').toLowerCase()
          const strainType = (getStrainType(p) || '').toLowerCase()
          const blob = `${p.name || ''} ${p.description || ''} ${cannabisType} ${strainName}`.toLowerCase()
          
          // Check if product matches any of the target strains
          for (const targetStrain of strainFiltersToCheck) {
            const targetStrainLower = targetStrain.toLowerCase()
            
            // Special case: For sleep/relaxation, include both Indica and all Hybrid types
            if (includeHybridForSleep && (targetStrainLower === 'indica' || targetStrainLower.includes('indica'))) {
              // Check for indica
              const isIndica = (
                strainType.includes('indica') ||
                cannabisType.includes('indica') ||
                blob.includes('indica')
              )
              // Check for any hybrid type (hybrid, hybrid_indica, hybrid_sativa)
              const isHybrid = (
                strainType.includes('hybrid') ||
                cannabisType.includes('hybrid') ||
                blob.includes('hybrid')
              )
              if (isIndica || isHybrid) {
                return true
              }
            }
            
            // Match logic similar to applyProductFilters
            if (targetStrainLower === 'sativa' || targetStrainLower.includes('sativa')) {
              if (
                strainType.includes('sativa') ||
                cannabisType.includes('sativa') ||
                blob.includes('sativa')
              ) {
                return true
              }
            }
            if (targetStrainLower === 'indica' || targetStrainLower.includes('indica')) {
              if (
                strainType.includes('indica') ||
                cannabisType.includes('indica') ||
                blob.includes('indica')
              ) {
                return true
              }
            }
            if (targetStrainLower === 'hybrid' || targetStrainLower.includes('hybrid')) {
              if (
                strainType.includes('hybrid') ||
                cannabisType.includes('hybrid') ||
                blob.includes('hybrid')
              ) {
                return true
              }
            }
            
            // Exact matches
            if (strainName === targetStrainLower || cannabisType === targetStrainLower || strainType === targetStrainLower) {
              return true
            }
            if (strainName && strainName.includes(targetStrainLower)) return true
            if (cannabisType && cannabisType.includes(targetStrainLower)) return true
          }
          
          return false
        })
        
        log('strain-filter-lenient', { 
          requestId: rid, 
          filteredCount: filteredByStrain.length, 
          totalCount: allProducts.length,
          hasEffectIntent,
          targetStrain: strainFiltersToCheck
        })
        
        allProducts = filteredByStrain
      }

      // Priority 2: Effect intent filtering (optional - only if products have effects data)
      // This is a secondary filter that enhances results but doesn't exclude products without effects
      if (filters.effectIntent) {
        const effectIntent = filters.effectIntent.toLowerCase()
        const effectKeywords = EFFECT_KEYWORDS[effectIntent as keyof typeof EFFECT_KEYWORDS]
        // Special handling: for sleep/relaxation we want to keep hybrids too (they're often relevant
        // and many products are missing explicit effects tags).
        const includeHybridForSleep =
          (effectIntent === 'sleep' || effectIntent === 'relaxation') &&
          (filters.strainType || '').toLowerCase().includes('indica')
        
        if (effectKeywords && effectKeywords.preferredEffects) {
          const preferredEffects = effectKeywords.preferredEffects.map((e: string) => e.toLowerCase())
          
          // Separate products with effects data from those without
          const productsWithEffects: Product[] = []
          const productsWithNonMatchingEffects: Product[] = []
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
              } else {
                // Don't exclude non-matching effects; keep them, just lower priority.
                productsWithNonMatchingEffects.push(p)
              }
            } else {
              // Product doesn't have effects data - include it if it matches strain type
              // OR if we don't have strain type data (be lenient for effect-based searches)
              const strainType = getStrainType(p)
              const strainTypeLower = (strainType || '').toLowerCase()
              const cannabisTypeLower = (p.cannabisType || '').toLowerCase()
              const targetStrainLower = (filters.strainType || '').toLowerCase()
              const strainNameLower = (p.strain || '').toLowerCase()
              const blob = `${p.name || ''} ${p.description || ''} ${cannabisTypeLower} ${strainNameLower}`.toLowerCase()

              // If no strain info, keep it (we already did strain + intent routing earlier)
              if (!strainTypeLower) {
                productsWithoutEffects.push(p)
                return
              }

              // If there is no target strain, keep it (effect intent is the driver)
              if (!targetStrainLower) {
                productsWithoutEffects.push(p)
                return
              }

              // Normal case: keep if matches the routed target strain
              if (strainTypeLower.includes(targetStrainLower)) {
                productsWithoutEffects.push(p)
                return
              }

              // Sleep/relaxation special case: allow hybrids alongside indica
              if (includeHybridForSleep && (strainTypeLower.includes('hybrid') || cannabisTypeLower.includes('hybrid') || blob.includes('hybrid'))) {
                productsWithoutEffects.push(p)
                return
              }

              // Otherwise, do the same lenient matching as strain filtering / FilterNav:
              // hybrid_sativa should be included for sativa intent even if getStrainType() is just "hybrid".
              if (targetStrainLower.includes('sativa')) {
                if (
                  strainTypeLower.includes('sativa') ||
                  cannabisTypeLower.includes('sativa') ||
                  blob.includes('sativa')
                ) {
                  productsWithoutEffects.push(p)
                  return
                }
              }
              if (targetStrainLower.includes('indica')) {
                if (
                  strainTypeLower.includes('indica') ||
                  cannabisTypeLower.includes('indica') ||
                  blob.includes('indica')
                ) {
                  productsWithoutEffects.push(p)
                  return
                }
              }
              if (targetStrainLower.includes('hybrid')) {
                if (
                  strainTypeLower.includes('hybrid') ||
                  cannabisTypeLower.includes('hybrid') ||
                  blob.includes('hybrid')
                ) {
                  productsWithoutEffects.push(p)
                  return
                }
              }
              // Otherwise: exclude (strain doesn't match target)
            }
          })
          
          // Prioritize products with matching effects, but also include products without effects data
          // that match the strain type (since effect detection already set the correct strain type)
          // If we have products with matching effects, show those first; otherwise fall back.
          if (productsWithEffects.length > 0) {
            allProducts = [...productsWithEffects, ...productsWithoutEffects, ...productsWithNonMatchingEffects]
            log('effect-filter-with-effects', { 
              requestId: rid, 
              withEffects: productsWithEffects.length, 
              withoutEffects: productsWithoutEffects.length,
              nonMatchingEffects: productsWithNonMatchingEffects.length,
              total: allProducts.length 
            })
          } else if (productsWithoutEffects.length > 0 || productsWithNonMatchingEffects.length > 0) {
            // No matching-effects products; keep what we have (don't hard-exclude).
            allProducts = [...productsWithoutEffects, ...productsWithNonMatchingEffects]
            log('effect-filter-no-effects', { 
              requestId: rid, 
              withoutEffects: productsWithoutEffects.length,
              nonMatchingEffects: productsWithNonMatchingEffects.length,
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

      // Note: Discount filtering is handled later via applyProductFilters to ensure
      // it works correctly with category filtering and stacking with other filters

      // Filter by brand if specified
      if (filters.brand) {
        const brandLower = filters.brand.toLowerCase()
        allProducts = allProducts.filter((p: Product) => {
          const brandName = (p.brand?.name || '').toLowerCase()
          return brandName.includes(brandLower)
        })
      }

      // Auto-detect brand if user typed one
      if (!filters.brand) {
        const brandMap = new Map<string, string>()
        allProducts.forEach((p) => {
          const name = p.brand?.name?.trim()
          if (name) {
            const normalized = name.toLowerCase()
            if (!brandMap.has(normalized)) {
              brandMap.set(normalized, name)
            }
          }
        })
        const normalizedQuery = userQuery.toLowerCase()
        const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
        for (const [lowerBrand, originalBrand] of brandMap.entries()) {
          if (normalizedQuery.includes(lowerBrand)) {
            filters.brand = originalBrand
            break
          }
          const parts = lowerBrand.split(/\s+/)
          if (parts.some((part) => tokens.includes(part))) {
            filters.brand = originalBrand
            break
          }
        }
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

      // Keyword refinement across name/description/brand/strain/effects
      // IMPORTANT: only do this for "pure text search" queries. For faceted queries,
      // natural language tokens/stopwords frequently eliminate everything.
      if (!hasFacetFilters && meaningfulTokens.length > 0) {
        allProducts = allProducts.filter((p: Product) => {
          const brandName = (p.brand?.name || '').toLowerCase()
          const strain = (p.strain || p.cannabisType || '').toLowerCase()
          const effects = (p.effects || []).join(' ').toLowerCase()
          const searchableText = `${p.name} ${p.description || ''} ${brandName} ${strain} ${effects}`.toLowerCase()
          return meaningfulTokens.some((w) => searchableText.includes(w))
        })
      }

      const effectLabel = filters.effectIntent ? formatEffectLabel(filters.effectIntent) : null

      // Use the same facets source that FilterNav uses for normalization
      // Build from the same source that FilterNav uses (facetSource)
      // This ensures filters match exactly what FilterNav expects
      // Replicate the same logic as mergedFacetSource/facetSource
      const normalizationSourceMap = new Map<string, Product>()
      ;[...allProductsGlobal, ...baseProducts, ...products, ...allProducts].forEach((p) => {
        if (p?.id) normalizationSourceMap.set(p.id, p)
      })
      const normalizationSource = normalizationSourceMap.size > 0
        ? Array.from(normalizationSourceMap.values())
        : allProductsGlobal.length
        ? allProductsGlobal
        : baseProducts.length
        ? baseProducts
        : products.length
        ? products
        : allProducts
      const normalizationFacets = buildFacetOptions(normalizationSource)
      
      // Normalize filter values to match option format (case-insensitive matching)
      // Prefer exact case match, then case-insensitive match
      const normalizeToOption = (value: string, options: string[]): string | null => {
        if (!value) return null
        // First try exact match
        if (options.includes(value)) return value
        // Then try case-insensitive match
        const lower = value.toLowerCase()
        const match = options.find(opt => opt.toLowerCase() === lower)
        // If multiple matches exist, prefer the one that matches getStrainType format for strains
        if (match) {
          // For strains, prefer normalized format (Indica, Sativa, Hybrid)
          if (lower === 'indica' || lower === 'sativa' || lower === 'hybrid') {
            const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
            if (options.includes(normalized)) return normalized
          }
          return match
        }
        return null
      }

      // Helper to merge new values with existing, avoiding duplicates (case-insensitive)
      // Prefers normalized values from options list to ensure consistency with FilterNav
      const mergeFilterArray = (existing: string[] | undefined, newValues: string[], options: string[]): string[] => {
        // Normalize all new values to match option format
        const normalized = newValues.map(v => {
          const normalized = normalizeToOption(v, options)
          return normalized || v
        })
        
        // Create a map of existing values (lowercase -> actual value) to preserve original format
        const existingMap = new Map<string, string>()
        ;(existing || []).forEach(v => {
          const lower = v.toLowerCase()
          // Normalize existing values too to match FilterNav format
          const normalizedExisting = normalizeToOption(v, options) || v
          existingMap.set(lower, normalizedExisting)
        })
        
        // Add normalized new values
        normalized.forEach(v => {
          const lower = v.toLowerCase()
          const normalizedV = normalizeToOption(v, options) || v
          existingMap.set(lower, normalizedV)
        })
        
        // Return deduplicated array with normalized values
        return Array.from(existingMap.values())
      }

      // Merge new filters with existing activeFilters to support stacking
      // Use normalizationFacets to ensure values match FilterNav's options exactly
      
      // Special handling: For sleep/relaxation queries, include both Indica and all Hybrid types in FilterNav
      let strainTypesToAdd: string[] = []
      if (filters.strainType) {
        strainTypesToAdd.push(filters.strainType)
        
        // If it's a sleep/relaxation query with Indica, also include all Hybrid types
        if ((filters.effectIntent === 'sleep' || filters.effectIntent === 'relaxation') && 
            filters.strainType.toLowerCase() === 'indica') {
          // Find all hybrid-related strain options (HYBRID, HYBRID_INDICA, HYBRID_SATIVA)
          const hybridOptions = normalizationFacets.strains.filter(s => 
            s.toLowerCase().includes('hybrid')
          )
          // Add all hybrid variations to ensure all hybrid types are selected
          hybridOptions.forEach(hybridOption => {
            if (!strainTypesToAdd.includes(hybridOption)) {
              strainTypesToAdd.push(hybridOption)
            }
          })
          
          // Fallback if no hybrid options found in normalization
          if (hybridOptions.length === 0) {
            strainTypesToAdd.push('Hybrid', 'HYBRID_INDICA', 'HYBRID_SATIVA')
          }
        }

        // For uplifting/creative searches routed to Sativa, also include Hybrid-Sativa in FilterNav
        // so chips and results stay aligned (many products are typed as "hybrid" with cannabisType "HYBRID_SATIVA").
        if (filters.strainType.toLowerCase() === 'sativa' && filters.effectIntent) {
          const hybridSativaOptions = normalizationFacets.strains.filter((s) => {
            const lower = s.toLowerCase()
            return lower.includes('hybrid') && lower.includes('sativa')
          })
          hybridSativaOptions.forEach((opt) => {
            if (!strainTypesToAdd.includes(opt)) {
              strainTypesToAdd.push(opt)
            }
          })
          if (hybridSativaOptions.length === 0) {
            strainTypesToAdd.push('HYBRID_SATIVA')
          }
        }
      }
      
      let appliedFilters: FacetedFilters = {
        categories: filters.category 
          ? mergeFilterArray(activeFilters.categories, [filters.category], normalizationFacets.categories)
          : activeFilters.categories || [],
        brands: filters.brand 
          ? mergeFilterArray(activeFilters.brands, [filters.brand], normalizationFacets.brands)
          : activeFilters.brands || [],
        strains: strainTypesToAdd.length > 0
          ? mergeFilterArray(activeFilters.strains, strainTypesToAdd, normalizationFacets.strains)
          : activeFilters.strains || [],
        terpenes: filters.terpenes && filters.terpenes.length
          ? mergeFilterArray(activeFilters.terpenes, filters.terpenes, normalizationFacets.terpenes)
          : activeFilters.terpenes || [],
        weights: filters.weight 
          ? mergeFilterArray(activeFilters.weights, [filters.weight], normalizationFacets.weights)
          : activeFilters.weights || [],
        effects: activeFilters.effects || [],
        // For saleOnly, if discount is detected from search input, set it to true
        // Otherwise, preserve existing saleOnly state (supports stacking with manual FilterNav selection)
        // Use OR logic: if either new filter or existing filter is true, set to true
        saleOnly: filters.discountedOnly === true || activeFilters.saleOnly === true,
      }

      let relaxedFilter: string | null = null
      
      // If categories are in appliedFilters AND we didn't already fetch by categoryId,
      // we need to fetch category products first (same logic as handleFiltersChange)
      // Check if we already fetched by categoryId in the initial params
      const alreadyFetchedByCategory = !!params.categoryId
      let productsToFilter = allProducts
      let filtersToApply = appliedFilters
      
      if (appliedFilters.categories && appliedFilters.categories.length > 0 && !alreadyFetchedByCategory) {
        // We have categories in appliedFilters but didn't fetch by categoryId initially
        // This can happen when filters are stacked (e.g., user searches "indica" then adds "flower")
        const selectedCategories = CATEGORY_DEFS.filter((c) => appliedFilters.categories!.includes(c.name))
        if (selectedCategories.length > 0) {
          try {
            const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!
            const lists = await Promise.all(
              selectedCategories.map((cat) =>
                fetchAllProducts({
                  venueId,
                  categoryId: cat.id,
                  quantityMin: 1,
                  // Include discount filter if specified - API expects "discounted" parameter
                  ...(appliedFilters.saleOnly ? { discounted: true } : {}),
                })
              )
            )
            const combined = lists.flat()
            // Deduplicate by product id
            const byId = new Map<string, Product>()
            combined.forEach((p: any) => {
              if (p?.id) byId.set(p.id, p)
            })
            productsToFilter = Array.from(byId.values())
            
            // Apply other filters (strains, brands, etc.) to category products
            // Don't check categories again since we already fetched by categoryId
            filtersToApply = {
              categories: [],
              brands: appliedFilters.brands || [],
              strains: appliedFilters.strains || [],
              terpenes: appliedFilters.terpenes || [],
              weights: appliedFilters.weights || [],
              effects: appliedFilters.effects || [],
              saleOnly: appliedFilters.saleOnly || false,
            }
            productsToFilter = applyProductFilters(productsToFilter, filtersToApply)
          } catch (err) {
            console.warn('Failed to fetch category products, using allProducts:', err)
            // Fall back to filtering allProducts
            productsToFilter = applyProductFilters(allProducts, appliedFilters)
          }
        } else {
          // Category names don't match, filter allProducts normally
          productsToFilter = applyProductFilters(allProducts, appliedFilters)
        }
      } else if (alreadyFetchedByCategory && appliedFilters.categories && appliedFilters.categories.length > 0) {
        // We already fetched by categoryId, so exclude categories from filter to avoid double-filtering
        // Note: allProducts has already been filtered by strain (lines 1161-1222), but since both
        // the early filtering and applyProductFilters use the same lenient matching logic,
        // it's safe to filter again (it will just re-apply the same filter)
        filtersToApply = {
          categories: [],
          brands: appliedFilters.brands || [],
          strains: appliedFilters.strains || [],
          terpenes: appliedFilters.terpenes || [],
          weights: appliedFilters.weights || [],
          effects: appliedFilters.effects || [],
          saleOnly: appliedFilters.saleOnly || false,
        }
        productsToFilter = applyProductFilters(allProducts, filtersToApply)
      } else {
        // No categories, or already fetched by categoryId - filter allProducts normally
        // But if allProducts was already strain-filtered, we need to account for that
        // Actually, applyProductFilters will handle it correctly since it does case-insensitive matching
        productsToFilter = applyProductFilters(allProducts, appliedFilters)
      }
      
      // Ensure discount filter is applied client-side even if API was supposed to filter it
      // This handles cases where API doesn't support discounted with categoryId or other edge cases
      // Apply discount filter BEFORE any other processing to ensure it's always applied
      if (appliedFilters.saleOnly) {
        // Filter productsToFilter if it has items, otherwise filter allProducts
        if (productsToFilter.length > 0) {
          productsToFilter = productsToFilter.filter((p: Product) => isOnSale(p))
        } else if (allProducts.length > 0) {
          // If productsToFilter is empty, filter allProducts directly
          productsToFilter = allProducts.filter((p: Product) => isOnSale(p))
        }
      }
      
      let filteredProducts = productsToFilter

      const explicitUserFilters = !!(
        filters.category ||
        filters.strainType ||
        (filters.terpenes && filters.terpenes.length) ||
        filters.brand ||
        filters.weight ||
        filters.discountedOnly
      )

      if (!filteredProducts.length && !explicitUserFilters) {
        for (const step of RELAXATION_PLAN) {
          if (step.key === 'saleOnly') {
            if (!filtersToApply.saleOnly) continue
            filtersToApply = { ...filtersToApply, saleOnly: false }
          } else {
            const currentValues = (filtersToApply[step.key] as string[] | undefined) || []
            if (!currentValues.length) continue
            filtersToApply = { ...filtersToApply, [step.key]: [] } as FacetedFilters
          }
          // Re-filter with relaxed filters
          filteredProducts = applyProductFilters(productsToFilter, filtersToApply)
          if (filteredProducts.length) {
            relaxedFilter = step.label
            break
          }
        }
      }

      // IMPORTANT: If explicit filters were requested, do NOT fall back to unfiltered products.
      // That creates a mismatch where pills/FilterNav show active filters, but results don't match.
      if (!filteredProducts.length && !explicitUserFilters) {
        filteredProducts = productsToFilter.length > 0 ? productsToFilter : allProducts
      }

      // Final check: if discount filter is active, ensure all products are actually on sale
      // This is a safety net in case API filtering didn't work correctly
      if (appliedFilters.saleOnly && filteredProducts.length > 0) {
        const beforeCount = filteredProducts.length
        filteredProducts = filteredProducts.filter((p: Product) => isOnSale(p))
        if (beforeCount !== filteredProducts.length) {
          log('discount-filter-reapplied', {
            requestId: rid,
            beforeCount,
            afterCount: filteredProducts.length
          })
        }
      }

      const rankedProducts = rankProductsByProbability(filteredProducts, appliedFilters, userQuery)
      const sliced = rankedProducts.slice(0, 100)

      setProducts(sliced)
      setBaseProducts(sliced)
      setIsChatMode(false)
      setShowPrePrompts(false)
      setActiveFilters(appliedFilters)
      setLoading(false)
      
      log('search-complete', {
        requestId: rid,
        productsCount: sliced.length,
        filteredCount: filteredProducts.length,
        appliedFilters,
        saleOnly: appliedFilters.saleOnly,
        discountedOnly: filters.discountedOnly
      })
      
      // Update allProductsGlobal if we fetched category products
      if (appliedFilters.categories && appliedFilters.categories.length > 0 && productsToFilter.length > 0) {
        setAllProductsGlobal(prev => {
          const map = new Map<string, Product>()
          ;[...prev, ...productsToFilter].forEach(p => {
            if (p?.id) map.set(p.id, p)
          })
          return Array.from(map.values())
        })
      }

      // Generate descriptive summary
      const parts: string[] = []
      if (appliedFilters.categories?.length) {
        parts.push(appliedFilters.categories.join(' / '))
      }
      if (appliedFilters.strains?.length) {
        parts.push(appliedFilters.strains.join('/').toLowerCase())
      }
      if (appliedFilters.terpenes && appliedFilters.terpenes.length) {
        parts.push(`${appliedFilters.terpenes[0].toLowerCase()}-forward`)
      }
      if (effectLabel) {
        parts.push(effectLabel.toLowerCase())
      }
      if (appliedFilters.saleOnly) {
        parts.push('discounted')
      }
      if (appliedFilters.brands && appliedFilters.brands.length) {
        parts.push(`${appliedFilters.brands[0]} brand`)
      }
      if (relaxedFilter) {
        parts.push(`relaxed ${relaxedFilter}`)
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

  // Handle store info queries - show only current store
  const handleStoreInfo = (intentResult: ReturnType<typeof routeIntent>, userQuery: string, requestId?: string) => {
    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    
    // Get the current store ID from URL params or selected location
    const currentStoreId = getActiveStoreId()
    const store = stores.find(s => s.id === currentStoreId)
    
    if (store) {
      // Set store info to display in boxes
      setStoreInfoDisplay({ active: true, store, requestId: rid })
      setIsChatMode(true)
      setShowResults(false)
    } else {
      // No store found - show message
      appendAssistantMessage('I couldn\'t find store information for the current location.', rid)
      setIsChatMode(true)
      setShowResults(false)
    }
  }

  // Handle EDUCATION_WITH_PRODUCTS: single-turn response with explanation + products
  const handleEducationWithProducts = async (userQuery: string, filters: ExtractedFilters, requestId?: string) => {
    if (!userQuery.trim()) return

    const rid = requestId || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`

    setIsChatMode(true)

    try {
      const explanation = await callOpenAI(userQuery, true, rid)
      const filterDesc = getFilterDescription(filters)
      const promptLines = PRODUCT_PROMPT_SUGGESTIONS.map((prompt) => `• ${prompt}`).join('\n')
      const contextLine = filterDesc
        ? `If you'd like, I can pull ${filterDesc} options from the menu.`
        : 'Want product ideas?'
      const combinedContent = `${explanation}\n\n${contextLine}\n\nTry these prompts:\n${promptLines}`
      appendAssistantMessage(combinedContent, rid)

      await searchProductsWithFilters(filters, userQuery, rid)
      setIsChatMode(false)
    } catch (error) {
      console.error('Error in education with products:', error)
      appendAssistantMessage('Sorry, I encountered an error. Please try again.', rid)
      setIsChatMode(true)
      setShowResults(false)
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
      const suggestionLines = PRODUCT_PROMPT_SUGGESTIONS.map((prompt) => `• ${prompt}`).join('\n')
      const decoratedResponse = `${aiResponse}\n\n💡 Need product ideas? Try:\n${suggestionLines}`
      appendAssistantMessage(decoratedResponse, rid)
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

  const handleGuidedSelection = async (field: 'feel' | 'modality', value: string) => {
    if (!guidedPrompt.active || !guidedPrompt.requestId) return
    const next = { ...guidedPrompt, [field]: value }
    setGuidedPrompt(next)
    // If both answered, run; otherwise keep waiting for the second answer
    if (next.feel && next.modality) {
      await runGuidedSearch(next.feel, next.modality, next.requestId || undefined)
    }
  }


  const handleStorefrontSearchClick = () => {
    setShowDropdown(false)
    setAiModeOpen(true)
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
    setShowFilterNav(false)
    setShowFilterNavInAiMode(false)
    setStoreInfoPrompt({ active: false, requestId: null })
    setStoreInfoDisplay({ active: false, store: null, requestId: null })
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
          if (isPureEducationQuery(trimmedQuery, intentResult.extracted)) {
            await handleChatQuery(trimmedQuery, false, requestId)
          } else {
            await handleEducationWithProducts(trimmedQuery, intentResult.extracted, requestId)
          }
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
  const educationQuestionRegex = /^(how|what|why|when|where|who|can|should|could|would|is|are|does|do)\b/i
  function isPureEducationQuery(message: string, filters: ExtractedFilters): boolean {
    const trimmed = message.trim().toLowerCase()
    const isQuestion = educationQuestionRegex.test(trimmed)
    const hasMeaningfulFilters = !!(
      filters.strainType ||
      (filters.terpenes && filters.terpenes.length > 0) ||
      filters.discountedOnly ||
      filters.brand ||
      filters.weight ||
      filters.priceMin ||
      filters.priceMax ||
      filters.effectIntent
    )
    return isQuestion && !hasMeaningfulFilters
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

  const buildFacetOptions = (items: Product[]) => {
    const categories = new Set<string>()
    const brands = new Set<string>()
    const strains = new Set<string>()
    const terpenes = new Set<string>()
    const weights = new Set<string>()
    const effects = new Set<string>()

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
      getTags(p).forEach((effect) => {
        const label = effect.charAt(0).toUpperCase() + effect.slice(1)
        effects.add(label)
      })
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
      effects: Array.from(effects).sort(sortFn),
    }
  }

  const buildFacetCounts = (items: Product[]) => {
    const categoryCounts: Record<string, number> = {}
    const brandCounts: Record<string, number> = {}
    const strainCounts: Record<string, number> = {}
    const terpeneCounts: Record<string, number> = {}
    const weightCounts: Record<string, number> = {}
    const effectCounts: Record<string, number> = {}

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
      getTags(p).forEach((effect) => {
        const label = effect.charAt(0).toUpperCase() + effect.slice(1)
        effectCounts[label] = (effectCounts[label] || 0) + 1
      })
    })

    // Ensure every official category key exists
    CATEGORY_DEFS.forEach((c) => {
      if (!(c.name in categoryCounts)) categoryCounts[c.name] = 0
    })

    return {
      categories: categoryCounts,
      brands: brandCounts,
      strains: strainCounts,
      terpenes: terpeneCounts,
      weights: weightCounts,
      effects: effectCounts,
    }
  }

  const isOnSale = (p: Product) =>
    !!(
      p.discountAmountFinal ||
      p.discountValueFinal ||
      (p.discounts && p.discounts.length > 0)
    )

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

  const facets = buildFacetOptions(facetSource)
  const facetCounts = buildFacetCounts(facetSource)
  
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

  const handleFiltersChange = async (f: FacetedFilters) => {
    const hasOtherFacetFilters = !!(
      f.brands?.length ||
      f.strains?.length ||
      f.terpenes?.length ||
      f.weights?.length ||
      f.effects?.length ||
      f.saleOnly
    )

    // When categories are selected (with or without other filters), always fetch category products first
    // Then apply other filters client-side to ensure we don't miss matches
    const selectedCategoriesFilters = f.categories ?? []
    if (selectedCategoriesFilters.length > 0) {
      const selectedCategories = CATEGORY_DEFS.filter((c) => selectedCategoriesFilters.includes(c.name))
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
            // Explicitly set categories to empty array so applyProductFilters skips category check
            const filtersWithoutCategories: FacetedFilters = {
              categories: [],
              brands: f.brands || [],
              strains: f.strains || [],
              terpenes: f.terpenes || [],
              weights: f.weights || [],
              effects: f.effects || [],
              saleOnly: f.saleOnly || false,
            }
            console.log('Applying filters to category products:', {
              categoryProductsCount: categoryProducts.length,
              filters: filtersWithoutCategories,
              selectedCategories: selectedCategories.map(c => c.name)
            })
            const beforeCount = categoryProducts.length
            categoryProducts = applyProductFilters(categoryProducts, filtersWithoutCategories)
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
    const filtered = applyProductFilters(source, f)
    setProducts(filtered)
    setShowResults(true)
    setActiveFilters(f)
    setSearchDescription(
      filtered.length
        ? `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`
        : 'No products available for these filters.'
    )
  }

  const handleRemovePill = (pill: FilterPill) => {
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
      const key = pill.key as FacetValueKey
      const current = next[key] ? [...next[key]!] : []
      // Remove matching value case-insensitively
      const updated = current.filter((val) => val.toLowerCase() !== pill.value!.toLowerCase())
      next[key] = updated.length ? updated : undefined
    }

    handleFiltersChange(next)
  }

  const hasFacetData = facetSource.length > 0

  // Handler for AI Mode prompt clicks
  const handleAiModePrompt = async (prompt: typeof AI_MODE_PROMPTS[0]) => {
    // Keep AI mode open - don't close it
    // Use label for display consistency, but query for actual search processing
    setQuery(prompt.label)
    setHasInteracted(true)
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`
    appendUserMessage(prompt.label, requestId)
    setShowPrePrompts(false)
    
    try {
      // Handle special prompt types
      if (prompt.promptType === 'store_info') {
        // Get current store and display in boxes
        const currentStoreId = getActiveStoreId()
        const store = stores.find(s => s.id === currentStoreId)
        if (store) {
          setStoreInfoDisplay({ active: true, store, requestId })
          setIsChatMode(true)
          setShowResults(false)
        } else {
          appendAssistantMessage('I couldn\'t find store information for the current location.', requestId)
        }
        return
      }
      
      if (prompt.promptType === 'loyalty') {
        // Handle loyalty program query
        const loyaltyInfo = `Loyalty Program Information:

Earn Points:
• Make purchases at any JALH location
• Points are earned based on your purchase amount
• Check with store staff for current point earning rates

Redeem Points:
• Visit any JALH location to redeem your points
• Points can be used for discounts on future purchases
• Speak with store staff to check your current point balance and redemption options

For specific details about earning rates and redemption options, please contact your local JALH store or visit in person.`
        appendAssistantMessage(loyaltyInfo, requestId)
        return
      }
      
      if (prompt.promptType === 'bestsellers') {
        // Fetch bestselling products
        setLoading(true)
        setShowResults(true)
        try {
          const res = await productService.list({
            venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
            limit: 50,
            sort: '-totalSold',
            quantityMin: 1,
          })
          const bestSellers = res.data || []
          setProducts(bestSellers)
          setBaseProducts(bestSellers)
          if (bestSellers.length > 0) {
            appendAssistantMessage(`Here are our bestselling products this week:`, requestId)
          } else {
            appendAssistantMessage(`No bestselling products available at this time.`, requestId)
          }
        } catch (error) {
          console.error('Error fetching bestsellers:', error)
          appendAssistantMessage(`Sorry, I couldn't fetch the bestselling products right now.`, requestId)
        } finally {
          setLoading(false)
        }
        return
      }
      
      if (prompt.promptType === 'deals') {
        // Handle deals/promotions - show discounted products
        const intentResult = routeIntent(prompt.query)
        const filters = {
          ...intentResult.extracted,
          discountedOnly: true,
        }
        // Use label for display consistency, query for processing
        await searchProductsWithFilters(filters, prompt.label, requestId)
        return
      }
      
      if (prompt.promptType === 'bundle') {
        // Handle multi-product bundle planning
        const intentResult = routeIntent(prompt.query)
        // Use label for display consistency, query for processing
        await searchProductsWithFilters(intentResult.extracted, prompt.label, requestId)
        return
      }
      
      // Default: handle as product shopping
      const intentResult = routeIntent(prompt.query)
      
      if (intentResult.intent === 'PRODUCT_SHOPPING' || intentResult.intent === 'PRODUCT_INFO') {
        // Use label for display consistency, query for processing
        // The searchProductsWithFilters function will handle including hybrid for sleep/relaxation queries
        await searchProductsWithFilters(intentResult.extracted, prompt.label, requestId)
      } else if (intentResult.intent === 'STORE_INFO') {
        handleStoreInfo(intentResult, prompt.label, requestId)
      } else {
        // Fallback for other intents
        // Use label for display consistency, query for processing
        await searchProductsWithFilters(intentResult.extracted, prompt.label, requestId)
      }
    } catch (error) {
      console.error('Error processing AI mode prompt:', error)
      appendAssistantMessage(`Sorry, I encountered an error processing your request.`, requestId)
    }
  }

  // (Previously used for header dropdowns; we now use full-screen modals.)

  // (URL parameter check removed - AI mode is now always open on store pages via forceAIMode prop)

  // Focus the AI mode input once when overlay opens
  const aiModeJustOpenedRef = useRef(false)
  useEffect(() => {
    if (aiModeOpen && !aiModeJustOpenedRef.current) {
      aiModeJustOpenedRef.current = true
      const timer = setTimeout(() => {
        if (aiModeInputRef.current) {
          aiModeInputRef.current.focus({ preventScroll: true })
        }
      }, 80)
      return () => clearTimeout(timer)
    } else if (!aiModeOpen) {
      aiModeJustOpenedRef.current = false
    }
  }, [aiModeOpen])

  // Prevent body scroll when AI mode is open (but allow scrolling inside overlay)
  useEffect(() => {
    if (aiModeOpen || forceAIMode) {
      // Prevent body scroll when AI mode is open
      const originalOverflow = document.body.style.overflow
      const originalHeight = document.body.style.height
      document.body.style.overflow = 'hidden'
      // For forceAIMode, we still want to prevent body scroll but allow internal scrolling
      if (forceAIMode) {
        // Use dynamic viewport height on mobile to avoid content being hidden under browser UI
        // (iOS Safari address bar / toolbar can make 100vh incorrect).
        document.body.style.height = '100dvh'
        document.documentElement.style.height = '100dvh'
      }
      
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.height = originalHeight
        if (forceAIMode) {
          document.documentElement.style.height = ''
        }
      }
    }
  }, [aiModeOpen, forceAIMode])

  // Full-screen AI Mode overlay - conditionally rendered (or always if forceAIMode)
  const aiModeOverlay = (aiModeOpen || forceAIMode) ? (
      <div 
        key="ai-mode-overlay"
        className={
          forceAIMode
            ? "h-[100dvh] bg-white flex flex-col overflow-hidden"
            : "fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
        }
      >
        {/* Search box inside AI Mode */}
        <div
          className="px-4 pb-4 border-b border-gray-200"
          style={{
            // Prevent the top content from sitting under the notch/status bar on iOS
            paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          }}
        >
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
                          selectedLocation === store.id ? 'border-green-700 bg-gray-50' : 'border-gray-200 bg-white',
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
                </div>
              </div>
            )}

            {/* Filter modal (AI Mode) */}
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

            <form 
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit(e)
              }} 
              className="w-full"
            >
              <div className="flex items-center gap-2">
                {/* Location icon (opens location modal) */}
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
                    className="absolute left-4 transition"
                    aria-label="Submit search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="searchStarGradient-ai-mode" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ec4899" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#ec4899" />
                          <animateTransform
                            attributeName="gradientTransform"
                            type="translate"
                            values="-100 0;100 0;-100 0"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#searchStarGradient-ai-mode)"
                        d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                      />
                    </svg>
                  </button>
                  <input
                    id="ai-search-input-ai-mode"
                    ref={aiModeInputRef}
                    type="text"
                    value={query}
                    onFocus={() => {
                      if (enablePresetDropdown) setShowDropdown(true)
                    }}
                    placeholder="Search by mood, products, or preference"
                    className="w-full pl-12 pr-12 py-3 bg-transparent border-none text-base text-black placeholder-gradient-animated rounded-full focus:outline-none focus-visible:outline-none"
                    onChange={(e) => {
                      const newValue = e.target.value
                      setHasInteracted(true)
                      setQuery(newValue)
                    }}
                    onKeyDown={(e) => {
                      // Prevent form submission on Enter if user is still typing
                      if (e.key === 'Enter' && !e.shiftKey) {
                        // Allow default form submission
                      }
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
                    className="absolute right-4 text-gray-500 hover:text-gray-700 transition"
                    aria-label="Start voice input"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2z"/>
                      <path d="M13 19.95a7.001 7.001 0 0 0 5.995-5.992L19 13h-2a5 5 0 0 1-9.995.217L7 13H5l.005.958A7.001 7.001 0 0 0 11 19.95V22h2v-2.05z"/>
                    </svg>
                  </button>
                </div>

                {/* Filter icon (opens filter modal) */}
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
                    {/* Top horizontal line with circle */}
                    <line x1="3" y1="9" x2="21" y2="9" strokeLinecap="round" />
                    <circle cx="12" cy="9" r="2.5" fill="none" />
                    {/* Bottom horizontal line with circle */}
                    <line x1="3" y1="15" x2="21" y2="15" strokeLinecap="round" />
                    <circle cx="12" cy="15" r="2.5" fill="none" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Category tiles and filter pills (AI Mode only) */}
            <div className="mt-4">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-1">
                  {/* Active filter pills - shown first */}
                  {filterPills.map((pill) => (
                    <button
                      key={`${pill.key}-${pill.value || 'sale'}`}
                      onClick={() => handleRemovePill(pill)}
                      className="flex-none inline-flex items-center gap-2 rounded-2xl border border-gray-200/70 bg-gray-100/70 text-sm text-gray-700 px-3 py-1.5 hover:bg-gray-200 transition whitespace-nowrap"
                    >
                      <span>{pill.label}</span>
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  ))}
                  
                  {/* Category tiles */}
                  {CATEGORY_DEFS.map((cat) => {
                    const selected = (activeFilters.categories || []).some(
                      (v) => v.toLowerCase() === cat.name.toLowerCase()
                    )
                    const meta = CATEGORY_TILE_META[cat.slug] || {
                      image: '/images/post-thumb-03.jpg',
                      className: 'bg-gray-200 text-gray-900',
                    }
                    const lightText = meta.className.includes('text-white')

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
                        {/* Image on left - touches edge */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image 
                            src={meta.image} 
                            alt={cat.name} 
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                        {/* Text on right */}
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

        {/* Content area - shows prompts or results */}
        <div 
          ref={aiModeScrollRef}
          className="flex-1 overflow-y-auto overscroll-none px-4 py-6"
          style={{ 
            // Prevent "scrolling past" the prompt list on mobile (rubber-banding / extra scroll)
            overscrollBehaviorY: 'none',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            scrollBehavior: 'auto', // Prevent smooth scroll from interfering
            minHeight: 0 // Critical for flex children to allow scrolling
          }}
        >
          <div className="max-w-2xl mx-auto">


            {storeInfoPrompt.active && (
              <div className="mb-4 space-y-2">
                <div className="text-sm font-semibold text-gray-700">Select a location</div>
                <div className="flex flex-wrap gap-2">
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() =>
                        handleStoreInfoPrompt(
                          storeInfoPrompt.requestId ||
                            crypto.randomUUID?.() ||
                            `${Date.now()}-${Math.random()}`,
                          s.id
                        )
                      }
                      className="px-3 py-2 rounded-full border text-sm bg-white text-gray-800 hover:bg-purple-50"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {guidedPrompt.active && (
              <div className="mb-4 space-y-3">
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

            {/* Show chat messages and results if they exist */}
            {chatMessages.length > 0 && (
              <div className="mb-6 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' && (
                      <button
                        onClick={handleClearChat}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors flex-shrink-0"
                        aria-label="Clear chat and reset"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Clear</span>
                      </button>
                    )}
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

            {/* Clear button - show when there's content but no user messages yet (e.g., store info, results) */}
            {chatMessages.length === 0 && (storeInfoDisplay.active || showResults || loading) && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={handleClearChat}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors flex-shrink-0"
                  aria-label="Clear chat and reset"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              </div>
            )}

            {/* Store info display - rendered after chat messages */}
            {storeInfoDisplay.active && storeInfoDisplay.store && (
              <div className="mb-6 space-y-3">
                {/* Store Name */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                    <p className="text-sm font-semibold mb-1">Store Name</p>
                    <p className="text-sm">{storeInfoDisplay.store.name}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                    <p className="text-sm font-semibold mb-1">Address</p>
                    <p className="text-sm">
                      {storeInfoDisplay.store.address || 
                        [storeInfoDisplay.store.addressLine1, storeInfoDisplay.store.addressLine2].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {storeInfoDisplay.store.phone && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                      <p className="text-sm font-semibold mb-1">Phone</p>
                      <p className="text-sm">{storeInfoDisplay.store.phone}</p>
                    </div>
                  </div>
                )}

                {/* OCM License */}
                {storeInfoDisplay.store.ocm && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                      <p className="text-sm font-semibold mb-1">OCM License</p>
                      <p className="text-sm">{storeInfoDisplay.store.ocm}</p>
                    </div>
                  </div>
                )}

                {/* Hours */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                    <p className="text-sm font-semibold mb-1">Hours</p>
                    {storeInfoDisplay.store.status === 'coming_soon' ? (
                      <p className="text-sm">
                        <span className="font-semibold">Coming Soon</span> - Hours are not yet available for this location.
                      </p>
                    ) : storeInfoDisplay.store.hoursDisplay ? (
                      <p className="text-sm">{storeInfoDisplay.store.hoursDisplay}</p>
                    ) : (
                      <p className="text-sm text-gray-600">Not listed yet</p>
                    )}
                  </div>
                </div>

                {/* Services */}
                {storeInfoDisplay.store.services && storeInfoDisplay.store.services.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                      <p className="text-sm font-semibold mb-1">Services</p>
                      <p className="text-sm">{storeInfoDisplay.store.services.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex justify-start mb-6">
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
                    setSelectedPreset(null)
                    setShowDropdown(true)
                  }}
                  className="px-6 py-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-medium transition"
                >
                  Start Over
                </button>
              </div>
            )}


            {/* Show prompts if no results yet and pre-prompts should be visible */}
            {showPrePrompts && !showResults && chatMessages.length === 0 && (
              <div className="space-y-3">
                {AI_MODE_PROMPTS.map((prompt, index) => (
                  <div key={prompt.id}>
                    <button
                      onClick={() => handleAiModePrompt(prompt)}
                      className="w-full flex items-center rounded-2xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                    >
                      {/* Image on left - touches edge */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={prompt.image}
                          alt={prompt.label}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      {/* Text in middle */}
                      <div className="flex-1 px-4 py-4">
                        <p className="text-base font-medium bg-gradient-to-r from-pink-500 via-blue-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                          {prompt.label}
                        </p>
                      </div>
                      {/* Icon on right - 3 stars with animated gradient */}
                      <div className="flex-shrink-0 pr-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient id={`promptStarGradient-${prompt.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#ec4899" />
                              <stop offset="50%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#ec4899" />
                              <animateTransform
                                attributeName="gradientTransform"
                                type="translate"
                                values="-100 0;100 0;-100 0"
                                dur="3s"
                                repeatCount="indefinite"
                              />
                            </linearGradient>
                          </defs>
                          <path
                            fill={`url(#promptStarGradient-${prompt.id})`}
                            d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                          />
                        </svg>
                      </div>
                    </button>
                    {/* Loyalty Program Banner - Insert after prompt 3 (index 2) - between best sellers and vape */}
                    {index === 2 && (
                      <button
                        onClick={() => {
                          const loyaltyPrompt = { id: 'loyalty-program', label: 'How do I earn and redeem loyalty points?', query: 'how do I earn and redeem loyalty points', category: 'Loyalty Program', image: '/images/post-thumb-04.jpg', promptType: 'loyalty' as const }
                          handleAiModePrompt(loyaltyPrompt)
                        }}
                        className="w-full relative rounded-2xl overflow-hidden group cursor-pointer mt-3"
                      >
                        {/* Full image background */}
                        <div className="relative h-24 sm:h-28">
                          <Image
                            src="/images/post-thumb-04.jpg"
                            alt="Loyalty Program"
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                          {/* Dark gradient overlay for text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />
                          {/* Content */}
                          <div className="absolute inset-0 flex flex-col justify-end items-start px-6 sm:px-8 pb-3 sm:pb-4 text-white">
                            <h3 className="text-xl sm:text-2xl font-bold mb-1 drop-shadow-lg">
                              How do I earn and redeem loyalty points?
                            </h3>
                            <p className="text-sm sm:text-base text-white/90 drop-shadow-md">
                              Learn about our rewards program
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  ) : null

  // If forceAIMode is true, only render AI mode overlay (no storefront)
  if (forceAIMode) {
    return <>{aiModeOverlay}</>
  }

  return (
    <>
      {aiModeOverlay}
      <section id="ai-search-anchor" className="relative title-padding-top">
      <div className="mx-auto max-w-6xl w-full">
        {/* Title removed per request; restore if needed */}

        {/* Google-style search interface */}
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6">
          {/* Logo - positioned like Google */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/jalh-logo.png"
              alt="Just a Little Higher"
              className="h-16 sm:h-20 w-auto"
            />
          </div>

          {/* Minimalist search input - stands on its own */}
          <div className="flex justify-center mb-4">
            <div className="w-full max-w-2xl">
              <div className="relative flex items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow">
                <span className="absolute left-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="searchStarGradient-storefront" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="50%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ec4899" />
                        <animateTransform
                          attributeName="gradientTransform"
                          type="translate"
                          values="-100 0;100 0;-100 0"
                          dur="3s"
                          repeatCount="indefinite"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      fill="url(#searchStarGradient-storefront)"
                      d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                    />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={handleStorefrontSearchClick}
                  className="w-full text-left pl-12 pr-4 py-3 bg-transparent border-none text-base text-black rounded-full focus:outline-none focus-visible:outline-none"
                >
                  {query ? (
                    <span className="text-gray-900 font-medium">
                      {query}
                    </span>
                  ) : (
                    <span className="bg-gradient-to-r from-pink-500 via-blue-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                      Search by mood, product, brands, or preference
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Mode and Filter buttons */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => setAiModeOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z"/>
              </svg>
              AI Mode
            </button>
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filter
            </button>
          </div>

          {/* Filter modal (opens directly from the main Filter button) */}
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
            open={filterModalOpen}
            onOpenChange={setFilterModalOpen}
          />
        </div>
      </div>
    </section>
    </>
  )
}
