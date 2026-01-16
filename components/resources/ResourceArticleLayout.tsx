'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

type TocItem = { id: string; title: string }

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function getNavbarOffsetPx() {
  // SiteChrome uses `top-[72px]` for mobile flyouts, implying a 72px navbar height.
  return 72
}

export default function ResourceArticleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const articleRef = useRef<HTMLElement | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  const topOffset = useMemo(() => getNavbarOffsetPx(), [])

  useEffect(() => {
    const el = articleRef.current
    if (!el) return

    // 1) Hide the in-article Table of Contents block (so we don't show it twice).
    const h2s = Array.from(el.querySelectorAll('h2'))
    const tocHeading = h2s.find((h) => (h.textContent || '').trim().toLowerCase() === 'table of contents')
    if (tocHeading) {
      let node: Element | null = tocHeading
      while (node) {
        const next = node.nextElementSibling
        ;(node as HTMLElement).style.display = 'none'
        if (next && next.tagName.toLowerCase() === 'h2') break
        node = next
      }
    }

    // 2) Build ToC from H2 headings (exclude the ToC heading itself).
    const items: TocItem[] = []
    const used = new Map<string, number>()
    for (const h of h2s) {
      const text = (h.textContent || '').trim()
      if (!text) continue
      if (text.toLowerCase() === 'table of contents') continue

      // Ensure stable/unique id
      const base = slugify(text) || 'section'
      const n = (used.get(base) || 0) + 1
      used.set(base, n)
      const id = n === 1 ? base : `${base}-${n}`

      if (!h.id) h.id = id
      // prevent navbar overlap when jumping
      ;(h as HTMLElement).style.scrollMarginTop = `${topOffset + 16}px`

      items.push({ id: h.id, title: text })
    }
    setToc(items)
    setActiveId(items[0]?.id || null)
  }, [topOffset])

  useEffect(() => {
    const el = articleRef.current
    if (!el) return

    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const pageY = window.scrollY || window.pageYOffset
        const articleTop = pageY + rect.top
        const articleHeight = el.scrollHeight
        const viewport = window.innerHeight

        const start = articleTop - topOffset
        const end = articleTop + articleHeight - viewport
        const raw = end <= start ? 1 : (pageY - start) / (end - start)
        const pct = Math.max(0, Math.min(1, raw))
        setProgress(pct)

        // Active section (scrollspy)
        const headings = Array.from(el.querySelectorAll('h2'))
        const threshold = topOffset + 20
        let current: string | null = null
        for (const h of headings) {
          const r = (h as HTMLElement).getBoundingClientRect()
          if (r.top - threshold <= 0) current = (h as HTMLElement).id || current
        }
        if (current) setActiveId(current)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll as any)
      window.removeEventListener('resize', onScroll as any)
    }
  }, [topOffset])

  return (
    <>
      {/* Reading progress bar (below fixed navbar) */}
      <div
        aria-hidden="true"
        className="fixed left-0 right-0 z-[79] h-[3px] bg-transparent"
        style={{ top: `${topOffset}px` }}
      >
        <div
          className="h-full bg-emerald-700"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main */}
        <main className="min-w-0 lg:col-span-9">
          {/* Mobile TOC dropdown */}
          {toc.length ? (
            <div className="lg:hidden mb-4">
              <button
                type="button"
                onClick={() => setMobileTocOpen((v) => !v)}
                className="inline-flex w-full items-center justify-between rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-900"
              >
                <span>On this page</span>
                <ChevronDownIcon className={['h-5 w-5 transition', mobileTocOpen ? 'rotate-180' : ''].join(' ')} />
              </button>
              {mobileTocOpen ? (
                <div className="mt-2 rounded-lg border border-black/10 bg-white p-3">
                  <ul className="space-y-2">
                    {toc.map((t) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          onClick={() => setMobileTocOpen(false)}
                          className="block text-sm font-semibold text-gray-700 hover:text-gray-900"
                        >
                          {t.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <article ref={articleRef as any} className="min-w-0">
            {children}
          </article>
        </main>

        {/* Right sticky TOC */}
        <aside className="hidden lg:block min-w-0 lg:col-span-3">
          <div className="sticky space-y-3" style={{ top: `${topOffset + 20}px` }}>
            <div className="text-sm font-semibold text-gray-900">On this page</div>
            <nav aria-label="Table of contents" className="text-sm">
              <ul className="space-y-2">
                {toc.map((t) => {
                  const active = t.id === activeId
                  return (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className={[
                          'block border-l-2 pl-3 transition',
                          active
                            ? 'border-emerald-700 text-gray-950 font-semibold'
                            : 'border-transparent text-gray-600 hover:text-gray-900',
                        ].join(' ')}
                      >
                        {t.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="text-xs text-gray-500">
              <Link href="#top" className="hover:text-gray-900">
                Back to top
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

