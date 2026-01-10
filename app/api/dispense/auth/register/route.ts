import { NextResponse } from 'next/server'

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 20
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
      { status: 429, headers: { 'retry-after': '3' } }
    )
  }

  const baseUrl =
    process.env.DISPENSE_BASE_URL ??
    process.env.NEXT_PUBLIC_DISPENSE_BASE_URL ??
    'https://api.dispenseapp.com/2023-03'
  const apiKey = process.env.DISPENSE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DISPENSE_API_KEY is not configured' },
      { status: 500 }
    )
  }

  const body = await req.text()
  const upstream = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-dispense-api-key': apiKey,
    },
    body,
  })

  const text = await upstream.text().catch(() => '')
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' },
  })
}

