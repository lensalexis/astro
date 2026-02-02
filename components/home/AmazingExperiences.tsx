'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrophyIcon, ChartBarIcon, ArrowUpIcon, PlayIcon, DocumentPlusIcon } from '@heroicons/react/24/outline'
import { stores } from '@/lib/stores'

// Default store hours
const defaultHours = [
  { day: 'Monday', hours: '9:00 AM - 8:00 PM' },
  { day: 'Tuesday', hours: '9:00 AM - 8:00 PM' },
  { day: 'Wednesday', hours: '9:00 AM - 8:00 PM' },
  { day: 'Thursday', hours: '9:00 AM - 8:00 PM' },
  { day: 'Friday', hours: '9:00 AM - 9:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 9:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 7:00 PM' },
]

export default function AmazingExperiences() {
  const [reviews, setReviews] = useState<any[]>([])
  const [rating, setRating] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState<number | null>(null)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/google-reviews')
        const data = await res.json()
        setReviews(data.result?.reviews || [])
        setRating(data.result?.rating || null)
        setTotalReviews(data.result?.user_ratings_total || null)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }
    fetchReviews()
  }, [])

  const store = stores[0]
  const sampleReview = reviews.find(r => r.rating >= 4) || reviews[0] || null

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-950">
            Amazing experiences (without the guesswork)
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Left Card - Longer/Horizontal (No overall link) */}
        <div className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 md:col-span-2">
          {/* Background Image */}
          <div className="relative h-[320px] w-full">
            <Image
              src="/images/post-thumb-12.jpg"
              alt="Resource Library"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 66vw, 100vw"
            />

            {/* Review Badge - Top Left (Clickable) */}
            {sampleReview && (
              <Link
                href="/reviews"
                className="absolute left-4 top-4 inline-flex max-w-[280px] items-start gap-2 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/10 transition hover:shadow-xl"
              >
                <span className="text-lg">❤️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-900 line-clamp-2">
                    {sampleReview.text?.slice(0, 80)}...
                  </div>
                </div>
              </Link>
            )}

            {/* Ranked #1 Badge - Middle Left (with Trophy) */}
            <div className="absolute bottom-28 left-4 inline-flex items-center gap-1.5 rounded-2xl bg-amber-50/95 px-4 py-2.5 shadow-lg ring-1 ring-amber-200/50 backdrop-blur-sm">
              <TrophyIcon className="h-4 w-4 text-amber-600" />
              <div className="text-xs font-semibold text-amber-900">Ranked #1 Dispensary in Bergen County</div>
            </div>

            {/* Search the menu Badge - Middle Right */}
            <Link
              href="/shop/all"
              className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-black/10 transition hover:shadow-xl"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                <ChartBarIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Search the menu</span>
            </Link>

            {/* Google Reviews Badge - Bottom Left */}
            {rating && totalReviews && (
              <Link
                href="/reviews"
                className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-black/10 transition hover:shadow-xl"
              >
                <img src="/images/google-g.svg" alt="Google" className="h-5 w-5" />
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-900">
                  {rating.toFixed(1)} · {totalReviews.toLocaleString()} reviews
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Card - Analytics Style */}
        <div className="group relative overflow-hidden rounded-3xl bg-[#8B4513] shadow-sm ring-1 ring-black/5">
          {/* Dark Top Section */}
          <div className="px-5 py-4">
            <div className="text-lg font-extrabold text-white">Get Analytics Over all Products</div>
          </div>

          {/* White Inner Card */}
          <div className="bg-white p-5">
            {/* Product Visits Header */}
            <div className="mb-3 flex items-center gap-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-black/5">
                <Image
                  src="/images/post-thumb-05.jpg"
                  alt="Product"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div className="text-sm font-semibold text-gray-900">Product visits</div>
            </div>

            {/* Contextual Filters (Badges/Pills) */}
            <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
              <span>on</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 ring-1 ring-black/5">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Shop all
              </span>
              <span>in</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 ring-1 ring-black/5">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Maywood, NJ
              </span>
            </div>

            {/* Analytics Statistics */}
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">104,887</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <ChartBarIcon className="h-3.5 w-3.5" />
                  <span>Product Views</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">3,216</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                  <span>Product conversion</span>
                </div>
              </div>
            </div>

            {/* Store Hours */}
            <div className="mb-4">
              <div className="mb-2 text-sm font-semibold text-gray-900">Store Hours</div>
              <div className="space-y-1 text-xs text-gray-600">
                {defaultHours.map((h) => (
                  <div key={h.day} className="flex justify-between">
                    <span>{h.day}:</span>
                    <span className="font-medium">{h.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link
                href="/shop/all"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                <span>Session replay</span>
              </Link>
              <Link
                href="/hours"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                <DocumentPlusIcon className="h-3.5 w-3.5" />
                <span>View Hours</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
