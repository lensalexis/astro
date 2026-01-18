import { NextResponse } from 'next/server'
import { listResources } from '@/lib/resources'

export async function GET() {
  const items = await listResources()
  const posts = items.map((it) => ({
    slug: it.slug,
    title: it.metadata.title || it.slug,
    date: it.metadata.date || null,
    href: `/blog/${it.slug}`,
  }))
  return NextResponse.json({ posts })
}

