import { ProductPriceType, ProductType } from './product'

export interface CartItem {
  productId: string
  quantity: number
  purchaseWeight?: number
}

export interface CartCreateData {
  venueId: string
  items: CartItem[]
}

export interface Cart {
  id?: string
  items?: CartItem[]
}

export interface AddToCartData {
  venueId: string
  productId: string
  quantity: number
  purchaseWeight?: number
  priceTierData?: {
    priceType: ProductPriceType
    type: ProductType
    weight?: number
  }
}

export interface CartItemWithProduct {
  product: {
    id: string
    [key: string]: any
  }
  quantity: number
  purchaseWeight?: number
}

export interface CartWithItemProducts {
  id?: string
  items?: CartItemWithProduct[]
}
