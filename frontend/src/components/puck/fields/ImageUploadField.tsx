'use client'
import { useRef, useState } from 'react'

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUploadField({ value, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (file: File) => {
    setStatus('uploading')
    setErrorMsg('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload thất bại')
      onChange(data.url)
      setStatus('idle')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi không xác định')
      setStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Preview ảnh hiện tại */}
      {value && (
        <img
          src={value}
          alt="preview"
          style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }}
        />
      )}

      {/* Nút upload */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px dashed #93c5fd',
          background: '#eff6ff',
          cursor: status === 'uploading' ? 'not-allowed' : 'pointer',
          fontSize: 13,
          color: '#1d4ed8',
          fontWeight: 500,
        }}
      >
        {status === 'uploading' ? '⏳ Đang upload...' : '☁️ Upload ảnh lên Cloud'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

      {/* Hoặc nhập URL tay */}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Hoặc dán URL ảnh..."
        style={{
          padding: '6px 10px',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          fontSize: 12,
          color: '#6b7280',
        }}
      />

      {status === 'error' && (
        <p style={{ color: '#dc2626', fontSize: 12, margin: 0 }}>❌ {errorMsg}</p>
      )}
    </div>
  )
}
