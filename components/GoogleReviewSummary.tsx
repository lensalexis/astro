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

  return (
    <div className="flex items-center gap-3 bg-[#f4f4f46e] px-4 py-2 rounded-full shadow-sm">
      {/* ✅ Avatars from Google reviewers */}
      <div className="flex -space-x-2">
        {reviews.slice(0, 4).map((r, i) => (
          <img
            key={i}
            src={r.profile_photo_url}
            alt={r.author_name}
            className="w-8 h-8 rounded-full border-2 border-white"
          />
        ))}
      </div>

      {/* ✅ Text + Stars */}
      <div className="flex items-center gap-2 text-sm sm:text-base">
        {/* <span className="font-semibold text-gray-900">Excellent</span> */}
        <img src="/images/google-g.svg" alt="Google" className="w-5 h-5" />
        <span className="text-yellow-500">★</span>
        {rating && totalReviews && (
          <span className="text-gray-700">
            {rating.toFixed(1)} · {totalReviews} reviews
          </span>
        )}
      </div>
    </div>
  )
}