'use client'

import {
  blogAdminGetAllList,
  blogPostAdminCreate, blogPostAdminDelete, blogPostAdminDraft,
  blogPostAdminGetList, blogPostAdminPublish, blogPostAdminUpdate,
  mediaDescriptorAdminCreate, mediaDescriptorAdminDelete,
} from '@/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { updateDoctorMediaId } from '@/lib/actions/updateDoctorMedia'
import { DOCTORS } from '@/lib/data/doctors'
import { ImageIcon, Images, Loader2, UserRound } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BANNER_STORAGE_KEY, buildShortDesc, GALLERY_STORAGE_KEY,
  generateSlug, ls, lsSave, parseShortDesc, STORAGE_KEY,
} from './_utils'
import { BannerTab } from './_components/BannerTab'
import { DoctorTab } from './_components/DoctorTab'
import { GalleryTab } from './_components/GalleryTab'
import { UploadStatusList } from './_components/UploadStatusList'
import type { BannerPost, SlideForm, Tab, UploadedMedia, UploadStatus } from './types'

export default function MediaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [tab, setTab] = useState<Tab>('doctor')

  // Doctor tab
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  // Gallery tab
  const [galleryMedia, setGalleryMedia] = useState<UploadedMedia[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [galleryPage, setGalleryPage] = useState(0)

  // Banner tab
  const [bannerMedia, setBannerMedia] = useState<UploadedMedia[]>([])
  const [bannerPosts, setBannerPosts] = useState<BannerPost[]>([])
  const [loadingBanners, setLoadingBanners] = useState(false)
  const [bannerBlogId, setBannerBlogId] = useState('')
  const [slideForm, setSlideForm] = useState<SlideForm | null>(null)
  const [savingSlideId, setSavingSlideId] = useState<string | null>(null)

  // Shared
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    setMediaList(ls<UploadedMedia>(STORAGE_KEY))
    setBannerMedia(ls<UploadedMedia>(BANNER_STORAGE_KEY))
    setGalleryMedia(ls<UploadedMedia>(GALLERY_STORAGE_KEY))
  }, [])

  // ── Fetch banner slides ────────────────────────────────────────────────────
  const fetchBannerPosts = useCallback(async (blogId?: string) => {
    const id = blogId ?? bannerBlogId
    if (!id) return
    setLoadingBanners(true)
    try {
      const res = await blogPostAdminGetList({ query: { BlogId: id, MaxResultCount: 50 } })
      const items = (res.data as { items?: unknown[] })?.items ?? []
      const posts: BannerPost[] = (items as Record<string, unknown>[]).map((p) => {
        const { order, imageUrl, caption } = parseShortDesc(
          p.shortDescription as string | null,
          p.coverImageMediaId as string | null
        )
        return {
          id: p.id as string,
          title: (p.title as string) ?? '',
          slug: (p.slug as string) ?? '',
          imageUrl,
          caption,
          status: (p.status as number) ?? 0,
          order,
          concurrencyStamp: p.concurrencyStamp as string | null,
          rawShortDescription: (p.shortDescription as string) ?? '',
        }
      })
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
      const bannerBlog = (blogs as Record<string, unknown>[]).find((b) =>
        ((b.slug ?? b.name) as string ?? '').toLowerCase().includes('banner')
      )
      if (bannerBlog?.id) {
        setBannerBlogId(bannerBlog.id as string)
        fetchBannerPosts(bannerBlog.id as string)
      } else {
        setLoadingBanners(false)
      }
    }).catch(() => setLoadingBanners(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const revalidate = () => fetch('/api/admin/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: '/' }),
  }).catch(() => {})

  // ── Upload ────────────────────────────────────────────────────────────────
  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyText = (text: string, label = 'URL') => {
    navigator.clipboard.writeText(text)
    toast({ title: `Đã copy ${label}` })
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
          statuses[i] = { name: file.name, status: 'error', message: (res.error as { error?: { message?: string } })?.error?.message ?? 'Lỗi' }
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
      } catch (err: unknown) {
        statuses[i] = { name: file.name, status: 'error', message: (err as Error)?.message ?? 'Lỗi' }
      }
      setUploadStatuses([...statuses])
    }

    if (uploaded.length > 0) {
      if (isGallery) {
        setGalleryMedia((prev) => { const u = [...uploaded, ...prev]; lsSave(GALLERY_STORAGE_KEY, u); return u })
        toast({ title: `Upload ${uploaded.length} ảnh thành công`, description: 'Copy URL để chèn vào bài viết' })
      } else if (isBanner) {
        setBannerMedia((prev) => { const u = [...uploaded, ...prev]; lsSave(BANNER_STORAGE_KEY, u); return u })
        if (uploaded.length === 1) setSlideForm({ mediaItem: uploaded[0], title: '', caption: '', saving: false })
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

  // ── Slide handlers ────────────────────────────────────────────────────────
  const handleCreateSlide = async () => {
    if (!slideForm) return
    const { mediaItem, title, caption } = slideForm
    if (!title.trim()) { toast({ title: 'Vui lòng nhập tiêu đề', variant: 'destructive' }); return }
    if (!bannerBlogId) { toast({ title: 'Chưa tìm thấy blog banner-slide', description: 'Hãy tạo blog có slug "banner-slide" trong CMS → Blogs', variant: 'destructive' }); return }

    setSlideForm((f) => f ? { ...f, saving: true } : null)
    const maxOrder = bannerPosts.reduce((m, p) => Math.max(m, p.order === 99 ? 0 : p.order), 0)
    const slug = generateSlug(title) + '-' + Date.now().toString(36)
    const shortDescription = buildShortDesc(maxOrder + 1, mediaItem.url, caption.trim())

    const res = await blogPostAdminCreate({
      body: { blogId: bannerBlogId, title: title.trim(), slug, shortDescription },
    })
    if (res.error || !res.data?.id) {
      toast({ title: 'Lỗi', description: (res.error as { error?: { message?: string } })?.error?.message ?? 'Lỗi tạo bài viết', variant: 'destructive' })
      setSlideForm((f) => f ? { ...f, saving: false } : null)
      return
    }

    await blogPostAdminPublish({ path: { id: res.data.id } })
    await revalidate()
    toast({ title: '✓ Slide đã tạo và xuất bản!', description: `"${title}" đã xuất hiện trên trang chủ` })
    setSlideForm(null)
    await fetchBannerPosts()
  }

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

  const handleMoveSlide = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= bannerPosts.length) return
    const a = bannerPosts[idx]
    const b = bannerPosts[targetIdx]
    setSavingSlideId(a.id)
    try {
      const orderA = b.order === 99 ? targetIdx + 1 : b.order
      const orderB = a.order === 99 ? idx + 1 : a.order
      const { imageUrl: imgA, caption: capA } = parseShortDesc(a.rawShortDescription)
      const { imageUrl: imgB, caption: capB } = parseShortDesc(b.rawShortDescription)
      await Promise.all([
        blogPostAdminUpdate({ path: { id: a.id }, body: { title: a.title, slug: a.slug, shortDescription: buildShortDesc(orderA, imgA, capA), concurrencyStamp: a.concurrencyStamp ?? undefined } }),
        blogPostAdminUpdate({ path: { id: b.id }, body: { title: b.title, slug: b.slug, shortDescription: buildShortDesc(orderB, imgB, capB), concurrencyStamp: b.concurrencyStamp ?? undefined } }),
      ])
      await revalidate()
      await fetchBannerPosts()
    } catch (err: unknown) {
      toast({ title: 'Lỗi đổi vị trí', description: (err as Error)?.message, variant: 'destructive' })
    } finally {
      setSavingSlideId(null)
    }
  }

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

  const tabCls = (t: Tab) =>
    `flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      tab === t
        ? 'border-blue-600 text-blue-600 bg-white dark:bg-gray-900'
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

      <UploadStatusList statuses={uploadStatuses} />

      {tab === 'doctor' && (
        <DoctorTab
          mediaList={mediaList}
          fileRef={fileRef}
          selectedDoctor={selectedDoctor}
          setSelectedDoctor={setSelectedDoctor}
          isUploading={isUploading}
          doUpload={doUpload}
          handleDelete={handleDelete}
          handleAssignDoctor={handleAssignDoctor}
          copyText={copyText}
        />
      )}

      {tab === 'banner' && (
        <BannerTab
          bannerMedia={bannerMedia}
          bannerPosts={bannerPosts}
          loadingBanners={loadingBanners}
          slideForm={slideForm}
          setSlideForm={setSlideForm}
          savingSlideId={savingSlideId}
          bannerRef={bannerRef}
          isUploading={isUploading}
          publishedCount={publishedCount}
          doUpload={doUpload}
          handleCreateSlide={handleCreateSlide}
          handleToggleSlide={handleToggleSlide}
          handleMoveSlide={handleMoveSlide}
          handleDeleteSlide={handleDeleteSlide}
          handleDelete={handleDelete}
        />
      )}

      {tab === 'gallery' && (
        <GalleryTab
          galleryMedia={galleryMedia}
          setGalleryMedia={setGalleryMedia}
          galleryRef={galleryRef}
          copiedId={copiedId}
          galleryPage={galleryPage}
          setGalleryPage={setGalleryPage}
          isUploading={isUploading}
          copyUrl={copyUrl}
          doUpload={doUpload}
        />
      )}
    </div>
  )
}
