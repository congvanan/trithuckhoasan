import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const [chuyenNganh, quocTe] = await Promise.all([
    fetchBlogPosts('tin-chuyen-nghanh', 4),
    fetchBlogPosts('tin-quoc-te', 4),
  ])
  return NextResponse.json({ chuyenNganh, quocTe })
}
