'use client'

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'

const PAGE_SIZE = 12

function extractImages(html: string): string[] {
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  const srcs: string[] = []
  for (const m of matches) {
    if (m[1]) srcs.push(m[1])
  }
  return srcs
}

type GalleryItem = { url: string; title?: string }

function loadPostGallery(postId: string): GalleryItem[] {
  try { return JSON.parse(localStorage.getItem(`cms-post-gallery-${postId}`) ?? '[]') } catch { return [] }
}

function loadGlobalGallery(): GalleryItem[] {
  try { return JSON.parse(localStorage.getItem('cms-gallery-media') ?? '[]') } catch { return [] }
}

export function ImageGallery({ html, postId }: { html: string; postId?: string }) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [page, setPage] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const pageItems = items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const allUrls = items.map((i) => i.url)

  useEffect(() => {
    const postGallery = postId ? loadPostGallery(postId) : []
    const globalGallery = loadGlobalGallery()
    const contentItems: GalleryItem[] = extractImages(html).map((url) => ({ url }))
    const seen = new Set<string>()
    const merged: GalleryItem[] = []
    for (const item of [...postGallery, ...globalGallery, ...contentItems]) {
      if (!seen.has(item.url)) { seen.add(item.url); merged.push(item) }
    }
    setItems(merged)
    setPage(0)
  }, [html, postId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightbox === null) return
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((p) => p !== null ? Math.min(p + 1, allUrls.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightbox((p) => p !== null ? Math.max(p - 1, 0) : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [allUrls.length, lightbox])

  if (items.length === 0) return null

  return (
    <>
      <div className="mt-10 border-t pt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ZoomIn className="w-5 h-5 text-teal-600" />
          Thư viện ảnh
          <span className="text-sm font-normal text-gray-400">({items.length} ảnh)</span>
        </h3>

        {/* Grid ảnh — trang hiện tại */}
        <div className="grid grid-cols-3 gap-4">
          {pageItems.map((item, i) => {
            const globalIdx = page * PAGE_SIZE + i
            return (
              <div
                key={globalIdx}
                className="cursor-zoom-in rounded-xl overflow-hidden group border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"
                onClick={() => setLightbox(globalIdx)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.title ?? `Ảnh ${globalIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                    <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
                {item.title && (
                  <div className="px-3 py-3 text-sm font-semibold text-gray-800 text-center line-clamp-2 leading-snug">
                    {item.title}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  i === page
                    ? 'bg-teal-600 text-white shadow'
                    : 'border hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700 text-gray-600'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[90vh] flex items-center gap-4">
            <button
              disabled={lightbox === 0}
              onClick={() => setLightbox((p) => Math.max((p ?? 0) - 1, 0))}
              className="text-white/60 hover:text-white disabled:opacity-20 transition-colors p-2 text-3xl select-none"
            >‹</button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={allUrls[lightbox]}
              alt={`Ảnh ${lightbox + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            <button
              disabled={lightbox === allUrls.length - 1}
              onClick={() => setLightbox((p) => Math.min((p ?? 0) + 1, allUrls.length - 1))}
              className="text-white/60 hover:text-white disabled:opacity-20 transition-colors p-2 text-3xl select-none"
            >›</button>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox + 1} / {allUrls.length}
          </div>
        </div>
      )}
    </>
  )
}
