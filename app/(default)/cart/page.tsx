'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import cartService from '@/app/api/cartService'
import { queryClientUtils, QueryClientKey } from '@/utils/queryClient'
import { CartWithItemProducts } from '@/types/cart'
import { XMarkIcon } from '@heroicons/react/24/outline'

// Declare window type for cartUpdated event
declare global {
  interface WindowEventMap {
    cartUpdated: CustomEvent
  }
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartWithItemProducts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCart = () => {
      const queryClient = queryClientUtils.getQueryClient()
      const cartData = queryClient.getQueryData<CartWithItemProducts>(QueryClientKey.CART)
      setCart(cartData || null)
      setLoading(false)
    }

    loadCart()

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    
    // Poll for changes
    const interval = setInterval(loadCart, 1000)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      clearInterval(interval)
    }
  }, [])

  const handleRemoveItem = async (productId: string) => {
    if (!cart || !cart.items) return

    const updatedItems = cart.items.filter(item => item.product.id !== productId)
    
    if (updatedItems.length === 0) {
      cartService.clearCart()
      setCart(null)
      return
    }

    try {
      const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!
      const newCart = await cartService.create({
        venueId,
        items: updatedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          purchaseWeight: item.purchaseWeight,
        })),
      })
      setCart(newCart)
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item from cart')
    }
  }

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      alert('Your cart is empty')
      return
    }

    const openCheckout = (cartId?: string | null) => {
      const baseUrl = 'https://kinebudsdispensary.com/menu/cart'
      const destination = cartId ? `${baseUrl}?cartId=${cartId}` : baseUrl
      window.location.href = destination
    }

    try {
      const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!
      const syncedCart = await cartService.create({
        venueId,
        items: cart.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          purchaseWeight: item.purchaseWeight,
        })),
      })
      openCheckout(syncedCart?.id || cart?.id)
    } catch (error) {
      console.error('Error syncing cart:', error)
      openCheckout(cart?.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading cart...</p>
        </div>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Your cart is empty</p>
            <button
              onClick={() => router.back()}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.items.reduce((sum, item) => {
    const price = (item.product as any).price || 0
    return sum + (price * item.quantity)
  }, 0)

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold mb-6 text-black">Your Cart</h1>
        
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="space-y-4">
            {cart.items.map((item) => {
              const product = item.product as any
              const image = product.image || product.primary_image_url || '/images/default-product.png'
              const price = product.price || 0
              const itemTotal = price * item.quantity

              return (
                <div key={item.product.id} className="flex items-center gap-4 p-4 border-b border-gray-200 last:border-0">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={image}
                      alt={product.name || 'Product'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-black truncate">{product.name}</h3>
                    {product.brand?.name && (
                      <p className="text-sm text-gray-500">{product.brand.name}</p>
                    )}
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-black">${itemTotal.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">${price.toFixed(2)} each</p>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="ml-4 text-red-500 hover:text-red-700 p-2"
                    aria-label="Remove item"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-black">Total ({totalItems} {totalItems === 1 ? 'item' : 'items'}):</span>
              <span className="text-2xl font-bold text-purple-600">${totalPrice.toFixed(2)}</span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-300"
              >
                Continue Shopping
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
