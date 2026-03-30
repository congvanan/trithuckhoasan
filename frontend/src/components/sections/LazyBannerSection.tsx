'use client'

import { useEffect, useRef, useState } from 'react'
import { BannerSlider, type BannerSlide } from './BannerSlider'
import type { BlogPostCommonDto } from '@/client/types.gen'

function BannerSkeleton() {
  return (
    <div
      className="w-full animate-pulse bg-gray-200"
      style={{ height: 'clamp(220px, 45vw, 520px)' }}
    />
  )
}

function parseSlides(posts: BlogPostCommonDto[]): (BannerSlide & { order: number })[] {
  return posts
    .map((p) => {
      const raw = p.shortDescription ?? ''
      const parts = raw.split('|')
      const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
      const order = firstIsOrder ? parseInt(parts[0]) : 99
      const rest = firstIsOrder ? parts.slice(1).join('|') : raw
      const sepIdx = rest.indexOf('|')
      const hasCover = sepIdx > 0 && (rest.startsWith('http') || rest.startsWith('/api/'))
      const imageUrl = hasCover
        ? rest.slice(0, sepIdx)
        : p.coverImageMediaId
        ? `/api/cms-kit/media/${p.coverImageMediaId}`
        : ''
      const caption = hasCover ? rest.slice(sepIdx + 1) : rest
      return {
        id: p.id ?? '',
        imageUrl,
        title: p.title ?? '',
        caption,
        link: `/blog/banner-slide/${p.slug ?? ''}`,
        order,
      }
    })
    .filter((s) => s.imageUrl)
    .sort((a, b) => a.order - b.order)
}

export function LazyBannerSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [slides, setSlides] = useState<(BannerSlide & { order: number })[] | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        fetch('/api/sections/banner')
          .then((r) => r.json())
          .then((posts: BlogPostCommonDto[]) => {
            setSlides(parseSlides(posts))
            setLoaded(true)
          })
          .catch(() => setLoaded(true))
      },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={loaded ? 'animate-fadeIn' : ''}>
      {loaded && slides?.length ? <BannerSlider slides={slides} /> : <BannerSkeleton />}
    </div>
  )
}
