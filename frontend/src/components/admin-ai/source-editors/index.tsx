'use client'
import type { AiSourceType } from '@/lib/api/ai'
import { CmsBlogPostPicker } from './CmsBlogPostPicker'
import { CmsPageEditor } from './CmsPageEditor'
import { ManualEditor } from './ManualEditor'
import { PlainTextEditor } from './PlainTextEditor'
import { UrlEditor } from './UrlEditor'
import { WordFileEditor } from './WordFileEditor'

export interface SourceTypeMeta { value: AiSourceType; label: string; hint: string }

export const SUPPORTED_SOURCE_TYPES: SourceTypeMeta[] = [
  { value: 11, label: 'Word (.docx)', hint: 'Tải file Word .docx — Reindex sẽ tách nội dung, chunk và embedding' },
  { value: 0,  label: 'Bài viết CMS', hint: 'Chọn bài viết từ CMS Blog' },
  { value: 1,  label: 'Trang CMS',    hint: 'Chọn trang CMS theo slug' },
  { value: 14, label: 'Văn bản',      hint: 'Dán văn bản thuần — Reindex sẽ chunk ngay' },
  { value: 20, label: 'URL',          hint: 'Nhập URL để hệ thống tự tải trang, làm sạch HTML và đưa vào RAG khi Reindex' },
  { value: 30, label: 'Thủ công',     hint: 'Nhập từng đoạn nội dung bằng tay' },
]

export function ConfigEditor({
  type,
  value,
  onChange,
}: {
  type: AiSourceType
  value: string
  onChange: (v: string) => void
}) {
  if (type === 0)  return <CmsBlogPostPicker value={value} onChange={onChange} />
  if (type === 1)  return <CmsPageEditor value={value} onChange={onChange} />
  if (type === 11) return <WordFileEditor value={value} onChange={onChange} />
  if (type === 14) return <PlainTextEditor value={value} onChange={onChange} />
  if (type === 20) return <UrlEditor value={value} onChange={onChange} />
  if (type === 30) return <ManualEditor value={value} onChange={onChange} />
  return null
}

export { CmsBlogPostPicker, CmsPageEditor, ManualEditor, PlainTextEditor, UrlEditor, WordFileEditor }
