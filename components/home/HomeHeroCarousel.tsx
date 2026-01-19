'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { Swiper as SwiperClass } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

export type HomeHeroSlide = {
  src: string
  mobileSrc?: string
  alt?: string
}

export default function HomeHeroCarousel({
  slides,
  children,
}: {
  slides: HomeHeroSlide[]
  children: ReactNode
}) {
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <section className="relative w-full overflow-hidden">
      {/* Taller on mobile so headline + stacked search fit */}
      <div className="relative h-[640px] w-full md:h-[520px]">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          loop
          effect="fade"
          speed={650}
          autoplay={{ delay: 5500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          onSwiper={setSwiper}
          className="h-full w-full"
        >
          {slides.map((s, idx) => (
            <SwiperSlide key={`${s.src}-${idx}`}>
              <div className="relative h-full w-full">
                <Image
                  src={isMobile && s.mobileSrc ? s.mobileSrc : s.src}
                  alt={s.alt || ''}
                  fill
                  priority={idx === 0}
                  className="object-cover"
                  sizes="100vw"
                />
                {/* readability overlay (dark gradient so white hero text stays readable) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            </SwiperSlide>
          ))}

        </Swiper>

        {/* Nav buttons (outside Swiper so they always get clicks) */}
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => swiper?.slidePrev()}
          className="absolute left-4 top-1/2 z-50 hidden -translate-y-1/2 items-center justify-center bg-transparent p-2 text-white/90 hover:text-white sm:flex"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => swiper?.slideNext()}
          className="absolute right-4 top-1/2 z-50 hidden -translate-y-1/2 items-center justify-center bg-transparent p-2 text-white/90 hover:text-white sm:flex"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Foreground content */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto mx-auto h-full w-full max-w-6xl px-4 sm:px-6">
            {children}
          </div>
        </div>
      </div>

      {/* Tweak Swiper pagination to look like Klook dots */}
      <style jsx global>{`
        .swiper-pagination {
          bottom: 14px !important;
        }
        .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          opacity: 0.35;
          background: rgba(0, 0, 0, 0.65);
        }
        .swiper-pagination-bullet-active {
          opacity: 0.9;
          transform: scale(1.05);
        }
      `}</style>
    </section>
  )
}

