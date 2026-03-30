import { readLayoutConfig, writeLayoutConfig, type SectionConfig } from '@/lib/server/pageLayout'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const config = readLayoutConfig()
  return NextResponse.json(config)
}

export async function POST(req: NextRequest) {
  try {
    const body: SectionConfig[] = await req.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid config format' }, { status: 400 })
    }
    writeLayoutConfig(body)
    revalidatePath('/')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
