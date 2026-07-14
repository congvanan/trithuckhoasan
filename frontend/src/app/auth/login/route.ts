import { clientConfig } from '@/config'
import { getSession } from '@/lib/actions'
import { getClientConfig } from '@/lib/session-utils'
import { cookies } from 'next/headers'
import * as client from 'openid-client'

// PKCE verifier/state được lưu ở cookie riêng thay vì iron-session:
// các route khác (vd /auth/set-tenant) gọi session.save() song song sẽ
// ghi đè cookie session bằng snapshot cũ và làm mất code_verifier.
const PKCE_COOKIE = 'pkce_code_verifier'
const STATE_COOKIE = 'auth_state'
const pkceCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 10, // đủ cho một lượt đăng nhập
}
/**
 * Handles the GET request for the login route.
 *
 * This function initiates the PKCE (Proof Key for Code Exchange) flow for OAuth2 authentication.
 * It generates a code verifier and code challenge, constructs the authorization URL with the necessary parameters,
 * and redirects the user to the authorization endpoint.
 *
 * @returns {Promise<Response>} A promise that resolves to a Response object that redirects the user to the authorization URL.
 */
export async function GET() {
  const session = await getSession()
  let code_verifier = client.randomPKCECodeVerifier()
  let code_challenge = await client.calculatePKCECodeChallenge(code_verifier)
  const openIdClientConfig = await getClientConfig()
  let tenantId = session.tenantId

  // Ensure tenantId is always a string and handle edge cases
  if (!tenantId || 
      tenantId === 'default' || 
      (typeof tenantId === 'object' && Object.keys(tenantId).length === 0) ||
      typeof tenantId !== 'string') {
    tenantId = ''
  } else {
    tenantId = String(tenantId)
  }

  let parameters: Record<string, string> = {
    redirect_uri: clientConfig.redirect_uri,
    scope: clientConfig.scope!,
    code_challenge,
    code_challenge_method: clientConfig.code_challenge_method,
    __tenant: tenantId,
  }
  let state!: string
  if (!openIdClientConfig.serverMetadata().supportsPKCE()) {
    state = client.randomState()
    parameters.state = state
  }
  let redirectTo = client.buildAuthorizationUrl(openIdClientConfig, parameters)
  const cookieStore = await cookies()
  cookieStore.set(PKCE_COOKIE, code_verifier, pkceCookieOptions)
  if (state) {
    cookieStore.set(STATE_COOKIE, state, pkceCookieOptions)
  } else {
    cookieStore.delete(STATE_COOKIE)
  }
  return Response.redirect(redirectTo.href)
}
