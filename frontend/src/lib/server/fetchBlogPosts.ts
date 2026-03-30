import type { BlogPostCommonDto } from '@/client/types.gen'

/** Fetch blog posts server-side với cache 60s */
export async function fetchBlogPosts(blogSlug: string, limit = 4): Promise<BlogPostCommonDto[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return []
  try {
    const url = `${baseUrl}/api/cms-kit-public/blog-posts/${blogSlug}?MaxResultCount=${limit}&SkipCount=0`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      next: process.env.NODE_ENV === 'development'
        ? { revalidate: 30, tags: ['blog-posts'] }
        : { revalidate: 60, tags: ['blog-posts'] },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data?.items ?? []
  } catch {
    return []
  }
}
