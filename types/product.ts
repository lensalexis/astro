export enum ProductType {
  FLOWER = "FLOWER",
  PRE_ROLLS = "PRE_ROLLS",
  VAPORIZERS = "VAPORIZERS",
  CONCENTRATES = "CONCENTRATES",
  EDIBLES = "EDIBLES",
  TINCTURES = "TINCTURES",
  TOPICALS = "TOPICALS",
  ACCESSORIES = "ACCESSORIES",
  BEVERAGES = "BEVERAGES",
  MERCHANDISE = "MERCHANDISE",
}

export enum ProductWeightUnit {
  GRAMS = "GRAMS",
  MILLIGRAMS = "MILLIGRAMS",
  OUNCES = "OUNCES",
  UNKNOWN = "UNKNOWN",
  EACH = "EACH",
}

export enum ProductPriceType {
  REGULAR = "REGULAR",
  WEIGHT_TIER = "WEIGHT_TIER",
  PRICE_TIER = "PRICE_TIER",
}

export enum CannabisContentUnit {
  PERCENTAGE = "%",
  MILLIGRAMS = "mg",
  MG_PER_GRAM = "mg/g",
}

export type ProductTier = {
  id: string
  price: number
  weight?: number
  weightUnit?: ProductWeightUnit
  weightFormatted?: string
  quantityAvailable?: number
  purchaseQuantity?: number
  discountValue?: number
  discountAmount?: number
  discountAmountFinal?: number
  discountValueFinal?: number
  discountTypeFinal?: "FLAT" | "PERCENT" | null
}

export type Product = {
  id: string
  name: string
  enable?: boolean
  slug?: string
  price?: number
  image?: string
  description?: string
  seoDescription?: string
  discountAmount?: number
  discountAmountFinal?: number
  discountValueFinal?: number
  discountTypeFinal?: "FLAT" | "PERCENT" | null
  brand?: {
    name?: string
    logo?: string
  }
  new?: boolean
  featured?: boolean
  weight?: number
  weightUnit?: ProductWeightUnit
  size?: string
  type?: ProductType
  subType?: string
  cannabisType?: string
  tiers?: ProductTier[]
  variants?: Product[]
  effects?: string[]
  weightFormatted?: string
  priceType?: ProductPriceType
  quantity?: number
  quantityTotal?: number
  purchaseMax?: number
  category?: string
  primary_image_url?: string
  imageUrls?: string[]
  images?: { url?: string }[]
  discounts?: Array<{
    type: "FLAT" | "PERCENT"
    value?: number
    amount?: number
  }>
  strain?: string
  labs?: {
    thcMax?: number | null
    thc?: number | null
    thcA?: number | null
    thcContentUnit?: CannabisContentUnit | null
    cbdMax?: number | null
    cbd?: number | null
    cbdA?: number | null
    cbdContentUnit?: CannabisContentUnit | null
    terpenes?: string[]
    alphaPinene?: number | null
    betaCaryophyllene?: number | null
    betaEudesmol?: number | null
    betaMyrcene?: number | null
    betaPinene?: number | null
    bisabolol?: number | null
    caryophylleneOxide?: number | null
    guaiol?: number | null
    humulene?: number | null
    limonene?: number | null
    linalool?: number | null
    ocimene?: number | null
    terpinene?: number | null
    terpinolene?: number | null
    threeCarene?: number | null
    transNerolidol?: number | null
  }
  [key: string]: any
}

export type ListProductsParams = {
  venueId: string
  limit?: number
  cursor?: string
  sort?: string
  search?: string
  category?: string
  categoryId?: string
  discounted?: boolean
  strain?: string
  cannabisType?: string
  priceMin?: number
  priceMax?: number
  quantityMin?: number
  quantityMax?: number
  weight?: string
  brand?: string
  productType?: string
  effects?: string[]
  terpenes?: string[]
  [key: string]: string | number | boolean | string[] | undefined
}

export type ProductsResponse = {
  data?: Product[]
  meta?: {
    total?: number
    limit?: number
    page?: number
    [key: string]: any
  }
  pagination?: {
    nextCursor?: string
    prevCursor?: string
    [key: string]: any
  }
  nextCursor?: string
  next_cursor?: string
  [key: string]: any
}
