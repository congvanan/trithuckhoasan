'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Pagination } from '@/components/admin-ai/Pagination'
import { AI_JOB_STATUS_LABEL, aiIngestionApi, AiIngestionJobDto, AiJobStatus } from '@/lib/api/ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Ban, ListChecks, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const PAGE_SIZE = 10

function statusBadge(s: AiJobStatus) {
  const map: Record<AiJobStatus, string> = {
    0: 'bg-gray-100 text-gray-700 border-gray-200',
    1: 'bg-blue-100 text-blue-700 border-blue-200',
    2: 'bg-green-100 text-green-700 border-green-200',
    3: 'bg-red-100 text-red-700 border-red-200',
    4: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  return <Badge className={map[s]}>{AI_JOB_STATUS_LABEL[s]}</Badge>
}

function progressBar(job: AiIngestionJobDto) {
  const pct = job.total > 0 ? Math.min(100, Math.round((job.progress / job.total) * 100)) : 0
  return (
    <div className="w-40">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${job.status === 3 ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5">
        {pct}% · {job.processedDocumentCount} docs · {job.processedChunkCount} chunks
      </p>
    </div>
  )
}

export default function AiJobsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearingFailed, setClearingFailed] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-jobs', statusFilter, page],
    queryFn: () => aiIngestionApi.list({
      Status: statusFilter === '' ? undefined : Number(statusFilter),
      MaxResultCount: PAGE_SIZE,
      SkipCount: (page - 1) * PAGE_SIZE,
    }),
    refetchInterval: 5000,
    placeholderData: (prev) => prev,
  })

  const handleCancel = async (job: AiIngestionJobDto) => {
    if (!confirm(`Huỷ tác vụ ${job.id.slice(0, 8)}…?`)) return
    setCancellingId(job.id)
    try {
      await aiIngestionApi.cancel(job.id)
      toast({ title: 'Đã huỷ tác vụ' })
      qc.invalidateQueries({ queryKey: ['admin-ai-jobs'] })
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setCancellingId(null)
    }
  }

  const items = data?.items ?? []
  const failedCount = items.filter((job) => job.status === 3 || job.status === 4).length

  const handleDelete = async (job: AiIngestionJobDto) => {
    if (job.status === 0 || job.status === 1) return
    if (!confirm(`Xoá log tác vụ ${job.id.slice(0, 8)}...?`)) return
    setDeletingId(job.id)
    try {
      await aiIngestionApi.delete(job.id)
      toast({ title: 'Đã xoá log tác vụ' })
      qc.invalidateQueries({ queryKey: ['admin-ai-jobs'] })
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearFailed = async () => {
    const failedJobs = items.filter((job) => job.status === 3 || job.status === 4)
    if (failedJobs.length === 0) return
    if (!confirm(`Xoá ${failedJobs.length} log thất bại/đã huỷ đang hiển thị?`)) return
    setClearingFailed(true)
    try {
      await aiIngestionApi.clearFailed()
      toast({ title: `Đã xoá ${failedJobs.length} log lỗi cũ` })
      qc.invalidateQueries({ queryKey: ['admin-ai-jobs'] })
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setClearingFailed(false)
    }
  }

  return (
    <div className="container max-w-5xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ai" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <ListChecks className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Tác vụ ingest</h1>
          <p className="text-sm text-gray-500">Tự động refresh mỗi 5 giây</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1 rounded-full text-sm border ${statusFilter === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
        >
          Tất cả
        </button>
        {([0, 1, 2, 3, 4] as AiJobStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm border ${statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
          >
            {AI_JOB_STATUS_LABEL[s]}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto text-red-700 border-red-200 hover:bg-red-50"
          onClick={handleClearFailed}
          disabled={failedCount === 0 || clearingFailed}
        >
          {clearingFailed ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
          Dọn lỗi cũ
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có tác vụ nào.</div>
      ) : (
        <div className="space-y-2">
          {items.map(job => (
            <div key={job.id} className="border rounded-lg px-4 py-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {statusBadge(job.status)}
                    <span className="text-xs text-gray-500">
                      {job.sourceName ?? job.sourceId.slice(0, 8) + '…'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tạo: {new Date(job.creationTime).toLocaleString('vi-VN')}
                    {job.startedAt && ` · Bắt đầu: ${new Date(job.startedAt).toLocaleTimeString('vi-VN')}`}
                    {job.finishedAt && ` · Kết thúc: ${new Date(job.finishedAt).toLocaleTimeString('vi-VN')}`}
                  </p>
                  {job.error && (
                    <p className="text-xs text-red-600 mt-1 break-all">⚠ {job.error}</p>
                  )}
                </div>
                {progressBar(job)}
                <div className="shrink-0">
                  {(job.status === 0 || job.status === 1) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                      onClick={() => handleCancel(job)}
                      disabled={cancellingId === job.id}
                    >
                      {cancellingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3 mr-1" />}
                      Huỷ
                    </Button>
                  )}
                  {job.status !== 0 && job.status !== 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(job)}
                      disabled={deletingId === job.id || clearingFailed}
                      title="Xoá log"
                    >
                      {deletingId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4">
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.totalCount ?? 0}
          onPageChange={setPage}
          showEdges={false}
          summary={(data?.totalCount ?? 0) === 0
            ? 'Tổng: 0 tác vụ'
            : `Hiển thị ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data?.totalCount ?? 0)} / ${data?.totalCount ?? 0} tác vụ`}
        />
      </div>
    </div>
  )
}
