'use client'

import type { BlogPostCommonDto } from '@/client/types.gen'
import { formatDate } from '@/lib/utils/formatDate'
import { parseCoverImage } from '@/lib/utils/parseCoverImage'
import Link from 'next/link'
import { useState } from 'react'
import { Calendar, FolderOpen, ArrowRight } from 'lucide-react'

const TABS = [
  { label: 'Sản khoa', blogSlug: 'san-khoa' },
  { label: 'Phụ khoa', blogSlug: 'phu-khoa' },
  { label: 'Sơ sinh', blogSlug: 'so-sinh' },
]

function getCoverUrl(post: BlogPostCommonDto): string {
  const { imageUrl } = parseCoverImage(post)
  return imageUrl || '/img/news-placeholder.png'
}

function PostCard({ post, blogSlug, categoryLabel }: {
  post: BlogPostCommonDto; blogSlug: string; categoryLabel: string
}) {
  return (
    <Link
      href={`/blog/${blogSlug}/${post.slug}`}
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border hover:border-blue-200 cursor-pointer"
    >
      <div className="h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <img
          src={getCoverUrl(post)}
          alt={post.title ?? ''}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/img/news-placeholder.png' }}
        />
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <Calendar className="w-3 h-3" />{formatDate(post.creationTime)}
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-600 mb-2">
          <FolderOpen className="w-3 h-3" />
          <span className="bg-blue-50 px-2 py-0.5 rounded">{categoryLabel}</span>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase leading-tight mb-3 line-clamp-3 flex-1 group-hover:text-blue-600 transition-colors duration-200">
          {post.title}
        </h3>
        <span className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-auto group-hover:gap-2 transition-all duration-200">
          + Xem chi tiết <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </span>
      </div>
    </Link>
  )
}

interface KienThucTabsProps {
  sanKhoaPosts: BlogPostCommonDto[]
  phuKhoaPosts: BlogPostCommonDto[]
  soSinhPosts: BlogPostCommonDto[]
}

export function KienThucTabs({ sanKhoaPosts, phuKhoaPosts, soSinhPosts }: KienThucTabsProps) {
  const [activeTab, setActiveTab] = useState(0)
  const postsMap = [sanKhoaPosts, phuKhoaPosts, soSinhPosts]

  return (
    <section className="w-full py-16 md:py-20 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Kiến thức chuyên khoa
        </h2>
        <div className="flex justify-center gap-4 mb-8">
          {TABS.map((tab, i) => (
            <button
              key={tab.blogSlug}
              onClick={() => setActiveTab(i)}
              className={`px-8 py-3 rounded-full font-semibold text-sm uppercase tracking-wide transition-all border-2 ${
                activeTab === i
                  ? 'bg-[#0f766e] border-[#0f766e] text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 border-[#14b8a6] text-[#0f766e] hover:bg-teal-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {postsMap[activeTab].length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Chưa có bài viết nào.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {postsMap[activeTab].map((post) => (
              <PostCard
                key={post.id}
                post={post}
                blogSlug={TABS[activeTab].blogSlug}
                categoryLabel={TABS[activeTab].label}
              />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <Link
            href={`/blog/${TABS[activeTab].blogSlug}`}
            className="border-2 border-blue-500 text-blue-600 px-6 py-2 rounded-full font-medium hover:bg-blue-50 flex items-center gap-2 transition-colors"
          >
            Xem thêm <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
