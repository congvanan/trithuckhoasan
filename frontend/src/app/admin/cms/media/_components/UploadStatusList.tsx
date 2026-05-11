import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import type { UploadStatus } from '../types'

export function UploadStatusList({ statuses }: { statuses: UploadStatus[] }) {
  if (statuses.length === 0) return null
  return (
    <div className="mb-4 space-y-2">
      {statuses.map((s, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm border ${
            s.status === 'uploading'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : s.status === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {s.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {s.status === 'success' && <CheckCircle2 className="w-4 h-4" />}
          {s.status === 'error' && <XCircle className="w-4 h-4" />}
          <span className="font-medium">{s.name}</span>
          <span className="ml-auto text-xs">
            {s.status === 'uploading'
              ? 'Đang upload...'
              : s.message ?? (s.status === 'success' ? 'Thành công' : 'Thất bại')}
          </span>
        </div>
      ))}
    </div>
  )
}
