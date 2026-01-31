'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bars3Icon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/components/UserContext'
import { site } from '@/lib/site'
import FloatingCartButton from '@/components/ui/FloatingCartButton'
import MobileBreadcrumbsBar from '@/components/seo/MobileBreadcrumbsBar'
import { CATEGORY_DEFS } from '@/lib/catalog'
import { useNavbarSearchSlot } from '@/components/NavbarSearchSlotContext'

function NavbarSearchSlotDiv({ onSearchClick }: { onSearchClick: () => void }) {
  const slot = useNavbarSearchSlot()
  return (
    <div
      id="navbar-search-slot"
      ref={(el) => {
        if (slot?.slotRef && el != null) {
          ;(slot.slotRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          slot.setSlotReady(true)
        }
      }}
      className="flex flex-1 min-w-0 max-w-2xl mx-auto justify-center items-center"
    >
      {!slot?.barInSlot && (
        <button
          type="button"
          onClick={onSearchClick}
          className="w-full max-w-full sm:max-w-xl rounded-full border border-gray-200 bg-gray-50 px-2.5 py-2 sm:px-4 sm:py-2.5 text-left text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition"
        >
          <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-gray-500" />
            <span className="truncate">Search flower, vapes, edibles…</span>
          </span>
        </button>
      )}
    </div>
  )
}

export default function SiteChrome() {
  const [mounted, setMounted] = useState(false)
  const [ageAllowed, setAgeAllowed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, setUser } = useUser()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [navDropdown, setNavDropdown] = useState<'discover' | null>(null)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [navMenuRef, setNavMenuRef] = useState<HTMLDivElement | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const mobileNavRef = useRef<HTMLDivElement | null>(null)
  const showChrome = true
  const [discoverPane, setDiscoverPane] = useState<'shop' | 'resources' | 'company'>('shop')

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
      if (navMenuRef && !navMenuRef.contains(e.target as Node)) setNavDropdown(null)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (locationOpen && !(e.target as HTMLElement).closest('#nav-location-pill')) setLocationOpen(false)
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) setMobileNavOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [navMenuRef, locationOpen])

  const categoryIcon: Record<string, string> = {
    flower: '/images/icon-cannabis-flower.png',
    'pre-rolls': '/images/icon-cannabis-preroll.png',
    vaporizers: '/images/icon-cannabis-vape.png',
    concentrates: '/images/icon-cannabis-concentrate.png',
    edibles: '/images/icon-cannabis-edibles.png',
    beverages: '/images/icon-cannabis-beverage.png',
  }

  const shopItems = [
    ...CATEGORY_DEFS.map((c) => ({
      title: c.slug === 'pre-rolls' ? 'Pre-rolls' : c.name,
      href: `/shop/${c.slug}`,
      icon: categoryIcon[c.slug] || '/images/icon-offers.png',
    })),
  ]

  return (
    <>
      {!mounted || !showChrome ? null : (
        <div
          id="site-navbar"
          ref={navRef}
          className="fixed top-0 left-0 right-0 z-[80] bg-white/70 backdrop-blur-md px-4 py-3"
          style={{ ['--site-nav-h' as any]: `${navHeight}px` }}
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-2">
            {/* Google-style: search box first (flex-1), then location, call, profile, hamburger */}
            <NavbarSearchSlotDiv onSearchClick={scrollToSearch} />

            <div className="relative flex items-center gap-1 shrink-0" ref={accountRef} id="nav-location-pill">
              {/* Profile (desktop only; on mobile see hamburger menu) */}
              <button
                type="button"
                className="hidden sm:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-gray-800 hover:bg-white/60 focus:outline-none"
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
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

              {/* Location (dropdown; desktop only on navbar) */}
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => {
                    setLocationOpen((v) => !v)
                    setAccountOpen(false)
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-white/60 focus:outline-none"
                  aria-label="Store location"
                  aria-expanded={locationOpen}
                >
                  <MapPinIcon className="h-5 w-5" />
                </button>
                {locationOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                    <div className="px-3 py-2">
                      <div className="text-sm font-semibold text-gray-900">Kine Buds</div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        {site.address.streetAddress}, {site.address.addressLocality}, {site.address.addressRegion} {site.address.postalCode}
                      </div>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="px-3 py-2 text-sm text-gray-600">Gloucester City (coming soon)</div>
                  </div>
                )}
              </div>

              {/* Phone (desktop only on navbar) */}
              <a
                href={`tel:${site.contact.phone}`}
                className="hidden sm:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-white/60 focus:outline-none"
                aria-label="Call store"
              >
                <PhoneIcon className="h-5 w-5" />
              </a>

              {/* Hamburger: opens Discover (desktop) or mobile menu (mobile) */}
              <div className="relative" ref={setNavMenuRef}>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-white/60 focus:outline-none"
                  aria-label="Menu"
                  aria-expanded={!!navDropdown || mobileNavOpen}
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 640) {
                      setMobileNavOpen(true)
                    } else {
                      setNavDropdown((v) => (v ? null : 'discover'))
                    }
                  }}
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
                {navDropdown ? (
                  <div className="absolute right-0 top-full mt-2 w-[560px] min-h-[280px] rounded-b-2xl border border-t-0 border-gray-200 bg-gray-50 shadow-xl overflow-hidden flex max-w-[calc(100vw-2rem)]">
                    <nav className="w-[180px] shrink-0 border-r border-gray-200 bg-gray-100/80 py-2">
                      {[
                        { key: 'shop' as const, label: 'Shop', Icon: ShoppingBagIcon },
                        { key: 'resources' as const, label: 'Resources', Icon: BookOpenIcon },
                        { key: 'company' as const, label: 'Company', Icon: BuildingOffice2Icon },
                      ].map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setDiscoverPane(key)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                            discoverPane === key
                              ? 'border-l-2 border-gray-900 bg-white text-gray-900'
                              : 'border-l-2 border-transparent text-gray-600 hover:bg-white/60 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </nav>
                    <div className="flex-1 min-w-0 p-4 bg-white">
                      {discoverPane === 'shop' && (
                        <>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {shopItems.map((it) => (
                              <Link
                                key={it.href}
                                href={it.href}
                                onClick={() => setNavDropdown(null)}
                                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                              >
                                <Image src={it.icon} alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
                                <span>{it.title}</span>
                              </Link>
                            ))}
                          </div>
                          <Link
                            href="/shop"
                            onClick={() => setNavDropdown(null)}
                            className="mt-4 flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                          >
                            Shop All
                          </Link>
                        </>
                      )}
                      {discoverPane === 'resources' && (
                        <div className="space-y-1">
                          <Link href="/blog" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Blog</Link>
                          <Link href="/brands" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Brands</Link>
                          <Link href="/faq" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">FAQ</Link>
                        </div>
                      )}
                      {discoverPane === 'company' && (
                        <div className="space-y-1">
                          <Link href="/about" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">About us</Link>
                          <Link href="/reviews" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Reviews</Link>
                          <Link href="/contact" onClick={() => setNavDropdown(null)} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50">Contact</Link>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
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

      {/* Mobile nav sheet */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[1px]">
          <div ref={mobileNavRef} className="absolute left-0 right-0 top-[var(--site-nav-h)] px-4 pb-6">
            <div className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Menu</div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white"
                  onClick={() => {
                    setMobileNavOpen(false)
                    setLocationOpen(false)
                  }}
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Mobile: user, location, phone (saved from navbar for space) */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={user ? '/menu/account' : '/login'}
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-black/5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{initials}</span>
                    )}
                  </span>
                  <span>{user ? 'Account' : 'Sign in'}</span>
                </Link>
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setLocationOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-black/5"
                  >
                    <MapPinIcon className="h-5 w-5 text-gray-600" />
                    <span>Location</span>
                  </button>
                  {locationOpen && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                      <div className="px-3 py-2">
                        <div className="text-sm font-semibold text-gray-900">Kine Buds</div>
                        <div className="mt-0.5 text-xs text-gray-600">
                          {site.address.streetAddress}, {site.address.addressLocality}, {site.address.addressRegion} {site.address.postalCode}
                        </div>
                      </div>
                      <div className="border-t border-gray-100" />
                      <div className="px-3 py-2 text-sm text-gray-600">Gloucester City (coming soon)</div>
                    </div>
                  )}
                </div>
                <a
                  href={`tel:${site.contact.phone}`}
                  onClick={() => setMobileNavOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-black/5"
                >
                  <PhoneIcon className="h-5 w-5 text-gray-600" />
                  <span>Call</span>
                </a>
              </div>

              <div className="mt-3 space-y-3">
                {/* Shop */}
                <details open>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900">
                    <span>Shop</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  </summary>
                  <div className="mt-2 rounded-2xl border border-black/10 bg-white p-2">
                    <div className="grid grid-cols-2 gap-1">
                      {shopItems.map((it) => (
                        <Link
                          key={it.href}
                          href={it.href}
                          onClick={() => setMobileNavOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-black/5"
                        >
                          <Image src={it.icon} alt="" width={20} height={20} className="h-5 w-5" />
                          <span className="text-sm font-semibold text-gray-900">{it.title}</span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/shop"
                      onClick={() => setMobileNavOpen(false)}
                      className="mt-2 flex w-full items-center justify-center rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      Shop All
                    </Link>
                  </div>
                </details>

                {/* Resources */}
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900">
                    <span>Resources</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  </summary>
                  <div className="mt-2 rounded-2xl border border-black/10 bg-white p-2">
                    <div className="grid gap-1">
                      <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        Blog
                      </Link>
                      <Link href="/brands" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        Brands
                      </Link>
                      <Link href="/faq" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        FAQ
                      </Link>
                      <Link href="/resources" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        Resources Center
                      </Link>
                    </div>
                  </div>
                </details>

                {/* Company */}
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900">
                    <span>Company</span>
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  </summary>
                  <div className="mt-2 rounded-2xl border border-black/10 bg-white p-2">
                    <div className="grid gap-1">
                      <Link href="/about" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        About us
                      </Link>
                      <Link href="/reviews" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        Reviews
                      </Link>
                      <Link href="/contact" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-black/5">
                        Contact
                      </Link>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
