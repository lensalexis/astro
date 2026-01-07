// app/api/google-reviews/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const placeId = process.env.GOOGLE_PLACE_ID
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`
  )
  const data = await res.json()

  return NextResponse.json(data)
}