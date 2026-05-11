'use client'
import {
  blogAdminGetAllList, BlogDto,
  blogPostAdminCreate, blogPostAdminDelete, blogPostAdminGet,
  blogPostAdminGetList, blogPostAdminPublish, blogPostAdminUpdate,
  BlogPostListDto,
} from '@/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Star, Plus, Trash2, Globe, Eye, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const BLOG_SLUG = 'tin-noi-bat'

function generateSlug(title: string) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function parseCover(raw?: string | null) {
  if (!raw) return { cover: null, desc: '' }
  const idx = raw.indexOf('|')
  if (idx > 0 && raw.startsWith('http')) return { cover: raw.slice(0, idx), desc: raw.slice(idx + 1) }
  return { cover: null, desc: raw }
}

function encodeCover(coverUrl: string, desc: string) {
  return coverUrl ? `${coverUrl}|${desc}` : desc
}

function formatDate(d?: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

function statusBadge(status?: number) {
  if (status === 1) return <Badge className="bg-green-100 text-green-700 border-green-200">Đã xuất bản</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">Nháp</Badge>
}

export default function FeaturedPostPage() {
  const { toast } = useToast()


  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null)

  // Lấy blogId của 'tin-noi-bat'
  const { data: blogsData } = useQuery({
    queryKey: ['admin-blogs-all'],
    queryFn: async () => {
      const res = await blogAdminGetAllList()
      return res.data?.items ?? []
    },
    staleTime: 10 * 60 * 1000,
  })
  const featuredBlog = (blogsData ?? []).find((b: BlogDto) => b.slug === BLOG_SLUG)

  const blogId = featuredBlog?.id

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-featured-posts', blogId],
    queryFn: async () => {
      if (!blogId) return { items: [], totalCount: 0 }
      const res = await blogPostAdminGetList({
        query: { BlogId: blogId, MaxResultCount: 20, SkipCount: 0 },
      })
      return res.data ?? { items: [], totalCount: 0 }
    },
    enabled: !!blogId,
    staleTime: 0,
  })

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const uploadData = await res.json()
    setUploadingCover(false)
    if (uploadData.url) setCoverImageUrl(uploadData.url)
    else toast({ title: 'Lỗi upload ảnh', description: uploadData.error, variant: 'destructive' })
  }

  const handleUpdateImage = async (post: BlogPostListDto, file: File) => {
    setUploadingImageId(post.id!)
    const form = new FormData()
    form.append('file', file)
    const uploadRes = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const uploadData = await uploadRes.json()
    if (!uploadData.url) { setUploadingImageId(null); return }
    const getRes = await blogPostAdminGet({ path: { id: post.id! } })
    if (!getRes.data) { setUploadingImageId(null); return }
    const current = getRes.data
    const { desc } = parseCover(current.shortDescription)
    await blogPostAdminUpdate({
      path: { id: post.id! },
      body: {
        title: current.title!, slug: current.slug!,
        shortDescription: encodeCover(uploadData.url, desc),
        content: current.content, concurrencyStamp: current.concurrencyStamp,
      },
    })
    setUploadingImageId(null)
    toast({ title: 'Đã cập nhật ảnh bìa' })
    await refetch()
  }

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim() || !featuredBlog?.id) return
    setSaving(true)
    const res = await blogPostAdminCreate({
      body: {
        blogId: featuredBlog.id, title, slug,
        shortDescription: encodeCover(coverImageUrl, shortDesc),
      },
    })
    setSaving(false)
    console.log('[featured] create response:', JSON.stringify(res), 'status:', res.response?.status, 'data:', res.data, 'error:', JSON.stringify(res.error))
    if (res.error) {
      const errDetail = (res.error as { error?: { message?: string }; message?: string })?.error?.message
        ?? (res.error as { message?: string })?.message
        ?? JSON.stringify(res.error)
      toast({ title: 'Lỗi tạo bài', description: errDetail, variant: 'destructive' })
    } else {
      toast({ title: 'Đã tạo bài nổi bật', description: title })
      setTitle(''); setSlug(''); setShortDesc(''); setCoverImageUrl(''); setShowForm(false)
      const refetchResult = await refetch()
      console.log('[featured] refetch result:', JSON.stringify(refetchResult.data))
    }
  }

  const handlePublish = async (post: BlogPostListDto) => {
    setPublishingId(post.id!)
    await blogPostAdminPublish({ path: { id: post.id! } })
    setPublishingId(null)
    toast({ title: 'Đã xuất bản', description: `"${post.title}" hiển thị trên trang chủ` })
    await refetch()
  }

  const handleDelete = async (post: BlogPostListDto) => {
    if (!confirm(`Xóa bài "${post.title}"?`)) return
    setDeletingId(post.id!)
    await blogPostAdminDelete({ path: { id: post.id! } })
    setDeletingId(null)
    await refetch()
  }

  if (!featuredBlog) {
    return (
      <div className="container max-w-3xl py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/cms" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
          <Star className="w-6 h-6 text-yellow-500" />
          <h1 className="text-2xl font-bold">Bài nổi bật</h1>
        </div>
        <div className="border rounded-lg p-6 bg-yellow-50 text-center">
          <p className="text-yellow-700 mb-4">Chưa có blog "Bài nổi bật". Cần khởi tạo trước.</p>
          <Link href="/admin/cms/blogs">
            <Button>Vào trang Blogs → Khởi tạo</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/cms" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
        <Star className="w-6 h-6 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold">Bài viết nổi bật</h1>
          <p className="text-sm text-gray-500">Bài được xuất bản mới nhất sẽ hiển thị ở Hero trang chủ</p>
        </div>
        <Button className="ml-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Thêm bài
        </Button>
      </div>

      {/* Hint */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-700">
        <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Chỉ <strong>1 bài được xuất bản mới nhất</strong> sẽ hiển thị ở trang chủ. Xuất bản bài mới để thay thế bài cũ.</span>
      </div>

      {/* Form tạo mới */}
      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-yellow-50 space-y-3">
          <h2 className="font-semibold text-sm text-yellow-700">Tạo bài nổi bật mới</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Tiêu đề * <span className={title.length > 220 ? 'text-red-500 font-bold' : 'text-gray-400'}>({title.length}/256)</span>
              </label>
              <Input
                value={title}
                maxLength={256}
                onChange={(e) => { setTitle(e.target.value); setSlug(generateSlug(e.target.value)) }}
                placeholder="Tiêu đề bài viết nổi bật"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Slug * (URL)</label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="tieu-de-bai-viet" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả ngắn (hiển thị dưới tiêu đề trang chủ)</label>
              <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Tóm tắt ngắn gọn về bài viết..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Ảnh bìa (hiển thị bên phải trang chủ)</label>
              <div className="flex items-center gap-3">
                <label className={`cursor-pointer px-3 py-2 rounded border text-sm ${uploadingCover ? 'opacity-50' : 'hover:bg-white border-yellow-300 text-yellow-700'}`}>
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
            <Button onClick={handleCreate} disabled={saving || !title || !slug || title.length > 256}>
              {saving ? 'Đang lưu...' : 'Lưu nháp'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {(data?.items ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có bài nổi bật nào. Tạo bài đầu tiên!</div>
          ) : (
            (data?.items ?? []).map((post) => (
              <div key={post.id} className={`flex items-center justify-between border rounded-lg px-4 py-3 ${post.status === 1 ? 'bg-yellow-50 border-yellow-200' : 'bg-white hover:bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {statusBadge(post.status)}
                    {post.status === 1 && <span className="text-xs text-yellow-600 font-medium flex items-center gap-1"><Star className="w-3 h-3" /> Đang hiển thị trang chủ</span>}
                  </div>
                  <p className="font-medium text-gray-800 truncate">{post.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(post.creationTime)}</p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <label className={`cursor-pointer px-2 py-1 rounded border text-xs ${uploadingImageId === post.id ? 'opacity-50' : 'text-blue-600 border-blue-300 hover:bg-blue-50'}`} title="Đổi ảnh bìa">
                    {uploadingImageId === post.id ? '⏳' : '🖼️'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpdateImage(post, f) }}
                      disabled={uploadingImageId === post.id}
                    />
                  </label>
                  {post.status !== 1 && (
                    <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => handlePublish(post)} disabled={publishingId === post.id}>
                      <Globe className="w-3 h-3 mr-1" />
                      {publishingId === post.id ? '...' : 'Xuất bản'}
                    </Button>
                  )}
                  <Link href={`/blog/tin-noi-bat/${post.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" className="text-gray-500"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(post)} disabled={deletingId === post.id}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
