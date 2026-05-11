import { CheckCircle2, Copy, ImageIcon, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import type { RefObject } from 'react'
import { lsSave, GALLERY_STORAGE_KEY } from '../_utils'
import type { UploadedMedia } from '../types'

const GALLERY_PAGE_SIZE = 10

interface GalleryTabProps {
  galleryMedia: UploadedMedia[]
  setGalleryMedia: (v: UploadedMedia[] | ((prev: UploadedMedia[]) => UploadedMedia[])) => void
  galleryRef: RefObject<HTMLInputElement | null>
  copiedId: string | null
  galleryPage: number
  setGalleryPage: (v: number | ((prev: number) => number)) => void
  isUploading: boolean
  copyUrl: (url: string, id: string) => void
  doUpload: (files: FileList, isBanner: boolean, isGallery?: boolean) => void
}

export function GalleryTab({
  galleryMedia, setGalleryMedia, galleryRef, copiedId,
  galleryPage, setGalleryPage, isUploading, copyUrl, doUpload,
}: GalleryTabProps) {
  const totalGalleryPages = Math.ceil(galleryMedia.length / GALLERY_PAGE_SIZE)
  const pageGallery = galleryMedia.slice(
    galleryPage * GALLERY_PAGE_SIZE,
    (galleryPage + 1) * GALLERY_PAGE_SIZE
  )

  return (
    <div className="space-y-6">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
        <strong>Hướng dẫn:</strong> Upload ảnh → Copy URL → Paste vào nội dung bài viết qua editor.
        Bài viết có ≥2 ảnh sẽ tự động hiển thị grid thư viện ảnh bên dưới nội dung.
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all"
        onClick={() => galleryRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files.length && doUpload(e.dataTransfer.files, false, true) }}
      >
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files?.length && doUpload(e.target.files, false, true)} />
        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
          <Upload className="w-6 h-6 text-teal-600" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700">Kéo thả ảnh vào đây</p>
          <p className="text-sm text-gray-400 mt-1">hoặc click để chọn file — hỗ trợ JPG, PNG, WebP</p>
        </div>
        {isUploading && <Loader2 className="w-5 h-5 animate-spin text-teal-600" />}
      </div>

      {galleryMedia.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có ảnh nào. Upload ảnh để bắt đầu.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pageGallery.map((media) => (
              <div key={media.id} className="group relative rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col">
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <button
                      onClick={() => copyUrl(media.url, media.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors w-full justify-center ${
                        copiedId === media.id ? 'bg-green-500 text-white' : 'bg-white text-gray-800 hover:bg-teal-50'
                      }`}
                    >
                      {copiedId === media.id
                        ? <><CheckCircle2 className="w-3.5 h-3.5" /> Đã copy!</>
                        : <><Copy className="w-3.5 h-3.5" /> Copy URL</>}
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
                <div className="px-2 pt-1.5 pb-2 border-t bg-white flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="Nhập tiêu đề ảnh..."
                    value={media.title ?? ''}
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

            <div
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
              onClick={() => galleryRef.current?.click()}
            >
              <Plus className="w-6 h-6 text-gray-300" />
              <span className="text-xs text-gray-400 mt-1">Thêm ảnh</span>
            </div>
          </div>

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
                <button key={i} onClick={() => setGalleryPage(i)}
                  className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                    i === galleryPage
                      ? 'bg-teal-600 text-white'
                      : 'border hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 text-gray-600'
                  }`}>
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
      )}
    </div>
  )
}
