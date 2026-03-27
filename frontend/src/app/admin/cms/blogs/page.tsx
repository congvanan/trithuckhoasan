'use client'
import { blogAdminCreate, blogAdminDelete, blogAdminGetList, BlogDto } from '@/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Rss, Sparkles, Star, ArrowRight, PenLine } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const TABS = [
  { key: 'featured', label: 'Bài nổi bật', icon: Star, color: 'yellow' },
  { key: 'blogs',    label: 'Chuyên mục blog', icon: Rss, color: 'blue' },
]

export default function BlogsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    const res = await fetch('/api/admin/seed-blogs')
    const data = await res.json()
    setSeeding(false)
    if (data.results) {
      const created = data.results.filter((r: string) => r.startsWith('✅')).length
      const skipped = data.results.filter((r: string) => r.startsWith('⏭️')).length
      toast({
        title: created > 0 ? `Đã tạo ${created} chuyên mục mới` : 'Không có gì mới',
        description: skipped > 0 ? `${skipped} chuyên mục đã tồn tại` : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const res = await blogAdminGetList({ query: { MaxResultCount: 100 } })
      return res.data ?? { items: [], totalCount: 0 }
    },
  })

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    const res = await blogAdminCreate({ body: { name, slug } })
    setSaving(false)
    if (res.error) {
      toast({ title: 'Lỗi', description: 'Không thể tạo chuyên mục', variant: 'destructive' })
    } else {
      toast({ title: 'Thành công', description: `Đã tạo chuyên mục "${name}"` })
      setName(''); setSlug(''); setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
    }
  }

  const handleDelete = async (blog: BlogDto) => {
    if (!confirm(`Xóa chuyên mục "${blog.name}"? Tất cả bài viết trong đây cũng sẽ bị xóa!`)) return
    setDeletingId(blog.id!)
    await blogAdminDelete({ path: { id: blog.id! } })
    setDeletingId(null)
    toast({ title: 'Đã xóa', description: `Chuyên mục "${blog.name}" đã được xóa` })
    queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
  }

  const generateSlug = (value: string) =>
    value.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-').replace(/-+/g, '-').trim()

  return (
    <div className="container max-w-3xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cms" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Rss className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Blogs</h1>
          <p className="text-sm text-gray-500">Quản lý bài nổi bật và chuyên mục blog</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 border-b pb-0">
        {TABS.map((tab, i) => {
          const Icon = tab.icon
          const isActive = activeTab === i
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(i); setShowForm(false) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg font-semibold text-sm border-b-2 transition-colors ${
                isActive
                  ? tab.color === 'yellow'
                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                    : 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB 1: Bài nổi bật ── */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Bài viết được <strong>xuất bản mới nhất</strong> trong chuyên mục này sẽ hiển thị ở <strong>Hero section</strong> trang chủ.
          </p>
          <Link href="/admin/cms/featured">
            <div className="flex items-center justify-between border-2 border-yellow-200 rounded-xl px-5 py-5 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-yellow-900">Quản lý bài viết nổi bật</p>
                  <p className="text-xs text-yellow-600 mt-0.5">Tạo, xuất bản, đổi ảnh bìa cho bài nổi bật</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-yellow-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/admin/cms/blog-posts?blogSlug=tin-noi-bat">
            <div className="flex items-center justify-between border rounded-xl px-5 py-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Xem tất cả bài trong "Tin nổi bật"</p>
                  <p className="text-xs text-gray-400 mt-0.5">Slug: <code className="bg-gray-100 px-1 rounded">tin-noi-bat</code></p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      )}

      {/* ── TAB 2: Chuyên mục blog ── */}
      {activeTab === 1 && (
        <div>
          {/* Actions */}
          <div className="flex gap-2 mb-4 justify-end">
            <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
              <Sparkles className="w-4 h-4 mr-1" />
              {seeding ? 'Đang tạo...' : 'Khởi tạo mặc định'}
            </Button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" /> Tạo chuyên mục
            </Button>
          </div>

          {/* Form tạo mới */}
          {showForm && (
            <div className="border rounded-lg p-4 mb-4 bg-blue-50 space-y-3">
              <p className="font-semibold text-sm text-blue-700">Tạo chuyên mục mới</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tên chuyên mục *</label>
                  <Input
                    value={name}
                    onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)) }}
                    placeholder="VD: Tin chuyên ngành"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Slug * (URL)</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="VD: tin-chuyen-nganh"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Sau khi tạo, vào <strong>Blog Posts</strong> để thêm bài vào chuyên mục này.</p>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={saving || !name || !slug}>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
              </div>
            </div>
          )}

          {/* Danh sách */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.items ?? []).filter(b => b.slug !== 'tin-noi-bat').length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  Chưa có chuyên mục nào.
                  <br />
                  <button onClick={handleSeed} className="text-blue-500 hover:underline text-sm mt-2">
                    Khởi tạo mặc định (Sản khoa, Phụ khoa, Sơ sinh...)
                  </button>
                </div>
              ) : (
                (data?.items ?? [])
                  .filter(b => b.slug !== 'tin-noi-bat')
                  .map((blog) => (
                    <div key={blog.id} className="flex items-center justify-between border rounded-lg px-4 py-3 bg-white hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-800">{blog.name}</p>
                        <p className="text-xs text-gray-400">
                          Slug: <code className="bg-gray-100 px-1 rounded">{blog.slug}</code>
                          {' · '}{blog.blogPostCount ?? 0} bài viết
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/cms/blog-posts?blogId=${blog.id}`}>
                          <Button variant="outline" size="sm">Xem bài viết</Button>
                        </Link>
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(blog)}
                          disabled={deletingId === blog.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
