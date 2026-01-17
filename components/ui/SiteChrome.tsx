'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bars3Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import { site } from '@/lib/site'
import FloatingCartButton from '@/components/ui/FloatingCartButton'
import MobileBreadcrumbsBar from '@/components/seo/MobileBreadcrumbsBar'
import DiscoverMegaMenu from '@/components/ui/DiscoverMegaMenu'

export default function SiteChrome() {
  const [mounted, setMounted] = useState(false)
  const [ageAllowed, setAgeAllowed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [menuRef, setMenuRef] = useState<HTMLDivElement | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const showChrome = true
  const AGE_SESSION_KEY = 'kinebuds_age_verified_session'
  const [modalQuery, setModalQuery] = useState('')
  const navRef = useRef<HTMLDivElement | null>(null)
  const [navHeight, setNavHeight] = useState(72)

  // Single-store experience (Kine Buds)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Expose navbar height as a CSS variable for overlays/offsets.
  useEffect(() => {
    if (!mounted) return
    const measure = () => {
      const el = navRef.current
      if (!el) return
      const h = Math.max(48, Math.round(el.getBoundingClientRect().height || 0))
      setNavHeight(h)
      document.documentElement.style.setProperty('--site-nav-h', `${h}px`)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [mounted])

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

  const scrollToSearch = () => {
    const el = document.getElementById('ai-search-anchor')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      router.push('/#ai-search-anchor')
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
      .map((n: string) => n[0])
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
      router.push('/')
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
        <div
          id="site-navbar"
          ref={navRef}
          className="fixed top-0 left-0 right-0 z-[80] bg-white px-4 border-b border-black/5"
          style={{ ['--site-nav-h' as any]: `${navHeight}px` }}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 py-2">
            {/* Left: logo + discover */}
            <div className="flex items-center gap-3">
              <Link href="/" className="mr-1 inline-flex items-center">
                <Image
                  src="/images/kine-buds-logo.png"
                  alt="Kine Buds"
                  width={142}
                  height={40}
                  className="w-[142px] h-auto"
                  priority
                />
              </Link>

              {/* Discover (Viator-like: no dark pill) */}
              <div className="relative" ref={setMenuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-black/5"
                >
                  <Bars3Icon className="h-5 w-5" />
                  <span>Discover</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                </button>
                {menuOpen && (
                  <>
                    {/* Backdrop (click to close) */}
                    <button
                      type="button"
                      aria-label="Close discover menu"
                      className="fixed inset-0 z-[70] cursor-default bg-black/20 backdrop-blur-[1px]"
                      onClick={() => setMenuOpen(false)}
                    />

                    {/* Panel */}
                    <div className="hidden sm:block absolute left-0 top-full mt-3 z-[80]">
                      <DiscoverMegaMenu onNavigate={() => setMenuOpen(false)} />
                    </div>

                    {/* Mobile: make it full width below navbar */}
                    <div className="sm:hidden fixed left-0 right-0 top-[var(--site-nav-h)] z-[80] px-4 pb-6 max-h-[calc(100vh-var(--site-nav-h))] overflow-auto">
                      <DiscoverMegaMenu onNavigate={() => setMenuOpen(false)} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: search icon | user/location */}
            <div className="ml-auto flex items-center gap-2" ref={accountRef}>
              {/* Search icon */}
              <button
                type="button"
                onClick={openSearch}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-gray-900 hover:bg-gray-50"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-700" />
              </button>

              <div className="hidden sm:block h-8 w-px bg-black/10" />

              {/* User + location dropdown (Viator-like white pill) */}
              <div
                id="nav-location-pill"
                className="relative inline-flex items-center rounded-full border border-black/10 bg-white px-1.5 py-1 shadow-sm"
              >
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-800"
                  onClick={() => {
                    if (!user) {
                      router.push('/login')
                      return
                    }
                    setAccountOpen((v) => !v)
                    setLocationOpen(false)
                  }}
                  aria-label={user ? 'Account menu' : 'Sign in'}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'User avatar'}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                <div className="mx-1 h-8 w-px bg-black/10" />

                <button
                  type="button"
                  onClick={() => {
                    // Keep location dropdown disabled (single store for now)
                    setLocationOpen(false)
                    setAccountOpen(false)
                  }}
                  className="inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1 text-left text-sm font-semibold text-gray-900 hover:bg-black/5"
                  aria-label="Store location"
                >
                  <span className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-gray-900">Kine Buds</span>
                    <span className="text-[11px] font-medium text-gray-600">
                      {site.address.addressLocality}, {site.address.addressRegion}
                    </span>
                  </span>
                  <span className="sm:hidden">Kine Buds</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {accountOpen && user && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-black/10 bg-white text-gray-900 shadow-xl">
                  <ul className="py-2 text-sm">
                    <li>
                      <Link
                        href="/menu/account"
                        className="flex items-center px-4 py-2 hover:bg-black/5"
                        onClick={() => setAccountOpen(false)}
                      >
                        Edit Account
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/orders"
                        className="flex items-center px-4 py-2 hover:bg-black/5"
                        onClick={() => setAccountOpen(false)}
                      >
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/loyalty"
                        className="flex items-center px-4 py-2 hover:bg-black/5"
                        onClick={() => setAccountOpen(false)}
                      >
                        Loyalty
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/menu/account/payments"
                        className="flex items-center px-4 py-2 hover:bg-black/5"
                        onClick={() => setAccountOpen(false)}
                      >
                        Payments
                      </Link>
                    </li>
                    <li>
                      <div className="my-1 border-t border-black/5" />
                    </li>
                    <li>
                      <button
                        type="button"
                        className="flex w-full items-center px-4 py-2 text-left hover:bg-black/5"
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

            </div>
          </div>
          {/* Mobile breadcrumb bar (driven by PageShell) */}
          <div className="mx-auto w-full max-w-6xl">
            <MobileBreadcrumbsBar />
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

      {/* Floating Cart Button */}
      <FloatingCartButton />
    </>
  )
}
