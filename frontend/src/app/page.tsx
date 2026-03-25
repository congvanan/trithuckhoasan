import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PublicLayout from '@/layout/public-layout'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NewsTabs } from '@/components/sections/NewsTabs'
import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import {
  Rocket,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Zap,
  Heart,
  Baby,
  Microscope,
  Stethoscope,
  BookOpen,
  Users,
  Palette,
  Code
} from 'lucide-react'

/**
 * The Home component is an asynchronous function that returns a comprehensive landing page.
 * It showcases the AbpReact template features and provides clear next steps for users.
 *
 * @returns {React.ReactElement} The rendered JSX element.
 */
export default async function Home() {
  const [chuyenNganhPosts, quocTePosts] = await Promise.all([
    fetchBlogPosts('tin-chuyen-nghanh', 4),
    fetchBlogPosts('tin-quoc-te', 4),
  ])

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <Badge variant="secondary" className="w-fit">
                  <Rocket className="w-3 h-3 mr-1" />
                  Tin tức y khoa
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl/none">
                  Điều trị polyp và viêm lộ tuyến cổ tử cung trong một lần can thiệp
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Ra máu bất thường giữa kỳ kinh, chị N.T.P đến BVĐK Hồng Ngọc thăm khám và bất ngờ phát hiện nhiều polyp cổ tử cung.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pages/dieu-tri-polyp-va-viem-lo-tuyen-co-tu-cung">
                  <Button size="lg" className="w-full sm:w-auto">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Đọc bài viết
                  </Button>
                </Link>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/hero-medical.png"
              alt="Bác sĩ thăm khám sản phụ"
              className="rounded-xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
              Chăm sóc sức khỏe sinh sản toàn diện
            </h2>
            <p className="text-muted-foreground md:text-xl max-w-3xl mx-auto">
              Tri Thức Khỏe Sản cung cấp thông tin y khoa chuyên sâu về sản phụ khoa,
              hỗ trợ sinh sản và sức khỏe phụ nữ từ đội ngũ chuyên gia hàng đầu.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle>Sức khỏe buồng trứng</CardTitle>
                <CardDescription>
                  Thông tin chuyên sâu về bệnh lý buồng trứng và phương pháp điều trị
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Suy buồng trứng sớm
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Hội chứng buồng trứng đa nang
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    U nang buồng trứng
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Baby className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Hỗ trợ sinh sản</CardTitle>
                <CardDescription>
                  Các kỹ thuật hỗ trợ sinh sản hiện đại và hiệu quả
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Thụ tinh trong ống nghiệm (IVF)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Kích thích buồng trứng
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Bảo tồn khả năng sinh sản
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Microscope className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Nghiên cứu khoa học</CardTitle>
                <CardDescription>
                  Cập nhật các nghiên cứu mới nhất trong lĩnh vực sản phụ khoa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Công nghệ vi lưu (Microfluid)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Ứng dụng trí tuệ nhân tạo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Phân tích dữ liệu lâm sàng
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Stethoscope className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Điều trị bệnh phụ khoa</CardTitle>
                <CardDescription>
                  Phác đồ điều trị chuẩn cho các bệnh lý phụ khoa thường gặp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Polyp và viêm lộ tuyến cổ tử cung
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    U xơ tử cung
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Lạc nội mạc tử cung
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Kiến thức sức khỏe</CardTitle>
                <CardDescription>
                  Thư viện kiến thức y khoa dành cho phụ nữ ở mọi lứa tuổi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Dinh dưỡng và lối sống lành mạnh
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Sức khỏe tâm lý và giấc ngủ
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Chăm sóc sức khỏe tiền mãn kinh
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle>Đội ngũ chuyên gia</CardTitle>
                <CardDescription>
                  Kết nối với các bác sĩ chuyên khoa sản phụ khoa giàu kinh nghiệm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Bác sĩ chuyên khoa sản phụ khoa
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Chuyên gia hỗ trợ sinh sản
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Tư vấn trực tuyến 24/7
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News Tabs Section */}
      <NewsTabs chuyenNganhPosts={chuyenNganhPosts} quocTePosts={quocTePosts} />

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4">
              Ready to build something amazing?
            </h2>
            <p className="text-muted-foreground md:text-xl mb-8 max-w-2xl mx-auto">
              Start exploring the components, check out the documentation, or dive into the admin panel to see what AbpReact can do for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin">
                <Button size="lg" className="w-full sm:w-auto">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Explore Admin Panel
                </Button>
              </Link>
              <Link href="https://abp-react-storybook.antosubash.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Palette className="w-4 h-4 mr-2" />
                  View Storybook
                </Button>
              </Link>
              <Link href="https://antosubash.github.io/abp-react/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Code className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}