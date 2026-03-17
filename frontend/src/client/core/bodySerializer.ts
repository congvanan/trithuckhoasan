// ============================================================
// Các hàm serialize body của HTTP request
// Chuyển đổi object JavaScript thành định dạng phù hợp để gửi lên server
// ============================================================

import type { ArrayStyle, ObjectStyle, SerializerOptions } from './pathSerializer'

// Kiểu hàm serialize query string: nhận object, trả về string URL
export type QuerySerializer = (query: Record<string, unknown>) => string

// Kiểu hàm serialize body: nhận bất kỳ, trả về dạng phù hợp để gửi
export type BodySerializer = (body: any) => any

// Tùy chọn cấu hình cho query serializer
export interface QuerySerializerOptions {
  allowReserved?: boolean                    // cho phép ký tự đặc biệt không bị encode
  array?: SerializerOptions<ArrayStyle>      // cách serialize mảng
  object?: SerializerOptions<ObjectStyle>    // cách serialize object
}

/**
 * Thêm một cặp key-value vào FormData.
 * - String và Blob: thêm trực tiếp
 * - Các kiểu khác (object, number...): chuyển sang JSON string
 */
const serializeFormDataPair = (data: FormData, key: string, value: unknown): void => {
  if (typeof value === 'string' || value instanceof Blob) {
    data.append(key, value)
  } else {
    data.append(key, JSON.stringify(value))
  }
}

/**
 * Thêm một cặp key-value vào URLSearchParams.
 * - String: thêm trực tiếp
 * - Các kiểu khác: chuyển sang JSON string
 */
const serializeUrlSearchParamsPair = (data: URLSearchParams, key: string, value: unknown): void => {
  if (typeof value === 'string') {
    data.append(key, value)
  } else {
    data.append(key, JSON.stringify(value))
  }
}

/**
 * Serializer dùng cho upload file hoặc form HTML.
 * Chuyển object thành FormData để gửi với Content-Type: multipart/form-data
 */
export const formDataBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(
    body: T
  ): FormData => {
    const data = new FormData()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return // bỏ qua các giá trị null/undefined
      }
      if (Array.isArray(value)) {
        // Mảng: thêm từng phần tử riêng lẻ với cùng key
        value.forEach((v) => serializeFormDataPair(data, key, v))
      } else {
        serializeFormDataPair(data, key, value)
      }
    })

    return data
  },
}

/**
 * Serializer mặc định cho hầu hết các API call.
 * Chuyển object thành JSON string để gửi với Content-Type: application/json
 * Xử lý đặc biệt: BigInt được chuyển thành string (JSON.stringify không hỗ trợ BigInt)
 */
export const jsonBodySerializer = {
  bodySerializer: <T>(body: T): string =>
    JSON.stringify(body, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)),
}

/**
 * Serializer dùng khi cần gửi dạng query string trong body.
 * Chuyển object thành URLSearchParams với Content-Type: application/x-www-form-urlencoded
 */
export const urlSearchParamsBodySerializer = {
  bodySerializer: <T extends Record<string, any> | Array<Record<string, any>>>(body: T): string => {
    const data = new URLSearchParams()

    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return // bỏ qua các giá trị null/undefined
      }
      if (Array.isArray(value)) {
        // Mảng: thêm từng phần tử riêng lẻ với cùng key
        value.forEach((v) => serializeUrlSearchParamsPair(data, key, v))
      } else {
        serializeUrlSearchParamsPair(data, key, value)
      }
    })

    return data.toString()
  },
}
