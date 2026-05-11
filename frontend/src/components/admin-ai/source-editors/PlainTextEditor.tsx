'use client'
import { RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import type { EditorProps } from './utils'

export function PlainTextEditor({ value, onChange }: EditorProps) {
  const [content, setContent] = useState(() => {
    try { return (JSON.parse(value || '{}') as Record<string, string>).content ?? '' } catch { return '' }
  })
  const handleChange = (c: string) => { setContent(c); onChange(JSON.stringify({ content: c })) }
  return (
    <div className="space-y-1">
      <textarea
        rows={10}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Dán văn bản vào đây. Sau khi tạo nguồn, bấm nút Reindex để hệ thống tự chunk và embedding."
        value={content}
        onChange={(e) => handleChange(e.target.value)}
      />
      <p className="text-[11px] text-gray-400">
        Sau khi <b>Tạo</b> → bấm nút <RefreshCcw className="inline w-3 h-3 -mt-0.5" /> trên hàng để Reindex và tạo chunks.
      </p>
    </div>
  )
}
