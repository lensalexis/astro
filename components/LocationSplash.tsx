'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { stores, type Store } from '@/lib/stores'
import type { Coordinates } from '@/types/location'
import { useRouter } from 'next/navigation'

dayjs.extend(utc)
dayjs.extend(timezone)

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Images for rotating carousel (from prompts)
const ROTATING_IMAGES = [
  '/images/post-thumb-03.jpg',
  '/images/post-thumb-04.jpg',
  '/images/post-thumb-05.jpg',
  '/images/post-thumb-06.jpg',
  '/images/post-thumb-07.jpg',
  '/images/post-thumb-08.jpg',
  '/images/post-thumb-09.jpg',
  '/images/post-thumb-10.jpg',
]

const getStoreStatus = (store: Store): boolean | null => {
  const now = dayjs().tz(store.timezone)
  const currentDay = dayNames[now.day()] as keyof Store['hours']

  if (store.hours.daily) {
    const openTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${store.hours.daily.open}`, 'YYYY-MM-DD HH:mm', store.timezone)
    const closeTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${store.hours.daily.close}`, 'YYYY-MM-DD HH:mm', store.timezone)
    return now.isAfter(openTime) && now.isBefore(closeTime)
  }

  const dayHours = store.hours[currentDay]
  if (!dayHours) return null

  const openTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${dayHours.open}`, 'YYYY-MM-DD HH:mm', store.timezone)
  const closeTime = dayjs.tz(`${now.format('YYYY-MM-DD')} ${dayHours.close}`, 'YYYY-MM-DD HH:mm', store.timezone)

  return now.isAfter(openTime) && now.isBefore(closeTime)
}

const toRadians = (deg: number) => (deg * Math.PI) / 180

const getDistanceMiles = (from: Coordinates, to: Coordinates) => {
  const R = 3958.8 // Earth radius in miles
  const dLat = toRadians(to.lat - from.lat)
  const dLon = toRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function LocationSplash() {
  const [storeStatuses, setStoreStatuses] = useState<Record<string, boolean | null>>({})
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [ageVerified, setAgeVerified] = useState(false)
  const [ageError, setAgeError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const AGE_SESSION_KEY = 'jalh_age_verified_session'
  const router = useRouter()

  useEffect(() => {
    const statuses: Record<string, boolean | null> = {}
    stores.forEach((store) => {
      statuses[store.id] = getStoreStatus(store)
    })
    setStoreStatuses(statuses)
  }, [])

  // Rotate images every 4 seconds with smooth transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % ROTATING_IMAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const distances = useMemo(() => {
    if (!userLocation) return {}
    return stores.reduce<Record<string, number>>((acc, store) => {
      acc[store.id] = getDistanceMiles(userLocation, store.coordinates)
      return acc
    }, {})
  }, [userLocation])

  const nearestStoreId = useMemo(() => {
    const entries = Object.entries(distances)
    if (!entries.length) return null
    return entries.sort((a, b) => a[1] - b[1])[0][0]
  }, [distances])

  useEffect(() => {
    if (nearestStoreId && !activeStoreId) {
      setActiveStoreId(nearestStoreId)
    }
  }, [nearestStoreId, activeStoreId])

  // Load age verification for current session only
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem(AGE_SESSION_KEY)
    if (stored === 'true') {
      setAgeVerified(true)
    }
    // clean up any legacy long-term key
    localStorage.removeItem('jalh_age_verified_until')
    
    // Allow reset via URL parameter for testing
    if (typeof window !== 'undefined' && window.location.search.includes('resetAge=true')) {
      sessionStorage.removeItem(AGE_SESSION_KEY)
      setAgeVerified(false)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const activeStore = stores.find((store) => store.id === activeStoreId)

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported on this device.')
      return
    }

    setIsLocating(true)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setIsLocating(false)
      },
      (error) => {
        console.error('Geolocation error', error)
        setGeoError('Unable to fetch your location. Please allow access and try again.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    )
  }

  const handleAgeResponse = (isOver21: boolean) => {
    if (isOver21) {
      setAgeVerified(true)
      setAgeError(null)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AGE_SESSION_KEY, 'true')
      }
    } else {
      setAgeVerified(false)
      setAgeError('You must be 21 or older to browse our menu.')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(AGE_SESSION_KEY)
      }
    }
  }

  return (
    <div className="relative h-screen bg-black text-white overflow-hidden">
      {/* Full-width rotating image background with gradient overlay */}
      <div className="absolute inset-0">
        {ROTATING_IMAGES.map((image, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image}
              alt={`Cannabis product ${idx + 1}`}
              fill
              className="object-cover"
              priority={idx === 0}
              quality={90}
            />
            {/* Dark gradient overlay at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            {/* Additional shadow gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          </div>
        ))}
      </div>

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Top section with logo and content over image */}
        <div className="flex-1 flex flex-col justify-end px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Logo */}
          <div className="mb-4 sm:mb-6 flex justify-center">
            <Image 
              src="/images/jalh-logo.png" 
              alt="Just a Little Higher" 
              width={200} 
              height={60} 
              className="h-8 sm:h-10 w-auto drop-shadow-lg" 
            />
          </div>

          {/* Title and subtitle */}
          <div className="text-center space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl">
              Ready to Get a Little Higher?
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-200 drop-shadow-lg">
              Your Destination for Recreational Cannabis in New York
            </p>
          </div>
        </div>

        {/* Bottom section: Age verification or location selection */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-4">
          {!ageVerified ? (
            /* Age verification buttons - styled like prompt boxes */
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-semibold text-white mb-4">Are you 21+?</div>
                <div className="flex gap-3 sm:gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => handleAgeResponse(true)}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-white transition-all shadow-lg hover:shadow-xl text-gray-900 font-semibold text-sm sm:text-base"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgeResponse(false)}
                    className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-white transition-all shadow-lg hover:shadow-xl text-gray-900 font-semibold text-sm sm:text-base"
                  >
                    No
                  </button>
                </div>
                {ageError && (
                  <p className="mt-3 text-xs sm:text-sm text-red-300 font-medium">{ageError}</p>
                )}
              </div>
            </div>
          ) : (
            /* Location dropdown - appears in place of buttons */
            <div className="space-y-4">
              <div className="w-full max-w-md mx-auto">
                <label className="sr-only" htmlFor="store-select-hero">
                  Choose a store
                </label>
                <select
                  id="store-select-hero"
                  value={activeStoreId ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setActiveStoreId(value || null)
                    if (value) router.push(`/stores/${value}`)
                  }}
                  className="w-full rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md px-5 py-4 text-base text-white shadow-2xl outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
                >
                  <option value="" className="bg-gray-900 text-white">Select a location near you</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id} className="bg-gray-900 text-white">
                      {`${store.name} — ${store.addressLine1}, ${store.addressLine2}`}
                    </option>
                  ))}
                </select>
              </div>
              {activeStore && (
                <div className="flex justify-center">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-md ${
                      storeStatuses[activeStore.id] === null
                        ? 'bg-white/10 text-gray-300 border border-white/20'
                        : storeStatuses[activeStore.id]
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {storeStatuses[activeStore.id] === null
                      ? 'Checking'
                      : storeStatuses[activeStore.id]
                        ? 'Open now'
                        : 'Closed'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
