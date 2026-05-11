import { DoctorSidebar } from '@/components/page/DoctorSidebar'
import { ImageGallery } from '@/components/blog/ImageGallery'
import { ShareButtons } from '@/components/blog/ShareButtons'
import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { BLOG_SLUGS, getBlogLabel } from '@/lib/constants/blogs'
import { formatDate } from '@/lib/utils/formatDate'
import { parseCoverImage } from '@/lib/utils/parseCoverImage'
import { Calendar, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

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
async function ArticleContent({ blogSlug, slug, appUrl }: { blogSlug: string; slug: string; appUrl: string }) {
  const [post, relatedRaw] = await Promise.all([
    fetchPost(blogSlug, slug),
    fetchBlogPosts(blogSlug, 7).catch(() => []),
  ])
  if (!post) notFound()

  // Lấy tối đa 6 bài liên quan, bỏ bài hiện tại
  const related = relatedRaw.filter((p) => p.slug !== slug).slice(0, 6)

  const { imageUrl: coverUrl, description: descText } = parseCoverImage(post)
  const shareUrl = `${appUrl}/blog/${blogSlug}/${slug}`

  const isBannerSlide = blogSlug === 'banner-slide'

  return (
    <article className="flex-1 min-w-0">

      {isBannerSlide ? (
        /* ── Sự Kiện: chỉ hiển thị ảnh bìa + thư viện ảnh, không có text bài viết ── */
        <>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={post.title} className="w-full object-cover rounded-2xl shadow-lg mb-6" style={{ maxHeight: '480px' }} />
          )}
          <ImageGallery html={post.content ?? ''} postId={post.id} />
        </>
      ) : (
        /* ── Layout thông thường (các chuyên mục khác) ── */
        <>
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
          {/* ── Nội dung bài viết ── */}
          <div
            className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-teal-700"
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />
        </>
      )}

      {/* ── Share bottom ── */}
      {!isBannerSlide && (
        <div className="mt-8 pt-6 border-t flex items-center justify-between flex-wrap gap-3">
          <Link href={`/blog/${blogSlug}`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 transition-colors">
            ← Quay lại
          </Link>
          <ShareButtons url={shareUrl} title={post.title ?? ''} />
        </div>
      )}

      {/* ── Bài viết liên quan — chỉ hiển thị ở các chuyên mục khác ── */}
      {!isBannerSlide && related.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-5">Bài viết liên quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {related.map((p) => {
              const { imageUrl: thumb } = parseCoverImage(p)
              return (
                <Link
                  key={p.id}
                  href={`/blog/${blogSlug}/${p.slug}`}
                  className="group rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={p.title ?? ''}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                        <span className="text-teal-300 text-xs">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>
                  {/* Title */}
                  <div className="px-3 py-3 flex-1 flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                      {p.title}
                    </p>
                    <span className="text-xs text-gray-400 mt-auto">{formatDate(p.creationTime)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ blogSlug: string; slug: string }>
}) {
  const { blogSlug, slug } = await params
  const blogLabel = getBlogLabel(blogSlug)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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

      <div className={blogSlug === 'banner-slide' ? '' : 'flex gap-8 items-start'}>
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent blogSlug={blogSlug} slug={slug} appUrl={appUrl} />
        </Suspense>

        {blogSlug !== 'banner-slide' && (
          <aside className="w-80 shrink-0 hidden lg:block sticky top-6">
            <DoctorSidebar />
          </aside>
        )}
      </div>
    </div>
  )
}
