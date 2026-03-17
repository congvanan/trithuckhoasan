// ============================================================
// Định nghĩa các interface và type cốt lõi của HTTP client
// ============================================================

import type { Auth, AuthToken } from './auth'
import type { BodySerializer, QuerySerializer, QuerySerializerOptions } from './bodySerializer'

/**
 * Interface của HTTP client - mô tả tất cả các method có thể gọi.
 * Generic types cho phép tùy chỉnh kiểu của request, response, config...
 */
export interface Client<RequestFn = never, Config = unknown, MethodFn = never, BuildUrlFn = never> {
  /** Trả về URL đầy đủ của request (bao gồm path params và query string) */
  buildUrl: BuildUrlFn
  connect: MethodFn   // gửi request method CONNECT
  delete: MethodFn    // gửi request method DELETE (xóa dữ liệu)
  get: MethodFn       // gửi request method GET (lấy dữ liệu)
  getConfig: () => Config  // lấy cấu hình hiện tại của client
  head: MethodFn      // gửi request method HEAD (chỉ lấy headers)
  options: MethodFn   // gửi request method OPTIONS
  patch: MethodFn     // gửi request method PATCH (cập nhật một phần)
  post: MethodFn      // gửi request method POST (tạo mới)
  put: MethodFn       // gửi request method PUT (cập nhật toàn bộ)
  request: RequestFn  // gửi request với method tùy chỉnh
  setConfig: (config: Config) => Config  // cập nhật cấu hình client
  trace: MethodFn     // gửi request method TRACE
}

/**
 * Cấu hình cho HTTP client và từng request.
 * Kế thừa RequestInit của Fetch API và mở rộng thêm các tính năng.
 */
export interface Config {
  /**
   * Token xác thực hoặc hàm trả về token.
   * Giá trị này sẽ được thêm vào request theo cấu hình `security`.
   * Hỗ trợ cả giá trị tĩnh và hàm async (lấy token mới mỗi lần gọi).
   */
  auth?: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken

  /**
   * Hàm serialize body của request.
   * Mặc định: JSON.stringify (jsonBodySerializer).
   * Đặt null để không serialize.
   */
  bodySerializer?: BodySerializer | null

  /**
   * HTTP headers gửi kèm với mọi request.
   * Có thể là object, Headers instance, hoặc mảng tuples.
   */
  headers?:
    | RequestInit['headers']
    | Record<
        string,
        string | number | boolean | (string | number | boolean)[] | null | undefined | unknown
      >

  /**
   * HTTP method của request (GET, POST, PUT...).
   */
  method?: 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE'

  /**
   * Hàm serialize query params thành URL string.
   * Mặc định: form style cho mảng, deepObject cho object.
   */
  querySerializer?: QuerySerializer | QuerySerializerOptions

  /**
   * Hàm validate dữ liệu request trước khi gửi.
   * Dùng để đảm bảo dữ liệu đúng format trước khi gửi lên server.
   */
  requestValidator?: (data: unknown) => Promise<unknown>

  /**
   * Hàm transform dữ liệu response sau khi nhận về.
   * Ví dụ: chuyển ISO string thành Date object.
   */
  responseTransformer?: (data: unknown) => Promise<unknown>

  /**
   * Hàm validate dữ liệu response sau khi nhận về.
   * Đảm bảo response đúng format trước khi transform và trả về.
   */
  responseValidator?: (data: unknown) => Promise<unknown>
}
