'use client'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { EditorProps } from './utils'

interface CmsBlog { id: string; name: string; slug: string; blogPostCount: number }
interface CmsPost { id: string; title: string; slug: string; blogId: string; blogName?: string | null }

export function CmsBlogPostPicker({ value, onChange }: EditorProps) {
  const [blogs, setBlogs] = useState<CmsBlog[]>([])
  const [blogsLoading, setBlogsLoading] = useState(false)
  const [blogsError, setBlogsError] = useState('')
  const [blogId, setBlogId] = useState('')
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')

  const selectedId = useMemo(() => {
    try { return (JSON.parse(value || '{}') as Record<string, string>).blogPostId ?? '' } catch { return '' }
  }, [value])

  useEffect(() => {
    let cancel = false
    setBlogsLoading(true); setBlogsError('')
    fetch('/api/cms-kit-admin/blogs/all')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancel) return
        const items: CmsBlog[] = (data.items ?? []).map((b: { id: string; name: string; slug: string; blogPostCount?: number }) => ({
          id: b.id, name: b.name, slug: b.slug, blogPostCount: b.blogPostCount ?? 0,
        }))
        setBlogs(items)
        if (items.length === 0) setBlogsError('CMS chưa có blog nào.')
        else if (items.length === 1) setBlogId(items[0].id)
      })
      .catch((e) => { if (!cancel) setBlogsError(`Không tải được danh sách blog: ${(e as Error).message}`) })
      .finally(() => { if (!cancel) setBlogsLoading(false) })
    return () => { cancel = true }
  }, [])

  useEffect(() => {
    if (!blogId) { setPosts([]); return }
    let cancel = false
    setPostsLoading(true); setPostsError('')
    const timer = setTimeout(() => {
      const qsObj: Record<string, string> = { BlogId: blogId, MaxResultCount: '200' }
      if (search.trim()) qsObj.Filter = search.trim()
      const qs = new URLSearchParams(qsObj).toString()
      fetch(`/api/cms-kit-admin/blogs/blog-posts?${qs}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
        .then((data) => {
          if (cancel) return
          const items: CmsPost[] = (data.items ?? []).map((p: { id: string; title: string; slug: string; blogId: string; blogName?: string | null }) => ({
            id: p.id, title: p.title, slug: p.slug, blogId: p.blogId, blogName: p.blogName,
          }))
          setPosts(items)
          if (items.length === 0) setPostsError('Không có bài viết phù hợp.')
        })
        .catch((e) => { if (!cancel) { setPosts([]); setPostsError(`Không tải được: ${(e as Error).message}`) } })
        .finally(() => { if (!cancel) setPostsLoading(false) })
    }, 300)
    return () => { cancel = true; clearTimeout(timer) }
  }, [blogId, search])

  const selectedPost = posts.find((p) => p.id === selectedId)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] text-gray-500 block mb-0.5">Blog cha</label>
          <select
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white disabled:opacity-50"
            value={blogId}
            onChange={(e) => setBlogId(e.target.value)}
            disabled={blogsLoading || blogs.length === 0}
          >
            <option value="">{blogsLoading ? 'Đang tải blog…' : '— Chọn blog —'}</option>
            {blogs.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.slug}) · {b.blogPostCount}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] text-gray-500 block mb-0.5">Tìm bài viết</label>
          <input
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm disabled:opacity-50"
            placeholder="Lọc theo tiêu đề…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={!blogId}
          />
        </div>
      </div>
      {blogsError && <p className="text-xs text-red-500">{blogsError}</p>}

      {blogId && (
        <div className="border border-gray-200 rounded-md bg-white max-h-64 overflow-y-auto">
          {postsLoading ? (
            <div className="p-3 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tải bài viết…
            </div>
          ) : postsError ? (
            <p className="p-3 text-xs text-gray-400">{postsError}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {posts.map((p) => {
                const isSel = p.id === selectedId
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${isSel ? 'bg-blue-100 font-medium text-blue-800' : 'text-gray-700'}`}
                      onClick={() => onChange(JSON.stringify({ blogPostId: p.id }))}
                    >
                      <div className="truncate">{p.title}</div>
                      <div className="text-[11px] text-gray-400 truncate">{p.slug}</div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {selectedPost && (
        <p className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
          ✓ Đã chọn: <b>{selectedPost.title}</b>
        </p>
      )}
    </div>
  )
}
