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

  // Xóa toàn bộ menu cũ
  const existing = await apiFetch(token, '/api/cms-kit-admin/menu-items')
  if (Array.isArray(existing)) {
    for (const item of existing) {
      await apiFetch(token, `/api/cms-kit-admin/menu-items/${item.id}`, 'DELETE')
    }
    results.push(`🗑️ Đã xóa ${existing.length} menu cũ`)
  }

  const create = (body: object) => apiFetch(token, '/api/cms-kit-admin/menu-items', 'POST', body)

  // Trang chủ
  await create({ displayName: 'Trang chủ', url: '/', order: 1, isActive: true, icon: 'home' })
  results.push('✅ Trang chủ')

  // Giới thiệu
  const gt = await create({ displayName: 'Giới thiệu', url: '#', order: 2, isActive: true, icon: 'info' })
  results.push('✅ Giới thiệu')
  await create({ displayName: 'Về chúng tôi', url: '/gioi-thieu/ve-chung-toi', parentId: gt.id, order: 1, isActive: true, icon: 'info' })
  await create({ displayName: 'Đội ngũ bác sĩ', url: '/bac-si', parentId: gt.id, order: 2, isActive: true, icon: 'stethoscope' })

  // Kiến thức
  const kt = await create({ displayName: 'Kiến thức', url: '#', order: 3, isActive: true, icon: 'book-open' })
  results.push('✅ Kiến thức')
  await create({ displayName: 'Sản khoa', url: '/blog/san-khoa', parentId: kt.id, order: 1, isActive: true, icon: 'baby' })
  await create({ displayName: 'Phụ khoa', url: '/blog/phu-khoa', parentId: kt.id, order: 2, isActive: true, icon: 'stethoscope' })
  await create({ displayName: 'Sơ sinh', url: '/blog/so-sinh', parentId: kt.id, order: 3, isActive: true, icon: 'baby' })

  // Tin tức
  const tt = await create({ displayName: 'Tin tức', url: '#', order: 4, isActive: true, icon: 'book-open' })
  results.push('✅ Tin tức')
  await create({ displayName: 'Tin chuyên ngành', url: '/blog/tin-chuyen-nghanh', parentId: tt.id, order: 1, isActive: true, icon: 'book' })
  await create({ displayName: 'Tin quốc tế', url: '/blog/tin-quoc-te', parentId: tt.id, order: 2, isActive: true, icon: 'microscope' })

  // Tư vấn
  await create({ displayName: 'Tư vấn', url: '/tu-van', order: 5, isActive: true, icon: 'message-circle' })
  results.push('✅ Tư vấn')

  // Dịch vụ
  await create({ displayName: 'Dịch vụ', url: '/dich-vu', order: 6, isActive: true, icon: 'briefcase-medical' })
  results.push('✅ Dịch vụ')

  // Liên hệ
  await create({ displayName: 'Liên hệ', url: '/lien-he', order: 7, isActive: true, icon: 'phone' })
  results.push('✅ Liên hệ')

  return NextResponse.json({ success: true, created: results })
}
