'use client'

import { useEffect } from 'react'
import AIProductSearch from '@/components/AIProductSearch'

export default function StoreDetailPage() {
  return (
    <div className="min-h-screen">
      <AIProductSearch forceAIMode={true} />
    </div>
  )
}
