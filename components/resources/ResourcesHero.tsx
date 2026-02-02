'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Crumb } from '@/lib/breadcrumbs'
import Breadcrumbs from '@/components/seo/Breadcrumbs'

const RESOURCES_HERO_IMAGE = '/images/herobanner2.jpg'
const RESOURCES_HERO_IMAGE_MOBILE = '/images/herobanner2-mobile.jpg'

export type ResourceCategoryTab = { label: string; href: string }

type Props = {
  breadcrumbCrumbs?: Crumb[]
  categoryTabs?: ResourceCategoryTab[]
}

export default function ResourcesHero({ breadcrumbCrumbs, categoryTabs }: Props) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative h-[380px] w-full sm:h-[440px] md:h-[520px]">
        {/* Still background image: desktop and mobile variants */}
        <div className="relative h-full w-full">
          <Image
            src={RESOURCES_HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover hidden sm:block"
            sizes="100vw"
          />
          <Image
            src={RESOURCES_HERO_IMAGE_MOBILE}
            alt=""
            fill
            priority
            className="object-cover sm:hidden"
            sizes="100vw"
          />
          {/* Readability overlay (same as homepage hero) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-black/10" />
        </div>

        {/* Foreground: breadcrumbs above title, title, subtitle, category pills below */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto mx-auto flex h-full w-full max-w-6xl flex-col justify-end px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-0">
            {breadcrumbCrumbs && breadcrumbCrumbs.length > 0 && (
              <div className="mb-3 -mt-2 sm:mb-4">
                <Breadcrumbs crumbs={breadcrumbCrumbs} variant="hero" />
              </div>
            )}
            <div className="flex flex-col items-start text-left gap-1 sm:gap-2">
              <h1 className="text-[30px] sm:text-5xl lg:text-[60px] font-extrabold tracking-tight text-white leading-tight">
                Resource Library
              </h1>
              <p className="max-w-3xl text-base sm:text-lg text-white/90 leading-snug">
              Your hub for cannabis education, product insights and everything Kine Buds.
              </p>
            </div>
            {categoryTabs && categoryTabs.length > 0 && (
              <div className="mt-5 sm:mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-visible scroll-smooth scrollbar-hide">
                <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 min-w-0">
                  {categoryTabs.map((tab) => (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className="shrink-0 inline-flex h-11 items-center rounded-full border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent whitespace-nowrap"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
