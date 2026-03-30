import type { MenuItemDto } from '@/client/types.gen'

/** Fetch menu items server-side: no-store trong dev, cache 60s trong prod */
export async function fetchMenuItems(): Promise<MenuItemDto[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return []
  try {
    const res = await fetch(`${baseUrl}/api/cms-kit-public/menu-items`, {
      signal: AbortSignal.timeout(5000),
      next: process.env.NODE_ENV === 'development'
        ? { revalidate: 5 }
        : { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}
