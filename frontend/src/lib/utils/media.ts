/**
 * Build URL for ABP CmsKit media by mediaId.
 * Images are stored in ABP backend blob storage, not in the frontend repo.
 *
 * Usage:
 *   getMediaUrl('uuid-of-media')
 *   → '/api/cms-kit-public/media/uuid-of-media'
 */
export function getMediaUrl(mediaId: string | null | undefined): string | null {
  if (!mediaId) return null
  // Thêm ?v=mediaId để bust cache mỗi khi mediaId thay đổi
  return `/api/cms-kit/media/${mediaId}?v=${mediaId.slice(0, 8)}`
}

/**
 * Fallback avatar URL using ui-avatars when no image is available.
 */
export function getAvatarFallback(name: string, size = 96): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0f2fe&color=0369a1&size=${size}`
}
