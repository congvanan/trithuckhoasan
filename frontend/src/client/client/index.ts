// ============================================================
// Entry point của thư mục client/client/
// Re-export tất cả types và utilities của HTTP client
// ============================================================

// Type xác thực (auth token)
export type { Auth } from '../core/auth'

// Các hàm serialize body request theo định dạng khác nhau
export {
  formDataBodySerializer,       // serialize dạng FormData (upload file)
  jsonBodySerializer,           // serialize dạng JSON (mặc định)
  urlSearchParamsBodySerializer,// serialize dạng URL query string
} from '../core/bodySerializer'

// Type tùy chọn cho query serializer
export type { QuerySerializerOptions } from '../core/bodySerializer'

// Hàm xây dựng params từ arguments (dùng trong SDK)
export { buildClientParams } from '../core/params'

// Hàm tạo HTTP client instance
export { createClient } from './client'

// Tất cả các types của HTTP client
export type {
  Client,             // Interface của HTTP client
  ClientOptions,      // Tùy chọn khởi tạo client
  Config,             // Cấu hình request
  CreateClientConfig, // Type hàm khởi tạo config
  Options,            // Tùy chọn cho từng request
  OptionsLegacyParser,// Tùy chọn theo kiểu cũ
  RequestOptions,     // Tùy chọn chi tiết của request
  RequestResult,      // Kiểu kết quả trả về
  ResponseStyle,      // Kiểu format response ('data' | 'fields')
  TDataShape,         // Shape cơ bản của data
} from './types'

// Hàm tạo config mặc định và merge headers
export { createConfig, mergeHeaders } from './utils'
