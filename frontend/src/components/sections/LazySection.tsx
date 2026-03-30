'use client'

import { useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'loading' | 'loaded' | 'error'

interface LazySectionProps<T> {
  /** API endpoint trả về data cho section */
  apiUrl: string
  /** Skeleton hiển thị khi chưa load */
  skeleton: React.ReactNode
  /** Render function nhận data và trả về JSX */
  render: (data: T) => React.ReactNode
  /**
   * Bao nhiêu px trước khi section vào viewport thì bắt đầu fetch.
   * Giá trị cao hơn = prefetch sớm hơn (ưu tiên cao hơn).
   */
  rootMargin?: string
}

/**
 * Lazy-load một section khi nó gần đến viewport.
 * Ưu tiên: section nào gần viewport hơn sẽ được fetch trước.
 */
export function LazySection<T>({
  apiUrl,
  skeleton,
  render,
  rootMargin = '400px',
}: LazySectionProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        setStatus('loading')

        fetch(apiUrl)
          .then((r) => {
            if (!r.ok) throw new Error('fetch failed')
            return r.json()
          })
          .then((d: T) => {
            setData(d)
            setStatus('loaded')
          })
          .catch(() => setStatus('error'))
      },
      { rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [apiUrl, rootMargin])

  return (
    <div ref={ref} className={status === 'loaded' ? 'animate-fadeIn' : ''}>
      {status === 'loaded' && data !== null ? render(data) : skeleton}
    </div>
  )
}
