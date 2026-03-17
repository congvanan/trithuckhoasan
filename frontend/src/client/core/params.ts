// ============================================================
// Xây dựng params cho HTTP request từ danh sách arguments
// Phân loại và đưa từng argument vào đúng vị trí: body, headers, path, query
// ============================================================

// Các vị trí có thể đặt tham số trong HTTP request
type Slot = 'body' | 'headers' | 'path' | 'query'

// Mô tả một field: nằm ở đâu trong request và tên tương ứng
export type Field =
  | {
      in: Exclude<Slot, 'body'>  // header, path, hoặc query
      key: string                // tên field trong object argument
      map?: string               // tên thực tế khi gửi lên server (nếu khác key)
    }
  | {
      in: Extract<Slot, 'body'>  // body
      key?: string               // không bắt buộc (có thể là toàn bộ body)
      map?: string
    }

// Tập hợp các fields với tùy chọn cho phép extra fields
export interface Fields {
  allowExtra?: Partial<Record<Slot, boolean>>  // cho phép các field không khai báo
  args?: ReadonlyArray<Field>                  // danh sách field đã biết
}

export type FieldsConfig = ReadonlyArray<Field | Fields>

// Map prefix đặc biệt → slot tương ứng
// Dùng khi muốn truyền thẳng vào slot mà không cần khai báo trong fields
const extraPrefixesMap: Record<string, Slot> = {
  $body_: 'body',
  $headers_: 'headers',
  $path_: 'path',
  $query_: 'query',
}
const extraPrefixes = Object.entries(extraPrefixesMap)

// Map từ tên key → thông tin slot và tên thực tế
type KeyMap = Map<
  string,
  {
    in: Slot
    map?: string
  }
>

/**
 * Xây dựng KeyMap từ FieldsConfig để tra cứu nhanh theo tên field.
 */
const buildKeyMap = (fields: FieldsConfig, map?: KeyMap): KeyMap => {
  if (!map) {
    map = new Map()
  }

  for (const config of fields) {
    if ('in' in config) {
      if (config.key) {
        map.set(config.key, {
          in: config.in,
          map: config.map,
        })
      }
    } else if (config.args) {
      buildKeyMap(config.args, map)
    }
  }

  return map
}

// Cấu trúc params đã phân loại sẵn sàng để đưa vào request
interface Params {
  body: unknown
  headers: Record<string, unknown>
  path: Record<string, unknown>
  query: Record<string, unknown>
}

/**
 * Xóa các slot rỗng khỏi params để tránh gửi object trống lên server.
 */
const stripEmptySlots = (params: Params) => {
  for (const [slot, value] of Object.entries(params)) {
    if (value && typeof value === 'object' && !Object.keys(value).length) {
      delete params[slot as Slot]
    }
  }
}

/**
 * Phân loại danh sách arguments vào đúng slot của HTTP request.
 * Dùng trong các SDK function được tự động sinh.
 *
 * @param args - Danh sách arguments truyền vào SDK function
 * @param fields - Cấu hình khai báo từng argument thuộc slot nào
 * @returns Params đã phân loại: { body, headers, path, query }
 */
export const buildClientParams = (args: ReadonlyArray<unknown>, fields: FieldsConfig) => {
  const params: Params = {
    body: {},
    headers: {},
    path: {},
    query: {},
  }

  const map = buildKeyMap(fields)
  let config: FieldsConfig[number] | undefined

  for (const [index, arg] of args.entries()) {
    if (fields[index]) {
      config = fields[index]
    }

    if (!config) {
      continue
    }

    if ('in' in config) {
      if (config.key) {
        // Field đã biết: đưa vào đúng slot theo khai báo
        const field = map.get(config.key)!
        const name = field.map || config.key
        ;(params[field.in] as Record<string, unknown>)[name] = arg
      } else {
        // Không có key → toàn bộ argument là body
        params.body = arg
      }
    } else {
      // Fields dạng object: duyệt từng key-value và phân loại
      for (const [key, value] of Object.entries(arg ?? {})) {
        const field = map.get(key)

        if (field) {
          // Key đã khai báo trong fields
          const name = field.map || key
          ;(params[field.in] as Record<string, unknown>)[name] = value
        } else {
          // Kiểm tra prefix đặc biệt ($body_, $query_...)
          const extra = extraPrefixes.find(([prefix]) => key.startsWith(prefix))

          if (extra) {
            const [prefix, slot] = extra
            ;(params[slot] as Record<string, unknown>)[key.slice(prefix.length)] = value
          } else {
            // Đưa vào slot được phép extra fields (nếu có)
            for (const [slot, allowed] of Object.entries(config.allowExtra ?? {})) {
              if (allowed) {
                ;(params[slot as Slot] as Record<string, unknown>)[key] = value
                break
              }
            }
          }
        }
      }
    }
  }

  // Xóa các slot rỗng trước khi trả về
  stripEmptySlots(params)

  return params
}
