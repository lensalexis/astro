'use client'

import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [rating, setRating] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState<number | null>(null)

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

  return (
    <div className="mt-6">
      {/* ✅ Summary header with same bg as cards */}
      <div className="bg-[#f4f4f4] rounded-xl p-4 mb-4 flex items-center gap-3 shadow-sm">
        <img src="/images/google-g.svg" alt="Google" className="w-6 h-6" />
        <span className="font-semibold text-gray-900">Excellent</span>
        <div className="flex text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </div>
        {rating && totalReviews && (
          <span className="font-semibold text-gray-700">
            {rating.toFixed(1)} | {totalReviews} reviews
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet</p>
      ) : (
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={true}
          spaceBetween={20}
          slidesPerView={1} // ✅ Only one review at a time
        >
          {reviews.map((r, i) => (
            <SwiperSlide key={i}>
              <div className="bg-[#f4f4f4] rounded-xl p-5 shadow-sm flex flex-col h-full">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {r.profile_photo_url && (
                      <img
                        src={r.profile_photo_url}
                        alt={r.author_name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 flex items-center gap-1">
                        {r.author_name}
                        <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.relative_time_description}
                      </p>
                    </div>
                  </div>

                  {/* Google G */}
                  <img
                    src="/images/google-g.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                </div>

                {/* Stars */}
                <div className="mt-3 flex items-center text-yellow-500">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <span key={idx}>⭐</span>
                  ))}
                </div>

                {/* Review Text */}
                <p className="mt-3 text-gray-700 text-sm flex-1">{r.text}</p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  )
}