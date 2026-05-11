'use client'
import { RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { parseConfig, type EditorProps } from './utils'

export function ManualEditor({ value, onChange }: EditorProps) {
  const parsed = useMemo(() => parseConfig(value), [value])
  const [title, setTitle] = useState(parsed.title ?? '')
  const [content, setContent] = useState(parsed.content ?? '')
  const [url, setUrl] = useState(parsed.url ?? '')

  const emit = (t: string, c: string, u: string) =>
    onChange(JSON.stringify({
      ...(t.trim() ? { title: t.trim() } : {}),
      content: c,
      ...(u.trim() ? { url: u.trim() } : {}),
    }))

  return (
    <div className="space-y-2">
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Tiêu đề (tuỳ chọn)"
        value={title}
        onChange={(e) => { setTitle(e.target.value); emit(e.target.value, content, url) }}
      />
      <textarea
        rows={8}
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Dán nội dung vào đây — văn bản thuần hoặc đã được làm sạch…"
        value={content}
        onChange={(e) => { setContent(e.target.value); emit(title, e.target.value, url) }}
      />
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="URL nguồn (tuỳ chọn, VD: https://example.com/bai-viet)"
        value={url}
        onChange={(e) => { setUrl(e.target.value); emit(title, content, e.target.value) }}
      />
      <p className="text-[11px] text-gray-400">
        Sau khi <b>Tạo</b> → bấm <RefreshCcw className="inline w-3 h-3 -mt-0.5" /> để Reindex tài liệu này.
        Dùng nút <b>Nhập thêm</b> trên hàng để thêm nhiều tài liệu vào cùng một nguồn.
      </p>
    </div>
  )
}
