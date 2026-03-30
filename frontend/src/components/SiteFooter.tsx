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
  website:     'https://trithucsankhoa.vn',
  facebook:    'https://facebook.com/trithucsankhoa',
  fbLabel:     'Fanpage',
  tiktok:      'https://tiktok.com/@trithucsankhoa',
  tiktokLabel: 'Channel',
}

// ✏️ Cập nhật link mạng xã hội tại đây
// ✏️ Cập nhật link mạng xã hội tại đây
const SOCIAL_LINKS: { label: string; href: string; svg: string }[] = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/trithucsankhoa',
    svg: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
  },
  {
    label: 'Email',
    href: 'mailto:vanphong@trithucsankhoa.vn',
    svg: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@trithucsankhoa',
    svg: 'M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M9.75 15.02V8.98L15.5 12l-5.75 3.02z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/company/trithucsankhoa',
    svg: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/trithucsankhoa',
    svg: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z',
  },
]

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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
                    strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d={s.svg} />
                  </svg>
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
          <span>&copy; 2026 Tri Thức Sản Khoa. All rights reserved.</span>
          <span>Tri Thức Sản Khoa – Kiến thức sản phụ khoa hàng đầu</span>
        </div>
      </div>
    </footer>
  )
}
