type KeywordFilterResult = {
  category?: string
  strainType?: 'Sativa' | 'Indica' | 'Hybrid'
  weight?: string
  sale?: boolean
  terpenes?: string[]
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Flower: [
    'flower',
    'flowers',
    'bud',
    'buds',
    'weed',
    'weedz',
    'cannabis',
    'ganja',
    'herb',
    'herbal',
    'nug',
    'nugs',
    'marijuana',
    'loud',
  ],
  Vaporizers: [
    'vape',
    'vapes',
    'vaporizer',
    'vaporizers',
    'cart',
    'carts',
    'cartridge',
    'cartridges',
    'dab pen',
    'pen',
    'pens',
    '510',
  ],
  'Pre Rolls': [
    'pre roll',
    'pre-roll',
    'pre rolls',
    'pre-rolls',
    'preroll',
    'prerolls',
    'joint',
    'joints',
    'cone',
    'cones',
    'blunt',
    'blunts',
  ],
  Concentrates: [
    'concentrate',
    'concentrates',
    'wax',
    'dab',
    'dabs',
    'rosin',
    'live rosin',
    'resin',
    'live resin',
    'shatter',
    'sauce',
    'diamonds',
    'extract',
    'hash',
  ],
  Edibles: [
    'edible',
    'edibles',
    'gummy',
    'gummies',
    'chew',
    'chews',
    'chocolate',
    'chocolates',
    'cookie',
    'cookies',
    'brownie',
    'brownies',
    'treat',
    'snack',
  ],
  Beverages: [
    'drink',
    'drinks',
    'beverage',
    'beverages',
    'soda',
    'tea',
    'coffee',
    'juice',
    'tonic',
    'mocktail',
    'infused water',
  ],
  Tinctures: [
    'tincture',
    'tinctures',
    'drop',
    'drops',
    'dropper',
    'sublingual',
    'tincture oil',
  ],
}

const STRAIN_KEYWORDS: Record<'Sativa' | 'Indica' | 'Hybrid', string[]> = {
  Sativa: [
    'sativa',
    'daytime',
    'energetic',
    'uplift',
    'uplifting',
    'creative',
    'focus',
    'focused',
    'social',
  ],
  Indica: [
    'indica',
    'relax',
    'relaxing',
    'couch lock',
    'couchlock',
    'sleep',
    'sleepy',
    'nighttime',
    'sedating',
    'calm',
  ],
  Hybrid: [
    'hybrid',
    'balanced',
    'mix',
    'combo',
    '50/50',
    'middle ground',
    'versatile',
  ],
}

const TERPENE_KEYWORDS: Record<string, string[]> = {
  Limonene: ['limonene', 'citrus terpene'],
  Myrcene: ['myrcene'],
  Caryophyllene: ['caryophyllene', 'pepper terpene'],
  Linalool: ['linalool', 'lavender terpene'],
  Pinene: ['pinene'],
  Humulene: ['humulene'],
}

const WEIGHT_KEYWORDS: Record<string, string[]> = {
  '1g': ['1g', 'single gram', 'one gram'],
  '3.5g': ['3.5g', 'eighth', '3.5', '1/8'],
  '7g': ['7g', 'quarter', '7 grams', '1/4'],
  '14g': ['14g', 'half ounce', 'half oz', '14 grams'],
  '28g': ['28g', 'ounce', 'oz', 'full ounce'],
}

const SALE_KEYWORDS = [
  'deal',
  'deals',
  'discount',
  'discounted',
  'on sale',
  'promo',
  'promotion',
  'special',
  'cheap',
  'value',
]

const normalize = (value: string) => value.trim().toLowerCase()

export function matchKeywordFilters(message: string): KeywordFilterResult {
  const lower = ` ${normalize(message)} `
  const result: KeywordFilterResult = {}

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(` ${keyword} `) || lower.includes(`${keyword} `) || lower.includes(` ${keyword}`))) {
      result.category = category
      break
    }
  }

  for (const [strain, keywords] of Object.entries(STRAIN_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      result.strainType = strain as KeywordFilterResult['strainType']
      break
    }
  }

  for (const [weight, keywords] of Object.entries(WEIGHT_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      result.weight = weight
      break
    }
  }

  for (const [terpene, keywords] of Object.entries(TERPENE_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      result.terpenes = [terpene]
      break
    }
  }

  if (SALE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    result.sale = true
  }

  return result
}
