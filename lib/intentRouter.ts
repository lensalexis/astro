import { stores } from './stores'

export type Intent = 'STORE_INFO' | 'PRODUCT_SHOPPING' | 'PRODUCT_INFO' | 'GENERAL_EDUCATION' | 'EDUCATION_WITH_PRODUCTS' | 'MIXED'

export type ExtractedFilters = {
  category?: string
  strainType?: 'Sativa' | 'Indica' | 'Hybrid'
  terpenes?: string[]
  priceMin?: number
  priceMax?: number
  discountedOnly?: boolean
  weight?: string
  brand?: string
  query?: string
  maxThc?: number
  thcRange?: string // e.g., '0-10%', '10-20%', '20-30%', '30-40%', '40%+'
}

export type IntentResult = {
  intent: Intent
  extracted: ExtractedFilters
  needsStoreDisambiguation?: boolean
  storeIdGuess?: string
  storeInfo?: string
}

// Category mapping with comprehensive synonyms
const categoryMap: Record<string, string> = {
  // Flower
  'flower': 'Flower',
  'flowers': 'Flower',
  'bud': 'Flower',
  'buds': 'Flower',
  'weed': 'Flower',
  'cannabis': 'Flower',
  // Vaporizers
  'vape': 'Vaporizers',
  'vapes': 'Vaporizers',
  'vaporizer': 'Vaporizers',
  'vaporizers': 'Vaporizers',
  'cart': 'Vaporizers',
  'carts': 'Vaporizers',
  'cartridge': 'Vaporizers',
  'cartridges': 'Vaporizers',
  'pen': 'Vaporizers',
  'pens': 'Vaporizers',
  'vape pen': 'Vaporizers',
  'vape pens': 'Vaporizers',
  // Pre Rolls
  'pre roll': 'Pre Rolls',
  'pre-roll': 'Pre Rolls',
  'pre rolls': 'Pre Rolls',
  'pre-rolls': 'Pre Rolls',
  'preroll': 'Pre Rolls',
  'prerolls': 'Pre Rolls',
  'prerolled': 'Pre Rolls',
  'joint': 'Pre Rolls',
  'joints': 'Pre Rolls',
  'pre-rolled': 'Pre Rolls',
  // Concentrates
  'concentrate': 'Concentrates',
  'concentrates': 'Concentrates',
  'wax': 'Concentrates',
  'rosin': 'Concentrates',
  'live rosin': 'Concentrates',
  'resin': 'Concentrates',
  'live resin': 'Concentrates',
  'shatter': 'Concentrates',
  'sugar': 'Concentrates',
  'badder': 'Concentrates',
  'budder': 'Concentrates',
  'crumble': 'Concentrates',
  'dabs': 'Concentrates',
  'dab': 'Concentrates',
  // Edibles
  'edible': 'Edibles',
  'edibles': 'Edibles',
  'gummy': 'Edibles',
  'gummies': 'Edibles',
  'chocolate': 'Edibles',
  'chocolates': 'Edibles',
  'candy': 'Edibles',
  'candies': 'Edibles',
  // Beverages
  'beverage': 'Beverages',
  'beverages': 'Beverages',
  'drink': 'Beverages',
  'drinks': 'Beverages',
  // Tinctures
  'tincture': 'Tinctures',
  'tinctures': 'Tinctures',
  'drops': 'Tinctures',
  'drop': 'Tinctures',
  // Topicals
  'topical': 'Topicals',
  'topicals': 'Topicals',
  'cream': 'Topicals',
  'lotion': 'Topicals',
}

// Terpene names
const terpeneNames = [
  'limonene', 'myrcene', 'pinene', 'linalool', 'caryophyllene',
  'terpinolene', 'humulene', 'ocimene', 'bisabolol', 'nerolidol'
]

// Store location keywords
const storeKeywords: Record<string, string> = {
  'upper west side': 'upper-west-side',
  'uws': 'upper-west-side',
  'murray hill': 'murray-hill',
  'briarwood': 'briarwood',
  'troy': 'troy',
  'queens plaza': 'queens-plaza',
  'fishkill': 'fishkill',
  'kew gardens': 'kew-gardens',
}

/**
 * Check if message is an educational question
 */
function isEducationQuestion(message: string): boolean {
  const lower = message.toLowerCase().trim()
  
  const educationKeywords = [
    'what is', 'whats', 'what does', 'what are', 'what do',
    'meaning of', 'define', 'definition of',
    'explain', 'explanation of',
    'difference between', 'difference of',
    'how does', 'how do', 'how is', 'how are',
    'why', 'when', 'how long', 'how much',
    'tell me about', 'tell me what',
    'can you explain', 'could you explain',
    'i want to know', 'i\'d like to know'
  ]
  
  // Check if starts with education keyword
  const startsWithEducation = educationKeywords.some(keyword => 
    lower.startsWith(keyword) || lower.includes(keyword + ' ')
  )
  
  // Check for question mark (weak signal, but helps)
  const hasQuestionMark = lower.includes('?')
  
  return startsWithEducation || (hasQuestionMark && lower.length < 50)
}

