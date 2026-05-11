export const STORAGE_KEY = 'cms-media-library'
export const BANNER_STORAGE_KEY = 'cms-banner-media'
export const GALLERY_STORAGE_KEY = 'cms-gallery-media'

export function ls<T>(key: string): T[] {
  try {
    const r = localStorage.getItem(key)
    return r ? JSON.parse(r) : []
  } catch {
    return []
  }
}

export function lsSave<T>(key: string, v: T[]) {
  localStorage.setItem(key, JSON.stringify(v))
}

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/** Giải mã shortDescription: `{order}|{imageUrl}|{caption}` hoặc `{imageUrl}|{caption}` (cũ) */
export function parseShortDesc(raw: string | null | undefined, coverMediaId?: string | null) {
  const r = raw ?? ''
  const parts = r.split('|')
  const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
  const order = firstIsOrder ? parseInt(parts[0]) : 99
  const rest = firstIsOrder ? parts.slice(1).join('|') : r
  const sepIdx = rest.indexOf('|')
  const hasCover = sepIdx > 0 && (rest.startsWith('http') || rest.startsWith('/api/'))
  const imageUrl = hasCover
    ? rest.slice(0, sepIdx)
    : coverMediaId
    ? `/api/cms-kit/media/${coverMediaId}`
    : ''
  const caption = hasCover ? rest.slice(sepIdx + 1) : rest
  return { order, imageUrl, caption }
}

/** Tạo shortDescription mới từ các thành phần */
export function buildShortDesc(order: number, imageUrl: string, caption: string) {
  const pad = String(order).padStart(2, '0')
  return `${pad}|${imageUrl}|${caption}`
}
