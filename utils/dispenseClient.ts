export type DispenseProductsProxyResponse<T = any> = {
  data: T[]
  nextCursor?: string | null
}

type Params = Record<string, string | number | boolean | string[] | undefined | null>

function toSearchParams(params: Params) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      v.forEach((vv) => sp.append(k, String(vv)))
      return
    }
    sp.set(k, String(v))
  })
  return sp
}

export async function listDispenseProducts<T = any>(
  params: Params,
  opts?: { signal?: AbortSignal }
): Promise<DispenseProductsProxyResponse<T>> {
  const sp = toSearchParams(params)
  const res = await fetch(`/api/dispense/products?${sp.toString()}`, {
    method: 'GET',
    signal: opts?.signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = (await res.json().catch(() => null)) as any
      const msg = body?.error || body?.message
      if (msg) throw new Error(`Products request failed (${res.status}): ${msg}`)
    }
    const text = await res.text().catch(() => '')
    throw new Error(`Products request failed (${res.status}): ${text || 'Unknown error'}`)
  }
  return (await res.json()) as DispenseProductsProxyResponse<T>
}

export async function getDispenseProductById<T = any>(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(`/api/dispense/products/${encodeURIComponent(id)}`, {
    method: 'GET',
    signal: opts?.signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = (await res.json().catch(() => null)) as any
      const msg = body?.error || body?.message
      if (msg) throw new Error(`Product request failed (${res.status}): ${msg}`)
    }
    const text = await res.text().catch(() => '')
    throw new Error(`Product request failed (${res.status}): ${text || 'Unknown error'}`)
  }
  return (await res.json()) as T
}

