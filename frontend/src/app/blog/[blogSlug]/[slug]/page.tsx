import { DoctorSidebar } from '@/components/page/DoctorSidebar'
import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'

const BLOG_SLUGS = ['tin-chuyen-nghanh', 'tin-quoc-te', 'banner-slide', 'tin-noi-bat', 'san-khoa', 'phu-khoa', 'so-sinh']

export async function generateStaticParams() {
  const results = await Promise.all(
    BLOG_SLUGS.map(async (blogSlug) => {
      const posts = await fetchBlogPosts(blogSlug, 20)
      return posts.map((p) => ({ blogSlug, slug: p.slug ?? '' }))
    })
  )
  return results.flat().filter((p) => p.slug)
}

export const revalidate = 300 // 5 phút
import { Calendar, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function fetchPost(blogSlug: string, slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return null
  try {
    const res = await fetch(
      `${baseUrl}/api/cms-kit-public/blog-posts/${blogSlug}/${slug}`,
      {
        signal: AbortSignal.timeout(5000),
        next: process.env.NODE_ENV === 'development'
          ? { revalidate: 10, tags: ['blog-posts'] }
          : { revalidate: 300, tags: ['blog-posts'] },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ blogSlug: string; slug: string }>
}) {
  const { blogSlug, slug } = await params
  const post = await fetchPost(blogSlug, slug)

  if (!post) notFound()

  const rawDesc = post.shortDescription ?? ''
  const hasCoverInDesc = rawDesc.startsWith('http') && rawDesc.includes('|')
  const coverUrl = hasCoverInDesc
    ? rawDesc.split('|')[0]
    : post.coverImageMediaId
    ? `/api/cms-kit/media/${post.coverImageMediaId}`
    : null
  const descText = hasCoverInDesc ? rawDesc.slice(rawDesc.indexOf('|') + 1) : rawDesc

  const BLOG_LABELS: Record<string, string> = {
    'tin-chuyen-nghanh': 'Tin chuyên ngành',
    'tin-quoc-te': 'Tin quốc tế',
    'san-khoa': 'Sản khoa',
    'phu-khoa': 'Phụ khoa',
    'so-sinh': 'Sơ sinh',
    'tin-noi-bat': 'Tin nổi bật',
    'banner-slide': 'Banner',
  }
  const blogLabel = BLOG_LABELS[blogSlug] ?? blogSlug

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/blog/${blogSlug}`} className="hover:text-blue-600">
          {blogLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 line-clamp-1">{post.title}</span>
      </nav>

      <div className="flex gap-8 items-start">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Tiêu đề trước — theo chuẩn báo hiện đại */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.creationTime)}
            </span>
            {post.author?.userName && (
              <span>bởi <strong>{post.author.userName}</strong></span>
            )}
          </div>

          {descText && (
            <p className="text-gray-600 text-base italic mb-6 bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r">
              {descText}
            </p>
          )}

          {/* Ảnh bìa sau lead paragraph */}
          {coverUrl && (
            <div className="mb-8 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={post.title ?? ''} className="w-full max-h-[480px] object-cover" />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-blue-600"
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />
        </article>

        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block sticky top-6">
          <DoctorSidebar />
        </aside>
      </div>
    </div>
  )
}
