'use client'
import { Pagination } from '@/components/admin-ai/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { aiLogApi, AiConversationListDto } from '@/lib/api/ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Eye,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 20

type QuickRange = '' | 'today' | '7d' | '30d'

function rangeToDates(range: QuickRange): { from: string; to: string } {
  if (!range) return { from: '', to: '' }
  const now = new Date()
  const to = now.toISOString().slice(0, 10)
  const fromDate = new Date(now)
  if (range === 'today') {
    return { from: to, to }
  }
  if (range === '7d') fromDate.setDate(now.getDate() - 6)
  if (range === '30d') fromDate.setDate(now.getDate() - 29)
  return { from: fromDate.toISOString().slice(0, 10), to }
}

export default function AiLogsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [filterInput, setFilterInput] = useState('')
  const [filter, setFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [quickRange, setQuickRange] = useState<QuickRange>('')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce ô tìm kiếm 350 ms
  useEffect(() => {
    const t = setTimeout(() => setFilter(filterInput.trim()), 350)
    return () => clearTimeout(t)
  }, [filterInput])

  // Reset về trang 1 khi đổi filter
  useEffect(() => { setPage(1) }, [filter, fromDate, toDate])

  // Date picker chỉ trả yyyy-mm-dd → mở rộng FromDate=00:00:00, ToDate=23:59:59.999
  // để bao trọn cả ngày (nếu không backend parse 2026-05-11 ⇒ 00:00:00, lọc sai).
  const fromDateIso = fromDate ? `${fromDate}T00:00:00` : undefined
  const toDateIso = toDate ? `${toDate}T23:59:59.999` : undefined

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-ai-logs', filter, fromDateIso, toDateIso, page],
    queryFn: () => aiLogApi.conversations({
      Filter: filter || undefined,
      FromDate: fromDateIso,
      ToDate: toDateIso,
      MaxResultCount: PAGE_SIZE,
      SkipCount: (page - 1) * PAGE_SIZE,
      Sorting: 'creationTime desc',
    }),
    placeholderData: (prev) => prev,
  })

  const handleDelete = async (c: AiConversationListDto) => {
    if (!confirm(`Xoá hội thoại ${c.id.slice(0, 8)}… kèm tất cả tin nhắn?`)) return
    setDeletingId(c.id)
    try {
      await aiLogApi.deleteConversation(c.id)
      toast({ title: 'Đã xoá hội thoại' })
      qc.invalidateQueries({ queryKey: ['admin-ai-logs'] })
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await aiLogApi.export({
        Filter: filter || undefined,
        FromDate: fromDateIso,
        ToDate: toDateIso,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-conversations-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Lỗi export', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const applyQuickRange = (r: QuickRange) => {
    setQuickRange(r)
    const { from, to } = rangeToDates(r)
    setFromDate(from); setToDate(to)
  }

  const clearFilters = () => {
    setFilterInput(''); setFilter(''); setFromDate(''); setToDate(''); setQuickRange('')
  }

  const hasFilter = !!(filter || fromDate || toDate)
  const items = data?.items ?? []
  const total = data?.totalCount ?? 0
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
    []
  )

  return (
    <div className="container max-w-6xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/ai" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <ClipboardList className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Nhật ký hội thoại</h1>
          <p className="text-sm text-gray-500">Xem câu hỏi của người dùng, feedback, citations</p>
        </div>
        <Button className="ml-auto" onClick={handleExport} disabled={exporting}>
          <Download className="w-4 h-4 mr-1" /> {exporting ? 'Đang xuất…' : 'Xuất CSV'}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-lg p-3 mb-4 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-8 pr-8"
              placeholder="Tìm theo session / tiêu đề / câu hỏi…"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
            />
            {filterInput && (
              <button
                onClick={() => setFilterInput('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Xoá"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
            {([
              ['', 'Tất cả'],
              ['today', 'Hôm nay'],
              ['7d', '7 ngày'],
              ['30d', '30 ngày'],
            ] as [QuickRange, string][]).map(([r, label]) => (
              <button
                key={r || 'all'}
                onClick={() => applyQuickRange(r)}
                className={`px-2.5 py-1 rounded text-xs transition ${quickRange === r ? 'bg-white text-blue-700 shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>Từ</span>
            <Input
              type="date"
              className="w-[140px] h-9"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setQuickRange('') }}
            />
            <span>đến</span>
            <Input
              type="date"
              className="w-[140px] h-9"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setQuickRange('') }}
            />
          </div>

          {hasFilter && (
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" /> Xoá lọc
            </Button>
          )}
        </div>
      </div>

      {/* Result count + pagination top */}
      <div className="mb-2 px-1">
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          showEdges={false}
          summary={
            isLoading
              ? 'Đang tải…'
              : total === 0
                ? 'Không có hội thoại nào.'
                : `Hiển thị ${from}–${to} / ${total}${isFetching ? ' (đang cập nhật…)' : ''}`
          }
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left font-medium px-3 py-2 w-[40%]">Hội thoại</th>
              <th className="text-left font-medium px-3 py-2 w-[14%]">Session</th>
              <th className="text-center font-medium px-3 py-2 w-[8%]">User</th>
              <th className="text-center font-medium px-3 py-2 w-[8%]">Tin nhắn</th>
              <th className="text-left font-medium px-3 py-2 w-[16%]">Tin gần nhất</th>
              <th className="text-right font-medium px-3 py-2 w-[14%]">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-3 py-3">
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  {hasFilter ? 'Không tìm thấy hội thoại nào khớp với bộ lọc.' : 'Chưa có hội thoại nào.'}
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/40 transition">
                  <td className="px-3 py-2 align-top">
                    <Link href={`/admin/ai/logs/${c.id}`} className="block group">
                      <p className="font-medium text-gray-800 group-hover:text-blue-700 truncate">
                        {c.title || c.lastUserMessage || '(chưa có nội dung)'}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        Tạo {dateFmt.format(new Date(c.creationTime))}
                        {c.clientIp && ` · IP ${c.clientIp}`}
                      </p>
                    </Link>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-[11px] font-mono">
                      {c.sessionId.slice(0, 10)}…
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-center align-top">
                    {c.userId ? (
                      <span className="inline-block text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">user</span>
                    ) : (
                      <span className="text-[11px] text-gray-400">guest</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center align-top text-gray-600">{c.messageCount}</td>
                  <td className="px-3 py-2 align-top text-xs text-gray-500">
                    {c.lastMessageAt ? dateFmt.format(new Date(c.lastMessageAt)) : '—'}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/ai/logs/${c.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-blue-600 border-blue-300 hover:bg-blue-50">
                          <Eye className="w-3 h-3 mr-1" /> Xem
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(c)}
                        disabled={deletingId === c.id}
                        title="Xoá"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bottom — đầy đủ với nút Đầu/Cuối */}
      <div className="mt-3 px-1">
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
