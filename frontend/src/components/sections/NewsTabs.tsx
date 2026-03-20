'use client'

import { blogPostPublicGetList, BlogPostCommonDto } from '@/client'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { Calendar, FolderOpen, ArrowRight } from 'lucide-react'

const TABS = [
  { label: 'Tin chuyên ngành', blogSlug: 'tin-chuyen-nganh' },
  { label: 'Tin quốc tế', blogSlug: 'tin-quoc-te' },
]

function formatDate(dateStr?: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function NewsCard({ post, blogSlug, categoryLabel }: { post: BlogPostCommonDto; blogSlug: string; categoryLabel: string }) {
  const imageUrl = post.coverImageMediaId
    ? `/api/cms-kit/media/${post.coverImageMediaId}`
    : '/img/news-placeholder.png'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={post.title ?? ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = '/img/news-placeholder.png'
          }}
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Calendar className="w-3 h-3" />
          {formatDate(post.creationTime)}
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-2">
          <FolderOpen className="w-3 h-3" />
          <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
            {categoryLabel}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase leading-tight mb-3 line-clamp-3 flex-1">
          {post.title}
        </h3>
        <Link
          href={`/blog/${blogSlug}/${post.slug}`}
          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1 mt-auto"
        >
          + Xem chi tiết
        </Link>
      </div>
    </div>
  )
}

function NewsTabContent({ blogSlug, categoryLabel }: { blogSlug: string; categoryLabel: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['public-blog-posts', blogSlug],
    queryFn: async () => {
      try {
        const res = await blogPostPublicGetList({
          path: { blogSlug },
          query: { MaxResultCount: 4, SkipCount: 0 },
        })
        return res.data ?? { items: [], totalCount: 0 }
      } catch {
        return { items: [], totalCount: 0 }
      }
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg h-72 animate-pulse" />
        ))}
      </div>
    )
  }

  const posts = data?.items ?? []

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chưa có bài viết nào.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {posts.map((post) => (
        <NewsCard key={post.id} post={post} blogSlug={blogSlug} categoryLabel={categoryLabel} />
      ))}
    </div>
  )
}

export function NewsTabs() {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="w-full py-12 md:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 md:px-6">
        {/* Tab buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {TABS.map((tab, i) => (
            <button
              key={tab.blogSlug}
              onClick={() => setActiveTab(i)}
              className={`px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wide transition-colors border-2 ${
                activeTab === i
                  ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <NewsTabContent
          blogSlug={TABS[activeTab].blogSlug}
          categoryLabel={TABS[activeTab].label}
        />

        {/* Xem thêm */}
        <div className="flex justify-center mt-8">
          <Link
            href={`/blog/${TABS[activeTab].blogSlug}`}
            className="border-2 border-blue-500 text-blue-600 dark:text-blue-400 px-6 py-2 rounded-full font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 transition-colors"
          >
            Xem thêm <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
