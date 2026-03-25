'use client'

import { mediaDescriptorAdminCreate, mediaDescriptorAdminDelete } from '@/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { updateDoctorMediaId } from '@/lib/actions/updateDoctorMedia'
import { DOCTORS } from '@/lib/data/doctors'
import { ArrowLeft, CheckCircle2, Copy, ImageIcon, Loader2, Trash2, Upload, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type UploadedMedia = {
  id: string
  name: string
  url: string
  uploadedAt: string
  doctorSlug?: string // bác sĩ được gán
}

const STORAGE_KEY = 'cms-media-library'

function loadFromStorage(): UploadedMedia[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(list: UploadedMedia[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

type UploadStatus = { name: string; status: 'uploading' | 'success' | 'error'; message?: string }

export default function MediaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([])
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string>('') // slug bác sĩ được chọn

  useEffect(() => {
    setMediaList(loadFromStorage())
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const statuses: UploadStatus[] = Array.from(files).map((f) => ({
      name: f.name,
      status: 'uploading',
    }))
    setUploadStatuses(statuses)

    const uploaded: UploadedMedia[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const res = await mediaDescriptorAdminCreate({
          path: { entityType: 'BlogPost' },
          query: { Name: file.name },
          body: { File: file },
        })

        if (res.error) {
          const errMsg = (res.error as any)?.error?.message ?? JSON.stringify(res.error)
          statuses[i] = { name: file.name, status: 'error', message: errMsg }
          setUploadStatuses([...statuses])
          continue
        }

        const media = res.data
        if (media?.id) {
          const item: UploadedMedia = {
            id: media.id,
            name: file.name,
            url: `/api/cms-kit/media/${media.id}`,
            uploadedAt: new Date().toLocaleString('vi-VN'),
            doctorSlug: selectedDoctor || undefined,
          }
          uploaded.push(item)

          // Tự động gán mediaId vào doctors.ts nếu đã chọn bác sĩ
          if (selectedDoctor) {
            try {
              await updateDoctorMediaId(selectedDoctor, media.id)
              const doctorName = DOCTORS.find((d) => d.slug === selectedDoctor)?.name ?? selectedDoctor
              statuses[i] = { name: file.name, status: 'success', message: `Đã gán cho ${doctorName}` }
            } catch {
              statuses[i] = { name: file.name, status: 'success', message: 'Upload OK (gán bác sĩ thất bại)' }
            }
          } else {
            statuses[i] = { name: file.name, status: 'success' }
          }
        } else {
          statuses[i] = { name: file.name, status: 'error', message: 'Server không trả về ID' }
        }
      } catch (err: any) {
        statuses[i] = {
          name: file.name,
          status: 'error',
          message: err?.message ?? 'Lỗi không xác định',
        }
      }
      setUploadStatuses([...statuses])
    }

    if (uploaded.length > 0) {
      setMediaList((prev) => {
        const updated = [...uploaded, ...prev]
        saveToStorage(updated)
        return updated
      })
      const doctorName = selectedDoctor
        ? DOCTORS.find((d) => d.slug === selectedDoctor)?.name
        : null
      toast({
        title: `Upload thành công ${uploaded.length}/${files.length} file`,
        description: doctorName ? `Đã gán ảnh cho ${doctorName}` : undefined,
        variant: 'default',
      })
    }

    const failCount = statuses.filter((s) => s.status === 'error').length
    if (failCount > 0) {
      toast({
        title: `${failCount} file upload thất bại`,
        description: statuses.filter((s) => s.status === 'error').map((s) => s.name).join(', '),
        variant: 'destructive',
      })
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setTimeout(() => setUploadStatuses([]), 5000)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa ảnh "${name}"?`)) return
    try {
      await mediaDescriptorAdminDelete({ path: { id } })
      setMediaList((prev) => {
        const updated = prev.filter((m) => m.id !== id)
        saveToStorage(updated)
        return updated
      })
      toast({ title: 'Đã xóa', description: name })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa file', variant: 'destructive' })
    }
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: 'Đã copy mediaId', description: id })
  }

  const handleAssignDoctor = async (mediaId: string, slug: string) => {
    try {
      await updateDoctorMediaId(slug, mediaId)
      const doctorName = DOCTORS.find((d) => d.slug === slug)?.name ?? slug
      setMediaList((prev) => {
        const updated = prev.map((m) => m.id === mediaId ? { ...m, doctorSlug: slug } : m)
        saveToStorage(updated)
        return updated
      })
      toast({ title: `Đã gán cho ${doctorName}`, description: `mediaId đã cập nhật vào doctors.ts` })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể gán bác sĩ', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/cms')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Media Library</h1>
            <p className="text-sm text-muted-foreground">Upload và quản lý ảnh cho website</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Chọn bác sĩ trước khi upload */}
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="text-sm border rounded-md px-2 py-1.5 bg-background"
          >
            <option value="">-- Không gán bác sĩ --</option>
            {DOCTORS.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? 'Đang upload...' : 'Upload ảnh'}
          </Button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Cách dùng nhanh:</strong> Chọn bác sĩ trong dropdown → Upload ảnh →{' '}
        <strong>ID tự động ghi vào doctors.ts</strong>, không cần copy thủ công.
      </div>

      {/* Upload Status */}
      {uploadStatuses.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploadStatuses.map((s, i) => (
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
              <span className="ml-auto">
                {s.status === 'uploading' && 'Đang upload...'}
                {s.status === 'success' && (s.message ?? 'Thành công')}
                {s.status === 'error' && (s.message ?? 'Thất bại')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Media Grid */}
      {mediaList.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-muted-foreground text-sm">Nhấn để upload ảnh đầu tiên</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                    ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                {/* Badge bác sĩ đã gán */}
                {media.doctorSlug && (
                  <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 text-white text-xs px-1.5 py-0.5 truncate">
                    {DOCTORS.find((d) => d.slug === media.doctorSlug)?.name ?? media.doctorSlug}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate mb-1">{media.name}</p>
                <p className="text-xs text-gray-400 mb-2">{media.uploadedAt}</p>
                <div className="flex gap-1 mb-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => copyId(media.id)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy ID
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:border-red-300"
                    onClick={() => handleDelete(media.id, media.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {/* Gán bác sĩ sau khi upload */}
                <select
                  className="w-full text-xs border rounded px-1 py-1 bg-background"
                  value={media.doctorSlug ?? ''}
                  onChange={(e) => e.target.value && handleAssignDoctor(media.id, e.target.value)}
                >
                  <option value="">Gán cho bác sĩ...</option>
                  {DOCTORS.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
