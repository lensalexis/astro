import { NextResponse } from 'next/server'
import { stores, about } from '@/lib/stores'

type Body = {
  userMessage?: string
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
  concise?: boolean
  requestId?: string
}

const RATE_WINDOW_MS = 60_000
const RATE_MAX = 30
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function POST(req: Request) {
  if (!rateLimit(req).ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'retry-after': '2' } }
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 }
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const userMessage = (body.userMessage || '').trim()
  if (!userMessage) {
    return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
  }

  const concise = !!body.concise
  const systemPrompt = concise
    ? `You are a helpful assistant for a cannabis dispensary called "Just A Little Higher" (JALH) in New York. Provide concise, educational answers (2-4 sentences maximum). Be friendly, knowledgeable, and compliant with cannabis regulations. Keep responses brief and to the point.

About JALH: ${about.summary}

Available Locations:
${stores
  .map(
    (s) =>
      `- ${s.name}: ${
        s.address || `${s.addressLine1}, ${s.addressLine2}`
      }${s.status === 'coming_soon' ? ' (Coming Soon)' : ''}${
        s.phone ? ` | Phone: ${s.phone}` : ''
      }${s.hoursDisplay ? ` | Hours: ${s.hoursDisplay}` : ''}`
  )
  .join('\n')}

If asked about specific products, you can mention that the customer can search for them using the product search feature. If asked about store locations, hours, or contact info, provide accurate information from the list above.`
    : `You are a helpful assistant for a cannabis dispensary called "Just A Little Higher" (JALH) in New York. You help customers with questions about cannabis products, effects, usage, and general information. Be friendly, knowledgeable, and compliant with cannabis regulations.

About JALH: ${about.summary}

Available Locations:
${stores
  .map(
    (s) =>
      `- ${s.name}: ${
        s.address || `${s.addressLine1}, ${s.addressLine2}`
      }${s.status === 'coming_soon' ? ' (Coming Soon)' : ''}${
        s.phone ? ` | Phone: ${s.phone}` : ''
      }${s.hoursDisplay ? ` | Hours: ${s.hoursDisplay}` : ''}`
  )
  .join('\n')}

If asked about specific products, you can mention that the customer can search for them using the product search feature. If asked about store locations, hours, or contact info, provide accurate information from the list above.`

  const priorMessages =
    Array.isArray(body.messages) && body.messages.length
      ? body.messages
          .slice(-12)
          .map((m) => ({
            role: m.role,
            content: String(m.content || '').slice(0, 2000),
          }))
          .filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content.trim())
      : []

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...priorMessages,
      { role: 'user', content: userMessage },
    ],
    temperature: concise ? 0.4 : 0.6,
    max_tokens: concise ? 160 : 420,
  }

  const maxRetries = 2
  let attempt = 0

  while (true) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      const data = (await res.json()) as any
      const content = data?.choices?.[0]?.message?.content?.trim?.() || ''
      return NextResponse.json({ content })
    }

    // Backoff on 429/5xx
    if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
      attempt += 1
      const retryAfter = res.headers.get('retry-after')
      const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : NaN
      const base = Number.isFinite(retryAfterMs) ? retryAfterMs : 600 * Math.pow(2, attempt - 1)
      await sleep(base + Math.floor(Math.random() * 250))
      continue
    }

    const errorText = await res.text().catch(() => '')
    console.error('OpenAI error', {
      requestId: body.requestId,
      status: res.status,
      errorText,
    })
    return NextResponse.json(
      { error: 'AI request failed' },
      { status: 502 }
    )
  }
}

