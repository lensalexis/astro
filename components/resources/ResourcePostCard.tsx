import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRightIcon } from '@heroicons/react/24/outline'

type Props = {
  href: string
  title: string
  date?: string
  categoryLabel?: string
  imageSrc: string
}

export default function ResourcePostCard({ href, title, date, categoryLabel, imageSrc }: Props) {
  const dateLabel = date
    ? new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : null

  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-2xl bg-white"
    >
      <div className="relative h-56 overflow-hidden rounded-t-2xl">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 33vw, 50vw"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {categoryLabel || 'Resources'}
          </div>
          <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-gray-900" />
        </div>

        <div className="mt-2 text-lg font-extrabold tracking-tight text-gray-950 line-clamp-2">
          {title}
        </div>

        {dateLabel ? (
          <div className="mt-3 text-xs font-semibold text-gray-500">{dateLabel}</div>
        ) : null}
      </div>
    </Link>
  )
}

