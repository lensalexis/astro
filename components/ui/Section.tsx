import type { ReactNode } from 'react'

export default function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-950">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

