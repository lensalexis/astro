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

export enum ProductPriceType {
  REGULAR = "REGULAR",
  WEIGHT_TIER = "WEIGHT_TIER",
  PRICE_TIER = "PRICE_TIER",
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
  weightUnit?: string
  size?: string
  type?: ProductType
  subType?: string
  cannabisType?: string
  tiers?: any[]
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
  [key: string]: any
}
