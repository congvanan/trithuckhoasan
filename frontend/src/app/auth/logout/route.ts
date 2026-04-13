import { clientConfig } from '@/config'
import { getSession } from '@/lib/actions'
import { createRedisInstance, RedisSession } from '@/lib/redis'
import { defaultSession, getClientConfig } from '@/lib/session-utils'
import * as client from 'openid-client'

export async function GET() {
  const session = await getSession()
  const sub = session.userInfo?.sub

  // 1. Xóa session Next.js ngay
  session.isLoggedIn = defaultSession.isLoggedIn
  session.access_token = defaultSession.access_token
  session.userInfo = defaultSession.userInfo
  session.refresh_token = undefined
  await session.save()

  // 2. Xóa Redis nếu có (không ảnh hưởng nếu Redis không chạy)
  try {
    if (sub) {
      const redis = createRedisInstance()
      await redis.del(`session:${sub}`)
      await redis.quit()
    }
  } catch {}

  // 3. Redirect đến ABP logout endpoint để xóa session ABP
  // Sau đó ABP redirect về post_logout_redirect_uri → user phải đăng nhập lại
  try {
    const openIdClientConfig = await getClientConfig()
    const endSessionUrl = client.buildEndSessionUrl(openIdClientConfig, {
      post_logout_redirect_uri: clientConfig.post_logout_redirect_uri,
    })
    return Response.redirect(endSessionUrl.href)
  } catch (err) {
    console.error('[auth/logout] Lỗi build end session URL:', err)
    // Fallback: về trang chủ (ABP session vẫn còn nhưng Next.js đã clear)
    return Response.redirect(process.env.NEXT_PUBLIC_APP_URL ?? '/')
  }
}
