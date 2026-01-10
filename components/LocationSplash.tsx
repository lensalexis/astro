'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { stores, type Store } from '@/lib/stores'
import type { Coordinates } from '@/types/location'
import { useRouter } from 'next/navigation'

dayjs.extend(utc)
dayjs.extend(timezone)

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// Videos for rotating splash background (only these are used)
// NOTE: the StoryTelling filename contains a space; keep it URL-encoded.
const ROTATING_VIDEOS = [
  '/videos/StoryTelling%20video_6-720p.mov',
  '/videos/fivio.mov',
  '/videos/fab.mov',
  '/videos/shoutout.MP4',
  '/videos/uws.mov',
  '/videos/show.mov',
  '/videos/briarwood.MOV',
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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const AGE_SESSION_KEY = 'jalh_age_verified_session'
  const router = useRouter()

  useEffect(() => {
    const statuses: Record<string, boolean | null> = {}
    stores.forEach((store) => {
      statuses[store.id] = getStoreStatus(store)
    })
    setStoreStatuses(statuses)
  }, [])

  // Rotate background media - each video plays for at least 12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % ROTATING_VIDEOS.length)
    }, 12000) // 12 seconds minimum
    return () => clearInterval(interval)
  }, [])

  // Enable audio after the first user interaction.
  // Autoplay with sound is blocked on most mobile browsers; we start muted and unmute to 50% after a tap.
  useEffect(() => {
    if (soundEnabled) return
    const enable = () => setSoundEnabled(true)
    window.addEventListener('pointerdown', enable, { once: true })
    window.addEventListener('touchstart', enable, { once: true })
    window.addEventListener('keydown', enable, { once: true })
    return () => {
      window.removeEventListener('pointerdown', enable)
      window.removeEventListener('touchstart', enable)
      window.removeEventListener('keydown', enable)
    }
  }, [soundEnabled])

  // Autoplay on all devices - ensure next video plays after transition
  // - keep videos muted + playsInline (required for iOS autoplay)
  // - imperatively call play() on the active video (some browsers ignore autoPlay attr)
  // - retry when tab becomes visible
  useEffect(() => {
    const syncAndPlayActive = async () => {
      const v = videoRefs.current[currentMediaIndex]
      if (!v) return
      
      // Always keep volume at 50% (muted controls whether you hear it)
      v.volume = 0.5
      v.muted = !soundEnabled
      v.playsInline = true
      
      // Reset to start before playing
      try {
        v.currentTime = 0
      } catch {
        // ignore
      }
      
      // Play the video - ensure it actually plays
      try {
        await v.play()
      } catch (err) {
        // Autoplay can still be blocked (power saver / data saver / user settings).
        // If blocked, we keep the background element; user interaction will usually allow play.
        console.warn('Video autoplay blocked:', err)
      }
    }

    // Pause others to reduce background resource usage
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i !== currentMediaIndex) {
        v.pause()
        v.muted = true
      }
    })

    // Play the active video
    syncAndPlayActive()

    // Retry when tab becomes visible
    const onVis = () => {
      if (document.visibilityState === 'visible') syncAndPlayActive()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [currentMediaIndex, soundEnabled])

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
    <div className="relative h-[100svh] supports-[height:100dvh]:h-[100dvh] bg-black text-white overflow-hidden">
      {/* Full-width rotating video background with gradient overlay */}
      <div className="absolute inset-0">
        {ROTATING_VIDEOS.map((src, idx) => (
          <div
            key={src}
            className={`absolute inset-0 ${
              idx === currentMediaIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ transition: 'opacity 0.3s' }}
          >
            <video
              ref={(el) => {
                videoRefs.current[idx] = el
              }}
              className="h-full w-full object-cover"
              autoPlay
              muted
              // Helps iOS/Safari treat it as an inline element and allow autoplay when muted.
              loop
              playsInline
              // Avoids mobile UI overlays
              controls={false}
              disablePictureInPicture
              preload="auto"
            >
              <source src={src} />
            </video>
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
        <div className="flex-1 flex flex-col justify-end px-4 sm:px-6 pb-2 sm:pb-3">
          {/* Logo */}
          <div className="mb-3 sm:mb-4 flex justify-center">
            <Image 
              src="/images/jalh-logo.png" 
              alt="Just a Little Higher" 
              width={200} 
              height={60} 
              className="h-8 sm:h-10 w-auto drop-shadow-lg" 
            />
          </div>

          {/* Title and subtitle */}
          <div className="text-center space-y-1 sm:space-y-2 mb-4 sm:mb-5">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-2xl">
              Ready to Get a Little Higher?
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-200 drop-shadow-lg">
              Your Destination for Recreational Cannabis in New York
            </p>
          </div>
        </div>

        {/* Bottom section: Age verification or location selection */}
        <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-3">
          {!ageVerified ? (
            /* Age verification buttons - styled like category pills */
            <div className="space-y-4">
              <div className="text-center">
                <div className="flex gap-3 sm:gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() => handleAgeResponse(true)}
                    className="flex-none rounded-2xl overflow-hidden flex items-center shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 bg-emerald-700 text-white opacity-90 hover:opacity-100 cursor-pointer"
                  >
                    {/* Image on left - touches edge */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image 
                        src="/images/post-thumb-03.jpg" 
                        alt="21+" 
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    {/* Text on right */}
                    <span className="text-left px-3 py-1.5 whitespace-nowrap">
                      <span className="block text-sm font-semibold leading-tight">I am 21+</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAgeResponse(false)}
                    className="flex-none rounded-2xl overflow-hidden flex items-center shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 bg-pink-900 text-white opacity-90 hover:opacity-100 cursor-pointer"
                  >
                    {/* Image on left - touches edge */}
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image 
                        src="/images/post-thumb-05.jpg" 
                        alt="Under 21" 
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    {/* Text on right */}
                    <span className="text-left px-3 py-1.5 whitespace-nowrap">
                      <span className="block text-sm font-semibold leading-tight">I am under 21</span>
                    </span>
                  </button>
                </div>
                {ageError && (
                  <p className="mt-3 text-xs sm:text-sm text-red-300 font-medium">{ageError}</p>
                )}
              </div>
            </div>
          ) : (
            /* Location button - appears in place of buttons */
            <div className="space-y-4">
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 hover:border-white px-6 py-3 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  <MapPinIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Select a Location Near You</span>
                </button>
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

          {/* Location modal */}
          {showLocationModal && (
            <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-sm">
              <div className="max-w-2xl mx-auto h-full flex flex-col">
                <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-base font-semibold text-gray-900">Select a location</div>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="p-2 text-gray-600 hover:text-black"
                    aria-label="Close location picker"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        onClick={() => {
                          setActiveStoreId(store.id)
                          setShowLocationModal(false)
                          router.push(`/stores/${store.id}`)
                        }}
                        className={[
                          'w-full text-left rounded-xl border px-4 py-3',
                          'hover:bg-gray-50 transition',
                          activeStoreId === store.id ? 'border-green-700 bg-gray-50' : 'border-gray-200 bg-white',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{store.name}</div>
                            {store.address || store.addressLine1 ? (
                              <div className="text-xs text-gray-600 mt-1">
                                {store.address ||
                                  [store.addressLine1, store.addressLine2].filter(Boolean).join(', ')}
                              </div>
                            ) : null}
                          </div>
                          {activeStoreId === store.id && (
                            <div className="text-xs font-semibold text-gray-700">Selected</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
