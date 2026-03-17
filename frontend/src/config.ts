// Import các icon từ thư viện lucide-react để dùng trong menu
import { Cog, Database, FileText, Home, Menu, MessageSquare, UserRound, Users } from 'lucide-react'
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
export const PublicMenus: Array<{ Name: string; Link: string }> = [
  {
    Name: 'Features',   // Tính năng
    Link: '#features',
  },
  {
    Name: 'Getting Started',  // Bắt đầu
    Link: '#getting-started',
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

