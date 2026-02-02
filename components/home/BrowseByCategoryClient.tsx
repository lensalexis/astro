'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

export type CategoryItem = {
  title: string
  slug: string
  href: string
  image: string
}

export default function BrowseByCategoryClient({
  items,
}: {
  items: CategoryItem[]
}) {
  const router = useRouter()

  const handleCategoryClick = (item: CategoryItem) => {
    router.push(item.href)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <button
          key={item.href + item.title}
          type="button"
          onClick={() => handleCategoryClick(item)}
          className="group flex items-center gap-3 w-full rounded-full bg-white/95 border border-gray-200/80 shadow-sm hover:shadow-md hover:border-gray-300/80 hover:bg-white transition-all text-left px-1 py-1.5 sm:px-1.5 sm:py-2"
        >
          {/* Circular area: existing category image */}
          <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-gray-100 bg-gray-50 ring-1 ring-black/5">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-[1.05]"
              sizes="56px"
            />
          </div>
          {/* Category name */}
          <span className="flex-1 min-w-0 truncate text-sm sm:text-base font-semibold text-gray-900 pr-3">
            {item.title}
          </span>
        </button>
      ))}
    </div>
  )
}
