'use client'
import { blogAdminCreate, blogAdminDelete, blogAdminGetList, BlogDto } from '@/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2, Rss } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function BlogsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      toast({ title: 'Lỗi', description: 'Không thể tạo blog', variant: 'destructive' })
    } else {
      toast({ title: 'Thành công', description: `Đã tạo blog "${name}"` })
      setName(''); setSlug(''); setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
    }
  }

  const handleDelete = async (blog: BlogDto) => {
    if (!confirm(`Xóa blog "${blog.name}"? Tất cả bài viết trong blog này cũng sẽ bị xóa!`)) return
    setDeletingId(blog.id!)
    await blogAdminDelete({ path: { id: blog.id! } })
    setDeletingId(null)
    toast({ title: 'Đã xóa', description: `Blog "${blog.name}" đã được xóa` })
    queryClient.invalidateQueries({ queryKey: ['admin-blogs'] })
  }

  const generateSlug = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

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
          <p className="text-sm text-gray-500">Quản lý các chuyên mục blog</p>
        </div>
        <Button className="ml-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Tạo Blog
        </Button>
      </div>

      {/* Form tạo mới */}
      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-blue-50 space-y-3">
          <h2 className="font-semibold text-sm text-blue-700">Tạo blog mới</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Tên blog *</label>
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setSlug(generateSlug(e.target.value)) }}
                placeholder="Tin chuyên ngành"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Slug * (URL)</label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tin-chuyen-nganh"
              />
            </div>
          </div>
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
          {(data?.items ?? []).length === 0 ? (
            <div className="text-center py-12 text-gray-400">Chưa có blog nào. Tạo blog đầu tiên!</div>
          ) : (
            (data?.items ?? []).map((blog) => (
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
  )
}
