// ============================================================
// Xử lý xác thực (authentication) cho các HTTP request
// Hỗ trợ Bearer token, Basic auth và API key
// ============================================================

// Kiểu token xác thực: chuỗi string hoặc undefined (chưa có token)
export type AuthToken = string | undefined

// Cấu hình cách gửi token xác thực trong request
export interface Auth {
  /**
   * Vị trí gửi token trong request:
   * - 'header': gửi qua HTTP header (mặc định, phổ biến nhất)
   * - 'query': gửi qua query string trên URL
   * - 'cookie': gửi qua cookie
   * @default 'header'
   */
  in?: 'header' | 'query' | 'cookie'

  /**
   * Tên của header hoặc query parameter chứa token.
   * @default 'Authorization'
   */
  name?: string

  /**
   * Kiểu scheme xác thực:
   * - 'bearer': token dạng JWT → thêm prefix "Bearer " (dùng cho ABP)
   * - 'basic': username:password dạng base64 → thêm prefix "Basic "
   */
  scheme?: 'basic' | 'bearer'

  /**
   * Loại xác thực:
   * - 'apiKey': dùng API key
   * - 'http': dùng HTTP authentication (Bearer/Basic)
   */
  type: 'apiKey' | 'http'
}

/**
 * Lấy và định dạng auth token để đưa vào request.
 * @param auth - Cấu hình xác thực
 * @param callback - Token hoặc hàm trả về token (hỗ trợ async)
 * @returns Token đã được định dạng theo scheme, hoặc undefined nếu không có token
 */
export const getAuthToken = async (
  auth: Auth,
  callback: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken
): Promise<string | undefined> => {
  // Lấy token: nếu callback là hàm thì gọi hàm, ngược lại dùng trực tiếp
  const token = typeof callback === 'function' ? await callback(auth) : callback

  // Không có token → không thêm vào request
  if (!token) {
    return
  }

  // Bearer token: thêm prefix "Bearer " → dùng cho JWT (phổ biến với ABP)
  if (auth.scheme === 'bearer') {
    return `Bearer ${token}`
  }

  // Basic auth: mã hóa base64 → thêm prefix "Basic "
  if (auth.scheme === 'basic') {
    return `Basic ${btoa(token)}`
  }

  // API key hoặc custom: trả về token nguyên bản
  return token
}
