'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { ConfigEditor, SUPPORTED_SOURCE_TYPES } from '@/components/admin-ai/source-editors'
import {
  AI_SOURCE_STATUS_LABEL,
  AI_SOURCE_TYPE_LABEL,
  aiIngestionTextApi,
  aiSourceApi,
  AiSourceListDto,
  AiSourceStatus,
  AiSourceType,
  CreateUpdateAiSourceDto,
} from '@/lib/api/ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, ChevronUp, LibraryBig, Loader2, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

// ─── Inline IngestText panel ──────────────────────────────────────────────────
function IngestPanel({ sourceId, sourceName, onClose }: { sourceId: string; sourceName: string; onClose: () => void }) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!content.trim()) return
    setLoading(true)
    try {
      const result = await aiIngestionTextApi.ingestText({
        sourceId,
        title: title.trim() || sourceName,
        content: content.trim(),
        url: url.trim() || undefined,
      })
      toast({ title: `Đã ingest: ${result.chunkCount} chunk`, description: `${result.latencyMs} ms` })
      setTitle(''); setContent(''); setUrl('')
    } catch (err) {
      toast({ title: 'Lỗi ingest', description: (err as Error).message, variant: 'destructive' })
    } finally { setLoading(false) }
  }

  return (
    <div className="mt-2 border border-blue-200 rounded-lg p-3 bg-blue-50 space-y-2">
      <p className="text-xs font-medium text-blue-700">Nhập tài liệu mới vào nguồn này</p>
      <input className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        placeholder="Tiêu đề tài liệu (tuỳ chọn)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows={6} className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        placeholder="Dán nội dung văn bản cần chunk và embedding…"
        value={content} onChange={(e) => setContent(e.target.value)} />
      <input className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        placeholder="URL nguồn (tuỳ chọn)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!content.trim() || loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {loading ? 'Đang xử lý…' : 'Ingest ngay'}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}>Đóng</Button>
      </div>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: AiSourceStatus }) {
  if (status === 1) return <Badge className="bg-green-100 text-green-700 border-green-200">{AI_SOURCE_STATUS_LABEL[1]}</Badge>
  if (status === 2) return <Badge className="bg-red-100 text-red-700 border-red-200">{AI_SOURCE_STATUS_LABEL[2]}</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border-gray-200">{AI_SOURCE_STATUS_LABEL[0]}</Badge>
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AiSourcesPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [filterStatus, setFilterStatus] = useState<number | ''>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUpdateAiSourceDto>({ name: '', description: '', type: 14, status: 1, configJson: '' })
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [ingestOpenId, setIngestOpenId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-sources', filter, filterStatus],
    queryFn: () => aiSourceApi.list({ Filter: filter || undefined, Status: filterStatus === '' ? undefined : Number(filterStatus), MaxResultCount: 50, SkipCount: 0 }),
    placeholderData: (prev) => prev,
  })

  const resetForm = () => { setForm({ name: '', description: '', type: 14, status: 1, configJson: '' }); setEditingId(null) }

  const openEdit = async (src: AiSourceListDto) => {
    const detail = await aiSourceApi.get(src.id)
    setForm({ name: detail.name, description: detail.description ?? '', type: detail.type, status: detail.status, configJson: detail.configJson ?? '', concurrencyStamp: detail.concurrencyStamp ?? undefined })
    setEditingId(src.id); setShowForm(true)
  }

  const submit = async () => {
    if (!form.name.trim()) return
    if (form.type === 11) {
      try {
        const config = JSON.parse(form.configJson || '{}') as Record<string, string>
        if (!config.base64 || !config.fileName?.toLowerCase().endsWith('.docx')) {
          toast({ title: 'Thieu file Word', description: 'Vui long chon file .docx truoc khi tao nguon.', variant: 'destructive' })
          return
        }
      } catch {
        toast({ title: 'Cau hinh Word khong hop le', description: 'Vui long chon lai file .docx.', variant: 'destructive' })
        return
      }
    }
    if (form.type === 20) {
      try {
        const config = JSON.parse(form.configJson || '{}') as Record<string, string>
        if (!config.url?.trim()) {
          toast({ title: 'Thiếu URL', description: 'Vui lòng nhập URL nguồn cần đưa vào RAG.', variant: 'destructive' })
          return
        }
      } catch {
        toast({ title: 'Cấu hình URL không hợp lệ', description: 'Vui lòng nhập lại URL nguồn.', variant: 'destructive' })
        return
      }
    }
    setSaving(true)
    try {
      if (editingId) { await aiSourceApi.update(editingId, form); toast({ title: 'Đã cập nhật nguồn' }) }
      else {
        await aiSourceApi.create(form)
        toast({
          title: 'Đã tạo nguồn',
          description: form.type === 20 ? 'Kiểm tra nội dung cào thử rồi bấm Reindex khi muốn đưa vào RAG.' : undefined,
        })
      }
      setShowForm(false); resetForm(); qc.invalidateQueries({ queryKey: ['admin-ai-sources'] })
    } catch (err) { toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (src: AiSourceListDto) => {
    if (!confirm(`Xoá nguồn "${src.name}" (kèm toàn bộ documents + chunks)?`)) return
    setBusyId(src.id)
    try { await aiSourceApi.delete(src.id); toast({ title: 'Đã xoá', description: src.name }); qc.invalidateQueries({ queryKey: ['admin-ai-sources'] }) }
    catch (err) { toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' }) }
    finally { setBusyId(null) }
  }

  const handleReindex = async (src: AiSourceListDto) => {
    setBusyId(src.id)
    try {
      const job = await aiSourceApi.reindex(src.id)
      const description = job.status === 2 ? `Hoàn tất: ${job.processedChunkCount} chunk.` : job.status === 3 ? (job.error ?? 'Thất bại.') : `Job ${job.id.slice(0, 8)}… đã tạo.`
      toast({ title: 'Reindex nguồn AI', description }); qc.invalidateQueries({ queryKey: ['admin-ai-sources'] }); qc.invalidateQueries({ queryKey: ['admin-ai-jobs'] })
    } catch (err) { toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' }) }
    finally { setBusyId(null) }
  }

  const selectedType = SUPPORTED_SOURCE_TYPES.find((t) => t.value === form.type) ?? SUPPORTED_SOURCE_TYPES[0]
  const items = data?.items ?? []

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ai" className="text-gray-500 hover:text-gray-700"><ArrowLeft className="w-5 h-5" /></Link>
        <LibraryBig className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Nguồn dữ liệu AI</h1>
          <p className="text-sm text-gray-500">Quản lý các kho dữ liệu đưa vào RAG</p>
        </div>
        <Button className="ml-auto" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-1" /> Thêm nguồn
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input className="max-w-xs" placeholder="Tìm theo tên/mô tả" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value === '' ? '' : Number(e.target.value))} className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
          <option value="">Tất cả trạng thái</option>
          <option value={1}>Bật</option>
          <option value={0}>Tắt</option>
          <option value={2}>Lỗi</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-blue-50 space-y-4">
          <h2 className="font-semibold text-sm text-blue-700">{editingId ? 'Chỉnh sửa nguồn' : 'Thêm nguồn mới'}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tên nguồn *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Guideline FIGO 2024" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Loại *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: Number(e.target.value) as AiSourceType, configJson: '' })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                {SUPPORTED_SOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">{selectedType.hint}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mô tả</label>
              <Input value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ghi chú nội bộ (tuỳ chọn)" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Trạng thái</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: Number(e.target.value) as AiSourceStatus })} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                <option value={1}>Bật — đưa vào RAG khi chat</option>
                <option value={0}>Tắt — giữ dữ liệu, không truy vấn</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Nội dung / Cấu hình</label>
            <ConfigEditor key={form.type} type={form.type} value={form.configJson ?? ''} onChange={(v) => setForm({ ...form, configJson: v })} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={submit} disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {saving ? 'Đang lưu…' : editingId ? 'Cập nhật' : 'Tạo'}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Huỷ</Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có nguồn nào.</div>
      ) : (
        <div className="space-y-2">
          {items.map((src) => (
            <div key={src.id} className="border rounded-lg bg-white">
              <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={src.status} />
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 rounded">{AI_SOURCE_TYPE_LABEL[src.type]}</span>
                  </div>
                  <p className="font-medium text-gray-800 truncate">{src.name}</p>
                  <p className="text-xs text-gray-400">
                    {src.documentCount} tài liệu · {src.chunkCount} chunk
                    {src.lastIndexedAt && ` · Index lần cuối: ${new Date(src.lastIndexedAt).toLocaleString('vi-VN')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <Button variant="outline" size="sm" title="Nhập thêm nội dung"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setIngestOpenId(ingestOpenId === src.id ? null : src.id)}>
                    {ingestOpenId === src.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    <span className="ml-1 text-xs">Nhập thêm</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleReindex(src)} disabled={busyId === src.id} title="Re-index">
                    {busyId === src.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => openEdit(src)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(src)} disabled={busyId === src.id}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {ingestOpenId === src.id && (
                <div className="px-4 pb-3">
                  <IngestPanel sourceId={src.id} sourceName={src.name} onClose={() => setIngestOpenId(null)} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-4">Tổng: {data?.totalCount ?? 0} nguồn</p>
    </div>
  )
}
