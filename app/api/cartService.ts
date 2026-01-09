import cookie from 'js-cookie'

import {
  CartCreateData,
  Cart,
  AddToCartData,
  CartWithItemProducts,
} from '@/types/cart'
import { RequestOptions, request } from './dispenseApiClient'
import { QueryClientKey, queryClientUtils } from '@/utils/queryClient'
import { ProductPriceType, ProductType } from '@/types/product'
import venueService from './venueService'

const CART_ITEMS_KEY = 'highscore_cart_items'

class CartService {
  async addProduct(
    {
      venueId,
      productId,
      quantity,
      purchaseWeight,
      priceTierData,
    }: AddToCartData,
    options?: RequestOptions
  ): Promise<CartWithItemProducts | null> {
    const cart = getCartFromStore()
    const items = cart?.items ?? []

    let finalQuantity = quantity || 1

    // Handle PRICE_TIER (price breaks by weight)
    if (
      priceTierData &&
      priceTierData.priceType === ProductPriceType.PRICE_TIER &&
      ![ProductType.ACCESSORIES, ProductType.MERCHANDISE].includes(
        priceTierData.type
      )
    ) {
      const weight =
        (purchaseWeight ?? 0) /
        (priceTierData.weight && priceTierData.weight > 0
          ? priceTierData.weight
          : 1)

      finalQuantity = weight * finalQuantity
    }

    // ✅ Log outgoing payload for debugging
    console.log('🛒 Add to Cart Payload:', {
      venueId,
      productId,
      quantity: finalQuantity,
      purchaseWeight,
      priceTierData,
    })

    const result = await this.create(
      {
        venueId,
        items: [
          ...(items.map((i) => ({
            quantity: i.quantity,
            productId: i.product.id,
            purchaseWeight: i.purchaseWeight ?? undefined,
          })) ?? []),
          {
            productId: productId,
            quantity: finalQuantity,
            purchaseWeight: priceTierData ? undefined : purchaseWeight,
          },
        ],
      },
      options
    )

    return result
  }

  async create(
    data: CartCreateData,
    options?: RequestOptions
  ): Promise<CartWithItemProducts | null> {
    const previousCart = getCartFromStore()
    const venue = venueService.getCurrentVenue()

    if (!data.items?.length) {
      this.clearCart()
      return null
    }

    try {
      // Build request body - include cartId if we have an existing cart to UPDATE it
      const body: any = {
        venueId: data.venueId,
        items: data.items ?? [],
      }

      // If we have an existing cart with an ID, include it to UPDATE instead of CREATE
      if (previousCart?.id) {
        body.cartId = previousCart.id
        console.log('🔄 Updating existing cart:', previousCart.id)
      } else {
        console.log('✨ Creating new cart')
      }

      // Cart operations require Organization API key, not venue key
      // Use direct fetch with org API key (same pattern as add-upsell route)
      const baseUrl = process.env.NEXT_PUBLIC_DISPENSE_BASE_URL || 'https://api.dispenseapp.com/2023-03'
      const orgApiKey = process.env.DISPENSE_ORG_API_KEY || process.env.NEXT_PUBLIC_DISPENSE_API_KEY
      
      if (!orgApiKey) {
        throw new Error('DISPENSE_ORG_API_KEY is required for cart operations')
      }

      console.log('🛒 Cart request body:', JSON.stringify(body, null, 2))

      const response = await fetch(`${baseUrl}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dispense-api-key': orgApiKey,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🛑 Cart API error:', errorText)
        throw new Error(`Cart API error: ${response.status} - ${errorText}`)
      }

      const newCart = await response.json() as CartWithItemProducts

      console.log('✅ Cart response:', { id: newCart.id, itemCount: newCart.items?.length || 0 })

      const queryClient = queryClientUtils.getQueryClient()
      queryClient.setQueryData(QueryClientKey.CART, newCart)

      setCartCookie(
        data.venueId,
        newCart.items?.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          purchaseWeight: i.purchaseWeight ?? undefined,
        })) ?? []
      )

      return newCart
    } catch (error: any) {
      console.error('🛑 Error creating/updating cart:', error)
      throw error
    }
  }

  async getById(
    id: string,
    options?: RequestOptions
  ): Promise<CartWithItemProducts | null> {
    return request<CartWithItemProducts>({
      method: 'GET',
      path: `/carts/${id}`,
      options,
    })
  }

  async getOrCreate(venueId: string): Promise<CartWithItemProducts | null> {
    if (!venueId) throw new Error('venueId is required')

    const cart = getCartFromStore()
    if (cart) return cart

    try {
      const cartItems = JSON.parse(
        cookie.get(CART_ITEMS_KEY) ?? '[]'
      ) as {
        productId: string
        quantity: number
        purchaseWeight?: number
        venueId?: string
      }[]

      if (!cartItems.length) {
        return {
          items: [],
        } as unknown as CartWithItemProducts
      }

      return this.create({ venueId, items: cartItems })
    } catch (error: any) {
      console.log('error creating cart', error)
      return null
    }
  }

  clearCart() {
    removeCartCookie()
    const queryClient = queryClientUtils.getQueryClient()
    queryClient.setQueryData(QueryClientKey.CART, null)
  }

  getTotalItemCount() {
    const cart = getCartFromStore()
    if (!cart || !cart.items) return 0
    return cart.items.reduce((acc, i) => acc + i.quantity, 0)
  }
}

function getCartFromStore(): CartWithItemProducts | undefined {
  const queryClient = queryClientUtils.getQueryClient()
  return queryClient.getQueryData<CartWithItemProducts>(QueryClientKey.CART) || undefined
}

function setCartCookie(
  venueId: string,
  items: {
    productId: string
    quantity: number
    purchaseWeight?: number
  }[]
) {
  items = items.map((i) => ({
    ...i,
    venueId: 'venueId' in i ? i.venueId : venueId,
  }))

  cookie.set(CART_ITEMS_KEY, JSON.stringify(items), { expires: 7 })
}

function removeCartCookie() {
  cookie.remove(CART_ITEMS_KEY, { expires: 7 })
}

export default new CartService()