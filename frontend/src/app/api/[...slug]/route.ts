import { getSession } from '@/lib/actions'
import { isTokenExpired } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export const maxDuration = 900

const DEFAULT_PROXY_TIMEOUT_MS = 30_000
const PROVIDER_TEST_PROXY_TIMEOUT_MS = 120_000
const LONG_RUNNING_PROXY_TIMEOUT_MS = 15 * 60_000

interface ApiError extends Error {
  status?: number
}

const PUBLIC_API_PREFIXES = ['/api/cms-kit-public/', '/api/cms-kit/media/']

const isPublicEndpoint = (path: string): boolean => {
  return PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix))
}

const INVALID_TENANT_IDS = new Set(['default', '', 'null', 'undefined'])

const isValidTenantId = (id: string | undefined | null): boolean => {
  return !!id && !INVALID_TENANT_IDS.has(id)
}

// Cache session trong 30 giây để tránh decrypt cookie + Redis cho mỗi API call
interface SessionCache {
  token: string
  tenantId?: string | null
  expires: number
}
const sessionCacheMap = new Map<string, SessionCache>()

const getCachedSession = async (cookieKey: string) => {
  const now = Date.now()
  const cached = sessionCacheMap.get(cookieKey)
  // Chỉ dùng cache nếu JWT vẫn còn hạn — tránh gửi token stale lên backend gây 401.
  if (cached && cached.expires > now && !isTokenExpired(cached.token)) {
    return { access_token: cached.token, tenantId: cached.tenantId }
  }
  if (cached) sessionCacheMap.delete(cookieKey)
  const session = await getSession()
  if (session.access_token) {
    // Cache tối đa 60s hoặc tới khi JWT hết hạn (chọn cái nhỏ hơn).
    const jwtExpMs = (() => {
      try {
        const payload = JSON.parse(
          Buffer.from(session.access_token!.split('.')[1], 'base64').toString('utf-8')
        )
        return typeof payload?.exp === 'number' ? payload.exp * 1000 : now + 60_000
      } catch {
        return now + 60_000
      }
    })()
    sessionCacheMap.set(cookieKey, {
      token: session.access_token,
      tenantId: session.tenantId,
      expires: Math.min(now + 60_000, jwtExpMs - 5_000),
    })
    // Dọn cache cũ để tránh memory leak
    if (sessionCacheMap.size > 100) {
      for (const [k, v] of sessionCacheMap) {
        if (v.expires < now) sessionCacheMap.delete(k)
      }
    }
  }
  return session
}

