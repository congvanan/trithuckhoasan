import { BlogPostCommonDto } from '@/client'
import { Calendar, ChevronRight, FolderOpen, Home, Search } from 'lucide-react'
import Link from 'next/link'

const PAGE_SIZE = 10

function parseCover(raw?: string | null): { cover: string | null; desc: string } {
  if (!raw) return { cover: null, desc: '' }
  const idx = raw.indexOf('|')
  if (idx > 0 && raw.startsWith('http')) return { cover: raw.slice(0, idx), desc: raw.slice(idx + 1) }
  return { cover: null, desc: raw }
}

function formatDate(d?: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

function getBlogLabel(slug: string) {
  const map: Record<string, string> = {
    'tin-chuyen-nghanh': 'Thông tin chuyên ngành',
    'tin-quoc-te': 'Tin quốc tế',
  }
  return map[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function fetchPosts(blogSlug: string, page: number, limit: number) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return { items: [] as BlogPostCommonDto[], totalCount: 0 }
  try {
    const skip = (page - 1) * limit
    const res = await fetch(
      `${baseUrl}/api/cms-kit-public/blog-posts/${blogSlug}?MaxResultCount=${limit}&SkipCount=${skip}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return { items: [] as BlogPostCommonDto[], totalCount: 0 }
    return await res.json()
  } catch {
    return { items: [] as BlogPostCommonDto[], totalCount: 0 }
  }
}

function Pagination({ currentPage, totalPages, blogSlug }: { currentPage: number; totalPages: number; blogSlug: string }) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const btnBase = 'flex items-center justify-center w-9 h-9 rounded text-sm border transition-colors'
  const active = 'bg-blue-500 text-white border-blue-500 font-semibold'
  const normal = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  const disabled = 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      {currentPage > 1 ? (
        <Link href={`/blog/${blogSlug}?page=${currentPage - 1}`} className={`${btnBase} ${normal}`}>‹</Link>
      ) : (
        <span className={`${btnBase} ${disabled}`}>‹</span>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className={`${btnBase} ${normal} cursor-default`}>...</span>
        ) : (
          <Link key={p} href={`/blog/${blogSlug}?page=${p}`}
            className={`${btnBase} ${p === currentPage ? active : normal}`}>{p}</Link>
        )
      )}
      {currentPage < totalPages ? (
        <Link href={`/blog/${blogSlug}?page=${currentPage + 1}`} className={`${btnBase} ${normal}`}>›</Link>
      ) : (
        <span className={`${btnBase} ${disabled}`}>›</span>
      )}
    </div>
  )
}

export default async function BlogListPage({
  params,
  searchParams,
}: {
  params: Promise<{ blogSlug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { blogSlug } = await params
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10))

  const [{ items: posts, totalCount }, { items: latestPosts }] = await Promise.all([
    fetchPosts(blogSlug, currentPage, PAGE_SIZE),
    fetchPosts(blogSlug, 1, 5),
  ])

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)
  const blogLabel = getBlogLabel(blogSlug)

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600 font-medium">{blogLabel}</span>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Cột trái */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-blue-700 uppercase border-b-2 border-blue-600 pb-2 mb-1">{blogLabel}</h1>
            <p className="text-sm text-gray-500 mb-4">Tìm thấy {totalCount ?? 0} bài viết.</p>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-gray-400">Chưa có bài viết nào.</div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post: BlogPostCommonDto) => {
                    const { cover, desc } = parseCover(post.shortDescription)
                    const imgUrl = cover ?? (post.coverImageMediaId ? `/api/cms-kit/media/${post.coverImageMediaId}` : null)
                    return (
                      <div key={post.id} className="bg-white rounded border hover:shadow-sm transition-shadow">
                        <div className="flex gap-4 p-4">
                          <Link href={`/blog/${blogSlug}/${post.slug}`} className="shrink-0">
                            <div className="w-[160px] h-[110px] bg-gray-100 rounded overflow-hidden">
                              {imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imgUrl} alt={post.title ?? ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📄</div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/blog/${blogSlug}/${post.slug}`}>
                              <h2 className="font-bold text-gray-800 text-base leading-snug hover:text-blue-600 line-clamp-2 mb-1">{post.title}</h2>
                            </Link>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                              <span className="flex items-center gap-1 text-amber-600">
                                <FolderOpen className="w-3 h-3" />{blogLabel}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{formatDate(post.creationTime)}
                              </span>
                            </div>
                            {desc && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{desc}</p>}
                            <Link href={`/blog/${blogSlug}/${post.slug}`} className="text-blue-600 text-sm font-medium hover:underline">
                              Xem chi tiết →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} blogSlug={blogSlug} />
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-72 shrink-0 hidden lg:block space-y-5">
            <div className="bg-white rounded border p-4">
              <h3 className="font-bold text-gray-700 uppercase text-sm border-b-2 border-blue-500 pb-1.5 mb-3">Tìm kiếm</h3>
              <form action="/timkiem" method="get" className="flex gap-1">
                <input
                  name="q"
                  type="text"
                  placeholder="Nhập từ khóa..."
                  className="flex-1 border rounded-l px-3 py-1.5 text-sm outline-none focus:border-blue-400"
                />
                <input type="hidden" name="category" value={blogSlug} />
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-r">
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="bg-white rounded border p-4">
              <h3 className="font-bold text-gray-700 uppercase text-sm border-b-2 border-blue-500 pb-1.5 mb-3">Bài viết mới nhất</h3>
              <div className="space-y-3">
                {latestPosts.map((post: BlogPostCommonDto) => {
                  const { cover } = parseCover(post.shortDescription)
                  const imgUrl = cover ?? (post.coverImageMediaId ? `/api/cms-kit/media/${post.coverImageMediaId}` : null)
                  return (
                    <Link key={post.id} href={`/blog/${blogSlug}/${post.slug}`}
                      className="flex gap-2 group hover:bg-gray-50 rounded p-1 -mx-1">
                      <div className="w-16 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                        {imgUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📄</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 line-clamp-2">{post.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatDate(post.creationTime)}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
