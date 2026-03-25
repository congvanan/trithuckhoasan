'use client'
import { blogPostPublicGet } from '@/client'
import { DoctorSidebar } from '@/components/page/DoctorSidebar'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ blogSlug: string; slug: string }>
}) {
  const { blogSlug, slug } = use(params)

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post-detail', blogSlug, slug],
    queryFn: async () => {
      const res = await blogPostPublicGet({ path: { blogSlug, blogPostSlug: slug } })
      if (!res.data) throw new Error('Không tìm thấy bài viết')
      return res.data
    },
  })

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !post) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 text-lg">Không tìm thấy bài viết.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">← Về trang chủ</Link>
      </div>
    )
  }

  const rawDesc = post.shortDescription ?? ''
  const hasCoverInDesc = rawDesc.startsWith('http') && rawDesc.includes('|')
  const coverFromDesc = hasCoverInDesc ? rawDesc.split('|')[0] : null
  const descText = hasCoverInDesc ? rawDesc.slice(rawDesc.indexOf('|') + 1) : rawDesc
  const coverUrl = coverFromDesc
    ?? (post.coverImageMediaId ? `/api/cms-kit/media/${post.coverImageMediaId}` : null)

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/blog/${blogSlug}`} className="hover:text-blue-600 capitalize">
          {blogSlug.replace(/-/g, ' ')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 line-clamp-1">{post.title}</span>
      </nav>

      <div className="flex gap-8 items-start">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Cover image */}
          {coverUrl && (
            <div className="mb-6 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={post.title ?? ''} className="w-full max-h-96 object-cover" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-4 pb-4 border-b">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.creationTime)}
            </span>
            {post.author?.userName && (
              <span>bởi <strong>{post.author.userName}</strong></span>
            )}
          </div>

          {/* Short description */}
          {descText && (
            <p className="text-gray-600 text-base italic mb-6 bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r">
              {descText}
            </p>
          )}

          {/* Content */}
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
