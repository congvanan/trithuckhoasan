import { getSession } from '@/lib/actions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await getSession()
    const token = session?.access_token
    const baseUrl = process.env.NEXT_PUBLIC_API_URL

    const res = await fetch(`${baseUrl}/api/cms-kit-admin/blogs/all`, {
      headers: { Authorization: `Bearer ${token}` },
      // @ts-expect-error dev only
      agent: new (await import('https')).Agent({ rejectUnauthorized: false }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
