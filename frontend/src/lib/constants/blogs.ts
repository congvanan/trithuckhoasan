export const BLOG_SLUGS = [
  'tin-chuyen-nghanh',
  'tin-quoc-te',
  'banner-slide',
  'tin-noi-bat',
  'san-khoa',
  'phu-khoa',
  'so-sinh',
] as const

export type BlogSlug = (typeof BLOG_SLUGS)[number]

export const BLOG_LABELS: Record<string, string> = {
  'tin-chuyen-nghanh': 'Thông tin chuyên ngành',
  'tin-quoc-te': 'Tin quốc tế',
  'banner-slide': 'Sự Kiện',
  'tin-noi-bat': 'Tin nổi bật',
  'san-khoa': 'Sản khoa',
  'phu-khoa': 'Phụ khoa',
  'so-sinh': 'Sơ sinh',
}

export function getBlogLabel(slug: string): string {
  return BLOG_LABELS[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
