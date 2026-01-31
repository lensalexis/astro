'use client'

import { useState, useRef, useEffect, useMemo, ReactNode, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPinIcon, FunnelIcon, MagnifyingGlassIcon, ArrowUturnLeftIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import { useNavbarSearchSlot } from '@/components/NavbarSearchSlotContext'
import GoogleReviewSummary from '@/components/GoogleReviewSummary'
import ProductCard, { pickPrimaryImage } from '@/components/ui/ProductCard'
import type { Product } from '@/types/product'
import { ProductType } from '@/types/product'
import FilterNav from '@/components/ui/FilterNav'
import { stores, about } from '@/lib/stores'
import { useParams } from 'next/navigation'
import { routeIntent, type Intent, type ExtractedFilters, EFFECT_KEYWORDS } from '@/lib/intentRouter'
import { listDispenseProducts } from '@/utils/dispenseClient'
import {
  CATEGORY_DEFS,
  CATEGORY_NAME_BY_SLUG,
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

function formatStrainLabel(input: string) {
  const raw = String(input || '').trim()
  if (!raw) return raw
  const upper = raw.toUpperCase()
  if (upper === 'ANY') return 'Any'
  if (['NA', 'N/A', 'UNKNOWN', 'NONE'].includes(upper)) return 'N/A'
  const parts = raw
    .split('_')
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length > 1) {
    return parts
      .map((p) => p.toLowerCase())
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }
  if (raw === upper) {
    const p = raw.toLowerCase()
    return p.charAt(0).toUpperCase() + p.slice(1)
  }
  return raw
}

function getCategoryCount(caseInsensitiveName: string, counts: Record<string, number> = {}) {
  if (!caseInsensitiveName) return 0
  if (counts[caseInsensitiveName] !== undefined) return counts[caseInsensitiveName]
  const lower = caseInsensitiveName.toLowerCase()
  const found = Object.entries(counts).find(([k]) => k.toLowerCase() === lower)
  if (found) return found[1]
  // Also try matching by slug -> name
  const slugMatch = Object.entries(CATEGORY_NAME_BY_SLUG).find(
    ([slug, name]) => name.toLowerCase() === lower || slug.toLowerCase() === lower
  )
  if (slugMatch) {
    const name = slugMatch[1]
    if (counts[name] !== undefined) return counts[name]
    const byLower = Object.entries(counts).find(([k]) => k.toLowerCase() === name.toLowerCase())
    if (byLower) return byLower[1]
  }
  return 0
}

const HERO_ROTATING_WORDS = ['favorite', 'go-to', 'flower', 'vape', 'edible', 'pre-roll'] as const

function RotatingWord({
  words = HERO_ROTATING_WORDS,
  holdMs = 2600,
  transitionMs = 220,
  className = '',
}: {
  words?: readonly string[]
  holdMs?: number
  transitionMs?: number
  className?: string
}) {
  const [idx, setIdx] = useState(0)
  const maxChars = Math.max(0, ...(words || []).map((w) => (w || '').length))
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) return
    if (!words?.length) return
    if (words.length <= 1) return

    let cancelled = false
    let holdTimer: number | undefined
    let outTimer: number | undefined
    let inRaf: number | undefined

    const cycle = () => {
      holdTimer = window.setTimeout(() => {
        if (cancelled) return
        setPhase('out')

        outTimer = window.setTimeout(() => {
          if (cancelled) return
          setIdx((v) => (v + 1) % words.length)
          setPhase('in')

          inRaf = window.requestAnimationFrame(() => {
            if (cancelled) return
            setPhase('idle')
            cycle()
          })
        }, transitionMs)
      }, holdMs)
    }

    cycle()

    return () => {
      cancelled = true
      if (holdTimer) window.clearTimeout(holdTimer)
      if (outTimer) window.clearTimeout(outTimer)
      if (inRaf) window.cancelAnimationFrame(inRaf)
    }
  }, [holdMs, transitionMs, words])

  const word = (words && words[idx]) || words?.[0] || ''

  return (
    <span
      className={[
        'relative inline-flex items-baseline overflow-hidden leading-none',
        'h-[35px] sm:h-[64px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: `${Math.max(1, maxChars + 1)}ch` }}
      aria-label={word}
    >
      <span
        key={word}
        className={[
          'inline-block whitespace-nowrap leading-none',
          'transition-[transform,opacity] duration-[220ms] ease-out',
        ].join(' ')}
        style={{
          opacity: phase === 'out' ? 0 : phase === 'in' ? 0 : 1,
          transform:
            phase === 'out'
              ? 'translateY(-35%)'
              : phase === 'in'
                ? 'translateY(35%)'
                : 'translateY(0%)',
        }}
      >
        {word}
      </span>
    </span>
  )
}

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
    description: 'Edibles, beverages & more',
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

    const res = await listDispenseProducts<Product>(requestParams)
    const products = res.data || []
    allProducts.push(...products)

    // Check for next cursor in response
    cursor = (res as any).nextCursor || undefined
    
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
  customChips?: ReactNode
  currentStoreId?: string
  /** If true, AI mode is always open and storefront view is hidden */
  forceAIMode?: boolean
  /**
   * If true (typically with `forceAIMode`), render only the hero/search header.
   * Useful for the homepage where we want Klook-style sections below the hero.
   */
  heroOnly?: boolean
  /** Homepage hero styling variant */
  heroVariant?: 'default' | 'viator'
  /** If set, portal homepage results into this element id */
  homeResultsPortalId?: string
  /** Override hero headline (useful for category pages) */
  heroTitle?: string
  /** Hide the hero quick prompt chips under the search bar */
  hideHeroQuickPrompts?: boolean
  /** Preselect a category in the hero filters (expects category label like "Flower") */
  initialHeroCategory?: string
}

