import { NextResponse } from 'next/server'
import productService from '@/lib/productService'
import type { ListProductsParams } from '@/types/product'

type Json = Record<string, unknown>

const venueIdFromEnv = () =>
  process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID

// Very small in-memory cache + in-flight coalescing to survive traffic spikes.
// (Best-effort: works per server process/region.)
const cache = new Map<string, { expiresAt: number; value: Json }>()
const inFlight = new Map<string, Promise<Json>>()

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 120
const rate = new Map<string, { windowStart: number; count: number }>()

function getClientIp(req: Request) {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') || 'unknown'
}

function rateLimit(req: Request) {
  const ip = getClientIp(req)
  const now = Date.now()
  const entry = rate.get(ip)
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rate.set(ip, { windowStart: now, count: 1 })
    return { ok: true }
  }
  entry.count += 1
  if (entry.count > RATE_MAX) return { ok: false }
  return { ok: true }
}

function parseNumber(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function parseBoolean(v: string | null): boolean | undefined {
  if (v == null) return undefined
  if (v === 'true') return true
  if (v === 'false') return false
  return undefined
}

function pickParams(sp: URLSearchParams): Omit<ListProductsParams, 'venueId'> & Record<string, any> {
  const limitRaw = parseNumber(sp.get('limit'))
  const limit = limitRaw ? Math.min(Math.max(limitRaw, 1), 200) : undefined

  const params: (Omit<ListProductsParams, 'venueId'> & Record<string, any>) = {
    limit,
    cursor: sp.get('cursor') || undefined,
    sort: sp.get('sort') || undefined,
    search: sp.get('search') || undefined,
    // Allow either `q` or `search` from clients; normalize to `search`.
    ...(sp.get('q') ? { search: sp.get('q')! } : null),
    category: sp.get('category') || undefined,
    categoryId: sp.get('categoryId') || undefined,
    discounted: parseBoolean(sp.get('discounted')),
    strain: sp.get('strain') || undefined,
    cannabisType: sp.get('cannabisType') || undefined,
    priceMin: parseNumber(sp.get('priceMin')),
    priceMax: parseNumber(sp.get('priceMax')),
    quantityMin: parseNumber(sp.get('quantityMin')),
    quantityMax: parseNumber(sp.get('quantityMax')),
    weight: sp.get('weight') || undefined,
    brand: sp.get('brand') || undefined,
    productType: sp.get('productType') || undefined,
    enable: parseBoolean(sp.get('enable')),
    // Used by AI search; not part of our typed params but supported by upstream.
    ...(parseNumber(sp.get('thcMax')) !== undefined ? { thcMax: parseNumber(sp.get('thcMax'))! } : null),
  }

  return params
}

export async function GET(req: Request) {
  if (!rateLimit(req).ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'retry-after': '2' } }
    )
  }

  const venueId = venueIdFromEnv()
  if (!venueId) {
    return NextResponse.json(
      { error: 'DISPENSE_VENUE_ID is not configured' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const params = pickParams(searchParams)

  // Normalize a common typo: some callers pass `category` as an ID.
  if (!params.categoryId && params.category && params.category.length >= 8) {
    // Keep both; Dispense API tolerates unknown keys, but our types allow both.
    params.categoryId = params.category
  }

  const cacheKey = JSON.stringify({ venueId, ...params })
  const now = Date.now()
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.value, {
      headers: {
        'cache-control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    })
  }

  const inflight = inFlight.get(cacheKey)
  if (inflight) {
    const value = await inflight
    return NextResponse.json(value, {
      headers: {
        'cache-control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    })
  }

  const promise = (async () => {
    const res = await productService.list(
      { venueId, ...(params as any) },
      { next: { revalidate: 15, tags: ['dispense:products'] } }
    )

    const responseAny = res as any
    const nextCursor =
      responseAny.nextCursor ||
      responseAny.next_cursor ||
      responseAny.pagination?.nextCursor ||
      null

    const payload: Json = { data: res.data || [], nextCursor }
    cache.set(cacheKey, { value: payload, expiresAt: now + 15_000 })
    return payload
  })()

  inFlight.set(cacheKey, promise)
  try {
    const value = await promise
    return NextResponse.json(value, {
      headers: {
        'cache-control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    })
  } catch (err: any) {
    console.error('Dispense products proxy error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 502 }
    )
  } finally {
    inFlight.delete(cacheKey)
  }
}

