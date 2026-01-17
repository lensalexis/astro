'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export type HomeStartHereItem = {
  title: string
  subtitle?: string
  href: string
  image: string
  badge?: string
}

type Mode = 'campaigns' | 'results'

function HorizontalRail({
  items,
  variant = 'card',
}: {
  items: HomeStartHereItem[]
  variant?: 'card' | 'banner'
}) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 pb-2">
        {items.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            className={[
              'group relative shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md',
              variant === 'banner' ? 'w-[320px] sm:w-[380px]' : 'w-[260px]',
            ].join(' ')}
          >
            <div className={['relative w-full', variant === 'banner' ? 'h-44' : 'h-40'].join(' ')}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes={variant === 'banner' ? '380px' : '260px'}
              />
              {item.badge ? (
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-black/5 backdrop-blur">
                  {item.badge}
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <div className="text-base font-bold text-gray-950 line-clamp-2">{item.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function HomeStartHereContent({
  items,
  resultsPortalId = 'home-start-here-results',
  variant = 'card',
}: {
  items: HomeStartHereItem[]
  resultsPortalId?: string
  variant?: 'card' | 'banner'
}) {
  const [mode, setMode] = useState<Mode>('campaigns')

  const eventName = useMemo(() => 'home:startHereMode', [])

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ mode?: Mode }>
      const next = ce?.detail?.mode
      if (next === 'results' || next === 'campaigns') setMode(next)
    }
    window.addEventListener(eventName, handler as EventListener)
    return () => window.removeEventListener(eventName, handler as EventListener)
  }, [eventName])

  return (
    <div className="relative">
      {/* Results slot (AIProductSearch portals into this) */}
      <div id={resultsPortalId} className={mode === 'results' ? '' : 'hidden'} />

      {/* Default campaigns */}
      <div className={mode === 'results' ? 'hidden' : ''}>
        <HorizontalRail items={items} variant={variant} />
      </div>
    </div>
  )
}

