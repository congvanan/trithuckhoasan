// ============================================================
// Serialize các tham số trong URL path và query string
// Hỗ trợ nhiều kiểu định dạng theo chuẩn OpenAPI
// ============================================================

interface SerializeOptions<T> extends SerializePrimitiveOptions, SerializerOptions<T> {}

interface SerializePrimitiveOptions {
  allowReserved?: boolean  // cho phép ký tự đặc biệt không bị percent-encode
  name: string             // tên tham số
}

export interface SerializerOptions<T> {
  /**
   * Có "explode" (tách thành nhiều params) hay không.
   * @default true
   */
  explode: boolean
  style: T  // kiểu định dạng
}

// Kiểu định dạng cho mảng
export type ArrayStyle = 'form' | 'spaceDelimited' | 'pipeDelimited'
export type ArraySeparatorStyle = ArrayStyle | MatrixStyle
// Kiểu định dạng đặc biệt (dùng trong path params)
type MatrixStyle = 'label' | 'matrix' | 'simple'
// Kiểu định dạng cho object
export type ObjectStyle = 'form' | 'deepObject'
type ObjectSeparatorStyle = ObjectStyle | MatrixStyle

interface SerializePrimitiveParam extends SerializePrimitiveOptions {
  value: string
}

/**
 * Lấy ký tự phân cách khi mảng được explode (tách từng phần tử).
 * - label: '.'  → ?a=.1.2.3
 * - matrix: ';' → ?a=;a=1;a=2
 * - simple: ',' → a=1,2,3
 * - mặc định: '&' → a=1&a=2
 */
export const separatorArrayExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case 'label':
      return '.'
    case 'matrix':
      return ';'
    case 'simple':
      return ','
    default:
      return '&'
  }
}

/**
 * Lấy ký tự phân cách khi mảng KHÔNG được explode (gộp vào một param).
 * - form: ','     → a=1,2,3
 * - pipeDelimited: '|' → a=1|2|3
 * - spaceDelimited: '%20' → a=1%202%203
 */
export const separatorArrayNoExplode = (style: ArraySeparatorStyle) => {
  switch (style) {
    case 'form':
      return ','
    case 'pipeDelimited':
      return '|'
    case 'spaceDelimited':
      return '%20'
    default:
      return ','
  }
}

/**
 * Lấy ký tự phân cách khi object được explode.
 */
export const separatorObjectExplode = (style: ObjectSeparatorStyle) => {
  switch (style) {
    case 'label':
      return '.'
    case 'matrix':
      return ';'
    case 'simple':
      return ','
    default:
      return '&'
  }
}

/**
 * Serialize tham số kiểu mảng thành chuỗi URL.
 * Hỗ trợ nhiều style theo chuẩn OpenAPI.
 */
export const serializeArrayParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[]
}) => {
  if (!explode) {
    // Gộp tất cả phần tử thành một param duy nhất
    const joinedValues = (
      allowReserved ? value : value.map((v) => encodeURIComponent(v as string))
    ).join(separatorArrayNoExplode(style))
    switch (style) {
      case 'label':
        return `.${joinedValues}`
      case 'matrix':
        return `;${name}=${joinedValues}`
      case 'simple':
        return joinedValues
      default:
        return `${name}=${joinedValues}`
    }
  }

  // Tách từng phần tử thành param riêng
  const separator = separatorArrayExplode(style)
  const joinedValues = value
    .map((v) => {
      if (style === 'label' || style === 'simple') {
        return allowReserved ? v : encodeURIComponent(v as string)
      }
      return serializePrimitiveParam({ allowReserved, name, value: v as string })
    })
    .join(separator)
  return style === 'label' || style === 'matrix' ? separator + joinedValues : joinedValues
}

/**
 * Serialize tham số kiểu primitive (string, number, boolean) thành chuỗi URL.
 * Trả về chuỗi rỗng nếu value là null hoặc undefined.
 */
export const serializePrimitiveParam = ({
  allowReserved,
  name,
  value,
}: SerializePrimitiveParam) => {
  if (value === undefined || value === null) {
    return ''
  }

  if (typeof value === 'object') {
    // Object lồng nhau không được hỗ trợ → cần querySerializer tùy chỉnh
    throw new Error(
      "Deeply-nested arrays/objects aren't supported. Provide your own `querySerializer()` to handle these."
    )
  }

  return `${name}=${allowReserved ? value : encodeURIComponent(value)}`
}

/**
 * Serialize tham số kiểu object thành chuỗi URL.
 * Hỗ trợ Date (ISO string) và nhiều style khác nhau.
 */
export const serializeObjectParam = ({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown> | Date
  valueOnly?: boolean  // chỉ lấy value, không thêm tên param
}) => {
  // Xử lý đặc biệt cho Date → chuyển sang ISO 8601 string
  if (value instanceof Date) {
    return valueOnly ? value.toISOString() : `${name}=${value.toISOString()}`
  }

  if (style !== 'deepObject' && !explode) {
    // Gộp tất cả key-value thành một chuỗi
    let values: string[] = []
    Object.entries(value).forEach(([key, v]) => {
      values = [...values, key, allowReserved ? (v as string) : encodeURIComponent(v as string)]
    })
    const joinedValues = values.join(',')
    switch (style) {
      case 'form':
        return `${name}=${joinedValues}`
      case 'label':
        return `.${joinedValues}`
      case 'matrix':
        return `;${name}=${joinedValues}`
      default:
        return joinedValues
    }
  }

  // deepObject hoặc explode: serialize từng key-value riêng
  // deepObject: name[key]=value
  const separator = separatorObjectExplode(style)
  const joinedValues = Object.entries(value)
    .map(([key, v]) =>
      serializePrimitiveParam({
        allowReserved,
        name: style === 'deepObject' ? `${name}[${key}]` : key,
        value: v as string,
      })
    )
    .join(separator)
  return style === 'label' || style === 'matrix' ? separator + joinedValues : joinedValues
}
