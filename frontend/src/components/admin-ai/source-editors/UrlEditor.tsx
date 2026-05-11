'use client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { aiSourceApi } from '@/lib/api/ai'
import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { parseConfig, type EditorProps } from './utils'

export function UrlEditor({ value, onChange }: EditorProps) {
  const parsed = useMemo(() => parseConfig(value), [value])
  const { toast } = useToast()
  const [title, setTitle] = useState(parsed.title ?? '')
  const [url, setUrl] = useState(parsed.url ?? '')
  const [contentSelector, setContentSelector] = useState(parsed.contentSelector ?? '')
  const [previewText, setPreviewText] = useState('')
  const [previewMeta, setPreviewMeta] = useState<{ title: string; characterCount: number; wordCount: number } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const emit = (t: string, u: string, s: string) =>
    onChange(JSON.stringify({
      ...(t.trim() ? { title: t.trim() } : {}),
      url: u.trim(),
      ...(s.trim() ? { contentSelector: s.trim() } : {}),
    }))

  const preview = async () => {
    if (!url.trim()) {
      toast({ title: 'Thiếu URL', description: 'Vui lòng nhập URL cần cào thử.', variant: 'destructive' })
      return
    }
    setPreviewing(true)
    try {
      const result = await aiSourceApi.preview({
        name: title.trim() || 'URL preview',
        type: 20,
        configJson: JSON.stringify({
          ...(title.trim() ? { title: title.trim() } : {}),
          url: url.trim(),
          ...(contentSelector.trim() ? { contentSelector: contentSelector.trim() } : {}),
        }),
      })
      setPreviewText(result.text)
      setPreviewMeta({ title: result.title, characterCount: result.characterCount, wordCount: result.wordCount })
      toast({
        title: 'Đã cào thử URL',
        description: `${result.characterCount.toLocaleString('vi-VN')} ký tự · ${result.wordCount.toLocaleString('vi-VN')} từ`,
      })
    } catch (err) {
      setPreviewText('')
      setPreviewMeta(null)
      toast({ title: 'Lỗi cào thử URL', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setPreviewing(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Tiêu đề (tuỳ chọn, nếu bỏ trống sẽ lấy title từ trang)"
        value={title}
        onChange={(e) => { setTitle(e.target.value); emit(e.target.value, url, contentSelector) }}
      />
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="https://hosrem.org.vn/vai-tro-cua-microbiome-trong-thu-tinh-ong-nghiem-id8626.html"
        value={url}
        onChange={(e) => { setUrl(e.target.value); emit(title, e.target.value, contentSelector) }}
      />
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Selector vùng nội dung (tuỳ chọn): .accordion-body, article, main, .article-content, #content"
        value={contentSelector}
        onChange={(e) => { setContentSelector(e.target.value); emit(title, url, e.target.value) }}
      />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={preview} disabled={previewing || !url.trim()}>
          {previewing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {previewing ? 'Đang cào thử...' : 'Cào thử nội dung'}
        </Button>
        {previewMeta && (
          <span className="text-xs text-gray-500">
            {previewMeta.characterCount.toLocaleString('vi-VN')} ký tự · {previewMeta.wordCount.toLocaleString('vi-VN')} từ
          </span>
        )}
      </div>
      {previewMeta && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600">Nội dung đã lọc: {previewMeta.title}</p>
          <textarea
            rows={14}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white font-mono"
            value={previewText}
            readOnly
          />
        </div>
      )}
      <p className="text-[11px] text-gray-400">
        Mặc định hệ thống tự tìm vùng bài viết chính. Hãy cào thử để kiểm tra nội dung, sau đó bấm Reindex trên danh sách nguồn khi muốn đưa vào RAG.
      </p>
    </div>
  )
}
