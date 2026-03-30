'use client'

import { useEffect, useRef, useState } from 'react'
import { NewsTabs } from './NewsTabs'
import type { BlogPostCommonDto } from '@/client/types.gen'

type Data = { chuyenNganh: BlogPostCommonDto[]; quocTe: BlogPostCommonDto[] }

function TabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-12">
      <div className="flex gap-3 justify-center">
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 container px-4 md:px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function LazyNewsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [data, setData] = useState<Data | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        fetch('/api/sections/news')
          .then((r) => r.json())
          .then((d: Data) => { setData(d); setLoaded(true) })
          .catch(() => setLoaded(true))
      },
      { rootMargin: '500px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={loaded ? 'animate-fadeIn' : ''}>
      {loaded && data ? (
        <NewsTabs chuyenNganhPosts={data.chuyenNganh} quocTePosts={data.quocTe} />
      ) : (
        <TabsSkeleton />
      )}
    </div>
  )
}
