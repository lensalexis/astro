import type { Product } from '@/types/product'

export const CATEGORY_DEFS = [
  { name: 'Flower', slug: 'flower', id: '1af917cd40ce027b' },
  { name: 'Vaporizers', slug: 'vaporizers', id: 'ba607fa13287b679' },
  { name: 'Pre Rolls', slug: 'pre-rolls', id: '873e1156bc94041e' },
  { name: 'Concentrates', slug: 'concentrates', id: 'dd753723f6875d2e' },
  { name: 'Edibles', slug: 'edibles', id: '2f2c05a9bbb5fd43' },
  { name: 'Beverages', slug: 'beverages', id: '45d32b3453f51209' },
  { name: 'Tinctures', slug: 'tinctures', id: '4b9c5820c59418fa' },
]

export const CATEGORY_NAME_BY_SLUG = CATEGORY_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.slug] = c.name
  return acc
}, {})

export const CATEGORY_NAME_BY_ID = CATEGORY_DEFS.reduce<Record<string, string>>((acc, c) => {
  acc[c.id] = c.name
  return acc
}, {})

export const DEFAULT_CATEGORY_LABELS = [
  'Flower',
  'Vaporizers',
  'Pre Rolls',
  'Concentrates',
  'Edibles',
  'Beverages',
  'Tinctures',
  'Topicals',
]

export type FacetedFilters = {
  categories?: string[]
  brands?: string[]
  strains?: string[]
  terpenes?: string[]
  weights?: string[]
  effects?: string[]
  saleOnly?: boolean
}

export type FacetOptions = {
  categories: string[]
  brands: string[]
  strains: string[]
  terpenes: string[]
  weights: string[]
  effects: string[]
}

export type FacetCounts = {
  categories: Record<string, number>
  brands: Record<string, number>
  strains: Record<string, number>
  terpenes: Record<string, number>
  weights: Record<string, number>
  effects: Record<string, number>
}

const typeMap: Record<string, string> = {
  FLOWER: 'flower',
  PRE_ROLLS: 'preRoll',
  VAPORIZERS: 'vape',
  EDIBLES: 'edible',
  TINCTURES: 'tincture',
  BEVERAGES: 'beverage',
  CONCENTRATES: 'concentrate',
  TOPICALS: 'topical',
}

export const getProductType = (p: Product): string | null => {
  if (p.type && typeMap[p.type]) {
    return typeMap[p.type]
  }

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

  if (p.subType) {
    const subTypeLower = p.subType.toLowerCase()
    if (subTypeLower.includes('flower')) return 'flower'
    if (subTypeLower.includes('pre') || subTypeLower.includes('roll')) return 'preRoll'
    if (subTypeLower.includes('vape')) return 'vape'
    if (subTypeLower.includes('edible')) return 'edible'
    if (subTypeLower.includes('tincture')) return 'tincture'
    if (subTypeLower.includes('beverage') || subTypeLower.includes('drink')) return 'beverage'
    if (subTypeLower.includes('concentrate')) return 'concentrate'
    if (subTypeLower.includes('topical')) return 'topical'
  }

  return null
}

