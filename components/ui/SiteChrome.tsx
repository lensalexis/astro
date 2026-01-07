'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bars3Icon,
  ChevronDownIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import { stores } from '@/lib/stores'

export default function SiteChrome() {
  const [mounted, setMounted] = useState(false)
  const [ageAllowed, setAgeAllowed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [menuRef, setMenuRef] = useState<HTMLDivElement | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [accountOpen, setAccountOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const showChrome = pathname !== '/'
  const hasStoreContext = pathname.startsWith('/stores/')
  const AGE_SESSION_KEY = 'jalh_age_verified_session'
  const [modalQuery, setModalQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Track age verification from sessionStorage (shared with splash)
  useEffect(() => {
    if (!mounted) return
    const checkAge = () => {
      const stored = typeof window !== 'undefined' ? sessionStorage.getItem(AGE_SESSION_KEY) : null
      setAgeAllowed(stored === 'true')
    }
    checkAge()
    const onStorage = (e: StorageEvent) => {
      if (e.key === AGE_SESSION_KEY) checkAge()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [mounted])

  useEffect(() => {
    if (pathname.startsWith('/stores/')) {
      const parts = pathname.split('/')
      setSelectedLocation(parts[2] || '')
    }
  }, [pathname])

  const scrollToSearch = () => {
    const el = document.getElementById('ai-search-anchor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (selectedLocation || stores[0]?.id) {
      const target = selectedLocation || stores[0].id
      router.push(`/stores/${target}#ai-search-anchor`)
    }
  }

  const displayName =
    (user?.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user?.name) ||
    user?.email ||
    ''
  const avatarUrl = (user as any)?.avatar || (user as any)?.photoUrl || (user as any)?.image
  const initials = useMemo(() => {
    if (!displayName) return '👤'
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])

  // Close account menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleMenuSelect = (path: string) => {
    setMenuOpen(false)
    if (path === 'home') {
      const target = selectedLocation || stores[0]?.id || ''
      if (target) router.push(`/stores/${target}`)
      return
    }
    router.push(path)
  }

  const openSearch = () => {
    setSearchModalOpen(true)
    setModalQuery('')
  }

  const focusMainSearch = (val?: string) => {
    const el = document.getElementById('ai-search-input') as HTMLInputElement | null
    if (el) {
      if (val !== undefined) {
        el.value = val
        el.dispatchEvent(new Event('input', { bubbles: true }))
      }
      el.focus()
    }
    scrollToSearch()
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    focusMainSearch(modalQuery)
    setSearchModalOpen(false)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef && !menuRef.contains(e.target as Node)) setMenuOpen(false)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (locationOpen && !(e.target as HTMLElement).closest('#nav-location-pill')) setLocationOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuRef, locationOpen])

  return (
    <>
      {!mounted || !showChrome ? null : (
        <div className="fixed top-0 left-0 right-0 z-40 bg-transparent px-4 py-3">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
            <div className="flex items-center gap-2">
              {/* Menu pill */}
              <div className="relative" ref={setMenuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Bars3Icon className="h-5 w-5" />
                  <span>Menu</span>
                </button>
                {menuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-40 rounded-2xl border border-gray-800 bg-black text-white shadow-xl">
                    <ul className="py-2 text-sm">
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-white/10"
                          onClick={() => handleMenuSelect('home')}
                        >
                          Home
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-white/10"
                          onClick={() => handleMenuSelect('/shop/flower')}
                        >
                          Shop All
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-white/10"
                          onClick={() => handleMenuSelect('/about')}
                        >
                          About
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-white/10"
                          onClick={() => handleMenuSelect('/contact')}
                        >
                          Contact
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Search trigger */}
              <button
                type="button"
                onClick={openSearch}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="url(#navSparkGradient)"
                    d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Zm6 8 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Zm-12 0 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"
                  />
                  <defs>
                    <linearGradient id="navSparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="inline-flex items-center gap-1">
                  <span className="sm:hidden">Search</span>
                  <span className="hidden sm:inline bg-gradient-to-r from-pink-500 via-fuchsia-500 to-green-400 bg-clip-text text-transparent">
                    Find your next favorite
                  </span>
                </span>
              </button>
            </div>

            {/* User + location pill */}
            <div
              id="nav-location-pill"
              className="relative inline-flex items-center gap-2 rounded-full bg-black px-2 py-1 text-white shadow-sm transition ml-auto"
              ref={accountRef}
            >
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-800"
                onClick={() => {
                  if (!user) {
                    router.push('/login')
                    return
                  }
                  setAccountOpen((v) => !v)
                  setLocationOpen(false)
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName || 'User avatar'} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              <div className="h-8 w-px bg-white/20" />
              <button
                type="button"
                onClick={() => {
                  setLocationOpen((v) => !v)
                  setAccountOpen(false)
                }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                <MapPinIcon className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {selectedLocation ? stores.find((s) => s.id === selectedLocation)?.name || 'Location' : 'Location'}
                </span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {accountOpen && user && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-gray-800 bg-black text-white shadow-xl">
                  <ul className="py-2 text-sm">
                    <li>
                      <Link
                        href="/menu/account"
                        className="flex items-center px-4 py-2 hover:bg-white/10"
                        onClick={() => setAccountOpen(false)}
                      >
                        Edit Account
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/orders"
                        className="flex items-center px-4 py-2 hover:bg-white/10"
                        onClick={() => setAccountOpen(false)}
                      >
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/loyalty"
                        className="flex items-center px-4 py-2 hover:bg-white/10"
                        onClick={() => setAccountOpen(false)}
                      >
                        Loyalty
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/payments"
                        className="flex items-center px-4 py-2 hover:bg-white/10"
                        onClick={() => setAccountOpen(false)}
                      >
                        Payments
                      </Link>
                    </li>
                    <li>
                      <div className="my-1 border-t border-white/10" />
                    </li>
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-left hover:bg-white/10"
                        onClick={() => {
                          localStorage.removeItem('dispense_user')
                          localStorage.removeItem('dispense_token')
                          setUser(null)
                          router.push('/login')
                          setAccountOpen(false)
                        }}
                      >
                        Log Out
                      </button>
                    </li>
                  </ul>
                </div>
              )}

              {locationOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-gray-800 bg-black text-white shadow-xl">
                  <ul className="max-h-64 overflow-auto py-2 text-sm">
                    {stores.map((s) => (
                      <li key={s.id}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-white/10"
                          onClick={() => {
                            setSelectedLocation(s.id)
                            setLocationOpen(false)
                            router.push(`/stores/${s.id}`)
                          }}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setSearchModalOpen(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-black"
              aria-label="Close search"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <form onSubmit={handleSearchSubmit} className="mt-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  value={modalQuery}
                  onChange={(e) => setModalQuery(e.target.value)}
                  placeholder="Search by mood, product, brands, or preference"
                  className="w-full rounded-full border border-purple-200 bg-white px-12 py-4 text-base font-semibold text-gray-800 shadow-[0_10px_25px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-600 hover:text-purple-700"
                  aria-label="Submit search"
                >
                  ➜
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600">Submitting will jump you into the main search to keep the same experience.</p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
