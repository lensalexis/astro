import { stores } from './stores'
import { matchKeywordFilters } from './filterKeywords'

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
  effectIntent?: string // e.g., 'sleep', 'energy', 'focus', 'pain', etc.
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
  'herb': 'Flower',
  'herbs': 'Flower',
  'green': 'Flower',
  'nugs': 'Flower',
  'nug': 'Flower',
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
  'oil': 'Vaporizers',
  'oils': 'Vaporizers',
  'vape oil': 'Vaporizers',
  'vape cartridge': 'Vaporizers',
  '510': 'Vaporizers', // Common vape thread size
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
  'roll': 'Pre Rolls',
  'rolled': 'Pre Rolls',
  'blunt': 'Pre Rolls',
  'blunts': 'Pre Rolls',
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
  'extract': 'Concentrates',
  'extracts': 'Concentrates',
  'hash': 'Concentrates',
  'kief': 'Concentrates',
  'keef': 'Concentrates',
  // Edibles
  'edible': 'Edibles',
  'edibles': 'Edibles',
  'gummy': 'Edibles',
  'gummies': 'Edibles',
  'chocolate': 'Edibles',
  'chocolates': 'Edibles',
  'candy': 'Edibles',
  'candies': 'Edibles',
  'cookie': 'Edibles',
  'cookies': 'Edibles',
  'brownie': 'Edibles',
  'brownies': 'Edibles',
  'gummy bear': 'Edibles',
  'gummy bears': 'Edibles',
  // Beverages
  'beverage': 'Beverages',
  'beverages': 'Beverages',
  'drink': 'Beverages',
  'drinks': 'Beverages',
  'soda': 'Beverages',
  'sodas': 'Beverages',
  'juice': 'Beverages',
  'tea': 'Beverages',
  'coffee': 'Beverages',
  'energy drink': 'Beverages',
  'energy drinks': 'Beverages',
  // Tinctures
  'tincture': 'Tinctures',
  'tinctures': 'Tinctures',
  'drops': 'Tinctures',
  'drop': 'Tinctures',
  'sublingual': 'Tinctures',
  'sublinguals': 'Tinctures',
  'oral': 'Tinctures',
  // Topicals
  'topical': 'Topicals',
  'topicals': 'Topicals',
  'cream': 'Topicals',
  'lotion': 'Topicals',
  'balm': 'Topicals',
  'salve': 'Topicals',
  'patch': 'Topicals',
  'patches': 'Topicals',
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

