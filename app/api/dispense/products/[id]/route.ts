import { NextResponse } from 'next/server'
import productService from '@/lib/productService'

const venueIdFromEnv = () =>
  process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 240
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

export async function GET(req: Request, ctx: { params: { id: string } }) {
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

  const id = ctx.params.id
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  try {
    const product = await productService.getById(
      { id, venueId },
      { next: { revalidate: 30, tags: ['dispense:product'] } }
    )
    return NextResponse.json(product, {
      headers: {
        'cache-control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (err: any) {
    console.error('Dispense product getById proxy error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 502 }
    )
  }
}

