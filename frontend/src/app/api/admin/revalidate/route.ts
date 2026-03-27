import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { path } = await request.json()
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  revalidatePath(path)
  // Revalidate trang chủ luôn (hero section)
  revalidatePath('/')
  return NextResponse.json({ revalidated: true, path })
}