/**
 * Check if message has shopping intent
 */
function hasShoppingIntent(message: string): boolean {
  const lower = message.toLowerCase()
  
  const shoppingKeywords = [
    'show', 'browse', 'shop', 'buy', 'find', 'recommend', 'suggest',
    'options', 'near me', 'in stock', 'menu', 'deals', 'under',
    'cheap', 'affordable', 'best', 'top', 'popular', 'available',
    'looking for', 'search for', 'get me', 'display', 'list'
  ]
  
  return shoppingKeywords.some(keyword => lower.includes(keyword))
}

/**
 * Check if extracted filters contain shoppable modifiers
 */
function hasShoppableFilters(filters: ExtractedFilters): boolean {
  return !!(
    filters.strainType ||
    filters.category ||
    (filters.terpenes && filters.terpenes.length > 0) ||
    filters.discountedOnly ||
    filters.brand ||
    filters.priceMin ||
    filters.priceMax
  )
}

/**
 * Extract filters from user message
 * Enhanced to extract filters even from educational questions
 */
function extractFilters(message: string): ExtractedFilters {
  const lower = message.toLowerCase()
  const filters: ExtractedFilters = {}

  // Extract strain type FIRST (including from educational questions like "what is sativa")
  // This allows combined queries like "sativa prerolls" to extract both
  if (lower.includes('sativa')) {
    filters.strainType = 'Sativa'
  } else if (lower.includes('indica')) {
    filters.strainType = 'Indica'
  } else if (lower.includes('hybrid')) {
    filters.strainType = 'Hybrid'
  }

  // Extract category (including from educational questions like "what are tinctures")
  // Check for exact matches first, then partial matches
  // Sort by length (longer first) to match more specific terms first
  const sortedCategoryEntries = Object.entries(categoryMap).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, category] of sortedCategoryEntries) {
    // Use word boundaries to avoid false matches
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i')
    if (regex.test(lower)) {
      filters.category = category
      break
    }
  }

  // Extract terpenes (including from educational questions like "what is limonene")
  const foundTerpenes: string[] = []
  for (const terpene of terpeneNames) {
    if (lower.includes(terpene)) {
      foundTerpenes.push(terpene.charAt(0).toUpperCase() + terpene.slice(1))
    }
  }
  if (foundTerpenes.length > 0) {
    filters.terpenes = foundTerpenes
  }

  // Extract price
  const priceUnderMatch = lower.match(/(?:under|below|less than|cheaper than)\s*\$?(\d+)/)
  if (priceUnderMatch) {
    filters.priceMax = parseInt(priceUnderMatch[1])
  }
  const priceOverMatch = lower.match(/(?:over|above|more than|at least)\s*\$?(\d+)/)
  if (priceOverMatch) {
    filters.priceMin = parseInt(priceOverMatch[1])
  }

  // Extract discount intent
  if (lower.match(/\b(cheap|budget|best value|best deals|sale|discounted|on sale|discount)\b/)) {
    filters.discountedOnly = true
  }

  // Extract weight (1g, 3.5g, 7g, 14g, 28g, etc.)
  const weightMatch = lower.match(/\b(\d+(?:\.\d+)?)\s*g\b/)
  if (weightMatch) {
    filters.weight = weightMatch[1] + 'g'
  }

  // Extract THC ranges
  // Match patterns like "20% thc", "thc 20-30", "high thc", "low thc", etc.
  const thcPercentMatch = lower.match(/(\d+)\s*%?\s*(?:thc|thc\s*level|thc\s*content)/i)
  if (thcPercentMatch) {
    const thcValue = parseInt(thcPercentMatch[1])
    if (thcValue >= 0 && thcValue < 10) {
      filters.thcRange = '0-10%'
    } else if (thcValue >= 10 && thcValue < 20) {
      filters.thcRange = '10-20%'
    } else if (thcValue >= 20 && thcValue < 30) {
      filters.thcRange = '20-30%'
    } else if (thcValue >= 30 && thcValue < 40) {
      filters.thcRange = '30-40%'
    } else if (thcValue >= 40) {
      filters.thcRange = '40%+'
    }
  } else {
    // Match range patterns like "20-30% thc", "thc 15 to 25"
    const thcRangeMatch = lower.match(/(\d+)\s*[-–—to]\s*(\d+)\s*%?\s*(?:thc|thc\s*level)/i)
    if (thcRangeMatch) {
      const min = parseInt(thcRangeMatch[1])
      const max = parseInt(thcRangeMatch[2])
      const avg = (min + max) / 2
      if (avg < 10) {
        filters.thcRange = '0-10%'
      } else if (avg < 20) {
        filters.thcRange = '10-20%'
      } else if (avg < 30) {
        filters.thcRange = '20-30%'
      } else if (avg < 40) {
        filters.thcRange = '30-40%'
      } else {
        filters.thcRange = '40%+'
      }
    } else {
      // Match descriptive terms
      if (lower.match(/\b(very\s+)?low\s+thc\b|\bthc\s*under\s*10\b|\bthc\s*below\s*10\b/i)) {
        filters.thcRange = '0-10%'
      } else if (lower.match(/\blow\s+thc\b|\bthc\s*10[-\s]?20\b|\bthc\s*under\s*20\b/i)) {
        filters.thcRange = '10-20%'
      } else if (lower.match(/\bmedium\s+thc\b|\bmoderate\s+thc\b|\bthc\s*20[-\s]?30\b/i)) {
        filters.thcRange = '20-30%'
      } else if (lower.match(/\bhigh\s+thc\b|\bthc\s*30[-\s]?40\b|\bthc\s*over\s*30\b/i)) {
        filters.thcRange = '30-40%'
      } else if (lower.match(/\bvery\s+high\s+thc\b|\bextremely\s+high\s+thc\b|\bthc\s*40\s*plus\b|\bthc\s*over\s*40\b/i)) {
        filters.thcRange = '40%+'
      }
    }
  }

  // Extract brand (if mentioned)
  // Basic detection; also allow single-word/small phrases as brand intent
  const brandMatch = lower.match(/\b(brand|from)\s+([a-z0-9][a-z0-9\s\-]{1,30})/i)
  if (brandMatch && brandMatch[2]) {
    filters.brand = brandMatch[2].trim()
  } else {
    const words = lower.trim().split(/\s+/)
    if (!filters.brand && words.length <= 3) {
      // Heuristic: short query without category/strain keywords -> treat as brand
      const hasCategory = !!filters.category
      const hasStrain = !!filters.strainType
      const hasTerp = filters.terpenes && filters.terpenes.length > 0
      if (!hasCategory && !hasStrain && !hasTerp) {
        filters.brand = lower.trim()
      }
    }
  }

  // Store query for text search
  filters.query = message

  // Extract low-THC intent (e.g., "not strong", "low thc", "mild", "light", "microdose")
  if (
    /(?:not\s+strong|low\s+thc|mild|light potency|low potency|microdose|micro dosing|beginner|weak)/.test(lower)
  ) {
    filters.maxThc = 20
  }

  return filters
}

