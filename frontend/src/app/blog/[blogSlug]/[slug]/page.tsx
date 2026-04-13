import { DoctorSidebar } from '@/components/page/DoctorSidebar'
import { ImageGallery } from '@/components/blog/ImageGallery'
import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { Calendar, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

const BLOG_SLUGS = ['tin-chuyen-nghanh', 'tin-quoc-te', 'banner-slide', 'tin-noi-bat', 'san-khoa', 'phu-khoa', 'so-sinh']

const BLOG_LABELS: Record<string, string> = {
  'tin-chuyen-nghanh': 'Tin chuyên ngành',
  'tin-quoc-te': 'Tin quốc tế',
  'san-khoa': 'Sản khoa',
  'phu-khoa': 'Phụ khoa',
  'so-sinh': 'Sơ sinh',
  'tin-noi-bat': 'Tin nổi bật',
  'banner-slide': 'Banner',
}

export async function generateStaticParams() {
  const results = await Promise.all(
    BLOG_SLUGS.map(async (blogSlug) => {
      const posts = await fetchBlogPosts(blogSlug, 50)
      return posts.map((p) => ({ blogSlug, slug: p.slug ?? '' }))
    })
  )
  return results.flat().filter((p) => p.slug)
}

export const revalidate = 600 // 10 phút

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
        signal: AbortSignal.timeout(8000),
        next: process.env.NODE_ENV === 'development'
          ? { revalidate: 10, tags: ['blog-posts'] }
          : { revalidate: 600, tags: ['blog-posts'] },
      }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Skeleton cho nội dung bài viết khi đang stream
function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3 mb-4">
        <div className="h-8 bg-gray-200 rounded w-full" />
        <div className="h-8 bg-gray-200 rounded w-4/5" />
      </div>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-16 bg-blue-50 rounded-r border-l-4 border-blue-200 mb-6" />
      <div className="space-y-3">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className={`h-4 bg-gray-200 rounded ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />
        ))}
        <div className="h-48 bg-gray-100 rounded my-4" />
        {[1,2,3,4,5].map(i => (
          <div key={i+10} className={`h-4 bg-gray-200 rounded ${i % 2 === 0 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}

// Component riêng để fetch + render — cho phép Suspense streaming
async function ArticleContent({ blogSlug, slug }: { blogSlug: string; slug: string }) {
  const post = await fetchPost(blogSlug, slug)
  if (!post) notFound()

  const rawDesc = post.shortDescription ?? ''
  const hasCoverInDesc = rawDesc.startsWith('http') && rawDesc.includes('|')
  const descText = hasCoverInDesc ? rawDesc.slice(rawDesc.indexOf('|') + 1) : rawDesc

  return (
    <article className="flex-1 min-w-0">
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

      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-blue-600"
        dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
      />

      {/* Gallery grid — tự động hiện khi bài có ≥2 ảnh */}
      <ImageGallery html={post.content ?? ''} />
    </article>
  )
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ blogSlug: string; slug: string }>
}) {
  const { blogSlug, slug } = await params
  const blogLabel = BLOG_LABELS[blogSlug] ?? blogSlug

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb — render ngay không cần chờ API */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/blog/${blogSlug}`} className="hover:text-blue-600">
          {blogLabel}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-400 italic text-xs">Đang tải...</span>
      </nav>

      <div className="flex gap-8 items-start">
        {/* Nội dung stream — hiện skeleton trong khi chờ API */}
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent blogSlug={blogSlug} slug={slug} />
        </Suspense>

        {/* Sidebar — render ngay vì dùng data tĩnh */}
        <aside className="w-80 shrink-0 hidden lg:block sticky top-6">
          <DoctorSidebar />
        </aside>
      </div>
    </div>
  )
}
