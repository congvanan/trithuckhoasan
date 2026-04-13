'use client'

import {
  blogAdminGetAllList,
  blogPostAdminCreate, blogPostAdminDelete, blogPostAdminDraft,
  blogPostAdminGetList, blogPostAdminPublish, blogPostAdminUpdate,
  mediaDescriptorAdminCreate, mediaDescriptorAdminDelete,
} from '@/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { updateDoctorMediaId } from '@/lib/actions/updateDoctorMedia'
import { DOCTORS } from '@/lib/data/doctors'
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, CheckSquare, Copy,
  ExternalLink, ImageIcon, Images, Loader2, Plus, Trash2, Upload, UserRound, XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type UploadedMedia = {
  id: string; name: string; url: string; uploadedAt: string; doctorSlug?: string
}
type BannerPost = {
  id: string
  title: string
  slug: string
  imageUrl: string
  caption: string
  status: number          // 0=Draft/Ẩn, 1=Published/Hiển thị
  order: number           // thứ tự hiển thị (lấy từ prefix shortDescription)
  concurrencyStamp?: string | null
  rawShortDescription: string  // lưu để update
}
type UploadStatus = { name: string; status: 'uploading' | 'success' | 'error'; message?: string }
type Tab = 'doctor' | 'banner' | 'gallery'
type SlideForm = { mediaItem: UploadedMedia; title: string; caption: string; saving: boolean }

const STORAGE_KEY = 'cms-media-library'
const BANNER_STORAGE_KEY = 'cms-banner-media'
const GALLERY_STORAGE_KEY = 'cms-gallery-media'

function ls<T>(key: string): T[] {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : [] } catch { return [] }
}
function lsSave<T>(key: string, v: T[]) { localStorage.setItem(key, JSON.stringify(v)) }

