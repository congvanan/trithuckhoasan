import { readSearchKeywords, writeSearchKeywords } from '@/lib/server/pageLayout'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(readSearchKeywords())
}

export async function POST(req: NextRequest) {
  try {
    const body: string[] = await req.json()
    if (!Array.isArray(body) || body.some((k) => typeof k !== 'string')) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
    writeSearchKeywords(body)
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
