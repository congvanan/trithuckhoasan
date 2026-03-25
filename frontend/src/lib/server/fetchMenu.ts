import type { MenuItemDto } from '@/client/types.gen'

/** Fetch menu items server-side với cache 60s (ISR) */
export async function fetchMenuItems(): Promise<MenuItemDto[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return []
  try {
    const res = await fetch(`${baseUrl}/api/cms-kit-public/menu-items`, {
      next: { revalidate: 60 }, // cache 60 giây, tự làm mới nền
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
