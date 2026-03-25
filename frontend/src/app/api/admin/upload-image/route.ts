import { getSession } from '@/lib/actions'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

export async function POST(req: NextRequest) {
  // Kiểm tra đăng nhập
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: 'Chưa cấu hình Cloudinary. Thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào .env.local' },
      { status: 500 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Không tìm thấy file' }, { status: 400 })
  }

  // Tạo chữ ký (signed upload - an toàn, API secret không lộ ra client)
  const timestamp = Math.round(Date.now() / 1000).toString()
  const folder = 'trithuckhoasan'
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + API_SECRET)
    .digest('hex')

  // Upload lên Cloudinary
  const uploadForm = new FormData()
  uploadForm.append('file', file)
  uploadForm.append('api_key', API_KEY)
  uploadForm.append('timestamp', timestamp)
  uploadForm.append('signature', signature)
  uploadForm.append('folder', folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: uploadForm }
  )
  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message ?? 'Upload thất bại' }, { status: 500 })
  }

  return NextResponse.json({
    url: data.secure_url,        // CDN URL (https)
    publicId: data.public_id,   // để xóa sau này nếu cần
    width: data.width,
    height: data.height,
  })
}
