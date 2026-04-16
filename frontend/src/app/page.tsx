import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PublicLayout from '@/layout/public-layout'
import Link from 'next/link'
import { NewsTabs } from '@/components/sections/NewsTabs'
import { KienThucTabs } from '@/components/sections/KienThucTabs'
import { BannerSlider, type BannerSlide } from '@/components/sections/BannerSlider'
import { fetchBlogPosts } from '@/lib/server/fetchBlogPosts'
import { readLayoutConfig } from '@/lib/server/pageLayout'
import { parseCoverImage } from '@/lib/utils/parseCoverImage'
import { Suspense } from 'react'
import {
  Rocket,
  CheckCircle,
  ArrowRight,
  Heart,
  Baby,
  Microscope,
  Stethoscope,
  BookOpen,
  Users,
} from 'lucide-react'

// ── Skeletons ─────────────────────────────────────────────────────────────
function BannerSkeleton() {
  return <div className="w-full animate-pulse bg-gray-200" style={{ height: 'clamp(220px, 45vw, 520px)' }} />
}

function TabsSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-12">
      <div className="flex gap-3 justify-center">
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
        <div className="h-9 w-32 bg-gray-200 rounded-full" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 container px-4 md:px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

function HeroSkeleton() {
  return (
    <div
      className="relative w-full overflow-hidden animate-pulse"
      style={{ height: 'clamp(480px, 58vw, 680px)', background: '#cbd5e1' }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 flex flex-col justify-center px-16 py-16 gap-5"
        style={{ width: '46%', background: 'linear-gradient(160deg,#134e4a,#0f766e)' }}
      >
        <div className="h-5 w-28 bg-white/20 rounded-full" />
        <div className="space-y-4">
          <div className="h-12 bg-white/20 rounded w-full" />
          <div className="h-12 bg-white/20 rounded w-5/6" />
        </div>
        <div className="h-12 w-36 bg-white/25 rounded-full mt-3" />
      </div>
    </div>
  )
}

// ── Server sections ────────────────────────────────────────────────────────
async function BannerSection() {
  let posts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  try { posts = await fetchBlogPosts('banner-slide', 10) } catch {}
  if (!posts.length) return null
  const slides: (BannerSlide & { order: number })[] = posts
    .map((p) => {
      // Lấy order từ prefix số (nếu có) trước khi parse cover
      const parts = (p.shortDescription ?? '').split('|')
      const firstIsOrder = /^\d+$/.test(parts[0] ?? '')
      const order = firstIsOrder ? parseInt(parts[0]) : 99
      const { imageUrl, description: caption } = parseCoverImage(p)
      return { id: p.id ?? '', imageUrl, title: p.title ?? '', caption, link: `/blog/banner-slide/${p.slug ?? ''}`, order }
    })
    .filter((s) => s.imageUrl)
    .sort((a, b) => a.order - b.order)
  return <BannerSlider slides={slides} />
}

async function NewsTabsSection() {
  let chuyenNganhPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  let quocTePosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  try {
    ;[chuyenNganhPosts, quocTePosts] = await Promise.all([
      fetchBlogPosts('tin-chuyen-nghanh', 4),
      fetchBlogPosts('tin-quoc-te', 4),
    ])
  } catch {}
  return <NewsTabs chuyenNganhPosts={chuyenNganhPosts} quocTePosts={quocTePosts} />
}

async function KienThucTabsSection() {
  let sanKhoaPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  let phuKhoaPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  let soSinhPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  try {
    ;[sanKhoaPosts, phuKhoaPosts, soSinhPosts] = await Promise.all([
      fetchBlogPosts('san-khoa', 4),
      fetchBlogPosts('phu-khoa', 4),
      fetchBlogPosts('so-sinh', 4),
    ])
  } catch {}
  return <KienThucTabs sanKhoaPosts={sanKhoaPosts} phuKhoaPosts={phuKhoaPosts} soSinhPosts={soSinhPosts} />
}

async function HeroSection() {
  let featuredPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  try { featuredPosts = await fetchBlogPosts('tin-noi-bat', 1) } catch {}
  const featured = featuredPosts[0] ?? null
  const { imageUrl: featuredCover, description: featuredDesc } = featured
    ? parseCoverImage(featured)
    : { imageUrl: '/img/hero-medical.png', description: '' }

  return (
    <section className="w-full overflow-hidden">
      {/* ── Mobile: stack dọc ── */}
      <div className="block md:hidden">
        {/* Ảnh */}
        <div className="w-full h-52 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredCover || '/img/hero-medical.png'} alt={featured?.title ?? ''} className="w-full h-full object-cover" />
        </div>
        {/* Text */}
        <div className="bg-gradient-to-br from-[#134e4a] to-[#0f766e] px-5 py-6">
          <span className="inline-flex items-center gap-1.5 text-teal-200 text-[0.65rem] font-bold px-3 py-1 rounded-full w-fit mb-3 tracking-widest uppercase border border-white/20 bg-white/10">
            <Rocket className="w-3 h-3" /> Tin nổi bật
          </span>
          <h1 className="text-white font-extrabold text-xl leading-snug tracking-tight mb-3">
            {featured?.title ?? 'Chào mừng đến Sankhoa360'}
          </h1>
          {featuredDesc && (
            <p className="text-teal-100/70 text-sm leading-relaxed line-clamp-2 mb-4">{featuredDesc}</p>
          )}
          {featured && (
            <Link href={`/blog/tin-noi-bat/${featured.slug}`}>
              <span className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full bg-white text-[#0f766e] shadow hover:bg-[#ccfbf1] transition-colors">
                Đọc bài viết <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Desktop: layout ngang với clip-path ── */}
      <div className="relative hidden md:block overflow-hidden" style={{ height: 'clamp(320px, 42vw, 500px)' }}>
        {/* Ảnh nền */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featuredCover || '/img/hero-medical.png'} alt={featured?.title ?? ''} className="w-full h-full object-cover" />
        </div>
        {/* Teal overlay trái */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: 'calc(52% + 60px)',
            background: 'linear-gradient(160deg, #134e4a 0%, #0f766e 100%)',
            clipPath: 'ellipse(78% 130% at 0% 50%)',
            zIndex: 5,
          }}
        />
        {/* Text */}
        <div
          className="absolute inset-y-0 left-0 flex flex-col justify-center px-8 lg:px-14 xl:px-16 py-10"
          style={{ width: '50%', zIndex: 10 }}
        >
          <span className="inline-flex items-center gap-1.5 text-teal-200 text-[0.68rem] font-bold px-3 py-1 rounded-full w-fit mb-4 tracking-widest uppercase border border-white/20 bg-white/10">
            <Rocket className="w-3 h-3" /> Tin nổi bật
          </span>
          <h1 className="text-white font-extrabold leading-[1.15] tracking-tight mb-4 text-2xl lg:text-3xl xl:text-4xl">
            {featured?.title ?? 'Chào mừng đến Sankhoa360'}
          </h1>
          {featuredDesc && (
            <p className="text-teal-100/70 text-sm lg:text-base leading-relaxed line-clamp-3 mb-6 max-w-sm">{featuredDesc}</p>
          )}
          {featured && (
            <Link href={`/blog/tin-noi-bat/${featured.slug}`} className="w-fit">
              <span className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full bg-white text-[#0f766e] shadow-lg hover:bg-[#ccfbf1] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                Đọc bài viết <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
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
          {[
            { color: 'pink',   Icon: Heart,       title: 'Sức khỏe buồng trứng',    desc: 'Thông tin chuyên sâu về bệnh lý buồng trứng và phương pháp điều trị',           items: ['Suy buồng trứng sớm', 'Hội chứng buồng trứng đa nang', 'U nang buồng trứng'] },
            { color: 'blue',   Icon: Baby,        title: 'Hỗ trợ sinh sản',          desc: 'Các kỹ thuật hỗ trợ sinh sản hiện đại và hiệu quả',                            items: ['Thụ tinh trong ống nghiệm (IVF)', 'Kích thích buồng trứng', 'Bảo tồn khả năng sinh sản'] },
            { color: 'purple', Icon: Microscope,  title: 'Nghiên cứu khoa học',      desc: 'Cập nhật các nghiên cứu mới nhất trong lĩnh vực sản phụ khoa',                  items: ['Công nghệ vi lưu (Microfluid)', 'Ứng dụng trí tuệ nhân tạo', 'Phân tích dữ liệu lâm sàng'] },
            { color: 'green',  Icon: Stethoscope, title: 'Điều trị bệnh phụ khoa',   desc: 'Phác đồ điều trị chuẩn cho các bệnh lý phụ khoa thường gặp',                   items: ['Polyp và viêm lộ tuyến cổ tử cung', 'U xơ tử cung', 'Lạc nội mạc tử cung'] },
            { color: 'orange', Icon: BookOpen,    title: 'Kiến thức sức khỏe',       desc: 'Thư viện kiến thức y khoa dành cho phụ nữ ở mọi lứa tuổi',                     items: ['Dinh dưỡng và lối sống lành mạnh', 'Sức khỏe tâm lý và giấc ngủ', 'Chăm sóc sức khỏe tiền mãn kinh'] },
            { color: 'indigo', Icon: Users,       title: 'Đội ngũ chuyên gia',       desc: 'Kết nối với các bác sĩ chuyên khoa sản phụ khoa giàu kinh nghiệm',             items: ['Bác sĩ chuyên khoa sản phụ khoa', 'Chuyên gia hỗ trợ sinh sản', 'Tư vấn trực tuyến 24/7'] },
          ].map(({ color, Icon, title, desc, items }) => (
            <Card key={title} className={`border-0 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border hover:border-${color}-200 cursor-pointer group`}>
              <CardHeader>
                <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-${color}-500 transition-colors duration-300`}>
                  <Icon className={`w-6 h-6 text-${color}-600 group-hover:text-white transition-colors duration-300`} />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item} className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Home page ──────────────────────────────────────────────────────────────
export default function Home() {
  const layout = readLayoutConfig()

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':     return <Suspense fallback={<HeroSkeleton />}><HeroSection /></Suspense>
      case 'banner':   return <Suspense fallback={<BannerSkeleton />}><BannerSection /></Suspense>
      case 'features': return <FeaturesSection />
      case 'news':     return <Suspense fallback={<TabsSkeleton />}><NewsTabsSection /></Suspense>
      case 'kienthuc': return <Suspense fallback={<TabsSkeleton />}><KienThucTabsSection /></Suspense>
      default:         return null
    }
  }

  return (
    <PublicLayout>
      {layout
        .filter((s) => s.visible)
        .map((s, i) => (
          <div key={s.id}>
            {i > 0 && <div className="h-[60px]" />}
            {renderSection(s.id)}
          </div>
        ))}
      <div className="pb-20" />
    </PublicLayout>
  )
}
