import type { Coordinates } from '@/types/location'
import { site } from '@/lib/site'

export type Store = {
  id: string
  name: string
  addressLine1: string
  addressLine2: string
  phone?: string | null
  timezone: string
  coordinates: Coordinates
  hoursDisplay?: string
  image?: string
  hours: {
    sunday?: { open: string; close: string }
    monday?: { open: string; close: string }
    tuesday?: { open: string; close: string }
    wednesday?: { open: string; close: string }
    thursday?: { open: string; close: string }
    friday?: { open: string; close: string }
    saturday?: { open: string; close: string }
    daily?: { open: string; close: string }
  }
  shopUrl?: string
  detailsUrl?: string
  // Enhanced fields for assistant
  status?: 'open' | 'coming_soon'
  ocm?: string
  services?: string[]
  address?: string // Full address string
}

export const stores: Store[] = [
  {
    id: 'kinebuds-maywood',
    name: 'Kine Buds Dispensary',
    addressLine1: site.address.streetAddress,
    addressLine2: `${site.address.addressLocality}, ${site.address.addressRegion} ${site.address.postalCode}`,
    address: `${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.addressRegion} ${site.address.postalCode}`,
    phone: site.contact.phone,
    timezone: 'America/New_York',
    coordinates: { lat: 40.9027, lng: -74.0619 }, // Maywood, NJ (approx)
    hoursDisplay: 'See Hours page for current hours',
    image: '/images/store-front.jpg',
    status: 'open',
    services: ['in_store'],
    hours: {
      // Keep empty; rendered hours are driven by /hours content.
    },
    shopUrl: '/shop',
    detailsUrl: '/store-info',
  },
]

export const about = {
  tagline: 'Your destination for recreational cannabis in Maywood, NJ',
  summary:
    'Kine Buds Dispensary offers curated products and clear guidance—flower, pre-rolls, edibles, vapes, and more.',
  story:
    'Built for a simple, welcoming shopping experience—helpful education, transparent pricing, and live inventory.',
}
