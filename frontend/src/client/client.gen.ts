// File được tự động sinh bởi @hey-api/openapi-ts
// KHÔNG chỉnh sửa tay - sẽ bị ghi đè khi chạy pnpm gen-api

import {
  type Config,
  type ClientOptions as DefaultClientOptions,
  createClient,
  createConfig,
} from './client'
import type { ClientOptions } from './types.gen'

/**
 * Kiểu hàm dùng để tùy chỉnh cấu hình ban đầu của HTTP client.
 * Hữu ích khi dùng với Next.js để đảm bảo client luôn có đúng giá trị cấu hình.
 * Dùng thay cho setConfig() nếu muốn khởi tạo sẵn từ đầu.
 */
export type CreateClientConfig<T extends DefaultClientOptions = ClientOptions> = (
  override?: Config<DefaultClientOptions & T>
) => Config<Required<DefaultClientOptions> & T>

// Khởi tạo HTTP client dùng chung cho toàn bộ ứng dụng
// - Trên trình duyệt (client-side): baseUrl = '' → dùng proxy Next.js (tránh CORS)
// - Trên server (server-side/SSR): baseUrl = NEXT_PUBLIC_API_URL → gọi thẳng backend
export const client = createClient(
  createConfig<ClientOptions>({
    baseUrl: typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL!,
  })
)