/**
 * Guess store ID from message
 */
function guessStoreId(message: string): string | undefined {
  const lower = message.toLowerCase()
  for (const [keyword, storeId] of Object.entries(storeKeywords)) {
    if (lower.includes(keyword)) {
      return storeId
    }
  }
  return undefined
}

/**
 * Route user message to appropriate intent
 * Priority order:
 * 1. STORE_INFO
 * 2. PRODUCT_INFO
 * 3. EDUCATION_WITH_PRODUCTS
 * 4. PRODUCT_SHOPPING
 * 5. GENERAL_EDUCATION
 */
export function routeIntent(userMessage: string): IntentResult {
  const lower = userMessage.toLowerCase().trim()
  const filters = extractFilters(lower)

  // (1) STORE_INFO: hours, address, phone, OCM, location keywords
  const storeInfoPatterns = [
    /(?:what|when|where|which|is|are|do|does|can|will)\s+(?:time|hours?|close|open|address|location|phone|number|ocm|license|delivery|pickup)/i,
    /(?:where|which)\s+(?:is|are)\s+(?:the|your|a)\s+(?:location|store|shop)/i,
    /(?:is|are)\s+(?:fishkill|kew\s+gardens|upper\s+west\s+side|murray\s+hill|briarwood|troy|queens\s+plaza)\s+(?:open|available|ready)/i,
  ]

  const isStoreInfo = storeInfoPatterns.some(pattern => pattern.test(userMessage))
  if (isStoreInfo) {
    const storeIdGuess = guessStoreId(userMessage)
    const needsDisambiguation = !storeIdGuess && stores.length > 1

    return {
      intent: 'STORE_INFO',
      extracted: filters,
      needsStoreDisambiguation,
      storeIdGuess,
    }
  }

  // (2) PRODUCT_INFO: specific product name / "this product" / SKU
  const productInfoPatterns = [
    /(?:is|what|how|what's|whats)\s+([a-z\s]+)\s+(?:live\s+resin|thc|cbd|strong|potent|available)/i,
    /(?:how|what)\s+(?:strong|potent|much\s+thc|thc\s+level)\s+(?:is|are|does)\s+([a-z\s]+)/i,
  ]

  const productInfoMatch = productInfoPatterns.some(pattern => pattern.test(userMessage))
  if (productInfoMatch && !lower.includes('show me') && !lower.includes('find')) {
    return {
      intent: 'PRODUCT_INFO',
      extracted: filters,
    }
  }

  // (3) EDUCATION_WITH_PRODUCTS: education question + shoppable filters
  const isEducation = isEducationQuestion(userMessage)
  const hasShoppable = hasShoppableFilters(filters)
  
  if (isEducation && hasShoppable) {
    return {
      intent: 'EDUCATION_WITH_PRODUCTS',
      extracted: filters,
    }
  }

  // (4) PRODUCT_SHOPPING: shopping verbs or clear intent
  const shoppingPatterns = [
    /(?:show|find|search|get|need|want|looking\s+for|buy|purchase|shop|see|display|list|recommend|suggest|browse).*(?:product|item|flower|vape|edible|pre-roll|preroll|concentrate|tincture|beverage|topical|indica|sativa|hybrid|strain|brand|price|cost|discount|sale|deal)/i,
    /(?:show\s+me|find\s+me|get\s+me|search\s+for|looking\s+for|shop\s+for).*(?:product|item|flower|vape|edible|pre-roll|preroll|concentrate|tincture|beverage|topical|indica|sativa|hybrid|strain|brand)/i,
    /.*\b(product|products|item|items)\b.*/i,
  ]

  const hasShopping = hasShoppingIntent(userMessage)
  const productKeywords = [
    'flower', 'vape', 'edible', 'pre-roll', 'preroll', 'concentrate', 'tincture', 'beverage', 'topical',
    'indica', 'sativa', 'hybrid', 'thc', 'cbd', 'strain', 'brand', 'product', 'products', 'buy', 'purchase', 'shop',
    'price', 'cost', 'discount', 'sale', 'deal', 'deals', 'best', 'cheap', 'under', 'menu', 'options', 'in stock'
  ]
  const hasProductKeyword = productKeywords.some(keyword => lower.includes(keyword)) || !!filters.brand

  const isShopping = shoppingPatterns.some(pattern => pattern.test(userMessage)) ||
    (hasShopping && hasProductKeyword) ||
    (hasShoppable && !isEducation) ||
    (lower.split(/\s+/).length <= 3 && hasProductKeyword && !isEducation)

  if (isShopping) {
    return {
      intent: 'PRODUCT_SHOPPING',
      extracted: filters,
    }
  }

  // (5) GENERAL_EDUCATION: definition, comparisons, informational
  if (isEducation) {
    return {
      intent: 'GENERAL_EDUCATION',
      extracted: filters,
    }
  }

  // Default to PRODUCT_SHOPPING if ambiguous but has product keywords
  if (hasProductKeyword) {
    return {
      intent: 'PRODUCT_SHOPPING',
      extracted: filters,
    }
  }

  // Default to GENERAL_EDUCATION
  return {
    intent: 'GENERAL_EDUCATION',
    extracted: filters,
  }
}

// Test examples for debugging
export const testExamples: Array<{ message: string; expectedIntent: Intent }> = [
  { message: 'what is sativa', expectedIntent: 'EDUCATION_WITH_PRODUCTS' },
  { message: 'what does limonene do', expectedIntent: 'EDUCATION_WITH_PRODUCTS' },
  { message: 'what\'s the difference between indica and sativa', expectedIntent: 'EDUCATION_WITH_PRODUCTS' },
  { message: 'what are terpenes', expectedIntent: 'EDUCATION_WITH_PRODUCTS' },
  { message: 'what are tinctures', expectedIntent: 'EDUCATION_WITH_PRODUCTS' },
  { message: 'is cannabis legal in NY', expectedIntent: 'GENERAL_EDUCATION' },
  { message: 'how long does an edible last', expectedIntent: 'GENERAL_EDUCATION' },
  { message: 'what\'s the difference between live resin and rosin', expectedIntent: 'GENERAL_EDUCATION' },
  { message: 'show me sativa products', expectedIntent: 'PRODUCT_SHOPPING' },
  { message: 'find indica flower', expectedIntent: 'PRODUCT_SHOPPING' },
  { message: 'what time do you close', expectedIntent: 'STORE_INFO' },
  { message: 'where is the Troy location', expectedIntent: 'STORE_INFO' },
]
