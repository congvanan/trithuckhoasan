'use client'

import { mediaDescriptorAdminCreate, mediaDescriptorAdminDelete } from '@/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Copy, ImageIcon, Trash2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

type UploadedMedia = {
  id: string
  name: string
  url: string
}

export default function MediaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [mediaList, setMediaList] = useState<UploadedMedia[]>([])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploaded: UploadedMedia[] = []

    for (const file of Array.from(files)) {
      try {
        const res = await mediaDescriptorAdminCreate({
          path: { entityType: 'cms-kit' },
          query: { Name: file.name },
          body: { File: file },
        })

        if (res.data) {
          const media = res.data as any
          uploaded.push({
            id: media.id,
            name: file.name,
            url: `/api/cms-kit-public/media/${media.id}`,
          })
        }
      } catch (err) {
        toast({
          title: 'Lỗi upload',
          description: `Không thể upload ${file.name}`,
          variant: 'destructive',
        })
      }
    }

    if (uploaded.length > 0) {
      setMediaList((prev) => [...uploaded, ...prev])
      toast({
        title: 'Upload thành công',
        description: `Đã upload ${uploaded.length} file`,
      })
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    try {
      await mediaDescriptorAdminDelete({ path: { id } })
      setMediaList((prev) => prev.filter((m) => m.id !== id))
      toast({ title: 'Đã xóa', description: 'File đã được xóa' })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể xóa file', variant: 'destructive' })
    }
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast({ title: 'Đã copy', description: `mediaId: ${id}` })
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
            <p className="text-sm text-muted-foreground">
              Upload và quản lý ảnh cho website
            </p>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Đang upload...' : 'Upload ảnh'}
          </Button>
        </div>
      </div>

      {/* Hướng dẫn */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 text-sm text-blue-800 dark:text-blue-300">
        <strong>Cách dùng:</strong> Upload ảnh → Copy <strong>mediaId</strong> →
        Paste vào <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">doctors.ts</code> hoặc dùng trong bài viết.
      </div>

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
            <Card key={media.id} className="overflow-hidden group relative">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate mb-2">{media.name}</p>
                <div className="flex gap-1">
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
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(media.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
