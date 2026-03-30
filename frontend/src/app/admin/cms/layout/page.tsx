'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Eye, EyeOff,
  GripVertical, LayoutDashboard, Loader2, Plus, RotateCcw, Save, Search, X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type SectionConfig = {
  id: string
  label: string
  visible: boolean
}

const SECTION_ICONS: Record<string, string> = {
  hero:     '🌟',
  features: '✨',
  news:     '📰',
  kienthuc: '📚',
  banner:   '🖼️',
}

const SECTION_DESC: Record<string, string> = {
  hero:     'Khung tin nổi bật với ảnh bìa + tiêu đề lớn (FIGO style)',
  features: 'Lưới 6 tính năng: Sức khỏe buồng trứng, IVF, Nghiên cứu...',
  news:     'Tab Tin chuyên ngành / Tin quốc tế (4 bài mới nhất)',
  kienthuc: 'Tab Sản khoa / Phụ khoa / Sơ sinh (4 bài mỗi nhóm)',
  banner:   'Slider ảnh quảng cáo (quản lý qua Media → Banner Slide)',
}

export default function LayoutConfigPage() {
  const { toast } = useToast()
  const [sections, setSections] = useState<SectionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Keywords state
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [kwDirty, setKwDirty] = useState(false)
  const [kwSaving, setKwSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [layoutRes, kwRes] = await Promise.all([
        fetch('/api/admin/page-layout'),
        fetch('/api/admin/search-keywords'),
      ])
      setSections(await layoutRes.json())
      setKeywords(await kwRes.json())
      setDirty(false)
      setKwDirty(false)
    } catch {
      toast({ title: 'Lỗi tải cấu hình', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const addKeyword = () => {
    const kw = newKeyword.trim()
    if (!kw || keywords.includes(kw)) return
    setKeywords((prev) => [...prev, kw])
    setNewKeyword('')
    setKwDirty(true)
  }

  const removeKeyword = (idx: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== idx))
    setKwDirty(true)
  }

  const saveKeywords = async () => {
    setKwSaving(true)
    try {
      const res = await fetch('/api/admin/search-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keywords),
      })
      if (!res.ok) throw new Error('Lỗi lưu keyword')
      toast({ title: '✓ Đã lưu từ khóa tìm kiếm' })
      setKwDirty(false)
    } catch {
      toast({ title: 'Lỗi lưu', variant: 'destructive' })
    } finally {
      setKwSaving(false)
    }
  }

  useEffect(() => { load() }, [load])

  const move = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSections(next)
    setDirty(true)
  }

  const toggle = (idx: number) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/page-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sections),
      })
      if (!res.ok) throw new Error('Lỗi lưu cấu hình')
      toast({ title: '✓ Đã lưu bố cục trang chủ', description: 'Thay đổi có hiệu lực ngay lập tức' })
      setDirty(false)
    } catch {
      toast({ title: 'Lỗi lưu', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const visibleCount = sections.filter((s) => s.visible).length

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cms">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            Bố cục trang chủ
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kéo mũi tên ↑↓ để đổi vị trí · Nhấn biểu tượng mắt để ẩn/hiện từng phần
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={load} disabled={saving}>
              <RotateCcw className="w-4 h-4 mr-1" />Huỷ
            </Button>
          )}
          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu...</>
              : <><Save className="w-4 h-4 mr-2" />Lưu bố cục</>
            }
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5 text-sm">
        <span className="text-blue-700">
          <strong>{visibleCount}</strong>/{sections.length} phần đang hiển thị trên trang chủ
        </span>
        {dirty && (
          <span className="ml-auto text-amber-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Chưa lưu — nhấn &quot;Lưu bố cục&quot; để áp dụng
          </span>
        )}
      </div>

      {/* Section list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />Đang tải...
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                section.visible
                  ? 'bg-white dark:bg-gray-900 border-gray-200 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 opacity-60'
              }`}
            >
              {/* Drag handle (decorative) */}
              <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

              {/* Position badge */}
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                section.visible ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {idx + 1}
              </span>

              {/* Emoji icon */}
              <span className="text-xl w-7 shrink-0 text-center">{SECTION_ICONS[section.id] ?? '📄'}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${section.visible ? '' : 'text-gray-400'}`}>
                  {section.label}
                </p>
                <p className="text-xs text-gray-400 truncate">{SECTION_DESC[section.id] ?? ''}</p>
              </div>

              {/* Visible toggle */}
              <button
                onClick={() => toggle(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                  section.visible
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                }`}
                title={section.visible ? 'Đang hiện — nhấn để ẩn' : 'Đang ẩn — nhấn để hiện'}
              >
                {section.visible
                  ? <><Eye className="w-3.5 h-3.5" />Hiện</>
                  : <><EyeOff className="w-3.5 h-3.5" />Ẩn</>
                }
              </button>

              {/* Move up/down */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  disabled={idx === 0}
                  onClick={() => move(idx, 'up')}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-500"
                  title="Lên"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={idx === sections.length - 1}
                  onClick={() => move(idx, 'down')}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed text-gray-500"
                  title="Xuống"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview hint */}
      {!loading && !dirty && (
        <div className="mt-6 text-center">
          <Link href="/" target="_blank"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <CheckCircle2 className="w-4 h-4" />
            Xem trang chủ để kiểm tra bố cục
          </Link>
        </div>
      )}

      {/* Search keywords */}
      {!loading && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-teal-600" />
              Từ khóa gợi ý tìm kiếm
            </h2>
            <Button
              onClick={saveKeywords}
              disabled={!kwDirty || kwSaving}
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 min-w-[90px]"
            >
              {kwSaving
                ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Đang lưu</>
                : <><Save className="w-4 h-4 mr-1" />Lưu</>
              }
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Hiển thị dưới ô tìm kiếm trên navbar để người dùng click nhanh
          </p>

          {/* Existing keywords */}
          <div className="flex flex-wrap gap-2 mb-3">
            {keywords.map((kw, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-sm font-medium"
              >
                {kw}
                <button
                  onClick={() => removeKeyword(idx)}
                  className="text-teal-400 hover:text-red-500 transition-colors"
                  title="Xóa"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
            {keywords.length === 0 && (
              <span className="text-sm text-gray-400 italic">Chưa có từ khóa nào</span>
            )}
          </div>

          {/* Add new keyword */}
          <form
            onSubmit={(e) => { e.preventDefault(); addKeyword() }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Thêm từ khóa mới..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 outline-none
                         focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <Button type="submit" size="sm" variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50">
              <Plus className="w-4 h-4 mr-1" />Thêm
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
