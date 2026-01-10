import { NextResponse } from 'next/server'

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

export async function POST(req: Request) {
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

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body?.venueId || !body?.items || !Array.isArray(body.items)) {
    return NextResponse.json(
      { error: 'venueId and items are required' },
      { status: 400 }
    )
  }

  const res = await fetch(`${baseUrl}/carts`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dispense-api-key': orgApiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    return NextResponse.json(
      { error: 'Cart request failed', details: errorText },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}

