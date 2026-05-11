/**
 * Parse cover image URL and description from shortDescription field.
 *
 * shortDescription format (các trường hợp có thể có):
 *   1. "https://...url...|Mô tả bài viết"
 *   2. "123|https://...url...|Mô tả bài viết"  (có order prefix là số)
 *   3. "/api/cms-kit/media/xxx|Mô tả bài viết"
 *   4. "Mô tả bài viết thuần tuý" (không có ảnh)
 */
export function parseCoverImage(post: {
  shortDescription?: string | null
  coverImageMediaId?: string | null
}): { imageUrl: string; description: string } {
  const raw = post.shortDescription ?? ''
  const parts = raw.split('|')

  // Bỏ order prefix nếu phần đầu là số nguyên
  const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
  const rest = firstIsOrder ? parts.slice(1).join('|') : raw

  const sepIdx = rest.indexOf('|')
  const hasCover = sepIdx > 0 && (rest.startsWith('http') || rest.startsWith('/api/'))

  const imageUrl = hasCover
    ? rest.slice(0, sepIdx)
    : post.coverImageMediaId
    ? `/api/cms-kit/media/${post.coverImageMediaId}`
    : ''

  const description = hasCover ? rest.slice(sepIdx + 1) : rest

  return { imageUrl, description }
}
