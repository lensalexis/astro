'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'
import cartService from '@/app/api/cartService'
import { queryClientUtils, QueryClientKey } from '@/utils/queryClient'
import { CartWithItemProducts } from '@/types/cart'

export default function FloatingCartButton() {
  const router = useRouter()
  const [cartCount, setCartCount] = useState(0)

  // Update cart count
  const updateCount = () => {
    const count = cartService.getTotalItemCount()
    setCartCount(count)
  }

  useEffect(() => {
    updateCount()

    // Listen for cart update events
    const handleCartUpdate = () => {
      updateCount()
    }

    window.addEventListener('cartUpdated', handleCartUpdate)
    
    // Also check for changes periodically (in case cart is updated elsewhere)
    const interval = setInterval(() => {
      updateCount()
    }, 1000)

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate)
      clearInterval(interval)
    }
  }, [])

  const handleClick = () => {
    // Navigate to cart page
    router.push('/cart')
  }

  // Don't show if cart is empty
  if (cartCount === 0) return null

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="View cart"
    >
      <ShoppingCartIcon className="h-6 w-6" />
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center min-w-[24px]">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  )
}
