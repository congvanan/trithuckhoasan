'use client'
import {
  blogAdminGetAllList, BlogDto,
  blogPostAdminGet, blogPostAdminPublish, blogPostAdminUpdate,
} from '@/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Save, Globe, Eye, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(
  () => import('@/components/puck/fields/RichTextField').then(m => m.RichTextField),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-400 text-sm">Đang tải trình soạn thảo...</div> }
)

function parseCover(raw?: string | null) {
  if (!raw) return { cover: null, desc: '' }
  const idx = raw.indexOf('|')
  if (idx > 0 && raw.startsWith('http')) return { cover: raw.slice(0, idx), desc: raw.slice(idx + 1) }
  return { cover: null, desc: raw }
}

function encodeCover(coverUrl: string, desc: string) {
  return coverUrl ? `${coverUrl}|${desc}` : desc
}

export default function EditBlogPostPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [content, setContent] = useState('')
  const [blogId, setBlogId] = useState('')
  const [concurrencyStamp, setConcurrencyStamp] = useState('')
  const [status, setStatus] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const { data: blogsData } = useQuery({
    queryKey: ['admin-blogs-all'],
    queryFn: async () => {
      const res = await blogAdminGetAllList()
      return (res.data?.items ?? []) as BlogDto[]
    },
    staleTime: 10 * 60 * 1000,
  })

  // Load bài viết
  useEffect(() => {
    if (!postId) return
    blogPostAdminGet({ path: { id: postId } }).then((res) => {
      if (!res.data) return
      const p = res.data
      const { cover, desc } = parseCover(p.shortDescription)
      setTitle(p.title ?? '')
      setSlug(p.slug ?? '')
      setShortDesc(desc)
      setCoverUrl(cover ?? '')
      setContent(p.content ?? '')
      setBlogId(p.blogId ?? '')
      setConcurrencyStamp(p.concurrencyStamp ?? '')
      setStatus(p.status ?? 0)
      setLoaded(true)
    })
  }, [postId])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const data = await res.json()
    setUploadingCover(false)
    if (data.url) setCoverUrl(data.url)
    else toast({ title: 'Lỗi upload ảnh', variant: 'destructive' })
  }

  const revalidate = async (blogSlug: string) => {
    await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: `/blog/${blogSlug}/${slug}` }),
    })
  }

  const handleSave = async (andPublish = false) => {
    if (!title || !slug) return
    setSaving(true)
    const res = await blogPostAdminUpdate({
      path: { id: postId },
      body: {
        title,
        slug,
        shortDescription: encodeCover(coverUrl, shortDesc),
        content,
        concurrencyStamp,
      },
    })
    if (res.error) {
      toast({ title: 'Lỗi lưu bài', variant: 'destructive' })
      setSaving(false)
      return
    }
    // Lấy stamp mới sau update
    const updated = await blogPostAdminGet({ path: { id: postId } })
    setConcurrencyStamp(updated.data?.concurrencyStamp ?? '')

    if (andPublish && status !== 1) {
      setPublishing(true)
      await blogPostAdminPublish({ path: { id: postId } })
      setStatus(1)
      setPublishing(false)
    }

    // Xóa cache trang chi tiết + trang chủ
    const blogSlug = blogsData?.find(b => b.id === blogId)?.slug ?? ''
    await revalidate(blogSlug)

    toast({
      title: andPublish && status !== 1 ? 'Đã lưu và xuất bản' : 'Đã lưu',
      description: title,
    })
    setSaving(false)
  }

  const blogName = blogsData?.find(b => b.id === blogId)?.name ?? ''

  return (
    <div className="container max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {!loaded ? <span className="inline-block w-64 h-5 bg-gray-200 rounded animate-pulse" /> : (title || 'Chỉnh sửa bài viết')}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            {blogName && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{blogName}</span>}
            {status === 1
              ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Đã xuất bản</span>
              : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Nháp</span>
            }
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {status !== 1 && (
            <Button variant="outline" size="sm"
              onClick={() => handleSave(true)}
              disabled={saving || publishing}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              <Globe className="w-4 h-4 mr-1" />
              {publishing ? 'Đang xuất bản...' : 'Lưu & Xuất bản'}
            </Button>
          )}
          <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? 'Đang lưu...' : 'Lưu nháp'}
          </Button>
          <Link href={`/blog/${blogsData?.find(b => b.id === blogId)?.slug ?? ''}/${slug}`} target="_blank">
            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="col-span-2 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 flex justify-between">
              <span>Tiêu đề *</span>
              <span className={title.length > 90 ? 'text-red-500 font-bold' : 'text-gray-400'}>({title.length}/100)</span>
            </label>
            <Input
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tiêu đề bài viết"
              className="text-base font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Slug (URL)</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="tieu-de-bai-viet"
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Nội dung bài viết</label>
            <div className="border rounded-lg overflow-hidden">
              <RichTextEditor
                value={content}
                onChange={(val: string) => setContent(val)}
                placeholder="Nhập nội dung bài viết..."
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ảnh bìa */}
          <div className="border rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Ảnh bìa
            </p>
            {coverUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverUrl} alt="Ảnh bìa" className="w-full h-36 object-cover rounded-lg border" />
                <button onClick={() => setCoverUrl('')} className="text-xs text-red-500 hover:underline">Xóa ảnh</button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg h-28 flex items-center justify-center text-gray-400 text-sm">
                Chưa có ảnh bìa
              </div>
            )}
            <label className={`block w-full text-center cursor-pointer px-3 py-2 rounded border text-sm transition-colors ${uploadingCover ? 'opacity-50' : 'hover:bg-gray-50 border-gray-300 text-gray-600'}`}>
              {uploadingCover ? '⏳ Đang upload...' : '☁️ Upload ảnh lên Cloud'}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
            </label>
          </div>

          {/* Mô tả ngắn */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-700">Mô tả ngắn</p>
              <span className={`text-xs ${shortDesc.length > 550 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>({shortDesc.length}/600)</span>
            </div>
            <textarea
              value={shortDesc}
              maxLength={600}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Tóm tắt bài viết, hiển thị dưới tiêu đề..."
              rows={5}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
