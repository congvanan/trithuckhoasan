'use client'
import {
  blogAdminGetAllList, BlogDto,
  blogPostAdminCreate, blogPostAdminDelete, blogPostAdminGet, blogPostAdminGetList, blogPostAdminPublish, blogPostAdminUpdate,
  BlogPostListDto, BlogPostStatus,
} from '@/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PenLine, Plus, Trash2, Globe, FileText, Eye } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function statusBadge(status?: BlogPostStatus) {
  if (status === 1) return <Badge className="bg-green-100 text-green-700 border-green-200">Đã xuất bản</Badge>
  if (status === 2) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Nháp</Badge>
}

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

function generateSlug(title: string) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

/** Lưu URL ảnh vào shortDescription: "https://...URL|Mô tả thực" */
function encodeCover(coverUrl: string, desc: string) {
  return coverUrl ? `${coverUrl}|${desc}` : desc
}
function parseCover(raw?: string | null): { cover: string | null; desc: string } {
  if (!raw) return { cover: null, desc: '' }
  const idx = raw.indexOf('|')
  if (idx > 0 && raw.startsWith('http')) {
    return { cover: raw.slice(0, idx), desc: raw.slice(idx + 1) }
  }
  return { cover: null, desc: raw }
}

function BlogPostsContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const filterBlogId = searchParams.get('blogId')

  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [blogId, setBlogId] = useState(filterBlogId ?? '')
  const [shortDesc, setShortDesc] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null)

  const handleUpdateImage = async (post: BlogPostListDto, file: File) => {
    setUploadingImageId(post.id!)
    const form = new FormData()
    form.append('file', file)
    const uploadRes = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const uploadData = await uploadRes.json()
    if (!uploadData.url) {
      toast({ title: 'Lỗi upload', description: uploadData.error, variant: 'destructive' })
      setUploadingImageId(null)
      return
    }
    // Lấy bài viết hiện tại để có concurrencyStamp
    const getRes = await blogPostAdminGet({ path: { id: post.id! } })
    if (!getRes.data) {
      toast({ title: 'Lỗi', description: 'Không lấy được dữ liệu bài viết', variant: 'destructive' })
      setUploadingImageId(null)
      return
    }
    const current = getRes.data
    const { desc } = parseCover(current.shortDescription)
    await blogPostAdminUpdate({
      path: { id: post.id! },
      body: {
        title: current.title!,
        slug: current.slug!,
        shortDescription: encodeCover(uploadData.url, desc),
        content: current.content,
        concurrencyStamp: current.concurrencyStamp,
      },
    })
    setUploadingImageId(null)
    toast({ title: 'Đã cập nhật ảnh', description: post.title ?? '' })
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
  }
  const [filterBlog, setFilterBlog] = useState(filterBlogId ?? '')

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const data = await res.json()
    setUploadingCover(false)
    if (data.url) {
      setCoverImageUrl(data.url)
    } else {
      toast({ title: 'Lỗi upload ảnh', description: data.error, variant: 'destructive' })
    }
  }

  const { data: blogsData } = useQuery({
    queryKey: ['admin-blogs-all'],
    queryFn: async () => {
      const res = await blogAdminGetAllList()
      return res.data?.items ?? []
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog-posts', filterBlog],
    queryFn: async () => {
      const res = await blogPostAdminGetList({
        query: { BlogId: filterBlog || undefined, MaxResultCount: 50, SkipCount: 0 },
      })
      return res.data ?? { items: [], totalCount: 0 }
    },
  })

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !blogId) return
    setSaving(true)
    const res = await blogPostAdminCreate({
      body: {
        blogId, title, slug,
        shortDescription: encodeCover(coverImageUrl, shortDesc),
      },
    })
    setSaving(false)
    if (res.error) {
      console.error('Blog post create error:', JSON.stringify(res.error, null, 2))
      const err = res.error as { error?: { message?: string; validationErrors?: { message: string }[] }; message?: string }
      const inner = err?.error
      const detail = inner?.validationErrors?.map(e => e.message).join(', ')
        ?? inner?.message
        ?? err?.message
        ?? JSON.stringify(res.error)
      toast({ title: 'Lỗi', description: detail, variant: 'destructive' })
    } else {
      toast({ title: 'Thành công', description: `Đã tạo bài "${title}"` })
      setTitle(''); setSlug(''); setShortDesc(''); setCoverImageUrl(''); setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
    }
  }

  const handleDelete = async (post: BlogPostListDto) => {
    if (!confirm(`Xóa bài viết "${post.title}"?`)) return
    setDeletingId(post.id!)
    await blogPostAdminDelete({ path: { id: post.id! } })
    setDeletingId(null)
    toast({ title: 'Đã xóa', description: `Bài "${post.title}" đã được xóa` })
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
  }

  const handlePublish = async (post: BlogPostListDto) => {
    setPublishingId(post.id!)
    await blogPostAdminPublish({ path: { id: post.id! } })
    setPublishingId(null)
    toast({ title: 'Đã xuất bản', description: `Bài "${post.title}" đã được xuất bản` })
    queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] })
  }

  const blogs: BlogDto[] = blogsData ?? []

  return (
    <div className="container max-w-5xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cms" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PenLine className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-sm text-gray-500">Quản lý bài viết blog</p>
        </div>
        <Button className="ml-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Tạo bài viết
        </Button>
      </div>

      {/* Filter by blog */}
      {blogs.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterBlog('')}
            className={`px-3 py-1 rounded-full text-sm border ${!filterBlog ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
          >
            Tất cả
          </button>
          {blogs.map(b => (
            <button
              key={b.id}
              onClick={() => setFilterBlog(b.id!)}
              className={`px-3 py-1 rounded-full text-sm border ${filterBlog === b.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Form tạo mới */}
      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-blue-50 space-y-3">
          <h2 className="font-semibold text-sm text-blue-700">Tạo bài viết mới</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Blog *</label>
              <select
                value={blogId}
                onChange={(e) => setBlogId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="">-- Chọn blog --</option>
                {blogs.map(b => <option key={b.id} value={b.id!}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Tiêu đề * <span className={title.length > 64 ? 'text-red-500 font-bold' : 'text-gray-400'}>({title.length}/64)</span>
              </label>
              <Input
                value={title}
                maxLength={64}
                onChange={(e) => { setTitle(e.target.value); setSlug(generateSlug(e.target.value)) }}
                placeholder="Tiêu đề bài viết (tối đa 64 ký tự)"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Slug * (URL)</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tieu-de-bai-viet" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả ngắn</label>
              <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Tóm tắt bài viết..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ảnh bìa</label>
              <div className="flex items-center gap-3">
                <label className={`cursor-pointer px-3 py-2 rounded border text-sm ${uploadingCover ? 'opacity-50' : 'hover:bg-white border-blue-300 text-blue-600'}`}>
                  {uploadingCover ? '⏳ Đang upload...' : '☁️ Upload ảnh lên Cloud'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                </label>
                {coverImageUrl && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImageUrl} alt="preview" className="h-16 w-24 object-cover rounded border" />
                    <button onClick={() => setCoverImageUrl('')} className="text-xs text-red-500 hover:underline">Xóa</button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={saving || !title || !slug || !blogId || title.length > 64}>
              {saving ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.items ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có bài viết nào.</div>
          ) : (
            (data?.items ?? []).map((post) => (
              <div key={post.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {statusBadge(post.status)}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded">{post.blogName}</span>
                  </div>
                  <p className="font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400">
                    Slug: <code className="bg-gray-100 px-1 rounded">{post.slug}</code>
                    {' · '}{formatDate(post.creationTime)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <label className={`cursor-pointer px-2 py-1 rounded border text-xs ${uploadingImageId === post.id ? 'opacity-50' : 'text-blue-600 border-blue-300 hover:bg-blue-50'}`} title="Upload ảnh bìa">
                    {uploadingImageId === post.id ? '⏳' : '🖼️'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpdateImage(post, f) }}
                      disabled={uploadingImageId === post.id}
                    />
                  </label>
                  {post.status !== 1 && (
                    <Button
                      variant="outline" size="sm"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => handlePublish(post)}
                      disabled={publishingId === post.id}
                    >
                      <Globe className="w-3 h-3 mr-1" />
                      {publishingId === post.id ? '...' : 'Xuất bản'}
                    </Button>
                  )}
                  <Link href={`/blog/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost" size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(post)}
                    disabled={deletingId === post.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-4">Tổng: {data?.totalCount ?? 0} bài viết</p>
    </div>
  )
}

export default function BlogPostsPage() {
  return (
    <Suspense>
      <BlogPostsContent />
    </Suspense>
  )
}
