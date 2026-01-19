'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [rating, setRating] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState<number | null>(null)
  const [swiper, setSwiper] = useState<any>(null)

  useEffect(() => {
    async function fetchReviews() {
      const res = await fetch(`/api/google-reviews`)
      const data = await res.json()
      setReviews(data.result.reviews || [])
      setRating(data.result.rating || null)
      setTotalReviews(data.result.user_ratings_total || null)
    }
    fetchReviews()
  }, [])

  const avatars = reviews.slice(0, 5)

  return (
    <div className="space-y-3">
      {/* Banner summary with avatars + rating */}
      <div className="flex flex-wrap items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/5">
        <div className="flex -space-x-2">
          {avatars.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-gray-100 ring-2 ring-white"
                />
              ))
            : avatars.map((r, i) => (
                <img
                  key={i}
                  src={r.profile_photo_url || '/images/google-g.svg'}
                  alt={r.author_name || 'Reviewer'}
                  className="h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
        </div>
        <div className="flex items-center gap-1 text-base font-semibold text-gray-900">
          <img src="/images/google-g.svg" alt="Google" className="h-5 w-5" />
          {rating ? rating.toFixed(1) : '—'}
          <span className="text-amber-500">★</span>
          {totalReviews ? `· ${totalReviews.toLocaleString()} reviews` : ''}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet</p>
      ) : (
        <div className="relative">
          {/* Arrows */}
          <button
            onClick={() => swiper?.slidePrev()}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-white rounded-full shadow-md w-10 h-10 ring-1 ring-black/5 hover:bg-gray-100 transition-colors"
            aria-label="Previous reviews"
          >
            ‹
          </button>
          <button
            onClick={() => swiper?.slideNext()}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 items-center justify-center bg-white rounded-full shadow-md w-10 h-10 ring-1 ring-black/5 hover:bg-gray-100 transition-colors"
            aria-label="Next reviews"
          >
            ›
          </button>

        <Swiper
          modules={[Autoplay, Navigation]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
          spaceBetween={16}
          slidesPerView={1.05}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 18 },
          }}
          onSwiper={setSwiper}
        >
          {reviews.map((r, i) => (
            <SwiperSlide key={i}>
              <div className="h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {r.profile_photo_url ? (
                    <img
                      src={r.profile_photo_url}
                      alt={r.author_name}
                      className="h-10 w-10 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 ring-1 ring-black/5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      {r.author_name}
                      <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                    </p>
                    <p className="text-xs text-gray-500">{r.relative_time_description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-500 text-sm">
                  {Array.from({ length: r.rating ?? 0 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>

                <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        </div>
      )}
    </div>
  )
}