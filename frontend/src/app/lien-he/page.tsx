'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  MapPin, Phone, Mail, Globe, Clock, Facebook,
  Send, CheckCircle2, Loader2, User, Building2,
  MessageSquare, Shield, RefreshCw, AlertCircle,
} from 'lucide-react'
import Image from 'next/image'

// ──────────────────────────────────────────────────────────────────
// ✏️  Cập nhật thông tin tại đây
// ──────────────────────────────────────────────────────────────────
const CONTACT_INFO = {
  orgName:    'Bệnh Viện Đa Khoa Hồng Ngọc - Cơ Sở Yên Ninh',
  address:    'Tòa Nhà....',
  phone:      '0396 066 556',
  phoneNote:  'có Zalo OA',
  email:      'abc@gmail.com.vn',
  website:    'https://kienthucsankhoa.vn',
  facebook:   'https://facebook.com',
  workHours:  'Thứ Hai – Thứ Sáu: 8:00 – 11:30 & 13:30 – 17:00',
  offDays:    'Nghỉ Thứ Bảy, Chủ nhật và ngày lễ',
  mapEmbedUrl:
    'https://maps.google.com/maps?q=21.0424649,105.8441577&z=17&output=embed',
}

// ✏️  Danh sách bác sĩ liên hệ
const DOCTORS = [
  {
    name:      'BS.CKI Trần Thị Mai Hoa',
    title:     'Phó trưởng Khoa sản Bệnh Viện Hồng Ngọc Yên Ninh',
    specialty: 'Sản Phụ Khoa –  Sức khỏe sinh sản',
    phone:     '0396 066 556',
    email:     'abc@gmail.com.vn',
    avatar:    null as string | null,   // thay bằng URL ảnh thật
  },
 
]
// ──────────────────────────────────────────────────────────────────

