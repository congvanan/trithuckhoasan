'use client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  /** Hiển thị nút "Đầu / Cuối" (mặc định true). Tắt cho header gọn. */
  showEdges?: boolean
  /** Văn bản phụ bên trái (mặc định: "Hiển thị X–Y / total"). Truyền null để ẩn. */
  summary?: string | null
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  showEdges = true,
  summary,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const defaultSummary = total === 0 ? 'Tổng: 0' : `Hiển thị ${from}–${to} / ${total}`

  if (totalPages <= 1 && summary === null) return null

  return (
    <div className="flex items-center justify-between gap-3">
      {summary !== null && (
        <p className="text-xs text-gray-500">{summary ?? defaultSummary}</p>
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 ml-auto">
          {showEdges && (
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={page <= 1}>
              « Đầu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-xs text-gray-600 px-2 whitespace-nowrap">
            Trang {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
            <ChevronRight className="w-3 h-3" />
          </Button>
          {showEdges && (
            <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>
              Cuối »
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
