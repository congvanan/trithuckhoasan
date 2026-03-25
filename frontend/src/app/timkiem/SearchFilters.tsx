'use client'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'

const BLOG_CATEGORIES = [
  { value: 'all', label: 'Tất cả (Tin tức & Thư viện)' },
  { value: 'tin-chuyen-nghanh', label: 'Thông tin chuyên ngành' },
  { value: 'tin-quoc-te', label: 'Tin quốc tế' },
]

interface Props {
  q: string
  category: string
  searchIn: string
  dateFrom: string
  dateTo: string
}

export function SearchFilters({ q, category, searchIn, dateFrom, dateTo }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams()
    const qVal = (fd.get('q') as string)?.trim()
    if (qVal) params.set('q', qVal)
    const cat = fd.get('category') as string
    if (cat && cat !== 'all') params.set('category', cat)
    const si = fd.get('searchIn') as string
    if (si && si !== 'all') params.set('searchIn', si)
    const df = fd.get('dateFrom') as string
    if (df) params.set('dateFrom', df)
    const dt = fd.get('dateTo') as string
    if (dt) params.set('dateTo', dt)
    params.set('page', '1')
    router.push(`/timkiem?${params.toString()}`)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded border p-4 sticky top-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-500">
        <Search className="w-4 h-4 text-blue-500" />
        <h3 className="font-bold text-gray-700 uppercase text-sm">Bộ lọc tìm kiếm</h3>
      </div>

      {/* Từ khóa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Từ khóa</label>
        <input
          name="q"
          type="text"
          defaultValue={q}
          placeholder="Nhập từ khóa..."
          className="w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400"
        />
      </div>

      {/* Danh mục */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
        <select
          name="category"
          defaultValue={category}
          className="w-full border rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
        >
          {BLOG_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tìm trong */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm trong</label>
        <div className="space-y-1.5">
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'title', label: 'Chỉ tiêu đề' },
            { value: 'desc', label: 'Chỉ nội dung/Mô tả' },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="searchIn"
                value={opt.value}
                defaultChecked={searchIn === opt.value}
                className="accent-blue-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ngày đăng */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày đăng / Cập nhật</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-6">Từ</span>
            <input
              name="dateFrom"
              type="date"
              defaultValue={dateFrom}
              className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-6">Đến</span>
            <input
              name="dateTo"
              type="date"
              defaultValue={dateTo}
              className="flex-1 border rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Search className="w-4 h-4" />
        Tìm kiếm
      </button>
    </form>
  )
}
