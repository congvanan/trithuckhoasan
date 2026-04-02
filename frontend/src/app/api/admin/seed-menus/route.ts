import { getSession } from '@/lib/actions'
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function apiFetch(token: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (method === 'DELETE') return null
  return res.json()
}

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn || !session.access_token) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  const token = session.access_token
  const results: string[] = []

  // Xóa toàn bộ menu cũ — children trước, parent sau
  const existingRes = await apiFetch(token, '/api/cms-kit-admin/menu-items')
  const existing: { id: string; parentId?: string }[] = Array.isArray(existingRes)
    ? existingRes
    : Array.isArray(existingRes?.items)
    ? existingRes.items
    : []
  const children = existing.filter((i) => i.parentId)
  const parents = existing.filter((i) => !i.parentId)
  for (const item of children) {
    await apiFetch(token, `/api/cms-kit-admin/menu-items/${item.id}`, 'DELETE')
  }
  for (const item of parents) {
    await apiFetch(token, `/api/cms-kit-admin/menu-items/${item.id}`, 'DELETE')
  }
  results.push(`🗑️ Đã xóa ${existing.length} menu cũ`)

  const create = (body: object) => apiFetch(token, '/api/cms-kit-admin/menu-items', 'POST', body)

  // 1. Trang chủ
  await create({ displayName: 'Trang chủ', url: '/', order: 1, isActive: true, icon: 'home' })
  results.push('✅ Trang chủ')

  // 2. Tin tức
  const tt = await create({ displayName: 'Tin tức', url: '#', order: 2, isActive: true, icon: 'newspaper' })
  results.push('✅ Tin tức')
  await create({ displayName: 'Tin chuyên ngành', url: '/blog/tin-chuyen-nghanh', parentId: tt.id, order: 1, isActive: true, icon: 'newspaper' })
  await create({ displayName: 'Tin quốc tế', url: '/blog/tin-quoc-te', parentId: tt.id, order: 2, isActive: true, icon: 'microscope' })
  await create({ displayName: 'Tin nổi bật', url: '/blog/tin-noi-bat', parentId: tt.id, order: 3, isActive: true, icon: 'newspaper' })

  // 3. Kiến thức
  const kt = await create({ displayName: 'Kiến thức', url: '#', order: 3, isActive: true, icon: 'book-open' })
  results.push('✅ Kiến thức')
  await create({ displayName: 'Sản khoa', url: '/blog/san-khoa', parentId: kt.id, order: 1, isActive: true, icon: 'baby' })
  await create({ displayName: 'Phụ khoa', url: '/blog/phu-khoa', parentId: kt.id, order: 2, isActive: true, icon: 'stethoscope' })
  await create({ displayName: 'Sơ sinh', url: '/blog/so-sinh', parentId: kt.id, order: 3, isActive: true, icon: 'baby' })

  // 4. Trí tuệ nhân tạo (AI) — chưa có URL, để # tạm
  const ai = await create({ displayName: 'Trí tuệ nhân tạo (AI)', url: '#', order: 4, isActive: true, icon: 'brain' })
  results.push('✅ Trí tuệ nhân tạo (AI)')
  await create({ displayName: 'Ứng dụng AI', url: '#', parentId: ai.id, order: 1, isActive: true, icon: 'brain' })
  await create({ displayName: 'Nghiên cứu AI', url: '#', parentId: ai.id, order: 2, isActive: true, icon: 'microscope' })

  // 5. Tài liệu — chưa có URL, để # tạm
  await create({ displayName: 'Tài liệu', url: '#', order: 5, isActive: true, icon: 'file-text' })
  results.push('✅ Tài liệu')

  // 6. Liên hệ
  await create({ displayName: 'Liên hệ', url: '/lien-he', order: 6, isActive: true, icon: 'phone' })
  results.push('✅ Liên hệ')

  return NextResponse.json({ success: true, created: results })
}
