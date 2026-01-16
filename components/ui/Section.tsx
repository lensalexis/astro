import Link from 'next/link'
import type { ReactNode } from 'react'

export default function Section({
  title,
  href,
  children,
}: {
  title: string
  href?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-950">{title}</h2>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

