import { getSession } from '@/lib/actions'
import { NextRequest, NextResponse } from 'next/server'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface ApiError extends Error {
  status?: number
}

const PUBLIC_API_PREFIXES = ['/api/cms-kit-public/']

const isPublicEndpoint = (path: string): boolean => {
  return PUBLIC_API_PREFIXES.some((prefix) => path.startsWith(prefix))
}

// Tenant IDs that are invalid/legacy and should NOT be forwarded to ABP
const INVALID_TENANT_IDS = new Set(['default', '', 'null', 'undefined'])

const isValidTenantId = (id: string | undefined | null): boolean => {
  return !!id && !INVALID_TENANT_IDS.has(id)
}

const getHeaders = async (path: string): Promise<HeadersInit> => {
  const headers = new Headers()

  if (isPublicEndpoint(path)) {
    try {
      const session = await getSession()
      const tenant = session.tenantId
      if (isValidTenantId(tenant)) {
        headers.set('__tenant', tenant!)
      }
    } catch {
      console.log(`[API Proxy] PUBLIC ${path} | no session`)
    }
    return headers
  }

  try {
    const session = await getSession()

    if (!session.access_token) {
      throw new Error('No access token available in session')
    }

    headers.set('Authorization', `Bearer ${session.access_token}`)
    if (isValidTenantId(session.tenantId)) {
      headers.set('__tenant', session.tenantId!)
    }

    return headers
  } catch (error) {
    console.error('Error getting headers:', error)
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
    const url = `${EXTERNAL_API_URL}${path}${request.nextUrl.search}`

    const headers = await getHeaders(path)

    // Forward Content-Type từ request gốc (quan trọng cho multipart/form-data upload file)
    const contentType = request.headers.get('Content-Type')
    if (contentType) {
      headers.set('Content-Type', contentType)
    } else if (includeBody) {
      headers.set('Content-Type', 'application/json')
    }

    const options: RequestInit = {
      method,
      headers,
      ...(includeBody && {
        body: request.body,
        duplex: 'half',
      }),
      cache: 'no-store',
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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

    // Forward binary responses (ảnh, file) — đọc ArrayBuffer để tránh lỗi stream
    if (!responseContentType.includes('application/json') && !responseContentType.includes('text/')) {
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: response.status,
        headers: {
          'Content-Type': responseContentType || 'application/octet-stream',
          'Cache-Control': 'public, max-age=86400',
        },
      })
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
