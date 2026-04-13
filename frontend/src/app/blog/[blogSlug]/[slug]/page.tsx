import { DoctorSidebar } from '@/components/page/DoctorSidebar'
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
  'banner-slide': 'Sự Kiện',
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
function parseCoverUrl(p: { shortDescription?: string | null; coverImageMediaId?: string | null }): string {
  const raw = p.shortDescription ?? ''
  const parts = raw.split('|')
  const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
  const rest = firstIsOrder ? parts.slice(1).join('|') : raw
  const idx = rest.indexOf('|')
  if (idx > 0 && (rest.startsWith('http') || rest.startsWith('/api/'))) return rest.slice(0, idx)
  return p.coverImageMediaId ? `/api/cms-kit/media/${p.coverImageMediaId}` : ''
}

async function ArticleContent({ blogSlug, slug }: { blogSlug: string; slug: string }) {
  const [post, relatedRaw] = await Promise.all([
    fetchPost(blogSlug, slug),
    fetchBlogPosts(blogSlug, 7).catch(() => []),
  ])
  if (!post) notFound()

  // Lấy tối đa 6 bài liên quan, bỏ bài hiện tại
  const related = relatedRaw.filter((p) => p.slug !== slug).slice(0, 6)

  const rawDesc = post.shortDescription ?? ''
  const descParts = rawDesc.split('|')
  const firstIsOrder = /^\d+$/.test(descParts[0] ?? '')
  const descRest = firstIsOrder ? descParts.slice(1).join('|') : rawDesc
  const descSepIdx = descRest.indexOf('|')
  const hasCoverInDesc = descSepIdx > 0 && (descRest.startsWith('http') || descRest.startsWith('/api/'))
  const descText = hasCoverInDesc ? descRest.slice(descSepIdx + 1) : descRest
  const coverUrl = hasCoverInDesc
    ? descRest.slice(0, descSepIdx)
    : post.coverImageMediaId
    ? `/api/cms-kit/media/${post.coverImageMediaId}`
    : ''

  const isBannerSlide = blogSlug === 'banner-slide'

  return (
    <article className="flex-1 min-w-0">

      {isBannerSlide ? (
        /* ── Hero card (chỉ dành cho Sự Kiện / banner-slide) ── */
        <div className="rounded-2xl overflow-hidden shadow-lg mb-8">
          <div
            className="px-6 md:px-8 pt-6 pb-5 flex flex-col gap-3"
            style={{ background: 'linear-gradient(160deg, #134e4a 0%, #0f766e 100%)' }}
          >
            <h1
              className="text-white font-extrabold leading-tight tracking-tight"
              style={{ fontSize: 'clamp(1.2rem, 2.4vw, 1.8rem)' }}
            >
              {post.title}
            </h1>
            {descText && (
              <p className="text-[#ccfbf1]/85 text-sm leading-relaxed line-clamp-3">{descText}</p>
            )}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[#ccfbf1]/60 text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(post.creationTime)}</span>
                {post.author?.userName && <><span>·</span><span>{post.author.userName}</span></>}
              </div>
              <span className="text-[#ccfbf1] text-xs font-semibold flex items-center gap-1">
                Chi tiết bài viết <span className="text-base leading-none">›</span>
              </span>
            </div>
          </div>
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt={post.title} className="w-full object-cover" style={{ maxHeight: '420px' }} />
          )}
        </div>
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
        </>
      )}

      {/* ── Nội dung bài viết ── */}
      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-800 prose-a:text-teal-700"
        dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
      />

      {/* ── Bài viết liên quan ── */}
      {related.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-5">Bài viết liên quan</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {related.map((p) => {
              const thumb = parseCoverUrl(p)
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

      <div className={blogSlug === 'banner-slide' ? '' : 'flex gap-8 items-start'}>
        <Suspense fallback={<ArticleSkeleton />}>
          <ArticleContent blogSlug={blogSlug} slug={slug} />
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
