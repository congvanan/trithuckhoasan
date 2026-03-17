// ============================================================
// Cấu hình tự động sinh code API client từ Swagger/OpenAPI
// Chạy lệnh: pnpm gen-api để regenerate toàn bộ thư mục src/client/
// ============================================================

import { defaultPlugins, defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  // Địa chỉ lấy file swagger.json từ backend ABP
  // Thay URL này thành backend local nếu muốn gen từ API local:
  // input: 'https://localhost:44321/swagger/v1/swagger.json'
  input: 'https://abp.antosubash.com/swagger/v1/swagger.json',

  // Thư mục xuất ra các file được tự động sinh (không chỉnh sửa tay)
  output: 'src/client',

  plugins: [
    // Các plugin mặc định (sinh types, sdk...)
    ...defaultPlugins,

    // Plugin sinh HTTP client dùng Fetch API (thay vì axios)
    '@hey-api/client-fetch',

    {
      // Plugin sinh TypeScript types từ schema OpenAPI
      name: '@hey-api/typescript',
      // readOnlyWriteOnlyBehavior: 'off', // bỏ comment nếu muốn tắt readonly/writeonly
    },
  ],
})
