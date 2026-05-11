import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DOCTORS } from '@/lib/data/doctors'
import { Copy, ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import type { RefObject } from 'react'
import type { UploadedMedia } from '../types'

interface DoctorTabProps {
  mediaList: UploadedMedia[]
  fileRef: RefObject<HTMLInputElement | null>
  selectedDoctor: string
  setSelectedDoctor: (v: string) => void
  isUploading: boolean
  doUpload: (files: FileList, isBanner: boolean, isGallery?: boolean) => void
  handleDelete: (id: string, name: string, isBanner?: boolean) => void
  handleAssignDoctor: (mediaId: string, slug: string) => void
  copyText: (text: string, label?: string) => void
}

export function DoctorTab({
  mediaList, fileRef, selectedDoctor, setSelectedDoctor,
  isUploading, doUpload, handleDelete, handleAssignDoctor, copyText,
}: DoctorTabProps) {
  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
        <strong>Cách dùng nhanh:</strong> Chọn bác sĩ trong dropdown → Upload ảnh →{' '}
        <strong>ID tự động ghi vào doctors.ts</strong>, không cần copy thủ công.
      </div>

      <div className="flex items-center gap-2 mb-4">
        <select
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="text-sm border rounded-md px-2 py-1.5 bg-background"
        >
          <option value="">-- Không gán bác sĩ --</option>
          {DOCTORS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
        <input
          ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files?.length && doUpload(e.target.files, false)}
        />
        <Button onClick={() => fileRef.current?.click()} disabled={isUploading}>
          {isUploading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang upload...</>
            : <><Upload className="w-4 h-4 mr-2" />Upload ảnh</>}
        </Button>
      </div>

      {mediaList.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-20 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-muted-foreground text-sm">Nhấn để upload ảnh đầu tiên</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url} alt={media.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
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
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                    onClick={() => copyText(media.id, 'mediaId')}>
                    <Copy className="w-3 h-3 mr-1" />Copy ID
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(media.id, media.name, false)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <select
                  className="w-full text-xs border rounded px-1 py-1 bg-background"
                  value={media.doctorSlug ?? ''}
                  onChange={(e) => e.target.value && handleAssignDoctor(media.id, e.target.value)}
                >
                  <option value="">Gán cho bác sĩ...</option>
                  {DOCTORS.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
