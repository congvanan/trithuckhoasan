'use client'
import { useState } from 'react'
import type { EditorProps } from './utils'

export function CmsPageEditor({ value, onChange }: EditorProps) {
  const [slug, setSlug] = useState(() => {
    try { return (JSON.parse(value || '{}') as Record<string, string>).slug ?? '' } catch { return '' }
  })
  const handleChange = (s: string) => { setSlug(s); onChange(JSON.stringify({ slug: s.trim() })) }
  return (
    <div className="space-y-1">
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="VD: gioi-thieu"
        value={slug}
        onChange={(e) => handleChange(e.target.value)}
      />
      <p className="text-[11px] text-gray-400">Slug của trang CMS cần index (mỗi nguồn = 1 trang)</p>
    </div>
  )
}