const getHeaders = async (request: NextRequest, path: string): Promise<Headers> => {
  const headers = new Headers()
  // Dùng cookie header làm key để định danh user
  const cookieKey = request.headers.get('cookie')?.slice(0, 64) ?? 'anon'

  if (isPublicEndpoint(path)) {
    try {
      const session = await getCachedSession(cookieKey)
      if (isValidTenantId(session.tenantId)) {
        headers.set('__tenant', session.tenantId!)
      }
    } catch { /* public endpoint — bỏ qua lỗi session */ }
    return headers
  }

  try {
    const session = await getCachedSession(cookieKey)
    if (!session.access_token) throw new Error('No access token')
    headers.set('Authorization', `Bearer ${session.access_token}`)
    if (isValidTenantId(session.tenantId)) {
      headers.set('__tenant', session.tenantId!)
    }
    return headers
  } catch (error) {
    throw new Error(`Failed to get request headers: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const makeApiRequest = async (
  request: NextRequest,
  method: RequestMethod,
  includeBody = false
): Promise<Response> => {
  const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL

  if (!EXTERNAL_API_URL) {
    console.error('NEXT_PUBLIC_API_URL environment variable is not set')
    throw new Error('API URL not configured')
  }
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  try {
    const path = request.nextUrl.pathname
    // Loại bỏ ?v=xxx (cache-bust param) trước khi forward đến backend
    const searchParams = new URLSearchParams(request.nextUrl.search)
    searchParams.delete('v')
    const search = searchParams.toString() ? `?${searchParams.toString()}` : ''
    const url = `${EXTERNAL_API_URL}${path}${search}`

    const headers = await getHeaders(request, path)

    // Forward Content-Type từ request gốc (quan trọng cho multipart/form-data upload file)
    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    } else if (includeBody) {
      headers.set('Content-Type', 'application/json')
    }

    // Thêm keep-alive để tái sử dụng kết nối TCP tới backend
    headers.set('Connection', 'keep-alive')

    const options: RequestInit = {
      method,
      headers,
      ...(includeBody && {
        body: request.body,
        duplex: 'half',
      }),
      cache: 'no-store',
    }

    const isProviderTest = path.includes('/ai-setting/test-provider')
    const isLongRunning = path.includes('/reindex') || path.includes('/ingest') || path.includes('/trigger')
    const proxyTimeoutMs = isLongRunning
      ? LONG_RUNNING_PROXY_TIMEOUT_MS
      : isProviderTest
        ? PROVIDER_TEST_PROXY_TIMEOUT_MS
        : DEFAULT_PROXY_TIMEOUT_MS
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(new Error(`API proxy timeout after ${Math.round(proxyTimeoutMs / 1000)}s`)),
      proxyTimeoutMs
    )

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime
      console.error(`[${requestId}] Fetch error:`, {
        error: fetchError,
        cause: (fetchError as any)?.cause,
        url,
        method,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
      if (controller.signal.aborted) {
        throw Object.assign(
          new Error(
            isLongRunning
              ? `Reindex request exceeded the ${Math.round(proxyTimeoutMs / 60_000)} minute proxy timeout. Try reducing the source size or run the job from the backend.`
              : isProviderTest
                ? `Provider test exceeded the ${Math.round(proxyTimeoutMs / 1000)} second proxy timeout. Check API key, model quota, and backend network access.`
              : `API request exceeded the ${Math.round(proxyTimeoutMs / 1000)} second proxy timeout.`
          ),
          { status: 504 }
        )
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response
        .clone()
        .json()
        .catch(() => null)
      
      // Better error message handling
      let errorMessage = `API request failed with status ${response.status}`
      if (errorData?.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error
        } else if (typeof errorData.error === 'object') {
          errorMessage = errorData.error.message || JSON.stringify(errorData.error)
        }
      }
      
      console.error(`[${requestId}] API request failed:`, {
        status: response.status,
        statusText: response.statusText,
        errorData,
        errorMessage,
        url,
        method,
        duration: `${Date.now() - startTime}ms`,
      })
      
      throw Object.assign(
        new Error(errorMessage),
        { status: response.status }
      )
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      })
    }

    const responseContentType = response.headers.get('Content-Type') ?? ''

    // Forward binary + download (CSV/xlsx/pdf/ảnh) — đọc ArrayBuffer để tránh lỗi stream
    const contentDisposition = response.headers.get('Content-Disposition') ?? ''
    const isDownload = contentDisposition.toLowerCase().includes('attachment')
    const isBinaryLike =
      !responseContentType.includes('application/json') &&
      !responseContentType.startsWith('text/html') &&
      !responseContentType.startsWith('text/plain')
    if (isDownload || isBinaryLike) {
      const buffer = await response.arrayBuffer()
      const headers: Record<string, string> = {
        'Content-Type': responseContentType || 'application/octet-stream',
      }
      if (contentDisposition) headers['Content-Disposition'] = contentDisposition
      // Chỉ cache image, không cache file download
      if (responseContentType.startsWith('image/')) {
        headers['Cache-Control'] = 'public, max-age=3600, stale-while-revalidate=60'
      } else {
        headers['Cache-Control'] = 'no-store'
      }
      return new NextResponse(buffer, { status: response.status, headers })
    }

    const responseHeaders = new Headers(response.headers)
    const data = await response.json().catch(() => null)
    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    const apiError = error as ApiError
    const duration = Date.now() - startTime
    
    // Better error handling to prevent [object Object] issues
    const errorMessage = apiError.message || 
                        (typeof error === 'string' ? error : 'Unknown error occurred')
    const errorStatus = apiError.status || 500
    
    console.error(`[${requestId}] API request error:`, {
      error: errorMessage,
      status: errorStatus,
      stack: apiError.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      originalError: error,
    })
    
    return NextResponse.json({ error: errorMessage }, { status: errorStatus })
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  return makeApiRequest(request, 'GET')
}

export async function POST(request: NextRequest): Promise<Response> {
  return makeApiRequest(request, 'POST', true)
}

export async function PUT(request: NextRequest): Promise<Response> {
  return makeApiRequest(request, 'PUT', true)
}

export async function DELETE(request: NextRequest): Promise<Response> {
  return makeApiRequest(request, 'DELETE')
}
