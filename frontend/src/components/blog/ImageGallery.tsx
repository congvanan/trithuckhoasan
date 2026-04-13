'use client'

import { X, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'

// Extract tất cả <img> src từ HTML content
function extractImages(html: string): string[] {
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  const srcs: string[] = []
  for (const m of matches) {
    if (m[1]) srcs.push(m[1])
  }
  return srcs
}

export function ImageGallery({ html }: { html: string }) {
  const [images, setImages] = useState<string[]>([])
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    setImages(extractImages(html))
  }, [html])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((p) => p !== null ? Math.min(p + 1, images.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightbox((p) => p !== null ? Math.max(p - 1, 0) : null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [images.length])

  if (images.length < 2) return null

  return (
    <>
      <div className="mt-10 border-t pt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ZoomIn className="w-5 h-5 text-teal-600" />
          Thư viện ảnh
          <span className="text-sm font-normal text-gray-400">({images.length} ảnh)</span>
        </h3>

        {/* Masonry grid */}
        <div className="columns-2 sm:columns-3 gap-2 space-y-2">
          {images.map((src, i) => (
            <div
              key={i}
              className="break-inside-avoid cursor-zoom-in overflow-hidden rounded-lg group relative"
              onClick={() => setLightbox(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Ảnh ${i + 1}`}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Đóng */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Ảnh */}
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl max-h-[90vh] flex items-center gap-4">
            {/* Prev */}
            <button
              disabled={lightbox === 0}
              onClick={() => setLightbox((p) => Math.max((p ?? 0) - 1, 0))}
              className="text-white/60 hover:text-white disabled:opacity-20 transition-colors p-2 text-3xl select-none"
            >
              ‹
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox]}
              alt={`Ảnh ${lightbox + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {/* Next */}
            <button
              disabled={lightbox === images.length - 1}
              onClick={() => setLightbox((p) => Math.min((p ?? 0) + 1, images.length - 1))}
              className="text-white/60 hover:text-white disabled:opacity-20 transition-colors p-2 text-3xl select-none"
            >
              ›
            </button>
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
