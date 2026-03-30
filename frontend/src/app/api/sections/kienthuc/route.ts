import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const [sanKhoa, phuKhoa, soSinh] = await Promise.all([
    fetchBlogPosts('san-khoa', 4),
    fetchBlogPosts('phu-khoa', 4),
    fetchBlogPosts('so-sinh', 4),
  ])
  return NextResponse.json({ sanKhoa, phuKhoa, soSinh })
}
