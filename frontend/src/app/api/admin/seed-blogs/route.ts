import { getSession } from '@/lib/actions'
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function apiFetch(token: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

const BLOGS_TO_CREATE = [
  { name: 'Sản khoa', slug: 'san-khoa' },
  { name: 'Phụ khoa', slug: 'phu-khoa' },
  { name: 'Sơ sinh', slug: 'so-sinh' },
  { name: 'Tin nổi bật', slug: 'tin-noi-bat' },
]

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.access_token) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const token = session.access_token
  const results: string[] = []

  // Lấy danh sách blog hiện có để tránh tạo trùng
  const existing = await apiFetch(token, '/api/cms-kit-admin/blogs?MaxResultCount=100')
  const existingSlugs = new Set((existing?.items ?? []).map((b: { slug: string }) => b.slug))

  for (const blog of BLOGS_TO_CREATE) {
    if (existingSlugs.has(blog.slug)) {
      results.push(`⏭️ "${blog.name}" (${blog.slug}) — đã tồn tại, bỏ qua`)
      continue
    }
    const created = await apiFetch(token, '/api/cms-kit-admin/blogs', 'POST', blog)
    if (created?.id) {
      results.push(`✅ Đã tạo "${blog.name}" (${blog.slug})`)
    } else {
      results.push(`❌ Lỗi tạo "${blog.name}"`)
    }
  }

  return NextResponse.json({ success: true, results })
}
