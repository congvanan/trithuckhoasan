import 'server-only'
import fs from 'fs'
import path from 'path'

export type SectionConfig = {
  id: 'hero' | 'features' | 'news' | 'kienthuc' | 'banner'
  label: string
  visible: boolean
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'page-layout.json')

const DEFAULT_LAYOUT: SectionConfig[] = [
  { id: 'hero',     label: 'Tin nổi bật',         visible: true },
  { id: 'features', label: 'Tính năng nổi bật',    visible: true },
  { id: 'news',     label: 'Tin tức mới nhất',      visible: true },
  { id: 'kienthuc', label: 'Kiến thức chuyên khoa', visible: true },
  { id: 'banner',   label: 'Banner Slider',         visible: true },
]

export function readLayoutConfig(): SectionConfig[] {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
    const parsed: SectionConfig[] = JSON.parse(raw)
    // Đảm bảo tất cả default sections đều có mặt (merge nếu thiếu)
    const ids = parsed.map((s) => s.id)
    const missing = DEFAULT_LAYOUT.filter((s) => !ids.includes(s.id))
    return [...parsed, ...missing]
  } catch {
    return DEFAULT_LAYOUT
  }
}

export function writeLayoutConfig(config: SectionConfig[]): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}

// ── Search keywords ────────────────────────────────────────────────────────
const KEYWORDS_PATH = path.join(process.cwd(), 'data', 'search-keywords.json')
const DEFAULT_KEYWORDS = ['Sản khoa', 'Phụ khoa', 'Sơ sinh', 'IVF']

export function readSearchKeywords(): string[] {
  try {
    const raw = fs.readFileSync(KEYWORDS_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : DEFAULT_KEYWORDS
  } catch {
    return DEFAULT_KEYWORDS
  }
}

export function writeSearchKeywords(keywords: string[]): void {
  fs.writeFileSync(KEYWORDS_PATH, JSON.stringify(keywords, null, 2), 'utf-8')
}
