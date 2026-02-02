'use client'

import { useEffect, useState } from 'react'

const HOURS_TEXT = '9am–9pm daily'
const TIMEZONE = 'America/New_York'
const OPEN_HOUR = 9
const CLOSE_HOUR = 21

function getIsOpenEastern(): boolean {
  if (typeof window === 'undefined') return true
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hour12: false,
  })
  const hour = parseInt(formatter.format(new Date()), 10)
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR
}

export default function StoreOpenBadge() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setIsOpen(getIsOpenEastern())
    const t = setInterval(() => setIsOpen(getIsOpenEastern()), 60_000)
    return () => clearInterval(t)
  }, [])

  if (isOpen === null) return null

  return (
    <div className="inline-flex items-center gap-2 sm:gap-3 rounded-full backdrop-blur-md px-4 py-1 shadow-sm ring-1 ring-white/40 w-fit">
      <span
        className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full shrink-0"
        style={{
          backgroundColor: isOpen ? 'oklch(0.65 0.2 145)' : 'oklch(0.55 0.22 25)',
          boxShadow: isOpen
            ? '0 0 8px oklch(0.7 0.2 145)'
            : '0 0 6px oklch(0.6 0.2 25)',
        }}
        aria-hidden
      />
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-sm sm:text-base font-semibold text-white leading-tight">
          {isOpen ? 'Now Open' : 'Closed'}
        </span>
        <span className="text-[11px] sm:text-xs text-white/80 leading-tight">
          {HOURS_TEXT}
        </span>
      </div>
    </div>
  )
}
