import React from 'react'
import Link from 'next/link'
import { FooterContactForm } from '@/components/FooterContactForm'
import { MapPin, Phone, Mail, Globe, Facebook } from 'lucide-react'
// Facebook & Mail above are used in the org info row, not SOCIAL_LINKS

// ✏️ Cập nhật thông tin tại đây
const ORG = {
  name:        'ĐỊA CHỈ LÀM VIỆC',
  address:     '55 Yên Ninh',
  phone:       '0396 066 556',
  phoneNote:   'có Zalo OA',
  email:       'abc@gmail.com',
  website:     'https://sankhoa360.vn',
  facebook:    'https://facebook.com/sankhoa360',
  fbLabel:     'Fanpage',
  tiktok:      'https://tiktok.com/@sankhoa360',
  tiktokLabel: 'Channel',
}

// ✏️ Cập nhật link mạng xã hội tại đây
// ✏️ Cập nhật link mạng xã hội tại đây
const SOCIAL_LINKS: { label: string; href: string; svg?: string; icon?: React.ReactNode }[] = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/sankhoa360',
    svg: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@trithucsankhoa',
    svg: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M9.75 15.02V8.98L15.5 12l-5.75 3.02z',
  },
  {
    label: 'Zalo',
    href: 'https://zalo.me/0396066556',
    icon: <ZaloIcon />,
  },
]

function ZaloIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm5.205 13.56c-.16.356-.477.585-.87.585H7.665c-.394 0-.71-.23-.87-.585a.964.964 0 0 1 .147-1.02l4.193-5.04H7.88a.87.87 0 0 1 0-1.74h8.24c.394 0 .71.23.87.585a.964.964 0 0 1-.147 1.02l-4.193 5.04h3.686a.87.87 0 0 1 .868.87c0 .107-.02.21-.055.305z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
    </svg>
  )
}

export function SiteFooter() {
  return (
    <footer style={{ background: 'linear-gradient(160deg, #134e4a 0%, #0f766e 100%)' }}>
      <div className="container mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* ── Col 1: Org info ─────────────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-white/20">
              {ORG.name}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-teal-300 mt-0.5 shrink-0" />
                <span>{ORG.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-teal-300 shrink-0" />
                <a href={`tel:${ORG.phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">
                  <span className="font-medium text-white/90">Điện Thoại:</span> {ORG.phone}
                  {ORG.phoneNote && <span className="text-white/60"> ({ORG.phoneNote})</span>}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-300 shrink-0" />
                <a href={`mailto:${ORG.email}`} className="hover:text-white transition-colors">
                  <span className="font-medium text-white/90">Email:</span> {ORG.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-teal-300 shrink-0" />
                <a href={ORG.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  <span className="font-medium text-white/90">Website:</span> {ORG.website.replace('https://', '')}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <a href={ORG.facebook} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Facebook className="w-4 h-4 text-teal-300" />
                  <span className="font-medium text-white/90">Facebook:</span> {ORG.fbLabel}
                </a>
                <a href={ORG.tiktok} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <TikTokIcon />
                  <span className="font-medium text-white/90">TikTok:</span> {ORG.tiktokLabel}
                </a>
              </li>
            </ul>

          </div>

          {/* ── Col 2: Social links ─────────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-white/20">
              Kết nối với chúng tôi
            </h3>
            <div className="flex flex-wrap gap-3 mt-2">
              {SOCIAL_LINKS.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  title={s.label}
                  aria-label={s.label}
                  className="w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center
                             text-white/70 hover:text-white hover:border-white transition-all duration-200 hover:scale-110"
                >
                  {s.icon ?? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                      strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d={s.svg} />
                    </svg>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Col 3: Mini contact form ─────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 pb-2 border-b border-white/20">
              Liên hệ
            </h3>
            <FooterContactForm />
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-5 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>&copy; 2026 Sankhoa360. All rights reserved.</span>
          <span>Sankhoa360 – Kiến thức sản phụ khoa hàng đầu</span>
        </div>
      </div>
    </footer>
  )
}
