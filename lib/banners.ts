import bannersJson from '@/data/banners.json'
import type { HomeStartHereItem } from '@/components/home/HomeStartHereContent'

export type BannerRotation = 'fixed' | 'daily' | 'random'

export type MarketingBanner = {
  id: string
  title: string
  href: string
  image: string
  alt?: string
  badge?: string
  placements: string[]
  enabled?: boolean
  startAt?: string // ISO date/time
  endAt?: string // ISO date/time
  rotation?: BannerRotation
  weight?: number
  priority?: number
  /** Optional: associate a hero banner with a product category */
  categorySlug?: string
}

function hashStringToUint32(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleDeterministic<T>(arr: T[], seedStr: string) {
  const out = arr.slice()
  const rand = mulberry32(hashStringToUint32(seedStr))
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function isActive(b: MarketingBanner, now: Date) {
  if (b.enabled === false) return false
  if (b.startAt) {
    const s = new Date(b.startAt)
    if (!Number.isNaN(s.getTime()) && now < s) return false
  }
  if (b.endAt) {
    const e = new Date(b.endAt)
    if (!Number.isNaN(e.getTime()) && now > e) return false
  }
  return true
}

export function listMarketingBanners(): MarketingBanner[] {
  return (bannersJson as unknown as MarketingBanner[]).filter(Boolean)
}

export function getMarketingBannersForPlacement(
  placement: string,
  opts?: {
    limit?: number
    now?: Date
    seedKey?: string
  }
): MarketingBanner[] {
  const now = opts?.now ?? new Date()
  const all = listMarketingBanners()
    .filter((b) => (b.placements || []).includes(placement))
    .filter((b) => isActive(b, now))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

  const limit = opts?.limit ?? all.length
  if (all.length <= 1) return all.slice(0, limit)

  const seedKey =
    opts?.seedKey ??
    (() => {
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      return `${placement}:${yyyy}-${mm}-${dd}`
    })()

  const rotation = all[0]?.rotation ?? 'daily'
  if (rotation === 'fixed') return all.slice(0, limit)

  return shuffleDeterministic(all, seedKey).slice(0, limit)
}

export function toHomeStartHereItems(banners: MarketingBanner[]): HomeStartHereItem[] {
  return banners.map((b) => ({
    title: b.title,
    href: b.href,
    image: b.image,
    badge: b.badge,
  }))
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function weightedPick<T extends { weight?: number }>(items: T[], rand: () => number): T | null {
  const weights = items.map((x) => clamp(Number(x.weight || 1), 1, 100))
  const total = weights.reduce((a, b) => a + b, 0)
  if (!total) return null
  let r = rand() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1] || null
}

function formatDayKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function pickHeroBanner(opts?: { categorySlug?: string; seedKey?: string }): MarketingBanner | null {
  const placement = 'category_hero'
  const all = getMarketingBannersForPlacement(placement, { limit: 999, seedKey: opts?.seedKey })
  const cat = (opts?.categorySlug || '').toLowerCase().trim()
  const candidates =
    cat && cat !== 'all'
      ? all.filter((b) => !b.categorySlug || b.categorySlug.toLowerCase() === cat)
      : all

  if (!candidates.length) return all[0] || null

  const dayKey = opts?.seedKey || formatDayKey(new Date())
  const rand = mulberry32(hashStringToUint32(`hero:${cat}:${dayKey}`))
  return weightedPick(candidates, rand)
}

