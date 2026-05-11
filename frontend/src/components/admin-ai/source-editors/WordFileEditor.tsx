'use client'
import { useToast } from '@/components/ui/use-toast'
import { useMemo, useState } from 'react'
import { parseConfig, readFileAsBase64, type EditorProps } from './utils'

export function WordFileEditor({ value, onChange }: EditorProps) {
  const { toast } = useToast()
  const parsed = useMemo(() => parseConfig(value), [value])
  const [fileName, setFileName] = useState(parsed.fileName ?? '')
  const [title, setTitle] = useState(parsed.title ?? '')
  const [url, setUrl] = useState(parsed.url ?? '')
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const emit = (next: Record<string, string>) => {
    onChange(JSON.stringify({
      fileName,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      base64: parsed.base64,
      ...(title.trim() ? { title: title.trim() } : {}),
      ...(url.trim() ? { url: url.trim() } : {}),
      ...next,
    }))
  }

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({ title: 'File khong hop le', description: 'Chi ho tro file Word .docx.', variant: 'destructive' })
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'File qua lon', description: 'Vui long chon file .docx nho hon 20 MB.', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const base64 = await readFileAsBase64(file)
      setFileName(file.name)
      setFileSize(file.size)
      onChange(JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        base64,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(url.trim() ? { url: url.trim() } : {}),
      }))
      toast({ title: 'Da nap file Word', description: `${file.name} - ${(file.size / 1024).toFixed(1)} KB` })
    } catch (err) {
      toast({ title: 'Khong doc duoc file', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        placeholder="Tieu de tai lieu (tuy chon, mac dinh lay ten file)"
        value={title}
        onChange={(e) => { setTitle(e.target.value); emit({ title: e.target.value.trim() }) }}
      />
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={loading}
      />
      <input
        className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm bg-white"
        placeholder="URL nguon (tuy chon)"
        value={url}
        onChange={(e) => { setUrl(e.target.value); emit({ url: e.target.value.trim() }) }}
      />
      {fileName && (
        <p className="text-xs text-green-600">
          File: {fileName}{fileSize ? ` - ${(fileSize / 1024).toFixed(1)} KB` : ''}
        </p>
      )}
      <p className="text-[11px] text-gray-400">
        Sau khi tao nguon, bam Reindex de backend doc .docx, chunk noi dung va tao embedding.
      </p>
    </div>
  )
}
