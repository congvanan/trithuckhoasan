import { BlogPostCommonDto } from '@/client'
import { Calendar, ChevronRight, FolderOpen, Home } from 'lucide-react'
import Link from 'next/link'
import { SearchFilters } from './SearchFilters'

const PAGE_SIZE = 10
const MAX_FETCH = 200

const BLOG_SLUGS: Record<string, string> = {
  'tin-chuyen-nghanh': 'Thông tin chuyên ngành',
  'tin-quoc-te': 'Tin quốc tế',
}

interface PostWithSlug extends BlogPostCommonDto {
  blogSlug: string
}

function parseCover(raw?: string | null): { cover: string | null; desc: string } {
  if (!raw) return { cover: null, desc: '' }
  const idx = raw.indexOf('|')
  if (idx > 0 && raw.startsWith('http')) return { cover: raw.slice(0, idx), desc: raw.slice(idx + 1) }
  return { cover: null, desc: raw }
}

function formatDate(d?: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

async function fetchAllPosts(blogSlug: string): Promise<PostWithSlug[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!baseUrl) return []
  try {
    const res = await fetch(
      `${baseUrl}/api/cms-kit-public/blog-posts/${blogSlug}?MaxResultCount=${MAX_FETCH}&SkipCount=0`,
      { next: { revalidate: 120 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return ((data?.items ?? []) as BlogPostCommonDto[]).map(p => ({ ...p, blogSlug }))
  } catch {
    return []
  }
}

function highlightKeyword(text: string, keyword: string): { before: string; match: string; after: string } | null {
  if (!keyword || !text) return null
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase())
  if (idx === -1) return null
  return {
    before: text.slice(0, idx),
    match: text.slice(idx, idx + keyword.length),
    after: text.slice(idx + keyword.length),
  }
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
  const parts = highlightKeyword(text, keyword)
  if (!parts) return <>{text}</>
  return (
    <>
      {parts.before}
      <mark className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{parts.match}</mark>
      {parts.after}
    </>
  )
}

export default async function TimKiemPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; searchIn?: string; dateFrom?: string; dateTo?: string; page?: string }>
}) {
  const params = await searchParams
  const q = (params.q ?? '').trim()
  const category = params.category ?? 'all'
  const searchIn = params.searchIn ?? 'all'
  const dateFrom = params.dateFrom ?? ''
  const dateTo = params.dateTo ?? ''
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10))

  // Fetch from relevant blogs
  let allPosts: PostWithSlug[] = []
  if (category === 'all') {
    const results = await Promise.all(Object.keys(BLOG_SLUGS).map(slug => fetchAllPosts(slug)))
    allPosts = results.flat()
  } else if (BLOG_SLUGS[category]) {
    allPosts = await fetchAllPosts(category)
  }

  // Sort by date desc
  allPosts.sort((a, b) => new Date(b.creationTime ?? 0).getTime() - new Date(a.creationTime ?? 0).getTime())

  // Filter by keyword
  let filtered = allPosts
  if (q) {
    const lower = q.toLowerCase()
    filtered = filtered.filter(post => {
      const { desc } = parseCover(post.shortDescription)
      if (searchIn === 'title') return (post.title ?? '').toLowerCase().includes(lower)
      if (searchIn === 'desc') return desc.toLowerCase().includes(lower)
      return (
        (post.title ?? '').toLowerCase().includes(lower) ||
        desc.toLowerCase().includes(lower)
      )
    })
  }

  // Filter by date
  if (dateFrom) {
    const from = new Date(dateFrom)
    filtered = filtered.filter(p => p.creationTime && new Date(p.creationTime) >= from)
  }
  if (dateTo) {
    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)
    filtered = filtered.filter(p => p.creationTime && new Date(p.creationTime) <= to)
  }

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const pagePosts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Pagination helper
  const buildUrl = (page: number) => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (category !== 'all') p.set('category', category)
    if (searchIn !== 'all') p.set('searchIn', searchIn)
    if (dateFrom) p.set('dateFrom', dateFrom)
    if (dateTo) p.set('dateTo', dateTo)
    p.set('page', String(page))
    return `/timkiem?${p.toString()}`
  }

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
  const activeBtn = 'bg-blue-500 text-white border-blue-500 font-semibold'
  const normalBtn = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
  const disabledBtn = 'bg-white text-gray-300 border-gray-200 cursor-not-allowed'

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-blue-600 font-medium">Tìm kiếm</span>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Cột kết quả (trái) */}
          <div className="flex-1 min-w-0">
            {/* Tiêu đề kết quả */}
            <div className="mb-4">
              {q ? (
                <h1 className="text-lg font-bold text-gray-800">
                  Kết quả tìm kiếm: <span className="text-blue-600">&quot;{q}&quot;</span>
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Tìm thấy {totalCount} kết quả)
                  </span>
                </h1>
              ) : (
                <h1 className="text-lg font-bold text-gray-800">
                  Tất cả bài viết
                  <span className="text-sm font-normal text-gray-500 ml-2">({totalCount} bài viết)</span>
                </h1>
              )}
            </div>

            {pagePosts.length === 0 ? (
              <div className="bg-white rounded border p-12 text-center text-gray-400">
                {q ? `Không tìm thấy kết quả nào cho "${q}".` : 'Chưa có bài viết nào.'}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {pagePosts.map((post) => {
                    const { cover, desc } = parseCover(post.shortDescription)
                    const imgUrl = cover ?? (post.coverImageMediaId ? `/api/cms-kit/media/${post.coverImageMediaId}` : null)
                    const categoryLabel = BLOG_SLUGS[post.blogSlug] ?? post.blogSlug
                    return (
                      <div key={post.id} className="bg-white rounded border hover:shadow-sm transition-shadow">
                        <div className="flex gap-4 p-4">
                          {/* Thumbnail */}
                          <Link href={`/blog/${post.blogSlug}/${post.slug}`} className="shrink-0">
                            <div className="w-[140px] h-[100px] bg-gray-100 rounded overflow-hidden">
                              {imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={imgUrl} alt={post.title ?? ''} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">📄</div>
                              )}
                            </div>
                          </Link>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Category badge */}
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded mb-1.5">
                              <FolderOpen className="w-3 h-3" />
                              {categoryLabel}
                            </span>

                            {/* Title */}
                            <Link href={`/blog/${post.blogSlug}/${post.slug}`}>
                              <h2 className="font-bold text-gray-800 text-base leading-snug hover:text-blue-600 line-clamp-2 mb-1">
                                <HighlightedText text={post.title ?? ''} keyword={q} />
                              </h2>
                            </Link>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{formatDate(post.creationTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" />{categoryLabel}
                              </span>
                            </div>

                            {/* Description */}
                            {desc && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                <HighlightedText text={desc} keyword={searchIn === 'title' ? '' : q} />
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-8">
                    {currentPage > 1 ? (
                      <Link href={buildUrl(currentPage - 1)} className={`${btnBase} ${normalBtn}`}>‹</Link>
                    ) : (
                      <span className={`${btnBase} ${disabledBtn}`}>‹</span>
                    )}
                    {pages.map((p, i) =>
                      p === '...' ? (
                        <span key={`dots-${i}`} className={`${btnBase} ${normalBtn} cursor-default`}>...</span>
                      ) : (
                        <Link key={p} href={buildUrl(p as number)}
                          className={`${btnBase} ${p === currentPage ? activeBtn : normalBtn}`}>{p}</Link>
                      )
                    )}
                    {currentPage < totalPages ? (
                      <Link href={buildUrl(currentPage + 1)} className={`${btnBase} ${normalBtn}`}>›</Link>
                    ) : (
                      <span className={`${btnBase} ${disabledBtn}`}>›</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Cột lọc (phải) */}
          <aside className="w-72 shrink-0">
            <SearchFilters
              q={q}
              category={category}
              searchIn={searchIn}
              dateFrom={dateFrom}
              dateTo={dateTo}
            />
          </aside>
        </div>
      </div>
    </div>
  )
}
