import { clientConfig } from '@/config'
import { getSession } from '@/lib/actions'
import { createRedisInstance, RedisSession } from '@/lib/redis'
import { getClientConfig } from '@/lib/session-utils'
import { cookies, headers } from 'next/headers'
import { NextRequest } from 'next/server'
import * as client from 'openid-client'

/**
 * Handles the GET request for OpenID Connect authentication.
 *
 * This function performs the following steps:
 * 1. Retrieves the current session.
 * 2. Fetches the OpenID client configuration.
 * 3. Constructs the current URL from the request headers.
 * 4. Performs the authorization code grant flow to obtain tokens.
 * 5. Updates the session with the access token and user information.
 * 6. Saves the session.
 * 7. Stores the access and refresh tokens in Redis.
 * 8. Redirects the user to the post-login route.
 *
 * @param {NextRequest} request - The incoming request object.
 * @returns {Promise<Response>} - A promise that resolves to a redirect response.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  let openIdClientConfig: Awaited<ReturnType<typeof getClientConfig>>
  try {
    openIdClientConfig = await getClientConfig()
  } catch (e) {
    console.error('[auth/openiddict] Discovery failed:', e)
    return new Response(`Auth discovery failed: ${(e as Error).message}`, { status: 500 })
  }
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost'
  const protocol = headerList.get('x-forwarded-proto') || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  const currentUrl = new URL(
    `${protocol}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
  )
  // PKCE verifier/state nằm ở cookie riêng (xem /auth/login) để không bị
  // các route khác save() iron-session song song ghi đè mất.
  const cookieStore = await cookies()
  const code_verifier = cookieStore.get('pkce_code_verifier')?.value || session.code_verifier
  const state = cookieStore.get('auth_state')?.value || session.state
  let tokenSet: Awaited<ReturnType<typeof client.authorizationCodeGrant>>
  try {
    tokenSet = await client.authorizationCodeGrant(openIdClientConfig, currentUrl, {
      pkceCodeVerifier: code_verifier,
      expectedState: state,
    })
  } catch (e) {
    console.error('[auth/openiddict] Token exchange failed:', e)
    return new Response(`Token exchange failed: ${(e as Error).message}`, { status: 500 })
  }
  cookieStore.delete('pkce_code_verifier')
  cookieStore.delete('auth_state')
  const { access_token, refresh_token } = tokenSet
  session.isLoggedIn = true
  session.access_token = access_token
  let claims = tokenSet.claims()!
  const { sub } = claims
  // Extract tenant ID from ABP JWT claim 'tid' (set by ABP for tenant-level users)
  // Always reset tenantId to clear any stale value from previous session
  const tenantId = (claims as Record<string, unknown>)['tid'] as string | undefined
  session.tenantId = tenantId || ''
  // call userinfo endpoint to get user info
  const userinfo = await client.fetchUserInfo(openIdClientConfig, access_token, sub)
  // store userinfo in session
  session.userInfo = {
    sub: userinfo.sub,
    name: userinfo.given_name!,
    email: userinfo.email!,
    email_verified: userinfo.email_verified!,
  }

  await session.save()

  // Lưu vào Redis nếu có — không ảnh hưởng login nếu Redis không chạy
  try {
    const redisSessionData = { access_token, refresh_token } as RedisSession
    const redis = createRedisInstance()
    const redisKey = `session:${session.userInfo.sub}`
    await redis.set(redisKey, JSON.stringify(redisSessionData))
    await redis.quit()
  } catch {
    // Redis không chạy — login vẫn thành công nhờ iron-session cookie
  }

  return Response.redirect(clientConfig.post_login_route)
}
