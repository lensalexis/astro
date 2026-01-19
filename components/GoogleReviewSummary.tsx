'use client'

import { useEffect, useState } from 'react'

export default function GoogleReviewSummary() {
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

  const avatars = reviews.slice(0, 5)

  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-white/40 backdrop-blur-md px-4 py-2 shadow-sm ring-1 ring-white/40 w-fit">
      {/* ✅ Avatars from Google reviewers */}
      <div className="flex -space-x-2">
        {avatars.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full bg-gray-100/70"
              />
            ))
          : avatars.map((r, i) => (
              <img
                key={i}
                src={r.profile_photo_url || '/images/google-g.svg'}
                alt={r.author_name || 'Reviewer'}
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
      </div>

      {/* ✅ Text + Stars */}
      <div className="flex items-center gap-2 text-sm sm:text-base">
        {/* <span className="font-semibold text-gray-900">Excellent</span> */}
        <img src="/images/google-g.svg" alt="Google" className="w-5 h-5" />
        <span className="text-yellow-500">★</span>
        {rating && (
          <span className="text-[color:oklch(0.93_0_0)]">
            {rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  )
}