export default function AIProductSearch(props: AIProductSearchProps = {}): ReactElement {
  const {
    customChips,
    currentStoreId,
    forceAIMode = false,
    heroOnly = false,
    heroVariant = 'default',
    homeResultsPortalId,
    heroTitle,
    hideHeroQuickPrompts = false,
    initialHeroCategory,
  } = props
  const { user } = useUser()
  const router = useRouter()
  const params = useParams<{ storeId?: string }>()
  const navbarSlot = useNavbarSearchSlot()
  const inNavbarSlot = Boolean(
    forceAIMode && heroVariant === 'viator' && navbarSlot?.slotReady && navbarSlot?.slotRef?.current
  )
  useEffect(() => {
    navbarSlot?.setBarInSlot(!!inNavbarSlot)
    return () => {
      navbarSlot?.setBarInSlot(false)
    }
  }, [inNavbarSlot, navbarSlot])
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
  const CATEGORY_CHIPS = [
    { id: 'cat-flower', label: 'Flower', category: 'flower' },
    { id: 'cat-vapes', label: 'Vaporizers', category: 'vaporizers' },
    { id: 'cat-pre-rolls', label: 'Pre Rolls', category: 'pre-rolls' },
    { id: 'cat-concentrates', label: 'Concentrates', category: 'concentrates' },
    { id: 'cat-edibles', label: 'Edibles', category: 'edibles' },
    { id: 'cat-beverages', label: 'Beverages', category: 'beverages' },
  ]
  type FeedId =
    | 'best-sellers'
    | 'trending'
    | 'easy-picks'
    | 'calm-unwind'
    | 'best-value'
    | 'uplifting-daytime'
    | 'staff-picks'

  type AiPrompt = {
    id: string
    label: string
    query: string
    category: string
    image: string
    promptType:
      | 'product'
      | 'deals'
      | 'store_info'
      | 'bestsellers'
      | 'loyalty'
      | 'bundle'
      | 'feed'
      | 'category'
    feedId?: FeedId
    categorySlug?: string
  }

  // AI Mode prompts (rendered + internal feed actions)
  const AI_MODE_PROMPTS: AiPrompt[] = [
    // Top 3 (under search box)
    {
      id: 'recommend-deals',
      label: "What's on sale today?",
      query: 'show me discounted products with best value',
      category: 'Deals/Promotions',
      image: '/images/post-thumb-06.jpg',
      promptType: 'deals',
    },
    {
      id: 'recommend-calm-flower',
      label: 'Recommend the best flower for relaxation',
      query: 'recommend best indica flower for relaxation and calming',
      category: 'Flower',
      image: '/images/post-thumb-03.jpg',
      promptType: 'product',
    },
    {
      id: 'store-info',
      label: 'Tell me about this store',
      query: 'tell me about this store',
      category: 'Store Information',
      image: '/images/post-thumb-03.jpg',
      promptType: 'store_info',
    },

    // Prompts after Best Selling this week (2)
    {
      id: 'prompt-edibles-low-dose',
      label: 'Find low-dose edibles for a chill vibe',
      query: 'recommend low dose edibles for relaxation, beginner friendly',
      category: 'Edibles',
      image: '/images/post-thumb-05.jpg',
      promptType: 'product',
    },
    {
      id: 'prompt-concentrates-flavor',
      label: 'Show me flavorful concentrates (live resin / rosin)',
      query: 'show me concentrates like live resin and rosin, best flavor',
      category: 'Concentrates',
      image: '/images/post-thumb-04.jpg',
      promptType: 'product',
    },

    // Prompts after Trending Right Now (2)
    {
      id: 'prompt-beverages',
      label: 'Show me THC beverages I can sip',
      query: 'show me cannabis beverages and drinkables',
      category: 'Beverages',
      image: '/images/post-thumb-06.jpg',
      promptType: 'product',
    },
    {
      id: 'prompt-balanced-1-1',
      label: 'Recommend balanced 1:1 THC:CBD options',
      query: 'recommend balanced thc cbd 1:1 products for beginners',
      category: 'Balanced',
      image: '/images/post-thumb-04.jpg',
      promptType: 'product',
    },

    // Prompts after Easy Picks for First Timers (2)
    {
      id: 'prompt-pre-roll-under-25',
      label: 'Find pre-rolls under $25',
      query: 'find pre rolls under 25 dollars',
      category: 'Pre Rolls',
      image: '/images/post-thumb-05.jpg',
      promptType: 'product',
    },
    {
      id: 'prompt-vapes-beginners',
      label: 'Best vapes for beginners',
      query: 'best vapes for beginners',
      category: 'Vaporizers',
      image: '/images/post-thumb-03.jpg',
      promptType: 'product',
    },

    // Prompt after Calm & Unwind Favorites (1)
    {
      id: 'prompt-sleep-edible',
      label: 'Recommend edibles for sleep (stay asleep)',
      query: 'recommend edibles for sleep and staying asleep',
      category: 'Sleep Support',
      image: '/images/post-thumb-03.jpg',
      promptType: 'product',
    },

    // Prompt after Best Value Right Now (1)
    {
      id: 'prompt-bundle-under-80',
      label: 'Build me a best-value bundle under $80',
      query: 'build a best value cannabis bundle under 80 dollars across categories',
      category: 'Bundle',
      image: '/images/post-thumb-06.jpg',
      promptType: 'bundle',
    },

    // Prompt after Uplifting & Daytime Picks (1)
    {
      id: 'prompt-daytime-vape',
      label: 'Recommend a daytime vape for focus & energy',
      query: 'recommend sativa and hybrid sativa vape cartridges for focus and energy',
      category: 'Vaporizers',
      image: '/images/post-thumb-05.jpg',
      promptType: 'product',
    },

    // Internal feed actions (used by section "View all" buttons)
    {
      id: 'feed-best-sellers',
      label: 'Show me best sellers this week',
      query: 'show me bestselling products this week',
      category: 'Best Sellers',
      image: '/images/post-thumb-05.jpg',
      promptType: 'bestsellers',
      feedId: 'best-sellers',
    },
    {
      id: 'feed-trending',
      label: 'Show me trending right now',
      query: 'show me trending products right now',
      category: 'Trending',
      image: '/images/post-thumb-05.jpg',
      promptType: 'feed',
      feedId: 'trending',
    },
    {
      id: 'feed-easy-picks',
      label: 'Show me easy picks for first timers',
      query: 'show me beginner friendly easy cannabis products',
      category: 'Easy Picks',
      image: '/images/post-thumb-04.jpg',
      promptType: 'feed',
      feedId: 'easy-picks',
    },
    {
      id: 'feed-calm-unwind',
      label: 'Show me calm & unwind favorites',
      query: 'show me calming relaxing favorites',
      category: 'Calm & Unwind',
      image: '/images/post-thumb-03.jpg',
      promptType: 'feed',
      feedId: 'calm-unwind',
    },
    {
      id: 'feed-best-value',
      label: 'Show me best value right now',
      query: 'show me best value deals right now',
      category: 'Best Value',
      image: '/images/post-thumb-06.jpg',
      promptType: 'feed',
      feedId: 'best-value',
    },
    {
      id: 'feed-uplifting-daytime',
      label: 'Show me uplifting & daytime picks',
      query: 'show me uplifting daytime picks',
      category: 'Uplifting',
      image: '/images/post-thumb-05.jpg',
      promptType: 'feed',
      feedId: 'uplifting-daytime',
    },
    {
      id: 'feed-staff-picks',
      label: 'Show me staff picks',
      query: 'show me staff picks',
      category: 'Staff Picks',
      image: '/images/post-thumb-04.jpg',
      promptType: 'feed',
      feedId: 'staff-picks',
    },
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

  const getCategorySlugForProduct = (p: Product) => {
    const typeSlugMap: Partial<Record<ProductType, string>> = {
      [ProductType.FLOWER]: 'flower',
      [ProductType.PRE_ROLLS]: 'pre-rolls',
      [ProductType.VAPORIZERS]: 'vaporizers',
      [ProductType.CONCENTRATES]: 'concentrates',
      [ProductType.EDIBLES]: 'edibles',
      [ProductType.BEVERAGES]: 'beverages',
    }

    if (p.type && typeSlugMap[p.type]) return typeSlugMap[p.type] as string
    if (p.category) return p.category.toLowerCase().replace(/\s+/g, '-')
    return 'flower'
  }

  const hashStringToInt = (input: string) => {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }

  const getDeterministicTileHeight = (productId: string) => {
    const heightOptions = [168, 208, 248, 192]
    const n = hashStringToInt(productId)
    return heightOptions[n % heightOptions.length]
  }

  const getDiscountPercent = (p: Product) => {
    const v = (p as any)?.discountValueFinal
    if (typeof v === 'number' && v > 0) return v
    const first = (p as any)?.discounts?.[0]?.value
    if (typeof first === 'number' && first > 0) return first
    return 0
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatMode, setIsChatMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allProductsGlobal, setAllProductsGlobal] = useState<Product[]>([])
  const [showPrePrompts, setShowPrePrompts] = useState(true)
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([])
  const [bestSellerLoading, setBestSellerLoading] = useState(true)
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [easyPicksProducts, setEasyPicksProducts] = useState<Product[]>([])
  const [easyPicksLoading, setEasyPicksLoading] = useState(true)
  const [calmUnwindProducts, setCalmUnwindProducts] = useState<Product[]>([])
  const [calmUnwindLoading, setCalmUnwindLoading] = useState(true)
  const [bestValueProducts, setBestValueProducts] = useState<Product[]>([])
  const [bestValueLoading, setBestValueLoading] = useState(true)
  const [upliftingProducts, setUpliftingProducts] = useState<Product[]>([])
  const [upliftingLoading, setUpliftingLoading] = useState(true)
  const [staffPicksProducts, setStaffPicksProducts] = useState<Product[]>([])
  const [staffPicksLoading, setStaffPicksLoading] = useState(true)
  const [categoryCountsByApi, setCategoryCountsByApi] = useState<Record<string, number>>({})
  const [aiModeOpen, setAiModeOpen] = useState(forceAIMode)
  const [showFilterNav, setShowFilterNav] = useState(false)
  const [showFilterNavInAiMode, setShowFilterNavInAiMode] = useState(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FacetedFilters>({})
  const [filterModalOpen, setFilterModalOpen] = useState(false)
  const [dispenseError, setDispenseError] = useState<string | null>(null)
  // Homepage hero (Airbnb-style) dropdown state
  const [heroCategory, setHeroCategory] = useState<string>('')
  const [heroStrain, setHeroStrain] = useState<string>('')
  const [heroType, setHeroType] = useState<string>('')
  const [heroCategoryOpen, setHeroCategoryOpen] = useState(false)
  const [heroStrainOpen, setHeroStrainOpen] = useState(false)
  const [heroTypeOpen, setHeroTypeOpen] = useState(false)
  const [heroTypesOpenSection, setHeroTypesOpenSection] = useState<'discounted' | 'brands' | 'weights' | 'terpenes' | null>(null)
  const [heroShowMoreFilters, setHeroShowMoreFilters] = useState(false)

  // Allow category pages to preselect a hero category.
  useEffect(() => {
    if (!initialHeroCategory) return
    setHeroCategory((prev) => (prev ? prev : initialHeroCategory))
  }, [initialHeroCategory])
  const heroCategoryBtnRef = useRef<HTMLButtonElement | null>(null)
  const heroStrainBtnRef = useRef<HTMLButtonElement | null>(null)
  const heroTypeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [heroDropdownPos, setHeroDropdownPos] = useState<{
    which: 'categories' | 'strains' | 'types'
    top: number
    left: number
    width: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const aiModeScrollRef = useRef<HTMLDivElement>(null)
  const lastProcessedQueryRef = useRef<string>('')
  const processingRef = useRef<boolean>(false)
  const inFlightRequestIds = useRef<Set<string>>(new Set())
  const messageIdsRef = useRef<Set<string>>(new Set())
  const lastStoreInfoRef = useRef<{ id: string | null; ts: number }>({ id: null, ts: 0 })
  const lastSubmitRef = useRef<{ key: string; ts: number } | null>(null)
  const feedPrefetchReqIdRef = useRef(0)
  const homeFeedCatalogRef = useRef<Product[]>([])
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

  useEffect(() => {
    setMounted(true)
  }, [])

  const safeFetchAllProducts = async (params: any) => {
    try {
      setDispenseError(null)
      return await fetchAllProducts(params)
    } catch (err: any) {
      setDispenseError(err?.message || 'Failed to fetch products.')
      return [] as Product[]
    }
  }

  const safeListDispenseProducts = async <T,>(
    params: Record<string, any>,
    opts?: { signal?: AbortSignal }
  ) => {
    try {
      setDispenseError(null)
      return await listDispenseProducts<T>(params, opts)
    } catch (err: any) {
      setDispenseError(err?.message || 'Failed to fetch products.')
      return { data: [], nextCursor: null } as any
    }
  }

  // Homepage hero: load full catalog facets when the hero dropdown opens.
  // (Same data source as the store-page FilterNav popup.)
  useEffect(() => {
    const shouldLoad =
      forceAIMode &&
      heroOnly &&
      heroVariant === 'viator' &&
      (heroCategoryOpen || heroStrainOpen || heroTypeOpen)
    if (!shouldLoad) return
    if (allProductsGlobal.length > 0) return

    let cancelled = false
    const loadAll = async () => {
      try {
        let res = await safeFetchAllProducts({})
        if (!res || res.length === 0) {
          res = await safeFetchAllProducts({ quantityMin: 1 })
        }
        if (!cancelled) {
          setAllProductsGlobal(res || [])
          if (!baseProducts.length && res?.length) setBaseProducts(res)
        }
      } catch (err) {
        console.warn('Failed to load all products for homepage facets', err)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
  }, [
    allProductsGlobal.length,
    baseProducts.length,
    forceAIMode,
    heroCategoryOpen,
    heroOnly,
    heroStrainOpen,
    heroTypeOpen,
    heroVariant,
  ])

  // Homepage hero: compute dropdown position + keep it in sync on scroll/resize.
  useEffect(() => {
    const open = !!heroDropdownPos
    const which = heroDropdownPos?.which
    if (!open || !which) return

    const update = () => {
      setHeroDropdownPos((prev) => {
        if (!prev) return prev
        const btn =
          prev.which === 'categories'
            ? heroCategoryBtnRef.current
            : prev.which === 'strains'
              ? heroStrainBtnRef.current
              : heroTypeBtnRef.current
        if (!btn) return prev
        const rect = btn.getBoundingClientRect()
        const top = rect.bottom + 8
        const left = rect.left
        const width = rect.width
        if (prev.top === top && prev.left === left && prev.width === width) return prev
        return { ...prev, top, left, width }
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  })

  // Close hero dropdown on outside click
  useEffect(() => {
    if (!heroDropdownPos) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      const isInBtn =
        heroCategoryBtnRef.current?.contains(t) ||
        heroStrainBtnRef.current?.contains(t) ||
        heroTypeBtnRef.current?.contains(t)
      const portalEl = document.querySelector('[data-home-hero-dropdown]')
      const isInPortal = portalEl ? portalEl.contains(t) : false
      if (!isInBtn && !isInPortal) {
        setHeroDropdownPos(null)
        setHeroCategoryOpen(false)
        setHeroStrainOpen(false)
        setHeroTypeOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [heroDropdownPos])

  // Lock body scroll while the location modal is open (prevents scrolling the sticky header/page behind it).
  useEffect(() => {
    if (!showLocationDropdown) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [showLocationDropdown])

  const getCreatedTs = (p: Product) => {
    const raw: any =
      (p as any)?.createdAt ??
      (p as any)?.created ??
      (p as any)?.updatedAt ??
      (p as any)?.updated ??
      (p as any)?.publishedAt
    if (typeof raw === 'number') return raw
    if (typeof raw === 'string') {
      const t = Date.parse(raw)
      return Number.isFinite(t) ? t : 0
    }
    return 0
  }

  const getTotalSold = (p: Product) => {
    const n = (p as any)?.totalSold
    return typeof n === 'number' ? n : 0
  }

  const getCannabisType = (p: Product) => `${(p as any)?.cannabisType || ''}`.toUpperCase()

  const dedupeProducts = (arr: Product[]) => {
    const byId = new Map<string, Product>()
    arr.forEach((p) => {
      if (p?.id) byId.set(p.id, p)
    })
    return Array.from(byId.values())
  }

  const deriveFeedFromCatalog = (feedId: FeedId, catalog: Product[]): Product[] => {
    const list = catalog || []

    if (feedId === 'best-sellers') {
      return [...list].sort((a, b) => getTotalSold(b) - getTotalSold(a))
    }

    if (feedId === 'trending') {
      return [...list].sort((a, b) => getCreatedTs(b) - getCreatedTs(a))
    }

    if (feedId === 'easy-picks') {
      const easy = list.filter((p) => {
        const productType = getProductType(p)
        // Check both productType and also check if category matches (fallback)
        const categoryLower = (p.category || '').toLowerCase()
        const isPreRollCategory = /pre[\s-]?roll/.test(categoryLower)
        const isVapeCategory = /vape|vaporizer/.test(categoryLower)
        const isPreRoll =
          productType === 'preRoll' ||
          p.type === ProductType.PRE_ROLLS ||
          isPreRollCategory
        const isVape =
          productType === 'vape' ||
          p.type === ProductType.VAPORIZERS ||
          isVapeCategory
        
        return isPreRoll || isVape
      })
      return [...easy].sort((a, b) => getTotalSold(b) - getTotalSold(a))
    }

    if (feedId === 'calm-unwind') {
      const calm = list.filter((p) => {
        const ct = getCannabisType(p)
        return ct === 'INDICA' || ct === 'HYBRID_INDICA'
      })
      return [...calm].sort((a, b) => getTotalSold(b) - getTotalSold(a))
    }

    if (feedId === 'uplifting-daytime') {
      const up = list.filter((p) => {
        const ct = getCannabisType(p)
        return ct === 'SATIVA' || ct === 'HYBRID_SATIVA'
      })
      return [...up].sort((a, b) => getTotalSold(b) - getTotalSold(a))
    }

    if (feedId === 'best-value') {
      const discounted = list.filter((p: any) => getDiscountPercent(p) > 0)
      return [...discounted].sort((a: any, b: any) => getDiscountPercent(b) - getDiscountPercent(a))
    }

    if (feedId === 'staff-picks') {
      const featured = list.filter((p: any) => p?.featured)
      if (featured.length > 0) return featured
      const seed = new Date().toISOString().slice(0, 10)
      return [...list].sort((a: any, b: any) => {
        const ha = hashStringToInt(`${seed}:${a?.id || ''}`)
        const hb = hashStringToInt(`${seed}:${b?.id || ''}`)
        return ha - hb
      })
    }

    return list
  }

  const fetchFeedProducts = async (
    feedId: FeedId,
    options?: { signal?: AbortSignal }
  ): Promise<Product[]> => {
    const signal = options?.signal
    const cached = homeFeedCatalogRef.current
    if (cached.length > 0) {
      return deriveFeedFromCatalog(feedId, cached)
    }

    // Fallback: single request, then derive locally (avoids 429 bursts).
    const res = await safeListDispenseProducts<Product>(
      { limit: 120, quantityMin: 1 },
      signal ? { signal } : undefined
    )
    const catalog = res.data || []
    homeFeedCatalogRef.current = catalog
    return deriveFeedFromCatalog(feedId, catalog)
  }

  // Prefetch a single "home feed catalog" and derive all sections locally (prevents 429 bursts).
  useEffect(() => {
    // Homepage hero doesn't render these sections; don't prefetch feeds there.
    if (forceAIMode && heroOnly) return
    if (!showPrePrompts || showResults || chatMessages.length > 0) return

    const controller = new AbortController()
    const reqId = ++feedPrefetchReqIdRef.current

    const run = async () => {
      try {
        setBestSellerLoading(true)
        setTrendingLoading(true)
        setEasyPicksLoading(true)
        setCalmUnwindLoading(true)
        setBestValueLoading(true)
        setUpliftingLoading(true)
        setStaffPicksLoading(true)

        // Two small requests (sequential) to seed the catalog with both "popular" and "new".
        const topSold = await safeListDispenseProducts<Product>(
          { limit: 120, sort: '-totalSold', quantityMin: 1 },
          { signal: controller.signal }
        )
        const recent = await safeListDispenseProducts<Product>(
          { limit: 120, sort: '-created', quantityMin: 1 },
          { signal: controller.signal }
        )
        const seedCatalog = dedupeProducts([...(topSold.data || []), ...(recent.data || [])])

        if (reqId !== feedPrefetchReqIdRef.current) return

        homeFeedCatalogRef.current = seedCatalog

        // Avoid repeating the same products across sections where possible.
        const used = new Set<string>()
        const excludeUsed = (arr: Product[], limit: number) => {
          const out: Product[] = []
          for (const p of arr) {
            if (!p?.id) continue
            if (used.has(p.id)) continue
            used.add(p.id)
            out.push(p)
            if (out.length >= limit) break
          }
          return out
        }

        const bestSellers = deriveFeedFromCatalog('best-sellers', seedCatalog)
        const trending = deriveFeedFromCatalog('trending', seedCatalog)
        const easy = deriveFeedFromCatalog('easy-picks', seedCatalog)
        const calm = deriveFeedFromCatalog('calm-unwind', seedCatalog)
        const value = deriveFeedFromCatalog('best-value', seedCatalog)
        const uplifting = deriveFeedFromCatalog('uplifting-daytime', seedCatalog)
        const staff = deriveFeedFromCatalog('staff-picks', seedCatalog)

        setBestSellerProducts(excludeUsed(bestSellers || [], 30))
        setTrendingProducts(excludeUsed(trending || [], 30))
        setEasyPicksProducts(excludeUsed(easy || [], 30))
        setCalmUnwindProducts(excludeUsed(calm || [], 30))
        setBestValueProducts(excludeUsed(value || [], 50))
        setUpliftingProducts(excludeUsed(uplifting || [], 30))
        setStaffPicksProducts(excludeUsed(staff || [], 30))
      } catch (err: any) {
        if (reqId !== feedPrefetchReqIdRef.current) return
        if (err?.name === 'AbortError') return
        console.error('Error prefetching feeds:', err)
      } finally {
        if (reqId !== feedPrefetchReqIdRef.current) return
        setBestSellerLoading(false)
        setTrendingLoading(false)
        setEasyPicksLoading(false)
        setCalmUnwindLoading(false)
        setBestValueLoading(false)
        setUpliftingLoading(false)
        setStaffPicksLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [
    chatMessages.length,
    showPrePrompts,
    showResults,
    trendingProducts.length,
    easyPicksProducts.length,
    calmUnwindProducts.length,
    bestValueProducts.length,
    upliftingProducts.length,
    staffPicksProducts.length,
  ])

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

  // Load full catalog for facets ONLY when the filter UI is opened.
  // This prevents a big burst of requests on initial page load (429 rate limits).
  useEffect(() => {
    if (!showFilterNavInAiMode && !showFilterNav && !filterModalOpen) return
    if (allProductsGlobal.length > 0) return

    let cancelled = false
    const loadAll = async () => {
      try {
        // Fetch full catalog (no quantityMin) so facets reflect all inventory
        let res = await safeFetchAllProducts({})
        // Fallback to in-stock only if empty
        if (!res || res.length === 0) {
          res = await safeFetchAllProducts({
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
  }, [allProductsGlobal.length, baseProducts.length, filterModalOpen, showFilterNav, showFilterNavInAiMode])

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

  // Auto-scroll disabled - users can manually scroll to see messages
  // Removed auto-scroll to prevent unwanted page movement after prompts

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
        allProducts = await safeFetchAllProducts(params)
      } catch (err) {
        // If pagination fails, try single request
        console.warn('Pagination failed, trying single request:', err)
        const res = await safeListDispenseProducts<Product>(params)
        allProducts = res.data || []
      }
      
      // If still no products, try without quantityMin filter
      if (allProducts.length === 0 && presetId !== 'pre-rolls-ready') {
        const fallbackParams = { ...params }
        delete fallbackParams.quantityMin
        const res = await safeListDispenseProducts<Product>(fallbackParams)
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
    try {
      log('openai-call', { requestId, userMessage, concise })
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userMessage,
          concise,
          requestId,
          messages: chatMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`AI API error: ${response.statusText}`)
      }

      const data = await response.json()
      log('openai-response', { requestId })
      return data?.content || 'Sorry, I could not generate a response.'
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
    // Skip strain filtering for "best vapes for beginners" to show all vapes
    const isVapesForBeginners = userQuery.toLowerCase().includes('best vapes for beginners') || 
                                 userQuery.toLowerCase().includes('vapes for beginners')
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
          allProducts = await safeFetchAllProducts(params)
        } catch (err) {
          console.warn('Pagination failed, falling back to single request:', err)
          const res = await safeListDispenseProducts<Product>(params)
          allProducts = res.data || []
        }
      } else {
        const res = await safeListDispenseProducts<Product>(params)
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
      if (filters.strainType && !isVapesForBeginners) {
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
          const fallbackRes = await safeListDispenseProducts<Product>(fallbackParams)
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
      if (filters.strainType && !isVapesForBeginners) {
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
        strains: (strainTypesToAdd.length > 0 && !isVapesForBeginners)
          ? mergeFilterArray(activeFilters.strains, strainTypesToAdd, normalizationFacets.strains)
          : (isVapesForBeginners ? [] : activeFilters.strains || []),
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
            const lists = await Promise.all(
              selectedCategories.map((cat) =>
                safeFetchAllProducts({
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
  const categoryOptions = useMemo(() => {
    const base = CATEGORY_DEFS.map((c) => c.name)
    // Some parts of the site surface Topicals; include it if not in the core list.
    if (!base.some((c) => c.toLowerCase() === 'topicals')) base.push('Topicals')
    return base
  }, [])
  const strainOptions = facets.strains
  
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

  const toggleHeroTypeFilter = (type: 'saleOnly' | 'brands' | 'weights' | 'terpenes', value?: string) => {
    if (type === 'saleOnly') {
      const next: FacetedFilters = { ...activeFilters, saleOnly: !activeFilters.saleOnly }
      handleFiltersChange(next)
      return
    }
    const key = type
    const current = (activeFilters[key] || []) as string[]
    const updated = value
      ? (current.some((v) => v.toLowerCase() === value.toLowerCase())
          ? current.filter((v) => v.toLowerCase() !== value.toLowerCase())
          : [...current, value])
      : []
    const next: FacetedFilters = { ...activeFilters, [key]: updated.length ? updated : undefined }
    handleFiltersChange(next)
  }

  const clearHeroTypeFilters = () => {
    const next: FacetedFilters = {
      ...activeFilters,
      saleOnly: false,
      brands: undefined,
      weights: undefined,
      terpenes: undefined,
    }
    handleFiltersChange(next)
    setHeroType('')
    setHeroTypeOpen(false)
    setHeroDropdownPos(null)
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
          const lists = await Promise.all(
            selectedCategories.map((cat) =>
              safeFetchAllProducts({
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
          if (forceAIMode && heroOnly && heroVariant === 'viator' && homeResultsPortalId && typeof window !== 'undefined') {
            setHeroShowMoreFilters(true)
            setShowFilterNavInAiMode(false)
            setShowLocationDropdown(false)
            window.dispatchEvent(new CustomEvent('home:startHereMode', { detail: { mode: 'results' } }))
          }
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

    // In hero viator mode, show results view immediately after any filter change (no need to click search)
    if (forceAIMode && heroOnly && heroVariant === 'viator' && homeResultsPortalId && typeof window !== 'undefined') {
      setHeroShowMoreFilters(true)
      setShowFilterNavInAiMode(false)
      setShowLocationDropdown(false)
      window.dispatchEvent(new CustomEvent('home:startHereMode', { detail: { mode: 'results' } }))
    }
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
  const handleAiModePrompt = async (prompt: AiPrompt) => {
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
• Make purchases at Kine Buds
• Points are earned based on your purchase amount
• Check with store staff for current point earning rates

Redeem Points:
• Visit Kine Buds to redeem your points
• Points can be used for discounts on future purchases
• Speak with store staff to check your current point balance and redemption options

For specific details about earning rates and redemption options, please contact Kine Buds or visit in person.`
        appendAssistantMessage(loyaltyInfo, requestId)
        return
      }
      
      if (prompt.promptType === 'bestsellers') {
        setLoading(true)
        setShowResults(true)
        try {
          const bestSellers = await fetchFeedProducts('best-sellers')
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

      if (prompt.promptType === 'feed' && prompt.feedId) {
        setLoading(true)
        setShowResults(true)
        try {
          const list = await fetchFeedProducts(prompt.feedId)
          setProducts(list)
          setBaseProducts(list)
          appendAssistantMessage(`Here are ${prompt.label.toLowerCase()}:`, requestId)
        } catch (error) {
          console.error('Error fetching feed:', error)
          appendAssistantMessage(`Sorry, I couldn't load that section right now.`, requestId)
        } finally {
          setLoading(false)
        }
        return
      }
      
      if (prompt.promptType === 'category' && prompt.categorySlug) {
        // Navigate directly to category page
        const storeId = getActiveStoreId()
        const categoryPath = storeId 
          ? `/stores/${storeId}/shop/${prompt.categorySlug}`
          : `/shop/${prompt.categorySlug}`
        router.push(categoryPath)
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
      
      // For "best vapes for beginners" prompt, remove strain filtering to show all vapes
      let filtersToUse = intentResult.extracted
      if (prompt.id === 'prompt-vapes-beginners') {
        filtersToUse = {
          ...intentResult.extracted,
          strainType: undefined,
          effectIntent: undefined,
        }
      }
      
      if (intentResult.intent === 'PRODUCT_SHOPPING' || intentResult.intent === 'PRODUCT_INFO') {
        // Use label for display consistency, query for processing
        // The searchProductsWithFilters function will handle including hybrid for sleep/relaxation queries
        await searchProductsWithFilters(filtersToUse, prompt.label, requestId)
      } else if (intentResult.intent === 'STORE_INFO') {
        handleStoreInfo(intentResult, prompt.label, requestId)
      } else {
        // Fallback for other intents
        // Use label for display consistency, query for processing
        await searchProductsWithFilters(filtersToUse, prompt.label, requestId)
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
    // Only lock body scroll for the full-screen overlay experience.
    // For `forceAIMode` (store pages), we want the page to scroll normally and
    // the AI search header to behave like a sticky navbar.
    if (!aiModeOpen || forceAIMode) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [aiModeOpen, forceAIMode])

  // Full-screen AI Mode overlay - conditionally rendered (or always if forceAIMode)
  const aiModeOverlay = (aiModeOpen || forceAIMode) ? (
      <div 
        key="ai-mode-overlay"
        className={
          forceAIMode
            ? (heroOnly ? "bg-transparent" : "min-h-[100dvh] bg-transparent flex flex-col")
            : "fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
        }
      >
        {/* Search box inside AI Mode */}
        <div
          className={
            forceAIMode
              ? (heroOnly
                  ? "pb-0"
                  : "sticky top-20 z-30 bg-white/0 backdrop-blur px-4 pb-6")
              : "px-4 pb-4 border-b border-gray-200"
          }
          style={{
            // Prevent the top content from sitting under the notch/status bar on iOS
            paddingTop: forceAIMode
              ? (heroOnly ? '0px' : '16px')
              : 'calc(env(safe-area-inset-top, 0px) + 16px)',
          }}
        >
          <div className={forceAIMode ? "max-w-6xl mx-auto" : "max-w-2xl mx-auto"}>
            {/* Location modal */}
            {mounted && showLocationDropdown && createPortal(
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
              </div>,
              document.body
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

            {forceAIMode ? (
              heroVariant === 'viator' ? (
                <div className="pb-1.5 sm:pb-3">
                  <div className="flex flex-col items-start text-left gap-2 sm:gap-3">
                    <GoogleReviewSummary />
                    <div className="w-full flex flex-col items-start gap-1 sm:gap-1.5">
                      <h1 className="text-[30px] sm:text-5xl lg:text-[60px] font-extrabold tracking-tight text-white whitespace-nowrap leading-tight">
                        {heroTitle ? (
                          heroTitle
                        ) : (
                          <>
                            Find your next <RotatingWord />
                          </>
                        )}
                      </h1>
                      <p className="max-w-3xl text-base sm:text-lg text-white/90 leading-snug">
                        Search our menu at Kine Buds &mdash; Your top destination for cannabis in Maywood, New Jersey.
                      </p>
                      {dispenseError ? (
                        <div className="mt-2 inline-flex max-w-3xl items-center rounded-2xl bg-black/40 px-4 py-2 text-left text-sm text-white ring-1 ring-white/15 backdrop-blur">
                          <span className="font-semibold">Menu connection issue:</span>
                          <span className="ml-2 truncate">
                            {dispenseError.includes('not configured')
                              ? 'Dispense API env is missing. Set DISPENSE_BASE_URL, DISPENSE_API_KEY, and DISPENSE_VENUE_ID.'
                              : dispenseError}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* Single search bar: portaled to navbar when slot ready, otherwise in hero */}
                    {(() => {
                      const theForm = (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault()
                        const next: FacetedFilters = {
                          categories: heroCategory ? [heroCategory] : undefined,
                          strains: heroStrain ? [heroStrain] : undefined,
                          saleOnly: activeFilters.saleOnly ?? false,
                          brands: activeFilters.brands?.length ? activeFilters.brands : undefined,
                          weights: activeFilters.weights?.length ? activeFilters.weights : undefined,
                          terpenes: activeFilters.terpenes?.length ? activeFilters.terpenes : undefined,
                        }
                        setShowFilterNavInAiMode(false)
                        setShowLocationDropdown(false)
                        await handleFiltersChange(next)
                        setHeroShowMoreFilters(true)
                        if (homeResultsPortalId && typeof window !== 'undefined') {
                          window.dispatchEvent(
                            new CustomEvent('home:startHereMode', { detail: { mode: 'results' } })
                          )
                        }
                      }}
                      className={inNavbarSlot ? 'w-full' : 'mt-8 sm:mt-8 w-full'}
                    >
                      {/* Keep the navbar anchor/input alive (used by SiteChrome to jump/focus). */}
                      <input
                        id="ai-search-input"
                        ref={aiModeInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="sr-only"
                        aria-hidden="true"
                        tabIndex={-1}
                      />

                      <div className="w-full max-w-5xl overflow-visible rounded-full ring-black/10 bg-white/10 backdrop-blur-md">
                        <div className="px-2 py-1.5 sm:px-2 sm:py-1">
                          <div className="flex flex-row flex-nowrap items-center gap-0">
                            {/* Browse */}
                            <div className="relative min-w-0 flex-1 overflow-hidden rounded-none border-0 bg-transparent sm:min-w-[120px]">
                              <button
                                type="button"
                                ref={heroCategoryBtnRef}
                                onClick={() => {
                                  const rect = heroCategoryBtnRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  const nextOpen = !heroCategoryOpen
                                  setHeroCategoryOpen(nextOpen)
                                  setHeroStrainOpen(false)
                                  setHeroTypeOpen(false)
                                  setHeroDropdownPos(
                                    nextOpen
                                      ? { which: 'categories', top: rect.bottom + 8, left: rect.left, width: rect.width }
                                      : null
                                  )
                                }}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left sm:px-4 sm:py-2"
                                aria-haspopup="listbox"
                                aria-expanded={heroCategoryOpen}
                              >
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-gray-900 leading-tight">Browse</div>
                                  <div
                                    className={[
                                      'truncate text-[13px] leading-tight',
                                      heroCategory
                                        ? 'font-medium text-gray-800'
                                        : 'animate-gradient-x bg-[linear-gradient(to_right,#ec4899,#a855f7,#ec4899)] bg-[length:200%_auto] bg-clip-text font-light text-transparent',
                                    ].join(' ')}
                                  >
                                    {heroCategory || 'Flower, vapes, edibles and more'}
                                  </div>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" />
                              </button>
                            </div>

                            {/* Divider */}
                            <div className="w-px self-stretch bg-gray-200 shrink-0" />

                            {/* Strain */}
                            <div className="relative min-w-0 flex-1 overflow-hidden rounded-none border-0 bg-transparent sm:min-w-[120px]">
                              <button
                                type="button"
                                ref={heroStrainBtnRef}
                                onClick={() => {
                                  const rect = heroStrainBtnRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  const nextOpen = !heroStrainOpen
                                  setHeroStrainOpen(nextOpen)
                                  setHeroCategoryOpen(false)
                                  setHeroTypeOpen(false)
                                  setHeroDropdownPos(
                                    nextOpen
                                      ? { which: 'strains', top: rect.bottom + 8, left: rect.left, width: rect.width }
                                      : null
                                  )
                                }}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left sm:px-4 sm:py-2"
                                aria-haspopup="listbox"
                                aria-expanded={heroStrainOpen}
                              >
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-gray-900 leading-tight">By strain</div>
                                  <div
                                    className={[
                                      'truncate text-[13px] leading-tight',
                                      heroStrain
                                        ? 'font-medium text-gray-800'
                                        : 'animate-gradient-x bg-[linear-gradient(to_right,#ec4899,#a855f7,#ec4899)] bg-[length:200%_auto] bg-clip-text font-light text-transparent',
                                    ].join(' ')}
                                  >
                                    {heroStrain ? formatStrainLabel(heroStrain) : 'Indica, Sativa or Hybrid'}
                                  </div>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" />
                              </button>
                            </div>

                            {/* Divider */}
                            <div className="w-px self-stretch bg-gray-200 shrink-0" />

                            {/* Types (Discounted, Brands, Weight, Terpenes) */}
                            <div className="relative min-w-0 flex-1 overflow-hidden rounded-none border-0 bg-transparent sm:min-w-[120px]">
                              <button
                                type="button"
                                ref={heroTypeBtnRef}
                                onClick={() => {
                                  const rect = heroTypeBtnRef.current?.getBoundingClientRect()
                                  if (!rect) return
                                  const nextOpen = !heroTypeOpen
                                  setHeroTypeOpen(nextOpen)
                                  setHeroCategoryOpen(false)
                                  setHeroStrainOpen(false)
                                  setHeroDropdownPos(
                                    nextOpen
                                      ? { which: 'types', top: rect.bottom + 8, left: rect.left, width: rect.width }
                                      : null
                                  )
                                  if (nextOpen) setHeroTypesOpenSection(null)
                                }}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left sm:px-4 sm:py-2"
                                aria-haspopup="listbox"
                                aria-expanded={heroTypeOpen}
                              >
                                <div className="min-w-0">
                                  <div className="text-[11px] font-semibold text-gray-900 leading-tight">By type</div>
                                  <div
                                    className={[
                                      'truncate text-[13px] leading-tight',
                                      (activeFilters.saleOnly || (activeFilters.brands?.length ?? 0) > 0 || (activeFilters.weights?.length ?? 0) > 0 || (activeFilters.terpenes?.length ?? 0) > 0)
                                        ? 'font-medium text-gray-800'
                                        : 'animate-gradient-x bg-[linear-gradient(to_right,#ec4899,#a855f7,#ec4899)] bg-[length:200%_auto] bg-clip-text font-light text-transparent',
                                    ].join(' ')}
                                  >
                                    {(() => {
                                      const parts: string[] = []
                                      if (activeFilters.saleOnly) parts.push('On sale')
                                      if (activeFilters.brands?.length) parts.push(`${activeFilters.brands.length} brand${activeFilters.brands.length !== 1 ? 's' : ''}`)
                                      if (activeFilters.weights?.length) parts.push(`${activeFilters.weights.length} weight${activeFilters.weights.length !== 1 ? 's' : ''}`)
                                      if (activeFilters.terpenes?.length) parts.push(`${activeFilters.terpenes.length} terpene${activeFilters.terpenes.length !== 1 ? 's' : ''}`)
                                      return parts.length > 0 ? parts.join(', ') : 'Discounted, Brands, Weight, Terpenes'
                                    })()}
                                  </div>
                                </div>
                                <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown menus (ported to body so they never get clipped) */}
                      {heroDropdownPos && mounted && typeof document !== 'undefined'
                        ? createPortal(
                            <div
                              data-home-hero-dropdown
                              style={{
                                position: 'fixed',
                                top: heroDropdownPos.top,
                                left: heroDropdownPos.left,
                                width: heroDropdownPos.which === 'types' ? 320 : heroDropdownPos.width,
                                minWidth: heroDropdownPos.which === 'types' ? 320 : undefined,
                                zIndex: 200,
                              }}
                            >
                              <div className="overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
                                <div className="max-h-80 overflow-auto p-2">
                                  {heroDropdownPos.which === 'types' ? (
                                    <>
                                      <button
                                        type="button"
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                        onClick={clearHeroTypeFilters}
                                      >
                                        Any
                                      </button>
                                      <div className="my-2 border-t border-gray-100" />

                                      {/* Discounted (collapsible) */}
                                      <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setHeroTypesOpenSection((s) => (s === 'discounted' ? null : 'discounted'))
                                          }}
                                          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                        >
                                          <span>Discounted</span>
                                          <span className="flex items-center gap-2">
                                            {activeFilters.saleOnly && (
                                              <span className="text-xs font-medium text-green-600">On</span>
                                            )}
                                            {heroTypesOpenSection === 'discounted' ? (
                                              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                            ) : (
                                              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                            )}
                                          </span>
                                        </button>
                                        {heroTypesOpenSection === 'discounted' && (
                                          <div className="border-t border-gray-100 px-2 pb-2">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                toggleHeroTypeFilter('saleOnly')
                                              }}
                                              className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-medium hover:bg-gray-50 text-gray-800"
                                            >
                                              <span className="flex items-center gap-3">
                                                <span
                                                  className={`h-5 w-5 shrink-0 rounded border flex items-center justify-center ${
                                                    activeFilters.saleOnly ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                                                  }`}
                                                >
                                                  {activeFilters.saleOnly && <CheckIcon className="h-3 w-3" />}
                                                </span>
                                                <span>On sale</span>
                                              </span>
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Brands (collapsible) */}
                                      {facets.brands?.length ? (
                                        <div className="mt-1 rounded-2xl border border-gray-100 overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setHeroTypesOpenSection((s) => (s === 'brands' ? null : 'brands'))
                                            }}
                                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                          >
                                            <span>Brands</span>
                                            <span className="flex items-center gap-2">
                                              {(activeFilters.brands?.length ?? 0) > 0 && (
                                                <span className="text-xs font-medium text-green-600">{activeFilters.brands?.length}</span>
                                              )}
                                              {heroTypesOpenSection === 'brands' ? (
                                                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                              ) : (
                                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                              )}
                                            </span>
                                          </button>
                                          {heroTypesOpenSection === 'brands' && (
                                            <div className="max-h-48 overflow-auto border-t border-gray-100 px-2 pb-2">
                                              {facets.brands.map((opt) => {
                                                const selected = (activeFilters.brands || []).some((v) => v.toLowerCase() === opt.toLowerCase())
                                                return (
                                                  <button
                                                    key={`brand-${opt}`}
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      toggleHeroTypeFilter('brands', opt)
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-medium hover:bg-gray-50 text-gray-800"
                                                  >
                                                    <span className="flex items-center gap-3">
                                                      <span
                                                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                                                          selected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                                                        }`}
                                                      >
                                                        {selected && <CheckIcon className="h-2.5 w-2.5" />}
                                                      </span>
                                                      <span className="truncate">{opt}</span>
                                                    </span>
                                                    {finalFacetCounts.brands?.[opt] != null && (
                                                      <span className="shrink-0 text-xs text-gray-500">{finalFacetCounts.brands[opt]}</span>
                                                    )}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      ) : null}

                                      {/* Weight (collapsible) */}
                                      {facets.weights?.length ? (
                                        <div className="mt-1 rounded-2xl border border-gray-100 overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setHeroTypesOpenSection((s) => (s === 'weights' ? null : 'weights'))
                                            }}
                                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                          >
                                            <span>Weight</span>
                                            <span className="flex items-center gap-2">
                                              {(activeFilters.weights?.length ?? 0) > 0 && (
                                                <span className="text-xs font-medium text-green-600">{activeFilters.weights?.length}</span>
                                              )}
                                              {heroTypesOpenSection === 'weights' ? (
                                                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                              ) : (
                                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                              )}
                                            </span>
                                          </button>
                                          {heroTypesOpenSection === 'weights' && (
                                            <div className="max-h-48 overflow-auto border-t border-gray-100 px-2 pb-2">
                                              {facets.weights.map((opt) => {
                                                const selected = (activeFilters.weights || []).some((v) => v.toLowerCase() === opt.toLowerCase())
                                                return (
                                                  <button
                                                    key={`weight-${opt}`}
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      toggleHeroTypeFilter('weights', opt)
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-medium hover:bg-gray-50 text-gray-800"
                                                  >
                                                    <span className="flex items-center gap-3">
                                                      <span
                                                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                                                          selected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                                                        }`}
                                                      >
                                                        {selected && <CheckIcon className="h-2.5 w-2.5" />}
                                                      </span>
                                                      <span className="truncate">{opt}</span>
                                                    </span>
                                                    {finalFacetCounts.weights?.[opt] != null && (
                                                      <span className="shrink-0 text-xs text-gray-500">{finalFacetCounts.weights[opt]}</span>
                                                    )}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      ) : null}

                                      {/* Terpenes (collapsible) */}
                                      {facets.terpenes?.length ? (
                                        <div className="mt-1 rounded-2xl border border-gray-100 overflow-hidden">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setHeroTypesOpenSection((s) => (s === 'terpenes' ? null : 'terpenes'))
                                            }}
                                            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                          >
                                            <span>Terpenes</span>
                                            <span className="flex items-center gap-2">
                                              {(activeFilters.terpenes?.length ?? 0) > 0 && (
                                                <span className="text-xs font-medium text-green-600">{activeFilters.terpenes?.length}</span>
                                              )}
                                              {heroTypesOpenSection === 'terpenes' ? (
                                                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                              ) : (
                                                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                              )}
                                            </span>
                                          </button>
                                          {heroTypesOpenSection === 'terpenes' && (
                                            <div className="max-h-48 overflow-auto border-t border-gray-100 px-2 pb-2">
                                              {facets.terpenes.map((opt) => {
                                                const selected = (activeFilters.terpenes || []).some((v) => v.toLowerCase() === opt.toLowerCase())
                                                return (
                                                  <button
                                                    key={`terp-${opt}`}
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      toggleHeroTypeFilter('terpenes', opt)
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-sm font-medium hover:bg-gray-50 text-gray-800"
                                                  >
                                                    <span className="flex items-center gap-3">
                                                      <span
                                                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                                                          selected ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                                                        }`}
                                                      >
                                                        {selected && <CheckIcon className="h-2.5 w-2.5" />}
                                                      </span>
                                                      <span className="truncate">{opt}</span>
                                                    </span>
                                                    {finalFacetCounts.terpenes?.[opt] != null && (
                                                      <span className="shrink-0 text-xs text-gray-500">{finalFacetCounts.terpenes[opt]}</span>
                                                    )}
                                                  </button>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      ) : null}
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                        onClick={() => {
                                          if (heroDropdownPos.which === 'categories') {
                                            setHeroCategory('')
                                            setHeroCategoryOpen(false)
                                          } else if (heroDropdownPos.which === 'strains') {
                                            setHeroStrain('')
                                            setHeroStrainOpen(false)
                                          }
                                          setHeroDropdownPos(null)
                                        }}
                                      >
                                        Any
                                      </button>
                                      {(heroDropdownPos.which === 'categories' ? categoryOptions : strainOptions).map((val) => (
                                        <button
                                          key={`${heroDropdownPos.which}-${val}`}
                                          type="button"
                                          className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                          onClick={async () => {
                                            const next: FacetedFilters = {
                                              categories: heroDropdownPos.which === 'categories' ? [val] : (heroCategory ? [heroCategory] : undefined),
                                              strains: heroDropdownPos.which === 'strains' ? [val] : (heroStrain ? [heroStrain] : undefined),
                                              saleOnly: activeFilters.saleOnly ?? false,
                                              brands: activeFilters.brands?.length ? activeFilters.brands : undefined,
                                              weights: activeFilters.weights?.length ? activeFilters.weights : undefined,
                                              terpenes: activeFilters.terpenes?.length ? activeFilters.terpenes : undefined,
                                            }
                                            if (heroDropdownPos.which === 'categories') {
                                              setHeroCategory(val)
                                              setHeroCategoryOpen(false)
                                            } else {
                                              setHeroStrain(val)
                                              setHeroStrainOpen(false)
                                            }
                                            setHeroDropdownPos(null)
                                            await handleFiltersChange(next)
                                          }}
                                        >
                                          <span className="flex items-center justify-between gap-3">
                                            <span className="truncate">
                                              {heroDropdownPos.which === 'strains' ? formatStrainLabel(val) : val}
                                            </span>
                                            {heroDropdownPos.which === 'categories' ? (
                                              (() => {
                                                const cnt = getCategoryCount(val, finalFacetCounts.categories)
                                                if (cnt > 0) {
                                                  return (
                                                    <span className="shrink-0 text-xs font-semibold text-gray-500">{cnt}</span>
                                                  )
                                                }
                                                return null
                                              })()
                                            ) : null}
                                            {heroDropdownPos.which === 'strains' && finalFacetCounts.strains?.[val] ? (
                                              <span className="shrink-0 text-xs font-semibold text-gray-500">{finalFacetCounts.strains[val]}</span>
                                            ) : null}
                                          </span>
                                        </button>
                                      ))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>,
                            document.body
                          )
                        : null}

                    </form>
                      )
                      return inNavbarSlot && navbarSlot?.slotRef?.current
                        ? createPortal(theForm, navbarSlot.slotRef.current)
                        : theForm
                    })()}

                    {/* Filter pills below hero bar (selected filters with X to remove) */}
                    {(filterPills.length > 0) && (
                      <div className="mt-4 w-full max-w-5xl">
                        <div className="flex flex-wrap gap-2">
                          {filterPills.map((pill) => (
                            <button
                              key={`${pill.key}-${pill.value || 'sale'}`}
                              type="button"
                              onClick={() => handleRemovePill(pill)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-800 shadow-sm backdrop-blur hover:bg-white transition whitespace-nowrap"
                            >
                              <span>{pill.label}</span>
                              <XMarkIcon className="h-4 w-4 text-gray-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/70 shadow-[0_30px_90px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl">
                  <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
                  <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
                  <div className="relative p-5 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="text-[26px] sm:text-4xl lg:text-[60px] font-extrabold tracking-tight text-gray-950 whitespace-nowrap">
                          {heroTitle ? (
                            heroTitle
                          ) : (
                            <>
                              Find your next <RotatingWord />
                            </>
                          )}
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-700">
                          Search Maywood’s premier cannabis destination for curated selections.
                        </p>
                      </div>
                      <div className="shrink-0">
                        <GoogleReviewSummary />
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSubmit(e)
                      }}
                      className="mt-6"
                    >
                      <div className="rounded-full border border-white/60 bg-white/90 shadow-lg ring-1 ring-black/5 backdrop-blur-xl">
                        <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
                          {/* Location segment */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowLocationDropdown(true)
                              setShowFilterNavInAiMode(false)
                            }}
                            className="inline-flex w-full items-center justify-between gap-3 rounded-full px-4 py-3 text-left hover:bg-black/5 sm:w-auto"
                            aria-label="Choose location"
                          >
                            <span className="inline-flex items-center gap-2">
                              <MapPinIcon className="h-5 w-5 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-900">
                                {stores.find((s) => s.id === getActiveStoreId())?.name || 'Choose a location'}
                              </span>
                            </span>
                            <span className="text-xs font-semibold text-gray-600">Change</span>
                          </button>

                          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

                          {/* Filters segment */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowFilterNavInAiMode(true)
                              setShowLocationDropdown(false)
                            }}
                            className="inline-flex w-full items-center justify-between gap-3 rounded-full px-4 py-3 text-left hover:bg-black/5 sm:w-auto"
                            aria-label="Open filters"
                          >
                            <span className="inline-flex items-center gap-2">
                              <FunnelIcon className="h-5 w-5 text-gray-700" />
                              <span className="text-sm font-semibold text-gray-900">Filters</span>
                            </span>
                            {filterPills.length ? (
                              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-900 px-2 text-xs font-semibold text-white">
                                {filterPills.length}
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-gray-600">Any</span>
                            )}
                          </button>

                          <div className="hidden h-8 w-px bg-gray-200 sm:block" />

                          {/* Query segment */}
                          <div className="relative flex-1">
                            <button
                              type="submit"
                              className="absolute left-4 top-1/2 -translate-y-1/2"
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
                                    <stop offset="100%" stopColor="#10b981" />
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
                              id="ai-search-input"
                              ref={aiModeInputRef}
                              type="text"
                              value={query}
                              onFocus={() => {
                                if (enablePresetDropdown) setShowDropdown(true)
                              }}
                              placeholder="Search by mood, products, or preference"
                              className="w-full rounded-full bg-transparent py-3 pl-12 pr-12 text-base font-semibold text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:outline-none"
                              onChange={(e) => {
                                const newValue = e.target.value
                                setHasInteracted(true)
                                setQuery(newValue)
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
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                              aria-label="Start voice input"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="h-5 w-5"
                              >
                                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2z" />
                                <path d="M13 19.95a7.001 7.001 0 0 0 5.995-5.992L19 13h-2a5 5 0 0 1-9.995.217L7 13H5l.005.958A7.001 7.001 0 0 0 11 19.95V22h2v-2.05z" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center rounded-full bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black sm:w-auto"
                          >
                            Search
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Category tiles and filter pills (AI Mode only) */}
                    <div className="mt-5">
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

                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategoryTile(cat.name)}
                                className={[
                                  'flex-none w-[170px] rounded-2xl border overflow-hidden text-left transition',
                                  selected ? 'border-green-600 ring-2 ring-green-300/60' : 'border-gray-200/70 hover:border-gray-300',
                                ].join(' ')}
                              >
                                <div className="flex items-center gap-3 p-3 bg-white/70">
                                  <div className="relative h-10 w-10 overflow-hidden rounded-xl">
                                    <Image src={meta.image} alt="" fill className="object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 truncate">{cat.name}</div>
                                    <div className="text-xs text-gray-600 truncate">{selected ? 'Selected' : 'Tap to filter'}</div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ) : (
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
                      id="ai-search-input"
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
            )}

            {/* (forceAIMode renders pills/tiles inside the hero banner above) */}
          </div>
        </div>

        {/* Content area - shows prompts or results */}
        {(!forceAIMode || !heroOnly) && (
          <div 
            ref={aiModeScrollRef}
            className={forceAIMode ? "px-4 py-6" : "flex-1 overflow-y-auto overscroll-none px-4 py-6"}
            style={
              forceAIMode
                ? undefined
                : {
                    // Prevent "scrolling past" the prompt list on mobile (rubber-banding / extra scroll)
                    overscrollBehaviorY: 'none',
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    scrollBehavior: 'auto', // Prevent smooth scroll from interfering
                    minHeight: 0, // Critical for flex children to allow scrolling
                  }
            }
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
                    <p className="text-sm font-semibold">{storeInfoDisplay.store.name}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
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
                      <p className="text-sm">
                        <span className="font-semibold">Phone:</span> {storeInfoDisplay.store.phone}
                      </p>
                    </div>
                  </div>
                )}

                {/* OCM License */}
                {storeInfoDisplay.store.ocm && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                      <p className="text-sm">
                        <span className="font-semibold">OCM:</span> {storeInfoDisplay.store.ocm}
                      </p>
                    </div>
                  </div>
                )}

                {/* Hours */}
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                    {storeInfoDisplay.store.status === 'coming_soon' ? (
                      <p className="text-sm">
                        <span className="font-semibold">Coming Soon</span> - Hours are not yet available for this location.
                      </p>
                    ) : storeInfoDisplay.store.hoursDisplay ? (
                      <p className="text-sm">
                        <span className="font-semibold">Hours:</span> {storeInfoDisplay.store.hoursDisplay}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Hours:</span> Not listed yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Services */}
                {storeInfoDisplay.store.services && storeInfoDisplay.store.services.length > 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-gray-200 text-gray-900 px-4 py-3">
                      <p className="text-sm">
                        <span className="font-semibold">Services:</span> {storeInfoDisplay.store.services.join(', ')}
                      </p>
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
                <div
                  className="columns-2 sm:columns-3"
                  style={{ columnGap: 12, columnFill: 'balance' as any }}
                >
                  {products.map((product, i) => (
                    <div key={product.id} className="mb-3 inline-block w-full break-inside-avoid">
                      <ProductCard
                        product={product}
                        imageHeight={getDeterministicTileHeight(product.id) || (i % 2 === 0 ? 208 : 192)}
                      />
                    </div>
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
              <div className="space-y-5">
                {(() => {
                  const byId = (id: string) => AI_MODE_PROMPTS.find((p) => p.id === id)

                  const PromptCard = ({ prompt }: { prompt: AiPrompt }) => (
                    <div key={prompt.id}>
                      <button
                        onClick={() => handleAiModePrompt(prompt)}
                        className="w-full flex items-center rounded-2xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                      >
                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden">
                          <Image 
                            src={prompt.image} 
                            alt={prompt.label} 
                            fill 
                            className="object-cover" 
                            sizes="80px"
                            priority={false}
                            loading="lazy"
                            unoptimized={prompt.image.startsWith('http')}
                          />
                        </div>
                        <div className="flex-1 px-4 py-4">
                          <p className="text-base font-medium bg-gradient-to-r from-pink-500 via-blue-500 to-pink-500 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                            {prompt.label}
                          </p>
                        </div>
                        <div className="flex-shrink-0 pr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                            <defs>
                              <linearGradient id={`promptStarGradient-${prompt.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#ec4899" />
                                <stop offset="50%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#ec4899" />
                                <animateTransform attributeName="gradientTransform" type="translate" values="-100 0;100 0;-100 0" dur="3s" repeatCount="indefinite" />
                              </linearGradient>
                            </defs>
                            <path
                              fill={`url(#promptStarGradient-${prompt.id})`}
                              d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                            />
                          </svg>
                        </div>
                      </button>
                    </div>
                  )

                  const renderMany = (ids: string[]) =>
                    ids
                      .map((id) => byId(id))
                      .filter(Boolean)
                      .map((p) => <PromptCard key={(p as AiPrompt).id} prompt={p as AiPrompt} />)

                  const FeedSection = ({
                    title,
                    viewAllPromptId,
                    loading,
                    items,
                  }: {
                    title: string
                    viewAllPromptId: string
                    loading: boolean
                    items: Product[]
                  }) => (
                    <div className="pt-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-sm font-semibold text-gray-900">{title}</div>
                        <button
                          type="button"
                          onClick={() => {
                            const p = byId(viewAllPromptId)
                            if (p) handleAiModePrompt(p as AiPrompt)
                          }}
                          className="text-sm font-medium text-pink-600 hover:text-pink-700 transition"
                        >
                          View all
                        </button>
                      </div>

                      {loading ? (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`${title}-skeleton-${i}`} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
                          ))}
                        </div>
                      ) : items.length === 0 ? (
                        <div className="mt-3 px-1 text-sm text-gray-500">No products available right now.</div>
                      ) : (
                        <div
                          className="mt-3 columns-2 sm:columns-3"
                          style={{ columnGap: 12, columnFill: 'balance' as any }}
                        >
                          {items.slice(0, 12).map((product, i) => (
                            <div key={product.id} className="mb-3 inline-block w-full break-inside-avoid">
                              <ProductCard
                                product={product}
                                imageHeight={getDeterministicTileHeight(product.id) || (i % 2 === 0 ? 208 : 192)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                  return (
                    <>
                      {/* 3 prompts */}
                      {renderMany(['recommend-deals', 'recommend-calm-flower', 'store-info'])}

                      {/* Banner */}
                      <button
                        onClick={() => {
                          const loyaltyPrompt = { id: 'loyalty-program', label: 'How do I earn and redeem loyalty points?', query: 'how do I earn and redeem loyalty points', category: 'Loyalty Program', image: '/images/post-thumb-04.jpg', promptType: 'loyalty' as const }
                          handleAiModePrompt(loyaltyPrompt)
                        }}
                        className="w-full relative rounded-2xl overflow-hidden group cursor-pointer mt-3"
                      >
                        <div className="relative h-24 sm:h-28">
                          <Image src="/images/post-thumb-04.jpg" alt="Loyalty Program" fill className="object-cover" sizes="100vw" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40" />
                          <div className="absolute inset-0 flex flex-col justify-end items-start px-6 sm:px-8 pb-3 sm:pb-4 text-white">
                            <h3 className="text-xl sm:text-2xl font-bold mb-1">
                              How do I earn and redeem loyalty points?
                            </h3>
                            <p className="text-sm sm:text-base text-white/90">
                              Learn about our rewards program
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Best selling this week */}
                      <FeedSection
                        title="Best selling this week"
                        viewAllPromptId="feed-best-sellers"
                        loading={bestSellerLoading}
                        items={bestSellerProducts}
                      />

                      {/* 2 prompts */}
                      {renderMany(['prompt-edibles-low-dose', 'prompt-concentrates-flavor'])}

                      {/* Trending Right Now */}
                      <FeedSection
                        title="Trending Right Now"
                        viewAllPromptId="feed-trending"
                        loading={trendingLoading}
                        items={trendingProducts}
                      />

                      {/* 2 prompts */}
                      {renderMany(['prompt-beverages', 'prompt-balanced-1-1'])}

                      {/* Easy Picks for First Timers */}
                      <FeedSection
                        title="Easy Picks for First Timers"
                        viewAllPromptId="feed-easy-picks"
                        loading={easyPicksLoading}
                        items={easyPicksProducts}
                      />

                      {/* 2 prompts */}
                      {renderMany(['prompt-pre-roll-under-25', 'prompt-vapes-beginners'])}

                      {/* Calm & Unwind Favorites */}
                      <FeedSection
                        title="Calm & Unwind Favorites"
                        viewAllPromptId="feed-calm-unwind"
                        loading={calmUnwindLoading}
                        items={calmUnwindProducts}
                      />

                      {/* 1 prompt */}
                      {renderMany(['prompt-sleep-edible'])}

                      {/* Best Value Right Now */}
                      <FeedSection
                        title="Best Value Right Now"
                        viewAllPromptId="feed-best-value"
                        loading={bestValueLoading}
                        items={bestValueProducts}
                      />

                      {/* 1 prompt */}
                      {renderMany(['prompt-bundle-under-80'])}

                      {/* Uplifting & Daytime Picks */}
                      <FeedSection
                        title="Uplifting & Daytime Picks"
                        viewAllPromptId="feed-uplifting-daytime"
                        loading={upliftingLoading}
                        items={upliftingProducts}
                      />

                      {/* 1 prompt */}
                      {renderMany(['prompt-daytime-vape'])}

                      {/* Staff Picks */}
                      <FeedSection
                        title="Staff Picks"
                        viewAllPromptId="feed-staff-picks"
                        loading={staffPicksLoading}
                        items={staffPicksProducts}
                      />
                    </>
                  )
                })()}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
  ) : null

  const homeResultsPortal =
    homeResultsPortalId && mounted && typeof document !== 'undefined'
      ? (() => {
          const el = document.getElementById(homeResultsPortalId)
          if (!el) return null

          // Only show results once we have an active selection/search.
          const hasAnyFilters = !!(
            activeFilters.categories?.length ||
            activeFilters.strains?.length ||
            activeFilters.brands?.length ||
            activeFilters.terpenes?.length ||
            activeFilters.weights?.length ||
            activeFilters.effects?.length ||
            activeFilters.saleOnly
          )

          return createPortal(
            <section className="pt-1">
              {hasAnyFilters ? (
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Showing results</div>
                    <div className="text-xs text-gray-500">
                      {products.length ? `${products.length} items` : loading ? 'Loading…' : 'No matches'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset homepage back to campaigns
                      setHeroShowMoreFilters(false)
                      setHeroCategory('')
                      setHeroStrain('')
                      setHeroType('')
                      setActiveFilters({})
                      setProducts([])
                      setShowResults(false)
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(
                          new CustomEvent('home:startHereMode', { detail: { mode: 'campaigns' } })
                        )
                      }
                    }}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-black/10 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              ) : null}

              {hasAnyFilters ? (
                loading ? (
                  <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={`home-skel-${i}`}
                        className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="h-48 w-full rounded-2xl bg-gray-200 animate-pulse" />
                        <div className="mt-3 h-3 w-1/3 rounded bg-gray-200 animate-pulse" />
                        <div className="mt-2 h-4 w-full rounded bg-gray-200 animate-pulse" />
                        <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="rounded-3xl bg-white p-6 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
                    No products found for these filters. Try a different category or strain.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-3">
                    {products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )
              ) : null}
            </section>,
            el
          )
        })()
      : null

  // If forceAIMode is true, only render AI mode overlay (no storefront)
  if (forceAIMode) {
    return (
      <>
        {aiModeOverlay}
        {homeResultsPortal}
      </>
    )
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
              src="/images/kine-buds-logo.png"
              alt="Kine Buds Dispensary"
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
