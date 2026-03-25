import type { BlogPostCommonDto } from '@/client/types.gen'

/** Fetch blog posts server-side với cache 60s */
export async function fetchBlogPosts(blogSlug: string, limit = 4): Promise<BlogPostCommonDto[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return []
  try {
    const url = `${baseUrl}/api/cms-kit-public/blog-posts/${blogSlug}?MaxResultCount=${limit}&SkipCount=0`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data?.items ?? []
  } catch {
    return []
  }
}
