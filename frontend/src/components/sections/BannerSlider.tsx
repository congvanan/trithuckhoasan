'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type BannerSlide = {
  id: string
  imageUrl: string
  title: string
  caption: string
  link: string
}

export function BannerSlider({ slides }: { slides: BannerSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = slides.length

  const go = (idx: number) => setCurrent((idx + total) % total)

  useEffect(() => {
    if (total <= 1 || paused) return
    timerRef.current = setTimeout(() => go(current + 1), 5000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, paused, total])

  if (total === 0) return null

  const slide = slides[current]

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900"
      style={{ height: 'clamp(220px, 42vw, 500px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.imageUrl}
            alt={s.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ))}

      {/* Caption */}
      {(slide.title || slide.caption) && (
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 py-5 md:px-12 md:py-7">
          <Link href={slide.link} className="group">
            {slide.title && (
              <h2 className="text-white font-bold text-lg md:text-2xl lg:text-3xl leading-tight drop-shadow-lg group-hover:underline line-clamp-2">
                {slide.title}
              </h2>
            )}
            {slide.caption && (
              <p className="text-white/80 text-sm md:text-base mt-1 line-clamp-1 drop-shadow">
                {slide.caption}
              </p>
            )}
          </Link>
        </div>
      )}

      {/* Prev / Next — chỉ hiện khi có nhiều hơn 1 slide */}
      {total > 1 && (
        <>
          <button
            onClick={() => go(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg"
            aria-label="Slide trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => go(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg"
            aria-label="Slide tiếp"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Progress bar */}
          {!paused && (
            <div className="absolute bottom-0 left-0 z-30 h-0.5 bg-blue-400 animate-progress" />
          )}
        </>
      )}
    </div>
  )
}