interface FormState {
  name: string; unit: string; email: string; phone: string; content: string; captcha: string
}
const EMPTY: FormState = { name: '', unit: '', email: '', phone: '', content: '', captcha: '' }

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode(len = 6) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export default function LienHePage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaError, setCaptchaError] = useState(false)

  // Generate code client-side only (tránh SSR mismatch)
  useEffect(() => { setCaptchaCode(genCode()) }, [])

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(genCode())
    setForm((p) => ({ ...p, captcha: '' }))
    setCaptchaError(false)
  }, [])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }))
    if (k === 'captcha') setCaptchaError(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.captcha.toUpperCase() !== captchaCode) {
      setCaptchaError(true)
      refreshCaptcha()
      return
    }
    setStatus('loading')
    // TODO: gọi API gửi form thực tế
    await new Promise((r) => setTimeout(r, 1200))
    setStatus('success')
  }

  const inputCls = `w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700
    bg-white dark:bg-gray-900 outline-none placeholder:text-gray-400
    focus:border-[#14b8a6] focus:ring-2 focus:ring-[#14b8a6]/20 transition-all`

  return (
    <div>
      {/* ── Google Map ──────────────────────────────────────────── */}
      <div className="w-full" style={{ height: 'clamp(260px, 40vw, 420px)' }}>
        <iframe
          src={CONTACT_INFO.mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Bản đồ"
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* ── LEFT: Form ──────────────────────────────── col 3/5 */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-1">Gửi tin nhắn cho chúng tôi</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Quý khách vui lòng điền đầy đủ thông tin sau để chúng tôi có thể hỗ trợ tốt nhất:
            </p>

            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-teal-50 dark:bg-teal-950/20 rounded-2xl border border-teal-200">
                <CheckCircle2 className="w-14 h-14 text-teal-500" />
                <h3 className="text-xl font-semibold text-teal-800 dark:text-teal-300">Gửi thành công!</h3>
                <p className="text-sm text-teal-700 dark:text-teal-400 max-w-xs">
                  Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong thời gian sớm nhất.
                </p>
                <Button variant="outline" onClick={() => { setForm(EMPTY); setStatus('idle') }}
                  className="mt-2 border-teal-300 text-teal-700 hover:bg-teal-50">
                  Gửi tin nhắn khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input required value={form.name} onChange={set('name')}
                      placeholder="Nhập họ tên..." className={inputCls} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Đơn vị công tác</label>
                    <input value={form.unit} onChange={set('unit')}
                      placeholder="Tên đơn vị công tác..." className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input required type="email" value={form.email} onChange={set('email')}
                      placeholder="name@example.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                      Điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input required value={form.phone} onChange={set('phone')}
                      placeholder="Số điện thoại liên hệ..." className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea required value={form.content} onChange={set('content')}
                    rows={5} placeholder="Nhập nội dung cần hỗ trợ..."
                    className={`${inputCls} resize-none`} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 flex items-center gap-1">
                    Mã xác nhận <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      required
                      value={form.captcha}
                      onChange={set('captcha')}
                      placeholder="Nhập mã xác nhận..."
                      maxLength={6}
                      autoComplete="off"
                      className={`${inputCls} flex-1 ${captchaError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                    />
                    {/* Captcha display */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div
                        className="flex items-center justify-center w-28 h-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600
                                   bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700
                                   font-mono font-extrabold tracking-[0.25em] text-base select-none"
                        style={{
                          letterSpacing: '0.2em',
                          textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
                          transform: 'skewX(-3deg)',
                          color: '#0f766e',
                        }}
                        aria-label="Mã xác nhận"
                      >
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        title="Đổi mã khác"
                        className="p-2 rounded-lg text-gray-400 hover:text-[#0f766e] hover:bg-teal-50 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {captchaError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Mã xác nhận không đúng. Mã mới đã được tạo, vui lòng thử lại.
                    </p>
                  )}
                </div>

                <Button type="submit" disabled={status === 'loading'}
                  className="w-full h-11 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl font-medium">
                  {status === 'loading'
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                    : <><Send className="w-4 h-4 mr-2" />Gửi tin nhắn</>
                  }
                </Button>
              </form>
            )}
          </div>

          {/* ── RIGHT: Doctors + Contact info ──────────── col 2/5 */}
          <div className="lg:col-span-2 space-y-6">

            {/* Doctor cards */}
            <div>
              <h3 className="text-base font-semibold text-[#0f766e] uppercase tracking-wide mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Liên hệ chuyên môn
              </h3>
              <div className="space-y-3">
                {DOCTORS.map((doc) => (
                  <div key={doc.email}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
                    {/* Avatar */}
                    <div className="shrink-0">
                      {doc.avatar ? (
                        <Image src={doc.avatar} alt={doc.name} width={64} height={64}
                          className="w-16 h-16 rounded-full object-cover border-2 border-teal-100" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shrink-0">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{doc.name}</p>
                      <p className="text-xs text-[#0f766e] font-medium mt-0.5">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.specialty}</p>
                      <div className="flex flex-col gap-0.5 mt-2">
                        <a href={`tel:${doc.phone.replace(/\s/g, '')}`}
                          className="text-xs text-gray-500 hover:text-[#0f766e] flex items-center gap-1.5 transition-colors">
                          <Phone className="w-3 h-3" />{doc.phone}
                        </a>
                        <a href={`mailto:${doc.email}`}
                          className="text-xs text-gray-500 hover:text-[#0f766e] flex items-center gap-1.5 transition-colors truncate">
                          <Mail className="w-3 h-3" />{doc.email}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact details */}
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0f766e] to-[#14b8a6] px-5 py-4">
                <div className="flex items-center gap-2 text-white">
                  <Building2 className="w-5 h-5 shrink-0" />
                  <span className="font-semibold text-sm">{CONTACT_INFO.orgName}</span>
                </div>
              </div>

              <div className="p-5 space-y-3.5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#14b8a6] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase mb-0.5">Văn phòng</p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{CONTACT_INFO.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#14b8a6] shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase mb-0.5">Điện thoại</p>
                    <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                      className="text-gray-700 dark:text-gray-300 hover:text-[#0f766e] transition-colors font-medium">
                      {CONTACT_INFO.phone}
                    </a>
                    {CONTACT_INFO.phoneNote && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({CONTACT_INFO.phoneNote})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#14b8a6] shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase mb-0.5">Email</p>
                    <a href={`mailto:${CONTACT_INFO.email}`}
                      className="text-[#0f766e] hover:underline">{CONTACT_INFO.email}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-[#14b8a6] shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase mb-0.5">Website</p>
                    <a href={CONTACT_INFO.website} target="_blank" rel="noopener noreferrer"
                      className="text-[#0f766e] hover:underline">{CONTACT_INFO.website.replace('https://', '')}</a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Facebook className="w-4 h-4 text-[#14b8a6] shrink-0" />
                  <div>
                    <p className="font-medium text-xs text-muted-foreground uppercase mb-0.5">Facebook</p>
                    <a href={CONTACT_INFO.facebook} target="_blank" rel="noopener noreferrer"
                      className="text-[#0f766e] hover:underline">Fanpage</a>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-3.5">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs text-amber-600 uppercase mb-1">Bộ phận tư vấn</p>
                      <p className="text-gray-700 dark:text-gray-300 text-xs leading-relaxed">{CONTACT_INFO.workHours}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{CONTACT_INFO.offDays}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick contact CTA */}
            <div className="flex gap-2">
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0d9488] transition-colors shadow-sm">
                <Phone className="w-4 h-4" />Gọi ngay
              </a>
              <a href={`mailto:${CONTACT_INFO.email}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#0f766e] text-[#0f766e] text-sm font-medium hover:bg-teal-50 transition-colors">
                <MessageSquare className="w-4 h-4" />Gửi email
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
