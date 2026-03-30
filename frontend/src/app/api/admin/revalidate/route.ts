import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { path } = await request.json()
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  revalidatePath(path)
  revalidatePath('/')
  // Xóa fetch cache của tất cả blog posts (homepage hero + NewsTabs + KienThucTabs)
  revalidateTag('blog-posts')
  return NextResponse.json({ revalidated: true, path })
}
