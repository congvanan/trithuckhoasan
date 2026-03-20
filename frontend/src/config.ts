// Import các icon từ thư viện lucide-react để dùng trong menu
import { BookOpenCheck, Cog, Database, FileText, Home, House, ImageIcon, Layers3, LibraryBig, Menu, MessageSquare, Microscope, Search, Sparkles, UserRound, Users } from 'lucide-react'
import React from 'react'

/**
 * Cấu hình kết nối OpenID Connect giữa frontend và backend ABP.
 * Tất cả giá trị đọc từ file .env.local để dễ thay đổi theo môi trường.
 */
export const clientConfig = {
  // Địa chỉ URL của backend API (vd: https://localhost:44321)
  url: process.env.NEXT_PUBLIC_API_URL,

  // Đối tượng nhận token (thường giống url)
  audience: process.env.NEXT_PUBLIC_API_URL,

  // ID của ứng dụng đã đăng ký trong OpenIddict backend (vd: AbpReact_Next_App)
  client_id: process.env.NEXT_PUBLIC_CLIENT_ID,

  // Các quyền truy cập yêu cầu (vd: openid profile email MyAbpApp offline_access)
  scope: process.env.NEXT_PUBLIC_SCOPE,

  // URL backend sẽ redirect về sau khi user đăng nhập thành công
  redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/openiddict`,

  // URL redirect về sau khi user đăng xuất
  post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}`,

  // Kiểu phản hồi: 'code' = nhận authorization code (bảo mật hơn implicit)
  response_type: 'code',

  // Loại grant: 'authorization_code' = đổi code lấy access token
  grant_type: 'authorization_code',

  // Trang chuyển đến sau khi đăng nhập xong
  post_login_route: `${process.env.NEXT_PUBLIC_APP_URL}`,

  // Phương thức bảo mật PKCE: 'S256' = mã hóa SHA-256 (chống tấn công code interception)
  code_challenge_method: 'S256',
}

/**
 * Danh sách menu hiển thị trên trang công khai (trang chủ, landing page).
 * Mỗi mục gồm tên và đường dẫn (anchor link trong cùng trang).
 */
export type PublicMenuItem = {
  Name: string
  Link: string
  Icon: React.ComponentType<{ className?: string }>
  submenus?: Array<{ Name: string; Link: string }>
}

export const PublicMenus: Array<PublicMenuItem> = [
  {
    Name: 'Trang chủ',
    Link: '/',
    Icon: House,
  },
  {
    Name: 'Guidelines',
    Link: '#guidelines',
    Icon: BookOpenCheck,
    submenus: [
      { Name: 'FIGO', Link: '#figo' },
      { Name: 'ACOG', Link: '#acog' },
      { Name: 'ISUOG', Link: '#isuog' },
      { Name: 'HOSREM', Link: '#hosrem' },
    ],
  },
  {
    Name: 'Nghiên cứu mới',
    Link: '#nghien-cuu-moi',
    Icon: Microscope,
    submenus: [
      { Name: 'Sản khoa', Link: '#san-khoa' },
      { Name: 'Phụ khoa', Link: '#phu-khoa' },
      { Name: 'Hiếm muộn', Link: '#hiem-muon' },
      { Name: 'Siêu âm thai', Link: '#sieu-am-thai' },
    ],
  },
  {
    Name: 'Chuyên đề',
    Link: '#chuyen-de',
    Icon: Layers3,
    submenus: [
      { Name: 'Tiền sản giật', Link: '#tien-san-giat' },
      { Name: 'Thai chậm tăng trưởng', Link: '#thai-cham-tang-truong' },
      { Name: 'Đái tháo đường thai kỳ', Link: '#dai-thao-duong-thai-ky' },
      { Name: 'IVF', Link: '#ivf' },
    ],
  },
  {
    Name: 'Tóm tắt AI',
    Link: '#tom-tat-ai',
    Icon: Sparkles,
  },
  {
    Name: 'Thư viện',
    Link: '#thu-vien',
    Icon: LibraryBig,
    submenus: [
      { Name: 'Bài báo', Link: '#bai-bao' },
      { Name: 'Khuyến cáo', Link: '#khuyen-cao' },
      { Name: 'Slide / PDF', Link: '#slide-pdf' },
    ],
  },
  {
    Name: 'Tìm kiếm',
    Link: '#tim-kiem',
    Icon: Search,
  },
]

/**
 * Danh sách menu hiển thị trong trang Admin (sau khi đăng nhập).
 * Hỗ trợ menu con (submenus) tối đa 2 cấp.
 */
export const AdminMenus: Array<{
  name: string
  link: string
  icon: React.ComponentType<{ className?: string }>
  submenus?: Array<{ name: string; link: string; icon: React.ComponentType<{ className?: string }> }>
}> = [
  {
    name: 'Home',         // Trang chủ admin
    link: '/admin',
    icon: Home,
  },
  {
    name: 'Users',        // Quản lý người dùng
    link: '/admin/users',
    icon: UserRound,
  },
  {
    name: 'Roles',        // Quản lý vai trò (phân quyền)
    link: '/admin/users/roles',
    icon: Users,
  },
  {
    name: 'CMS',          // Quản lý nội dung (có menu con)
    link: '/admin/cms',
    icon: FileText,
    submenus: [
      {
        name: 'Pages',        // Quản lý trang nội dung
        link: '/admin/cms/pages',
        icon: FileText,
      },
      {
        name: 'Menu Items',   // Quản lý menu điều hướng
        link: '/admin/cms/menus',
        icon: Menu,
      },
      {
        name: 'Comments',     // Quản lý bình luận
        link: '/admin/cms/comments',
        icon: MessageSquare,
      },
      {
        name: 'Media',        // Quản lý ảnh/media
        link: '/admin/cms/media',
        icon: ImageIcon,
      },
    ],
  },
  {
    name: 'Tenants',      // Quản lý tenant (đa công ty/tổ chức)
    link: '/admin/tenants',
    icon: Database,
  },
  {
    name: 'Settings',     // Cài đặt hệ thống
    link: '/admin/settings',
    icon: Cog,
  },
]

