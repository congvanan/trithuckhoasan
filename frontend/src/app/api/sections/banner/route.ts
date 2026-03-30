import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const posts = await fetchBlogPosts('banner-slide', 10)
  return NextResponse.json(posts)
}
