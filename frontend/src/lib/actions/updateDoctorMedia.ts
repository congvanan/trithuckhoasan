'use server'

import fs from 'fs'
import path from 'path'

export async function updateDoctorMediaId(slug: string, mediaId: string): Promise<void> {
  const filePath = path.join(process.cwd(), 'src/lib/data/doctors.ts')
  let content = fs.readFileSync(filePath, 'utf-8')

  // Tìm đúng doctor theo slug, rồi thay mediaId (undefined hoặc 'xxx') bằng ID mới
  const pattern = new RegExp(
    `(slug:\\s*'${slug}'[\\s\\S]*?mediaId:\\s*)(undefined|'[^']*')`,
    'g'
  )

  if (!pattern.test(content)) {
    throw new Error(`Không tìm thấy bác sĩ có slug: ${slug}`)
  }

  content = content.replace(
    new RegExp(`(slug:\\s*'${slug}'[\\s\\S]*?mediaId:\\s*)(undefined|'[^']*')`, 'g'),
    `$1'${mediaId}'`
  )

  fs.writeFileSync(filePath, content, 'utf-8')
}
