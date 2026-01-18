import type { HomeHeroSlide } from '@/components/home/HomeHeroCarousel'
import type { HomeStartHereItem } from '@/components/home/HomeStartHereContent'
import { CATEGORY_DEFS, CATEGORY_NAME_BY_SLUG } from '@/lib/catalog'
import { pickHeroBanner } from '@/lib/banners'

export type CategoryIntentKey =
  | 'bestSellers'
  | 'bestDeals'
  | 'budgetPicks'
  | 'highThc'
  | 'indica'
  | 'sativa'
  | 'hybrid'

export type CategoryLandingConfig = {
  slug: string
  name: string
  /** Hero headline (full string, e.g. "Find your next pre-roll") */
  heroTitle: string
  /** Static hero background image (no slider on category pages) */
  heroImage: string
  /** If we ever want to re-enable a carousel, keep slides optional */
  heroSlides?: HomeHeroSlide[]
  /** Category-specific banner rail (replaces homepage “Offers for you”) */
  banners: HomeStartHereItem[]
  /** Which Netflix-style rails to show and in what order */
  intentOrder: CategoryIntentKey[]
}

function titleCaseCategory(name: string) {
  return name.replace(/\s+/g, ' ').trim()
}

function heroTitleFor(slug: string, name: string) {
  const lower = slug.toLowerCase()
  if (lower === 'pre-rolls') return 'Find your next pre-roll'
  if (lower === 'vaporizers') return 'Find your next vape'
  if (lower === 'edibles') return 'Find your next edible'
  if (lower === 'concentrates') return 'Find your next concentrate'
  if (lower === 'beverages') return 'Find your next beverage'
  if (lower === 'flower') return 'Find your next flower'
  return `Find your next ${titleCaseCategory(name)}`
}

function defaultHeroImageFor(slug: string) {
  const picked = pickHeroBanner({ categorySlug: slug })
  if (picked?.image) return picked.image
  return '/images/deal-slider-1.jpg'
}

function bannersFor(slug: string): HomeStartHereItem[] {
  // Keep the images unique per category by using different combinations/order.
  const lower = slug.toLowerCase()

  const seeAllHref = `/shop/${lower}/all`

  if (lower === 'flower') {
    return [
      { title: 'Fresh drops', href: seeAllHref, image: '/images/deal-slider-2.jpg', badge: 'New' },
      { title: 'Top shelf picks', href: seeAllHref, image: '/images/deal-slider-1.jpg', badge: 'Top' },
      { title: 'Best value flower', href: seeAllHref, image: '/images/deal-slider-5.jpg', badge: 'Value' },
    ]
  }

  if (lower === 'pre-rolls') {
    return [
      { title: 'Grab & go classics', href: seeAllHref, image: '/images/deal-slider-3.jpg', badge: 'Popular' },
      { title: 'Party pack picks', href: seeAllHref, image: '/images/deal-slider-4.jpg', badge: 'Bundle' },
      { title: 'Under $25', href: seeAllHref, image: '/images/post-thumb-05.jpg', badge: 'Deal' },
    ]
  }

  if (lower === 'vaporizers') {
    return [
      { title: 'Smooth hits', href: seeAllHref, image: '/images/deal-slider-4.jpg', badge: 'Trending' },
      { title: 'Best value carts', href: seeAllHref, image: '/images/deal-slider-1.jpg', badge: 'Value' },
      { title: 'Beginner friendly', href: seeAllHref, image: '/images/post-thumb-03.jpg', badge: 'Easy' },
    ]
  }

  if (lower === 'edibles') {
    return [
      { title: 'Low dose favorites', href: seeAllHref, image: '/images/post-thumb-05.jpg', badge: 'Low dose' },
      { title: 'Sleep support picks', href: seeAllHref, image: '/images/deal-slider-5.jpg', badge: 'Night' },
      { title: 'Tasty best sellers', href: seeAllHref, image: '/images/deal-slider-2.jpg', badge: 'Top' },
    ]
  }

  if (lower === 'concentrates') {
    return [
      { title: 'Flavor chasers', href: seeAllHref, image: '/images/deal-slider-1.jpg', badge: 'Terps' },
      { title: 'Live resin / rosin', href: seeAllHref, image: '/images/deal-slider-3.jpg', badge: 'Premium' },
      { title: 'Best value grams', href: seeAllHref, image: '/images/deal-slider-4.jpg', badge: 'Value' },
    ]
  }

  if (lower === 'beverages') {
    return [
      { title: 'Sip & chill', href: seeAllHref, image: '/images/post-thumb-06.jpg', badge: 'Popular' },
      { title: 'Best value drinks', href: seeAllHref, image: '/images/deal-slider-2.jpg', badge: 'Value' },
      { title: 'New drinkables', href: seeAllHref, image: '/images/deal-slider-5.jpg', badge: 'New' },
    ]
  }

  return [
    { title: 'Featured picks', href: seeAllHref, image: '/images/deal-slider-1.jpg', badge: 'Featured' },
    { title: 'New arrivals', href: seeAllHref, image: '/images/deal-slider-2.jpg', badge: 'New' },
    { title: 'Best value', href: seeAllHref, image: '/images/deal-slider-5.jpg', badge: 'Value' },
  ]
}

export function getCategoryLandingConfig(slug: string): CategoryLandingConfig | null {
  const def = CATEGORY_DEFS.find((c) => c.slug === slug)
  const name = def?.name || CATEGORY_NAME_BY_SLUG[slug] || slug
  if (!name) return null

  return {
    slug,
    name,
    heroTitle: heroTitleFor(slug, name),
    heroImage: defaultHeroImageFor(slug),
    banners: bannersFor(slug),
    intentOrder: ['bestSellers', 'bestDeals', 'indica', 'sativa', 'hybrid', 'highThc', 'budgetPicks'],
  }
}

