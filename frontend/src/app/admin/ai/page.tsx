'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, LibraryBig, ListChecks, Sliders } from 'lucide-react'
import Link from 'next/link'

const tiles = [
  {
    title: 'Nguồn dữ liệu',
    desc: 'Thêm nguồn từ CMS, PDF, Word, ảnh, URL. Re-index khi nội dung thay đổi.',
    href: '/admin/ai/sources',
    icon: LibraryBig,
  },
  {
    title: 'Cấu hình AI',
    desc: 'Chọn provider LLM (Gemini, OpenAI, Claude), quản lý API key, tuning RAG.',
    href: '/admin/ai/settings',
    icon: Sliders,
  },
  {
    title: 'Tác vụ ingest',
    desc: 'Theo dõi tiến độ tạo embedding. Huỷ job lỗi hoặc chạy quá lâu.',
    href: '/admin/ai/jobs',
    icon: ListChecks,
  },
  {
    title: 'Nhật ký hội thoại',
    desc: 'Xem câu hỏi từ người dùng, feedback, xuất CSV để phân tích.',
    href: '/admin/ai/logs',
    icon: ClipboardList,
  },
]

export default function AiHubPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Trợ lý AI</h1>
        <p className="text-muted-foreground">
          Quản lý chatbot RAG — nguồn dữ liệu, cấu hình provider, theo dõi tác vụ và hội thoại.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {tiles.map((t) => (
          <Card key={t.href}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <t.icon className="h-5 w-5" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={t.href}>
                <Button variant="outline" size="sm">Mở trang</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