function generateSlug(title: string) {
  return title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

/** Giải mã shortDescription: `{order}|{imageUrl}|{caption}` hoặc `{imageUrl}|{caption}` (cũ) */
function parseShortDesc(raw: string | null | undefined, coverMediaId?: string | null) {
  const r = raw ?? ''
  const parts = r.split('|')
  const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
  const order = firstIsOrder ? parseInt(parts[0]) : 99
  const rest = firstIsOrder ? parts.slice(1).join('|') : r
  const sepIdx = rest.indexOf('|')
  const hasCover = sepIdx > 0 && (rest.startsWith('http') || rest.startsWith('/api/'))
  const imageUrl = hasCover
    ? rest.slice(0, sepIdx)
    : coverMediaId ? `/api/cms-kit/media/${coverMediaId}` : ''
  const caption = hasCover ? rest.slice(sepIdx + 1) : rest
  return { order, imageUrl, caption }
}

/** Tạo shortDescription mới từ các thành phần */
function buildShortDesc(order: number, imageUrl: string, caption: string) {
  const pad = String(order).padStart(2, '0')
  return `${pad}|${imageUrl}|${caption}`
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function MediaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('doctor')

  // Doctor tab
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  // Gallery tab
  const [galleryMedia, setGalleryMedia] = useState<UploadedMedia[]>([])
  const [galleryRef] = [useRef<HTMLInputElement>(null)]
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [galleryPage, setGalleryPage] = useState(0)
  const GALLERY_PAGE_SIZE = 10

  // Banner tab
  const [bannerMedia, setBannerMedia] = useState<UploadedMedia[]>([])
  const [bannerPosts, setBannerPosts] = useState<BannerPost[]>([])
  const [loadingBanners, setLoadingBanners] = useState(false)
  const [bannerBlogId, setBannerBlogId] = useState('')
  const [slideForm, setSlideForm] = useState<SlideForm | null>(null)
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null)  // toggle/move đang xử lý

  // Shared
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setMediaList(ls<UploadedMedia>(STORAGE_KEY))
    setBannerMedia(ls<UploadedMedia>(BANNER_STORAGE_KEY))
    setGalleryMedia(ls<UploadedMedia>(GALLERY_STORAGE_KEY))
  }, [])

  // ── Fetch banner slides (admin API — hiện cả draft) ───────────────────────
  const fetchBannerPosts = useCallback(async (blogId?: string) => {
    const id = blogId ?? bannerBlogId
    if (!id) return
    setLoadingBanners(true)
    try {
      const res = await blogPostAdminGetList({ query: { BlogId: id, MaxResultCount: 50 } })
      const items = (res.data as any)?.items ?? []
      const posts: BannerPost[] = items.map((p: any) => {
        const { order, imageUrl, caption } = parseShortDesc(p.shortDescription, p.coverImageMediaId)
        return {
          id: p.id,
          title: p.title ?? '',
          slug: p.slug ?? '',
          imageUrl,
          caption,
          status: p.status ?? 0,
          order,
          concurrencyStamp: p.concurrencyStamp,
          rawShortDescription: p.shortDescription ?? '',
        }
      })
      // Sắp xếp theo thứ tự
      posts.sort((a, b) => a.order - b.order)
      setBannerPosts(posts)
    } catch {
      toast({ title: 'Lỗi tải danh sách slides', variant: 'destructive' })
    } finally {
      setLoadingBanners(false)
    }
  }, [bannerBlogId, toast])

  useEffect(() => {
    if (tab !== 'banner') return
    blogAdminGetAllList().then((res) => {
      const blogs = res.data?.items ?? []
      const bannerBlog = blogs.find((b: any) =>
        (b.slug ?? b.name ?? '').toLowerCase().includes('banner')
      )
      if (bannerBlog?.id) {
        setBannerBlogId(bannerBlog.id)
        fetchBannerPosts(bannerBlog.id)
      } else {
        setLoadingBanners(false)
      }
    }).catch(() => setLoadingBanners(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  // Helper: revalidate trang chủ
  const revalidate = () => fetch('/api/admin/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/' }),
  }).catch(() => {})

  // ── Upload ────────────────────────────────────────────────────────────────────
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const doUpload = async (files: FileList, isBanner: boolean, isGallery = false) => {
    setIsUploading(true)
    const statuses: UploadStatus[] = Array.from(files).map((f) => ({ name: f.name, status: 'uploading' as const }))
    setUploadStatuses([...statuses])
    const uploaded: UploadedMedia[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const res = await mediaDescriptorAdminCreate({
          path: { entityType: 'BlogPost' },
          query: { Name: file.name },
          body: { File: file },
        })
        if (res.error || !res.data?.id) {
          statuses[i] = { name: file.name, status: 'error', message: (res.error as any)?.error?.message ?? 'Lỗi' }
          setUploadStatuses([...statuses])
          continue
        }
        const item: UploadedMedia = {
          id: res.data.id,
          name: file.name,
          url: `/api/cms-kit/media/${res.data.id}`,
          uploadedAt: new Date().toLocaleString('vi-VN'),
          doctorSlug: isBanner ? undefined : (selectedDoctor || undefined),
        }
        uploaded.push(item)

        if (!isBanner && selectedDoctor) {
          try {
            await updateDoctorMediaId(selectedDoctor, res.data.id)
            const dn = DOCTORS.find((d) => d.slug === selectedDoctor)?.name ?? selectedDoctor
            statuses[i] = { name: file.name, status: 'success', message: `Đã gán cho ${dn}` }
          } catch {
            statuses[i] = { name: file.name, status: 'success', message: 'Upload OK (gán bác sĩ thất bại)' }
          }
        } else {
          statuses[i] = { name: file.name, status: 'success' }
        }
      } catch (err: any) {
        statuses[i] = { name: file.name, status: 'error', message: err?.message ?? 'Lỗi' }
      }
      setUploadStatuses([...statuses])
    }

    if (uploaded.length > 0) {
      if (isGallery) {
        setGalleryMedia((prev) => { const u = [...uploaded, ...prev]; lsSave(GALLERY_STORAGE_KEY, u); return u })
        toast({ title: `Upload ${uploaded.length} ảnh thành công`, description: 'Copy URL để chèn vào bài viết' })
      } else if (isBanner) {
        setBannerMedia((prev) => { const u = [...uploaded, ...prev]; lsSave(BANNER_STORAGE_KEY, u); return u })
        if (uploaded.length === 1) {
          setSlideForm({ mediaItem: uploaded[0], title: '', caption: '', saving: false })
        }
        toast({ title: `Upload ${uploaded.length} ảnh thành công`, description: 'Điền tiêu đề bên dưới để tạo slide' })
      } else {
        setMediaList((prev) => { const u = [...uploaded, ...prev]; lsSave(STORAGE_KEY, u); return u })
        toast({ title: `Upload ${uploaded.length} file thành công` })
      }
    }

    const failCount = statuses.filter((s) => s.status === 'error').length
    if (failCount > 0) toast({ title: `${failCount} file thất bại`, variant: 'destructive' })

    setIsUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (bannerRef.current) bannerRef.current.value = ''
    setTimeout(() => setUploadStatuses([]), 6000)
  }

  // ── Tạo slide ─────────────────────────────────────────────────────────────
  const handleCreateSlide = async () => {
    if (!slideForm) return
    const { mediaItem, title, caption } = slideForm
    if (!title.trim()) { toast({ title: 'Vui lòng nhập tiêu đề', variant: 'destructive' }); return }
    if (!bannerBlogId) { toast({ title: 'Chưa tìm thấy blog banner-slide', description: 'Hãy tạo blog có slug "banner-slide" trong CMS → Blogs', variant: 'destructive' }); return }

    setSlideForm((f) => f ? { ...f, saving: true } : null)

    // Gán thứ tự cuối + 1
    const maxOrder = bannerPosts.reduce((m, p) => Math.max(m, p.order === 99 ? 0 : p.order), 0)
    const nextOrder = maxOrder + 1
    const slug = generateSlug(title) + '-' + Date.now().toString(36)
    const shortDescription = buildShortDesc(nextOrder, mediaItem.url, caption.trim())

    const res = await blogPostAdminCreate({
      body: { blogId: bannerBlogId, title: title.trim(), slug, shortDescription },
    })

    if (res.error || !res.data?.id) {
      const msg = (res.error as any)?.error?.message ?? 'Lỗi tạo bài viết'
      toast({ title: 'Lỗi', description: msg, variant: 'destructive' })
      setSlideForm((f) => f ? { ...f, saving: false } : null)
      return
    }

    await blogPostAdminPublish({ path: { id: res.data.id } })
    await revalidate()

    toast({ title: '✓ Slide đã tạo và xuất bản!', description: `"${title}" đã xuất hiện trên trang chủ` })
    setSlideForm(null)
    await fetchBannerPosts()
  }

  // ── Bật / Tắt slide ───────────────────────────────────────────────────────
  const handleToggleSlide = async (post: BannerPost) => {
    setSavingSlideId(post.id)
    try {
      if (post.status === 1) {
        await blogPostAdminDraft({ path: { id: post.id } })
        toast({ title: `Đã ẩn slide "${post.title}"` })
      } else {
        await blogPostAdminPublish({ path: { id: post.id } })
        toast({ title: `Đã bật slide "${post.title}"` })
      }
      await revalidate()
      await fetchBannerPosts()
    } catch {
      toast({ title: 'Lỗi cập nhật trạng thái', variant: 'destructive' })
    } finally {
      setSavingSlideId(null)
    }
  }

  // ── Di chuyển slide (lên / xuống) ────────────────────────────────────────
  const handleMoveSlide = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= bannerPosts.length) return

    const a = bannerPosts[idx]
    const b = bannerPosts[targetIdx]
    setSavingSlideId(a.id)

    try {
      // Tính lại order: hoán đổi order giữa 2 posts
      const orderA = b.order === 99 ? targetIdx + 1 : b.order
      const orderB = a.order === 99 ? idx + 1 : a.order

      const { imageUrl: imgA, caption: capA } = parseShortDesc(a.rawShortDescription)
      const { imageUrl: imgB, caption: capB } = parseShortDesc(b.rawShortDescription)

      await Promise.all([
        blogPostAdminUpdate({
          path: { id: a.id },
          body: { title: a.title, slug: a.slug, shortDescription: buildShortDesc(orderA, imgA, capA), concurrencyStamp: a.concurrencyStamp ?? undefined },
        }),
        blogPostAdminUpdate({
          path: { id: b.id },
          body: { title: b.title, slug: b.slug, shortDescription: buildShortDesc(orderB, imgB, capB), concurrencyStamp: b.concurrencyStamp ?? undefined },
        }),
      ])

      await revalidate()
      await fetchBannerPosts()
    } catch (err: any) {
      toast({ title: 'Lỗi đổi vị trí', description: err?.message, variant: 'destructive' })
    } finally {
      setSavingSlideId(null)
    }
  }

  // ── Xóa slide ─────────────────────────────────────────────────────────────
  const handleDeleteSlide = async (post: BannerPost) => {
    if (!confirm(`Xóa slide "${post.title}"?`)) return
    setSavingSlideId(post.id)
    try {
      await blogPostAdminDelete({ path: { id: post.id } })
      await revalidate()
      await fetchBannerPosts()
      toast({ title: 'Đã xóa slide', description: post.title })
    } catch {
      toast({ title: 'Lỗi xóa slide', variant: 'destructive' })
    } finally {
      setSavingSlideId(null)
    }
  }

  const handleDelete = async (id: string, name: string, isBanner = false) => {
    if (!confirm(`Xóa ảnh "${name}"?`)) return
    try {
      await mediaDescriptorAdminDelete({ path: { id } })
      if (isBanner) {
        setBannerMedia((prev) => { const u = prev.filter((m) => m.id !== id); lsSave(BANNER_STORAGE_KEY, u); return u })
        if (slideForm?.mediaItem.id === id) setSlideForm(null)
      } else {
        setMediaList((prev) => { const u = prev.filter((m) => m.id !== id); lsSave(STORAGE_KEY, u); return u })
      }
      toast({ title: 'Đã xóa', description: name })
    } catch {
      toast({ title: 'Lỗi xóa', variant: 'destructive' })
    }
  }

  const handleAssignDoctor = async (mediaId: string, slug: string) => {
    try {
      await updateDoctorMediaId(slug, mediaId)
      const dn = DOCTORS.find((d) => d.slug === slug)?.name ?? slug
      setMediaList((prev) => { const u = prev.map((m) => m.id === mediaId ? { ...m, doctorSlug: slug } : m); lsSave(STORAGE_KEY, u); return u })
      toast({ title: `Đã gán cho ${dn}` })
    } catch {
      toast({ title: 'Lỗi', variant: 'destructive' })
    }
  }

  const copyText = (text: string, label = 'URL') => {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã copy ${label}` })
  }

  const tabCls = (t: Tab) =>
    `flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t ? 'border-blue-600 text-blue-600 bg-white dark:bg-gray-900'
               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`

  const publishedCount = bannerPosts.filter((p) => p.status === 1).length

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/cms')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-sm text-muted-foreground">Upload và quản lý ảnh cho website</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'doctor' && (
            <>
              <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-background">
                <option value="">-- Không gán bác sĩ --</option>
                {DOCTORS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
              </select>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files?.length && doUpload(e.target.files, false)} />
              <Button onClick={() => fileRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? 'Đang upload...' : 'Upload ảnh'}
              </Button>
            </>
          )}
          {tab === 'banner' && (
            <>
              <input ref={bannerRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files?.length && doUpload(e.target.files, true)} />
              <Button variant="outline" onClick={() => bannerRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? 'Đang upload...' : 'Upload ảnh banner'}
              </Button>
            </>
          )}
          {tab === 'gallery' && (
            <>
              <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => e.target.files?.length && doUpload(e.target.files, false, true)} />
              <Button onClick={() => galleryRef.current?.click()} disabled={isUploading}>
                {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                {isUploading ? 'Đang upload...' : 'Upload ảnh'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-5 gap-1">
        <button className={tabCls('doctor')} onClick={() => setTab('doctor')}>
          <UserRound className="w-4 h-4" />Ảnh bác sĩ
        </button>
        <button className={tabCls('banner')} onClick={() => setTab('banner')}>
          <Images className="w-4 h-4" />Banner Slide
          {bannerPosts.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full">{publishedCount}/{bannerPosts.length}</span>
          )}
        </button>
        <button className={tabCls('gallery')} onClick={() => setTab('gallery')}>
          <ImageIcon className="w-4 h-4" />Thư viện ảnh
          {galleryMedia.length > 0 && (
            <span className="ml-1 bg-teal-100 text-teal-700 text-xs px-1.5 rounded-full">{galleryMedia.length}</span>
          )}
        </button>
      </div>

      {/* Upload Status */}
      {uploadStatuses.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploadStatuses.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm border ${
              s.status === 'uploading' ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : s.status === 'success'  ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {s.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {s.status === 'success'   && <CheckCircle2 className="w-4 h-4" />}
              {s.status === 'error'     && <XCircle className="w-4 h-4" />}
              <span className="font-medium">{s.name}</span>
              <span className="ml-auto text-xs">{s.status === 'uploading' ? 'Đang upload...' : (s.message ?? (s.status === 'success' ? 'Thành công' : 'Thất bại'))}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─────────── TAB: Bác sĩ ─────────────────────────────────────────── */}
      {tab === 'doctor' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
            <strong>Cách dùng nhanh:</strong> Chọn bác sĩ trong dropdown → Upload ảnh →{' '}
            <strong>ID tự động ghi vào doctors.ts</strong>, không cần copy thủ công.
          </div>
          {mediaList.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}>
              <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-muted-foreground text-sm">Nhấn để upload ảnh đầu tiên</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mediaList.map((media) => (
                <Card key={media.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.url} alt={media.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    {media.doctorSlug && (
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-xs px-1.5 py-0.5 truncate">
                        {DOCTORS.find((d) => d.slug === media.doctorSlug)?.name ?? media.doctorSlug}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground truncate mb-1">{media.name}</p>
                    <p className="text-xs text-gray-400 mb-2">{media.uploadedAt}</p>
                    <div className="flex gap-1 mb-1">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => copyText(media.id, 'mediaId')}>
                        <Copy className="w-3 h-3 mr-1" />Copy ID
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(media.id, media.name, false)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <select className="w-full text-xs border rounded px-1 py-1 bg-background"
                      value={media.doctorSlug ?? ''}
                      onChange={(e) => e.target.value && handleAssignDoctor(media.id, e.target.value)}>
                      <option value="">Gán cho bác sĩ...</option>
                      {DOCTORS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─────────── TAB: Banner Slide ───────────────────────────────────── */}
      {tab === 'banner' && (
        <div className="space-y-6">

          {/* ── BƯỚC 1: Upload ảnh ─────────────────────────────────────── */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <span className="font-semibold text-sm">Upload ảnh banner</span>
              <span className="text-xs text-gray-400 ml-1">— hỗ trợ nhiều file cùng lúc</span>
            </div>
            <div className="p-4">
              {bannerMedia.length === 0 ? (
                <div className="border-2 border-dashed border-amber-300 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:border-amber-400 transition-colors"
                  onClick={() => bannerRef.current?.click()}>
                  <Images className="w-10 h-10 text-amber-400 mb-2" />
                  <p className="text-sm text-gray-500">Nhấn <strong>Upload ảnh banner</strong> ở trên hoặc click vào đây</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {bannerMedia.map((media) => {
                    const isSelected = slideForm?.mediaItem.id === media.id
                    return (
                      <div key={media.id}
                        className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSlideForm(isSelected ? null : { mediaItem: media, title: '', caption: '', saving: false })}
                      >
                        <div className="aspect-video bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                            <CheckSquare className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 flex items-center justify-between">
                          <span className="text-white text-xs truncate">{isSelected ? 'Đang chọn' : 'Chọn'}</span>
                          <button
                            className="text-red-300 hover:text-red-400"
                            onClick={(e) => { e.stopPropagation(); handleDelete(media.id, media.name, true) }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  <div
                    className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => bannerRef.current?.click()}
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Thêm ảnh</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BƯỚC 2: Điền thông tin slide ────────────────────────────── */}
          <div className={`border rounded-xl overflow-hidden transition-opacity ${!slideForm ? 'opacity-50' : ''}`}>
            <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <span className="font-semibold text-sm">Điền thông tin slide</span>
              {!slideForm && <span className="text-xs text-gray-400 ml-1">— chọn ảnh ở bước 1 trước</span>}
            </div>
            <div className="p-4">
              {!slideForm ? (
                <p className="text-sm text-gray-400 text-center py-4">← Nhấn vào một ảnh ở bước 1 để bắt đầu</p>
              ) : (
                <div className="flex gap-4 items-start">
                  <div className="w-40 shrink-0 rounded-lg overflow-hidden border aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={slideForm.mediaItem.url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Tiêu đề slide <span className="text-red-500">*</span></label>
                      <Input
                        placeholder="VD: Chào mừng đến Bệnh viện Hồng Ngọc"
                        value={slideForm.title}
                        onChange={(e) => setSlideForm((f) => f ? { ...f, title: e.target.value } : null)}
                        maxLength={100}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Chú thích phụ <span className="text-gray-400">(tuỳ chọn)</span></label>
                      <Input
                        placeholder="VD: Đội ngũ chuyên gia sản phụ khoa hàng đầu"
                        value={slideForm.caption}
                        onChange={(e) => setSlideForm((f) => f ? { ...f, caption: e.target.value } : null)}
                        maxLength={150}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={handleCreateSlide}
                        disabled={slideForm.saving || !slideForm.title.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {slideForm.saving
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</>
                          : <><CheckCircle2 className="w-4 h-4 mr-2" />Tạo & Xuất bản slide</>
                        }
                      </Button>
                      <Button variant="ghost" onClick={() => setSlideForm(null)}>Huỷ</Button>
                      <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Slide sẽ xuất hiện ngay trên trang chủ
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── BƯỚC 3: Quản lý slides ───────────────────────────────────── */}
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span className="font-semibold text-sm">Quản lý slides</span>
                {bannerPosts.length > 0 && (
                  <span className="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {publishedCount} đang hiện / {bannerPosts.length} tổng
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Kéo mũi tên ↑↓ để đổi vị trí · Bật/Tắt để ẩn hoặc hiện slide</p>
            </div>

            <div className="p-4">
              {loadingBanners ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />Đang tải danh sách...
                </div>
              ) : bannerPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <Images className="w-8 h-8" />
                  <p className="text-sm">Chưa có slide nào — hoàn thành bước 1 và 2 để tạo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header row */}
                  <div className="hidden md:grid grid-cols-[2.5rem_5rem_1fr_7rem_8rem] gap-3 px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide border-b pb-2">
                    <span>STT</span>
                    <span>Ảnh</span>
                    <span>Tiêu đề / Chú thích</span>
                    <span className="text-center">Trạng thái</span>
                    <span className="text-right">Thao tác</span>
                  </div>

                  {bannerPosts.map((post, idx) => {
                    const isSaving = savingSlideId === post.id
                    const isPublished = post.status === 1
                    return (
                      <div
                        key={post.id}
                        className={`grid grid-cols-[2.5rem_5rem_1fr] md:grid-cols-[2.5rem_5rem_1fr_7rem_8rem] gap-3 items-center px-3 py-2.5 rounded-lg border transition-colors ${
                          isPublished ? 'bg-white dark:bg-gray-900 border-gray-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 opacity-70'
                        }`}
                      >
                        {/* STT */}
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-bold text-gray-500">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={idx === 0 || isSaving}
                              onClick={() => handleMoveSlide(idx, 'up')}
                              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-600"
                              title="Lên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={idx === bannerPosts.length - 1 || isSaving}
                              onClick={() => handleMoveSlide(idx, 'down')}
                              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-600"
                              title="Xuống"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-20 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                          {post.imageUrl
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" /></div>}
                        </div>

                        {/* Title + caption */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{post.title || '(chưa có tiêu đề)'}</p>
                          {post.caption && <p className="text-xs text-gray-400 truncate mt-0.5">{post.caption}</p>}
                        </div>

                        {/* Status toggle */}
                        <div className="hidden md:flex justify-center">
                          <button
                            disabled={isSaving}
                            onClick={() => handleToggleSlide(post)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              isPublished
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {isSaving
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                            }
                            {isPublished ? 'Đang hiện' : 'Đang ẩn'}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center justify-end gap-1">
                          <Link href={`/admin/cms/blog-posts/${post.id}/edit`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2">Sửa</Button>
                          </Link>
                          <Link href={`/blog/banner-slide/${post.slug}`} target="_blank">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Xem">
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                          <Button
                            size="sm" variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                            disabled={isSaving}
                            onClick={() => handleDeleteSlide(post)}
                            title="Xóa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Mobile: status + actions in one row (col-span full) */}
                        <div className="md:hidden col-span-3 flex items-center gap-2 pl-[5.5rem] mt-1">
                          <button
                            disabled={isSaving}
                            onClick={() => handleToggleSlide(post)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              isPublished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {isPublished ? 'Đang hiện' : 'Đang ẩn'}
                          </button>
                          <Link href={`/admin/cms/blog-posts/${post.id}/edit`}>
                            <Button size="sm" variant="outline" className="h-6 text-xs px-2">Sửa</Button>
                          </Link>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400"
                            onClick={() => handleDeleteSlide(post)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ══ TAB: THƯ VIỆN ẢNH ══════════════════════════════════════════════════ */}
      {tab === 'gallery' && (
        <div className="space-y-6">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
            <strong>Hướng dẫn:</strong> Upload ảnh → Copy URL → Paste vào nội dung bài viết qua editor. Bài viết có ≥2 ảnh sẽ tự động hiển thị grid thư viện ảnh bên dưới nội dung.
          </div>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
            onClick={() => galleryRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files.length && doUpload(e.dataTransfer.files, false, true) }}
          >
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Kéo thả ảnh vào đây</p>
              <p className="text-sm text-gray-400 mt-1">hoặc click để chọn file — hỗ trợ JPG, PNG, WebP</p>
            </div>
            {isUploading && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
          </div>

          {/* Grid ảnh đã upload */}
          {galleryMedia.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>Chưa có ảnh nào. Upload ảnh để bắt đầu.</p>
            </div>
          ) : (() => {
            const totalGalleryPages = Math.ceil(galleryMedia.length / GALLERY_PAGE_SIZE)
            const pageGallery = galleryMedia.slice(galleryPage * GALLERY_PAGE_SIZE, (galleryPage + 1) * GALLERY_PAGE_SIZE)
            return (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pageGallery.map((media) => (
                <div key={media.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col">
                  {/* Ảnh */}
                  <div className="relative aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={media.url} alt={media.name} className="w-full h-full object-cover" />

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => copyUrl(media.url, media.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full justify-center ${
                          copiedId === media.id
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-800 hover:bg-teal-50'
                        }`}
                      >
                        {copiedId === media.id ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Đã copy!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy URL</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const updated = galleryMedia.filter((m) => m.id !== media.id)
                          setGalleryMedia(updated)
                          lsSave(GALLERY_STORAGE_KEY, updated)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 w-full justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    </div>
                  </div>

                  {/* Input tiêu đề */}
                  <div className="px-2 pt-1.5 pb-2 border-t bg-white flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="Nhập tiêu đề ảnh..."
                      value={(media as UploadedMedia & { title?: string }).title ?? ''}
                      onChange={(e) => {
                        const updated = galleryMedia.map((m) =>
                          m.id === media.id ? { ...m, title: e.target.value } : m
                        )
                        setGalleryMedia(updated)
                        lsSave(GALLERY_STORAGE_KEY, updated)
                      }}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300"
                    />
                    <span className="text-[10px] text-gray-300 truncate">{media.name}</span>
                  </div>
                </div>
              ))}

              {/* Thêm ảnh */}
              <div
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
                onClick={() => galleryRef.current?.click()}
              >
                <Plus className="w-6 h-6 text-gray-300" />
                <span className="text-xs text-gray-400 mt-1">Thêm ảnh</span>
              </div>
            </div>

            {/* Pagination */}
            {totalGalleryPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setGalleryPage((p) => Math.max(p - 1, 0))}
                  disabled={galleryPage === 0}
                  className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-30 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 transition-colors"
                >
                  ‹ Trước
                </button>
                {Array.from({ length: totalGalleryPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setGalleryPage(i)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                      i === galleryPage
                        ? 'bg-teal-600 text-white'
                        : 'border hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setGalleryPage((p) => Math.min(p + 1, totalGalleryPages - 1))}
                  disabled={galleryPage === totalGalleryPages - 1}
                  className="px-3 py-1.5 rounded border text-xs font-medium disabled:opacity-30 hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 transition-colors"
                >
                  Sau ›
                </button>
              </div>
            )}
            </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
