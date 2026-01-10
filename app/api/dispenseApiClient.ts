import 'server-only'
import DispenseError from './dispenseError'

type RequestMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH'

export type RequestOptions = Pick<RequestInit, 'signal'> & {
  cache?: RequestCache
  next?: {
    revalidate?: number
    tags?: string[]
  }
}

type RequestConfig = Omit<RequestInit, 'body'> & {
  headers?: Headers
  method: RequestMethod
  params?: Record<string, any>
  body?: Record<string, any>
} & RequestOptions

const DISPENSE_BASE_URL =
  process.env.DISPENSE_BASE_URL ?? process.env.NEXT_PUBLIC_DISPENSE_BASE_URL
const DISPENSE_API_KEY =
  process.env.DISPENSE_API_KEY ?? process.env.NEXT_PUBLIC_DISPENSE_API_KEY

// Coalesce identical in-flight GETs (server-side spike protection).
const inFlightGetRequests = new Map<string, Promise<unknown>>()

export async function request<T extends any>({
  method,
  path,
  options,
}: {
  method: RequestMethod
  path: string | URL
  options?: Omit<RequestConfig, 'method'>
}): Promise<T> {
  options = options ?? {}

  const url = new URL(
    joinUrl(
      DISPENSE_BASE_URL!,
      (path as URL)?.toString() ?? path
    )
  )

  if (process.env.NODE_ENV !== 'production') {
    console.log('URL', url.toString())
  }

  Object.keys(options.params ?? {}).forEach((key) => {
    const value = options?.params?.[key]

    if (value) {
      if (Array.isArray(value)) {
        value.forEach((subValue) => {
          url.searchParams.append(key, subValue)
        })
      } else {
        url.searchParams.append(key, `${value}`)
      }
    }
  })

  const headers = new Headers(options.headers)
  headers.append('content-type', 'application/json')
  if (!DISPENSE_API_KEY) {
    throw new Error('Dispense API key is not configured (DISPENSE_API_KEY).')
  }
  headers.append('x-dispense-api-key', DISPENSE_API_KEY)

  const config: {
    headers: Headers
    method: RequestMethod
  } = { ...options, headers, method }

  let body = undefined

  if (options.body) {
    body = JSON.stringify(options.body)
  }

  // Next.js (prod) will cache server-side GET fetches by default unless told not to.
  // Local dev appears "fresh" which can make prod look like it's missing updates.
  // Default to no-store unless the caller explicitly opts into caching via `next.revalidate`
  // or sets a `cache` policy themselves.
  const cache: RequestCache | undefined =
    options.cache ??
    (method === 'GET' && options.next?.revalidate === undefined ? 'no-store' : undefined)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const maxRetries = 2
  let attempt = 0
  let response: Response

  const doFetch = async () => {
    while (true) {
      response = await fetch(url, {
        ...config,
        cache,
        body,
      })

      if (response.ok) break

      if (response.status === 429 && attempt < maxRetries) {
        attempt += 1
        const retryAfter = response.headers.get('retry-after')
        const retryAfterMs = retryAfter
          ? Number.parseInt(retryAfter, 10) * 1000
          : NaN
        const base = Number.isFinite(retryAfterMs)
          ? retryAfterMs
          : 500 * Math.pow(2, attempt - 1)
        const jitter = Math.floor(Math.random() * 250)
        await sleep(base + jitter)
        continue
      }

      break
    }

    return response!
  }

  // Only coalesce GETs without a caller-provided AbortSignal (signals shouldn't cancel shared work).
  const isCoalescableGet = method === 'GET' && !options.signal
  const inFlightKey = isCoalescableGet ? `${method}:${url.toString()}` : null
  if (inFlightKey && inFlightGetRequests.has(inFlightKey)) {
    return (await inFlightGetRequests.get(inFlightKey)!) as T
  }

  const run = async () => {
    const res = await doFetch()
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests, please try again later.')
      }
      const responseBody = await res.json().catch(() => null)
      throw new DispenseError(
        getErrorFromApiResponse(responseBody)?.message ??
          getErrorFromApiResponse(responseBody) ??
          'Error',
        res.status
      )
    }

    const responseBody = res.status === 204 ? {} : await res.json()
    return responseBody as T
  }

  const promise = run()
  if (inFlightKey) inFlightGetRequests.set(inFlightKey, promise as Promise<unknown>)
  try {
    return await promise
  } finally {
    if (inFlightKey) inFlightGetRequests.delete(inFlightKey)
  }

  /* istanbul ignore next */
  if (!response.ok) {
    const responseBody = await response.json()

    throw new DispenseError(
      getErrorFromApiResponse(responseBody)?.message ?? 'Error',
      response.status
    )
  }

  /* istanbul ignore next */
  const responseBody = response.status === 204 ? {} : await response.json()
  /* istanbul ignore next */
  return responseBody as Promise<T>
}

function getErrorFromApiResponse(response: any) {
  if (!response) return null

  if (process.env.NODE_ENV !== 'production') {
    console.log(response)
  }

  if (response.errors && response.errors.length)
    return response.errors[0].message || response.errors[0]

  return 'Error'
}

function joinUrl(...parts: string[]): string {
  return parts
    .map((p) => {
      if (!p) return ''
      return p.replace(/(^\/|\/$)/g, '')
    })
    .join('/')
}