export const getCategoryLabel = (p: Product): string | null => {
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

export const getStrainType = (p: Product): string | null => {
  const rawStrain = `${p.cannabisType || ''} ${p.strain || ''}`.toLowerCase()
  if (rawStrain.includes('indica') && rawStrain.includes('lean')) return 'Indica leaning'
  if (rawStrain.includes('sativa') && rawStrain.includes('lean')) return 'Sativa leaning'
  if (rawStrain.includes('indica')) return 'Indica'
  if (rawStrain.includes('sativa')) return 'Sativa'
  if (rawStrain.includes('hybrid')) return 'Hybrid'
  return null
}

export const getTags = (p: Product): string[] => {
  return (p.effects || [])
    .map((tag) => (tag || '').toLowerCase().trim())
    .filter(Boolean)
}

export const getThcTotal = (p: Product, useMax: boolean = true): number | null => {
  const thcValue: string | number | null =
    (useMax ? (p.labs?.thcMax ?? p.labs?.thc ?? null) : (p.labs?.thc ?? p.labs?.thcMax ?? null)) as any

  if (thcValue === null || thcValue === undefined || thcValue === '') return null

  if (typeof thcValue === 'string') {
    const cleaned = thcValue.replace(/%/g, '').trim()
    if (cleaned.includes('-') || cleaned.includes('–') || cleaned.includes('—')) {
      return null
    }
    const numValue = parseFloat(cleaned)
    if (isNaN(numValue)) return null
    return numValue
  }

  if (typeof thcValue === 'number') {
    if (isNaN(thcValue) || !isFinite(thcValue)) return null
    return thcValue
  }

  return null
}

export const getCbdTotal = (p: Product): number | null => {
  const cbdValue: string | number | null = (p.labs?.cbd ?? p.labs?.cbdMax ?? p.labs?.cbdA ?? null) as any

  if (cbdValue === null || cbdValue === undefined || cbdValue === '') return null

  if (typeof cbdValue === 'string') {
    const cleaned = cbdValue.replace(/%/g, '').trim()
    if (cleaned.includes('-') || cleaned.includes('–') || cleaned.includes('—')) {
      return null
    }
    const numValue = parseFloat(cleaned)
    if (isNaN(numValue)) return null
    return numValue
  }

  if (typeof cbdValue === 'number') {
    if (isNaN(cbdValue) || !isFinite(cbdValue)) return null
    return cbdValue
  }

  return null
}

export const isOnSale = (p: Product): boolean => {
  return !!(
    p.discounts?.length ||
    p.discountAmountFinal ||
    p.discountValueFinal ||
    p.discountTypeFinal
  )
}

const getWeightLabel = (p: Product): string | null => {
  return (
    p.weightFormatted ||
    (p.weight ? `${p.weight}${p.weightUnit ? ` ${p.weightUnit.toLowerCase()}` : ''}` : null)
  )
}

const normalizeList = (values?: string[]) =>
  (values || []).map((value) => value?.toLowerCase().trim()).filter(Boolean) as string[]

export const applyProductFilters = (items: Product[], filters: FacetedFilters) => {
  const normalizedCategories = normalizeList(filters.categories)
  const normalizedBrands = normalizeList(filters.brands)
  const normalizedStrains = normalizeList(filters.strains)
  const normalizedTerpenes = normalizeList(filters.terpenes)
  const normalizedWeights = normalizeList(filters.weights)
  const normalizedEffects = normalizeList(filters.effects)

  return items.filter((p) => {
    if (normalizedCategories.length) {
      const cat = getCategoryLabel(p)?.toLowerCase()
      if (!cat || !normalizedCategories.includes(cat)) return false
    }

    if (filters.saleOnly && !isOnSale(p)) return false

    if (normalizedBrands.length) {
      const brandName = (p.brand?.name || '').toLowerCase()
      if (!normalizedBrands.includes(brandName)) return false
    }

    if (normalizedStrains.length) {
      const strainName = (p.strain || '').toLowerCase()
      const cannabisType = (p.cannabisType || '').toLowerCase()
      const strainType = (getStrainType(p) || '').toLowerCase()
      const blob = `${p.name || ''} ${p.description || ''} ${cannabisType} ${strainName}`.toLowerCase()

      const matches = normalizedStrains.some((sel) => {
        if (!sel) return false
        if (sel === strainName || sel === cannabisType || sel === strainType) return true
        if (strainName && strainName.includes(sel)) return true
        if (cannabisType && cannabisType.includes(sel)) return true

        if (sel === 'sativa' || sel.includes('sativa')) {
          return (
            strainType.includes('sativa') ||
            cannabisType.includes('sativa') ||
            blob.includes('sativa')
          )
        }
        if (sel === 'indica' || sel.includes('indica')) {
          return (
            strainType.includes('indica') ||
            cannabisType.includes('indica') ||
            blob.includes('indica')
          )
        }
        if (sel === 'hybrid' || sel.includes('hybrid')) {
          return (
            strainType.includes('hybrid') ||
            cannabisType.includes('hybrid') ||
            blob.includes('hybrid')
          )
        }

        return false
      })

      if (!matches) return false
    }

    if (normalizedWeights.length) {
      const weightLabel = (getWeightLabel(p) || '').toLowerCase()
      if (!weightLabel || !normalizedWeights.includes(weightLabel)) return false
    }

    if (normalizedTerpenes.length) {
      const terpList = (p.labs?.terpenes || []).map((t) => (t || '').toLowerCase())
      if (!terpList.some((t) => normalizedTerpenes.includes(t))) return false
    }

    if (normalizedEffects.length) {
      const tags = getTags(p)
      if (!tags.length) return false
      const hasMatch = normalizedEffects.some((effect) =>
        tags.some((tag) => tag.includes(effect) || effect.includes(tag))
      )
      if (!hasMatch) return false
    }

    return true
  })
}

const sortAlpha = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

export const buildFacetOptions = (items: Product[]): FacetOptions => {
  const categories = new Set<string>()
  const brands = new Set<string>()
  const strains = new Set<string>()
  const terpenes = new Set<string>()
  const weights = new Set<string>()
  const effects = new Set<string>()

  items.forEach((p) => {
    const cat = getCategoryLabel(p)
    if (cat) categories.add(cat)
    if (p.brand?.name) brands.add(p.brand.name.trim())
    if (p.strain) strains.add(p.strain.trim())
    if (p.cannabisType) strains.add(p.cannabisType.trim())
    const strainType = getStrainType(p)
    if (strainType) strains.add(strainType)
    p.labs?.terpenes?.forEach((t) => {
      if (t) terpenes.add(t)
    })
    const weightLabel = getWeightLabel(p)
    if (weightLabel) weights.add(weightLabel)
    getTags(p).forEach((effect) => effects.add(effect.charAt(0).toUpperCase() + effect.slice(1)))
  })

  return {
    categories: CATEGORY_DEFS.map((c) => c.name),
    brands: Array.from(brands).sort(sortAlpha),
    strains: Array.from(strains).sort(sortAlpha),
    terpenes: Array.from(terpenes).sort(sortAlpha),
    weights: Array.from(weights).sort(sortAlpha),
    effects: Array.from(effects).sort(sortAlpha),
  }
}

const ensureCategoryCounts = (counts: Record<string, number>) => {
  CATEGORY_DEFS.forEach((cat) => {
    if (!(cat.name in counts)) {
      counts[cat.name] = 0
    }
  })
  return counts
}

export const buildFacetCounts = (items: Product[]): FacetCounts => {
  const categoryCounts: Record<string, number> = {}
  const brandCounts: Record<string, number> = {}
  const strainCounts: Record<string, number> = {}
  const terpeneCounts: Record<string, number> = {}
  const weightCounts: Record<string, number> = {}
  const effectCounts: Record<string, number> = {}

  items.forEach((p) => {
    const cat = getCategoryLabel(p)
    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1

    const brand = (p.brand?.name || '').trim()
    if (brand) brandCounts[brand] = (brandCounts[brand] || 0) + 1

    const strainName = (p.strain || '').trim()
    if (strainName) strainCounts[strainName] = (strainCounts[strainName] || 0) + 1
    const cannabisType = (p.cannabisType || '').trim()
    if (cannabisType) strainCounts[cannabisType] = (strainCounts[cannabisType] || 0) + 1
    const normalizedStrainType = getStrainType(p)
    if (normalizedStrainType) {
      strainCounts[normalizedStrainType] = (strainCounts[normalizedStrainType] || 0) + 1
    }

    p.labs?.terpenes?.forEach((t) => {
      if (!t) return
      terpeneCounts[t] = (terpeneCounts[t] || 0) + 1
    })

    const weightLabel = getWeightLabel(p)
    if (weightLabel) {
      weightCounts[weightLabel] = (weightCounts[weightLabel] || 0) + 1
    }

    getTags(p).forEach((effect) => {
      const label = effect.charAt(0).toUpperCase() + effect.slice(1)
      effectCounts[label] = (effectCounts[label] || 0) + 1
    })

  })

  ensureCategoryCounts(categoryCounts)

  return {
    categories: categoryCounts,
    brands: brandCounts,
    strains: strainCounts,
    terpenes: terpeneCounts,
    weights: weightCounts,
    effects: effectCounts,
  }
}
