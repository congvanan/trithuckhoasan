import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowDown, ArrowUp, CheckCircle2, CheckSquare, ExternalLink,
  ImageIcon, Images, Loader2, Plus, Trash2, Upload,
} from 'lucide-react'
import Link from 'next/link'
import type { RefObject } from 'react'
import type { BannerPost, SlideForm, UploadedMedia } from '../types'

interface BannerTabProps {
  bannerMedia: UploadedMedia[]
  bannerPosts: BannerPost[]
  loadingBanners: boolean
  slideForm: SlideForm | null
  setSlideForm: (v: SlideForm | null | ((prev: SlideForm | null) => SlideForm | null)) => void
  savingSlideId: string | null
  bannerRef: RefObject<HTMLInputElement | null>
  isUploading: boolean
  publishedCount: number
  doUpload: (files: FileList, isBanner: boolean, isGallery?: boolean) => void
  handleCreateSlide: () => void
  handleToggleSlide: (post: BannerPost) => void
  handleMoveSlide: (idx: number, dir: 'up' | 'down') => void
  handleDeleteSlide: (post: BannerPost) => void
  handleDelete: (id: string, name: string, isBanner?: boolean) => void
}

export function BannerTab({
  bannerMedia, bannerPosts, loadingBanners, slideForm, setSlideForm,
  savingSlideId, bannerRef, isUploading, publishedCount,
  doUpload, handleCreateSlide, handleToggleSlide, handleMoveSlide,
  handleDeleteSlide, handleDelete,
}: BannerTabProps) {
  return (
    <div className="space-y-6">

      {/* ── BƯỚC 1: Upload ảnh ─────────────────────────────────────── */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <span className="font-semibold text-sm">Upload ảnh banner</span>
          <span className="text-xs text-gray-400 ml-1">— hỗ trợ nhiều file cùng lúc</span>
          <div className="ml-auto flex items-center gap-2">
            <input ref={bannerRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => e.target.files?.length && doUpload(e.target.files, true)} />
            <Button variant="outline" onClick={() => bannerRef.current?.click()} disabled={isUploading}>
              {isUploading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang upload...</>
                : <><Upload className="w-4 h-4 mr-2" />Upload ảnh banner</>}
            </Button>
          </div>
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
                      <button className="text-red-300 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); handleDelete(media.id, media.name, true) }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => bannerRef.current?.click()}>
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
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Tiêu đề slide <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="VD: Chào mừng đến Bệnh viện Hồng Ngọc"
                    value={slideForm.title}
                    onChange={(e) => setSlideForm((f) => f ? { ...f, title: e.target.value } : null)}
                    maxLength={100}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Chú thích phụ <span className="text-gray-400">(tuỳ chọn)</span>
                  </label>
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
                      : <><CheckCircle2 className="w-4 h-4 mr-2" />Tạo & Xuất bản slide</>}
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
              <div className="hidden md:grid grid-cols-[2.5rem_5rem_1fr_7rem_8rem] gap-3 px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide border-b pb-2">
                <span>STT</span><span>Ảnh</span><span>Tiêu đề / Chú thích</span>
                <span className="text-center">Trạng thái</span><span className="text-right">Thao tác</span>
              </div>

              {bannerPosts.map((post, idx) => {
                const isSaving = savingSlideId === post.id
                const isPublished = post.status === 1
                return (
                  <div key={post.id}
                    className={`grid grid-cols-[2.5rem_5rem_1fr] md:grid-cols-[2.5rem_5rem_1fr_7rem_8rem] gap-3 items-center px-3 py-2.5 rounded-lg border transition-colors ${
                      isPublished ? 'bg-white dark:bg-gray-900 border-gray-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 opacity-70'
                    }`}
                  >
                    {/* STT + move buttons */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-bold text-gray-500">{String(idx + 1).padStart(2, '0')}</span>
                      <div className="flex flex-col gap-0.5">
                        <button disabled={idx === 0 || isSaving} onClick={() => handleMoveSlide(idx, 'up')}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-600" title="Lên">
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button disabled={idx === bannerPosts.length - 1 || isSaving} onClick={() => handleMoveSlide(idx, 'down')}
                          className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-400 hover:text-gray-600" title="Xuống">
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

                    {/* Status toggle — desktop */}
                    <div className="hidden md:flex justify-center">
                      <button disabled={isSaving} onClick={() => handleToggleSlide(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isPublished
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}>
                        {isSaving
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-green-500' : 'bg-gray-400'}`} />}
                        {isPublished ? 'Đang hiện' : 'Đang ẩn'}
                      </button>
                    </div>

                    {/* Actions — desktop */}
                    <div className="hidden md:flex items-center justify-end gap-1">
                      <Link href={`/admin/cms/blog-posts/${post.id}/edit`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">Sửa</Button>
                      </Link>
                      <Link href={`/blog/banner-slide/${post.slug}`} target="_blank">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Xem">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                        disabled={isSaving} onClick={() => handleDeleteSlide(post)} title="Xóa">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Mobile: status + actions */}
                    <div className="md:hidden col-span-3 flex items-center gap-2 pl-[5.5rem] mt-1">
                      <button disabled={isSaving} onClick={() => handleToggleSlide(post)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isPublished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
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
  )
}
