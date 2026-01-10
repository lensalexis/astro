import { NextResponse } from 'next/server'

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

  const baseUrl =
    process.env.DISPENSE_BASE_URL ??
    process.env.NEXT_PUBLIC_DISPENSE_BASE_URL ??
    'https://api.dispenseapp.com/2023-03'
  const orgApiKey = process.env.DISPENSE_ORG_API_KEY
  if (!orgApiKey) {
    return NextResponse.json(
      { error: 'DISPENSE_ORG_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const { id } = ctx.params
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const res = await fetch(`${baseUrl}/carts/${encodeURIComponent(id)}`, {
    headers: {
      'x-dispense-api-key': orgApiKey,
    },
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    return NextResponse.json(
      { error: 'Failed to fetch cart', details: errorText },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json(data, {
    headers: {
      'cache-control': 'private, max-age=0, no-store',
    },
  })
}