// Effect-based keyword mapping for intent detection
// Comprehensive mapping of natural language effects, moods, and symptoms to cannabis strain types
export const EFFECT_KEYWORDS = {
  // ============================================================================
  // INDICA-RELATED EFFECTS (Body-focused, relaxing, sedating)
  // ============================================================================
  sleep: {
    keywords: [
      'sleep', 'sleeping', 'insomnia', 'rest', 'bedtime', 'knock me out', 'sleepy', 'tired', 
      'exhausted', 'can\'t sleep', 'help me sleep', 'help with sleep', 'for sleep',
      'sleep aid', 'bed time', 'nighttime', 'evening', 'want to sleep', 'need sleep'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['sedating', 'relaxing', 'sleep-inducing', 'sleepy', 'calming'],
    thcRange: { min: 18, max: 100 }
  },
  relaxation: {
    keywords: [
      'relax', 'relaxation', 'chill', 'unwind', 'calm', 'peaceful', 'mellow', 
      'laid back', 'take it easy', 'chill out', 'wind down', 'decompress'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['relaxing', 'calming', 'body-focused', 'peaceful', 'mellow'],
    thcRange: { min: 15, max: 100 }
  },
  sedative: {
    keywords: ['sedative', 'sedating', 'couch lock', 'couchlock', 'locked', 'stuck'],
    strainType: 'Indica' as const,
    preferredEffects: ['sedating', 'couch lock', 'body-focused', 'heavy'],
    thcRange: { min: 18, max: 100 }
  },
  pain: {
    keywords: [
      'pain', 'pain relief', 'ache', 'sore', 'arthritis', 'inflammation', 
      'muscle', 'relief', 'chronic pain', 'body pain', 'discomfort', 'help with pain',
      'pain management', 'muscle pain', 'joint pain', 'body ache'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['pain-relieving', 'anti-inflammatory', 'body-focused', 'relaxing'],
    thcRange: { min: 15, max: 100 },
    cbdPreferred: true
  },
  anxiety: {
    keywords: [
      'anxiety', 'anxious', 'worried', 'stress', 'panic', 'overwhelmed', 
      'nervous', 'tense', 'stress relief', 'anxiety relief', 'help with anxiety',
      'calm down', 'reduce stress', 'stress management'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['calming', 'anxiolytic', 'relaxing', 'stress-relieving'],
    thcRange: { min: 10, max: 30 },
    cbdPreferred: true
  },
  bodyHigh: {
    keywords: [
      'body high', 'body effects', 'physical', 'body feeling', 'body buzz',
      'full body', 'body relaxation'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['body-focused', 'relaxing', 'physical', 'body high'],
    thcRange: { min: 15, max: 100 }
  },
  appetite: {
    keywords: [
      'appetite', 'munchies', 'hungry', 'increase appetite', 'appetite stimulation',
      'food', 'eating', 'hunger'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['appetite-stimulating', 'hunger-inducing'],
    thcRange: { min: 15, max: 100 }
  },
  nausea: {
    keywords: [
      'nausea', 'nauseous', 'queasy', 'sick', 'upset stomach', 'help with nausea',
      'anti-nausea', 'nausea relief'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['anti-nausea', 'stomach-soothing'],
    thcRange: { min: 10, max: 100 },
    cbdPreferred: true
  },
  muscleRelaxation: {
    keywords: [
      'muscle relaxation', 'muscle relief', 'muscle tension', 'tight muscles',
      'muscle spasms', 'muscle pain', 'sore muscles'
    ],
    strainType: 'Indica' as const,
    preferredEffects: ['muscle-relaxing', 'body-focused', 'pain-relieving'],
    thcRange: { min: 15, max: 100 }
  },
  
  // ============================================================================
  // SATIVA-RELATED EFFECTS (Mind-focused, energizing, uplifting)
  // ============================================================================
  energy: {
    keywords: [
      'energy', 'energetic', 'wake up', 'morning', 'get going', 'productive', 
      'boost', 'pick me up', 'alert', 'awake', 'energize', 'energizing',
      'wake me up', 'get energized', 'boost energy'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['energetic', 'uplifting', 'invigorating', 'awakening'],
    thcRange: { min: 12, max: 100 }
  },
  focus: {
    keywords: [
      'focus', 'concentrate', 'attention', 'clarity', 'mental', 'sharp', 
      'clear headed', 'mental clarity', 'focused', 'concentration',
      'help focus', 'improve focus', 'stay focused'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['focus-enhancing', 'mental', 'clarity', 'alert'],
    thcRange: { min: 12, max: 100 }
  },
  creative: {
    keywords: [
      'creative', 'creativity', 'artistic', 'inspiration', 'inspired', 
      'artistic flow', 'creative flow', 'brainstorm', 'ideas'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['creative', 'uplifting', 'inspiring', 'mental'],
    thcRange: { min: 12, max: 100 }
  },
  motivate: {
    keywords: [
      'motivate', 'motivation', 'motivated', 'get motivated', 'drive', 
      'ambition', 'get things done', 'productive'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['motivating', 'energetic', 'uplifting', 'productive'],
    thcRange: { min: 12, max: 100 }
  },
  uplift: {
    keywords: [
      'uplift', 'uplifted', 'uplifting', 'elevate', 'elevated', 'lift',
      'pick me up', 'boost mood', 'feel good'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['uplifting', 'euphoric', 'mood-boosting'],
    thcRange: { min: 12, max: 100 }
  },
  euphoria: {
    keywords: [
      'euphoria', 'euphoric', 'euphoric feeling', 'bliss', 'blissful',
      'ecstatic', 'high spirits'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['euphoric', 'uplifting', 'mood-boosting'],
    thcRange: { min: 15, max: 100 }
  },
  happiness: {
    keywords: [
      'happy', 'happiness', 'mood', 'upbeat', 'fun', 'laugh', 'joy', 
      'cheerful', 'good vibes', 'positive', 'feel happy', 'make me happy',
      'mood boost', 'boost mood', 'improve mood'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['uplifting', 'euphoric', 'mood-boosting', 'happy'],
    thcRange: { min: 15, max: 100 }
  },
  social: {
    keywords: [
      'social', 'talkative', 'conversation', 'chatty', 'sociable', 
      'party', 'party time', 'socializing', 'hang out', 'friends'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['social', 'talkative', 'uplifting', 'euphoric'],
    thcRange: { min: 15, max: 100 }
  },
  giggly: {
    keywords: [
      'giggly', 'giggle', 'laugh', 'laughing', 'funny', 'humor', 
      'make me laugh', 'hilarious'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['giggly', 'euphoric', 'uplifting', 'happy'],
    thcRange: { min: 15, max: 100 }
  },
  depression: {
    keywords: [
      'depression', 'depressed', 'sad', 'down', 'low mood', 'depression relief',
      'help with depression', 'feel better', 'mood lift'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['mood-boosting', 'uplifting', 'euphoric', 'antidepressant'],
    thcRange: { min: 15, max: 100 }
  },
  daytime: {
    keywords: [
      'daytime', 'day time', 'morning', 'afternoon', 'day use', 
      'day strain', 'daytime use', 'active', 'daytime activity'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['energetic', 'uplifting', 'daytime', 'alert'],
    thcRange: { min: 12, max: 100 }
  },
  cerebral: {
    keywords: [
      'cerebral', 'head high', 'mental high', 'mind', 'thinking', 
      'thoughtful', 'intellectual', 'brain'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['cerebral', 'mental', 'uplifting', 'focus-enhancing'],
    thcRange: { min: 12, max: 100 }
  },
  invigorating: {
    keywords: [
      'invigorating', 'invigorate', 'refreshing', 'revitalizing', 
      'rejuvenating', 'renewed energy'
    ],
    strainType: 'Sativa' as const,
    preferredEffects: ['invigorating', 'energetic', 'uplifting'],
    thcRange: { min: 12, max: 100 }
  },
  
  // ============================================================================
  // HYBRID-RELATED EFFECTS (Balanced, versatile)
  // ============================================================================
  balance: {
    keywords: [
      'balance', 'balanced', 'well rounded', 'even', 'equilibrium',
      'best of both', 'balanced effects'
    ],
    strainType: 'Hybrid' as const,
    preferredEffects: ['balanced', 'well-rounded', 'versatile'],
    thcRange: { min: 12, max: 100 }
  },
  versatile: {
    keywords: [
      'versatile', 'all purpose', 'multi purpose', 'flexible', 
      'adaptable', 'works for anything'
    ],
    strainType: 'Hybrid' as const,
    preferredEffects: ['versatile', 'balanced', 'well-rounded'],
    thcRange: { min: 12, max: 100 }
  },
  allDay: {
    keywords: [
      'all day', 'all-day', 'all day use', 'anytime', 'any time',
      'whenever', 'flexible timing'
    ],
    strainType: 'Hybrid' as const,
    preferredEffects: ['balanced', 'versatile', 'all-day'],
    thcRange: { min: 12, max: 30 }
  },
  mild: {
    keywords: [
      'mild', 'light', 'subtle', 'gentle', 'easy', 'beginner', 
      'soft', 'weak', 'low key', 'not too strong', 'mild effects'
    ],
    strainType: 'Hybrid' as const,
    preferredEffects: ['mild', 'gentle', 'balanced'],
    thcRange: { min: 0, max: 15 }
  },
  
  // ============================================================================
  // POTENCY-RELATED (Any strain type)
  // ============================================================================
  strong: {
    keywords: [
      'strong', 'potent', 'heavy', 'powerful', 'knockout', 'hit hard', 
      'no joke', 'intense', 'heavy hitter', 'very strong', 'super strong',
      'maximum potency', 'high potency'
    ],
    strainType: undefined, // Can be any strain type
    preferredEffects: ['sedating', 'intense', 'powerful'],
    thcRange: { min: 25, max: 100 }
  }
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
    filters.effectIntent || // Effect intent (e.g., "sleep", "energy") is shoppable
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

  // Extract effect-based intent FIRST (before explicit strain type)
  // This allows queries like "help me sleep" to automatically map to Indica
  // Check effect keywords and set strain type + filters based on detected effect
  for (const [effectKey, effectData] of Object.entries(EFFECT_KEYWORDS)) {
    const foundKeywords = effectData.keywords.filter(kw => {
      // Use word boundaries for better matching, but also allow partial matches for common variations
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Try word boundary first (exact match)
      const wordBoundaryRegex = new RegExp(`\\b${escaped}\\b`, 'i')
      if (wordBoundaryRegex.test(lower)) return true
      // Also check if the keyword is contained in the message (for variations like "sleeping" containing "sleep")
      // But only for single words to avoid false positives
      if (kw.split(/\s+/).length === 1 && lower.includes(kw.toLowerCase())) {
        return true
      }
      return false
    })
    
    if (foundKeywords.length > 0) {
      filters.effectIntent = effectKey
      
      // Set strain type if not already set and effect has a preferred strain type
      if (!filters.strainType && effectData.strainType) {
        filters.strainType = effectData.strainType
      }
      
      // Set maxTHC for mild/beginner effects
      if (effectKey === 'mild' && !filters.maxThc) {
        filters.maxThc = 15
      }
      
      // Break after first match (prioritize first effect found)
      break
    }
  }

  // Extract explicit strain type (if not already set by effect detection)
  // This allows combined queries like "sativa prerolls" to extract both
  if (!filters.strainType) {
    if (lower.includes('sativa')) {
      filters.strainType = 'Sativa'
    } else if (lower.includes('indica')) {
      filters.strainType = 'Indica'
    } else if (lower.includes('hybrid')) {
      filters.strainType = 'Hybrid'
    }
  }

  // Extract category (including from educational questions like "what are tinctures")
  // Check for exact matches first, then partial matches
  // Sort by length (longer first) to match more specific terms first
  // Also handle combinations like "vape sativa" - category should be extracted even with other terms
  const sortedCategoryEntries = Object.entries(categoryMap).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, category] of sortedCategoryEntries) {
    // Use word boundaries to avoid false matches, but also allow partial matches for common terms
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wordBoundaryRegex = new RegExp(`\\b${escapedKeyword}\\b`, 'i')
    // For single-word keywords, also check if they appear anywhere in the message
    // This helps with queries like "vape sativa" where "vape" should match even with other words
    const isSingleWord = keyword.split(/\s+/).length === 1
    const partialMatch = isSingleWord && lower.includes(keyword.toLowerCase())
    
    if (wordBoundaryRegex.test(lower) || partialMatch) {
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

  const keywordMatches = matchKeywordFilters(lower)
  if (!filters.category && keywordMatches.category) {
    filters.category = keywordMatches.category
  }
  if (!filters.strainType && keywordMatches.strainType) {
    filters.strainType = keywordMatches.strainType
  }
  if (!filters.weight && keywordMatches.weight) {
    filters.weight = keywordMatches.weight
  }
  if (!filters.discountedOnly && keywordMatches.sale) {
    filters.discountedOnly = true
  }
  if ((!filters.terpenes || filters.terpenes.length === 0) && keywordMatches.terpenes) {
    filters.terpenes = keywordMatches.terpenes
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
    const needsStoreDisambiguation = !storeIdGuess && stores.length > 1

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
