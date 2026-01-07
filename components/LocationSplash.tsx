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
  const AGE_SESSION_KEY = 'jalh_age_verified_session'
  const router = useRouter()

  useEffect(() => {
    const statuses: Record<string, boolean | null> = {}
    stores.forEach((store) => {
      statuses[store.id] = getStoreStatus(store)
    })
    setStoreStatuses(statuses)
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-white to-rose-50 text-gray-900 bg-[url('/images/jalh-bg-mobile.png')] sm:bg-[url('/images/jalh-bg-desktop.png')] bg-cover bg-center">
      {/* Faux blurred backdrop to mimic page behind */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,121,64,0.12),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(209,56,139,0.12),transparent_50%),radial-gradient(circle_at_50%_80%,rgba(34,121,64,0.08),transparent_50%)] blur-sm opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/8 via-white/24 to-white/10 backdrop-blur-sm" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col items-center gap-4">
            <Image src="/images/jalh-logo.png" alt="Just a Little Higher" width={190} height={60} className="h-12 w-auto" />
            <div className="inline-flex items-center justify-center gap-2 self-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-lime-700 ring-1 ring-lime-200/60">
              New York • 5 locations
            </div>
          </div>

          <div className="mt-6 space-y-2 text-center">
            <h1
              className="text-2xl font-black leading-tight tracking-tight bg-gradient-to-r from-sky-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent sm:text-4xl"
              style={{ fontFamily: "'Black Ops One', var(--font-inter)" }}
            >
              READY TO GET A LITTLE HIGHER?
            </h1>
            <p className="text-lg text-gray-700 sm:text-xl">Your Destination for Recreational Cannabis in New York</p>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <div className="w-full max-w-md space-y-3">
              <div className="text-sm font-semibold text-gray-800">Are you over 21 years of age?</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                <button
                  type="button"
                  onClick={() => handleAgeResponse(true)}
                  className="w-full sm:w-32 rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-semibold text-green-800 shadow-[0_6px_14px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleAgeResponse(false)}
                  className="w-full sm:w-32 rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 shadow-[0_6px_14px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-200"
                >
                  No
                </button>
              </div>
              {ageError && <p className="text-sm text-rose-700">{ageError}</p>}
            </div>

            {ageVerified && (
              <div className="mt-2 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center sm:gap-4">
                <div className="w-full max-w-md">
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
                    className="w-full rounded-2xl border-2 border-purple-300 bg-white px-5 py-3 text-base text-gray-900 shadow-[0_10px_25px_rgba(0,0,0,0.06)] outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200"
                  >
                    <option value="">Select a location near you</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {`${store.name} — ${store.addressLine1}, ${store.addressLine2}`}
                      </option>
                    ))}
                  </select>
                </div>
                {activeStore && (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      storeStatuses[activeStore.id] === null
                        ? 'bg-gray-200 text-gray-700'
                        : storeStatuses[activeStore.id]
                          ? 'bg-green-200 text-green-900'
                          : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {storeStatuses[activeStore.id] === null
                      ? 'Checking'
                      : storeStatuses[activeStore.id]
                        ? 'Open now'
                        : 'Closed'}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* <button
            onClick={handleUseLocation}
            className="mx-auto mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-lime-800 underline-offset-4 hover:underline md:mx-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-6-5.373-6-10a6 6 0 0 1 12 0c0 4.627-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2.5" />
            </svg>
            {isLocating ? 'Locating...' : 'Use my location to find the nearest store'}
          </button> */}
          {geoError && <p className="mt-2 text-sm text-amber-700">{geoError}</p>}
        </div>
      </div>
    </div>
  )
}
