'use client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, Send, CheckCircle2 } from 'lucide-react'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function genCode(len = 5) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

export function FooterContactForm() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [content, setContent] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [code, setCode]       = useState('')
  const [error, setError]     = useState(false)
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success'>('idle')

  useEffect(() => { setCode(genCode()) }, [])

  const refresh = useCallback(() => { setCode(genCode()); setCaptcha(''); setError(false) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (captcha.toUpperCase() !== code) { setError(true); refresh(); return }
    setStatus('loading')
    await new Promise((r) => setTimeout(r, 1000)) // TODO: gọi API
    setStatus('success')
  }

  const inputCls = `w-full px-3 py-2 text-sm rounded-lg bg-white/10 border border-white/20
    placeholder:text-white/40 text-white outline-none
    focus:border-white/50 focus:bg-white/15 transition-all`

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-teal-300" />
        <p className="text-white/90 text-sm font-medium">Gửi thành công! Chúng tôi sẽ phản hồi sớm.</p>
        <button onClick={() => { setName(''); setEmail(''); setContent(''); setCaptcha(''); setStatus('idle'); refresh() }}
          className="text-xs text-teal-300 hover:underline mt-1">
          Gửi ý kiến khác
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        </span>
        <input required value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Họ và tên *" className={`${inputCls} pl-9`} />
      </div>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </span>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email *" className={`${inputCls} pl-9`} />
      </div>

      <textarea required value={content} onChange={(e) => setContent(e.target.value)}
        rows={3} placeholder="Nội dung... *"
        className={`${inputCls} resize-none`} />

      {/* Captcha row */}
      <div className="flex gap-2">
        {/* Code display */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex items-center justify-center w-24 h-9 rounded-lg bg-white/15 border border-white/25
                          font-mono font-extrabold tracking-[0.2em] text-sm text-white select-none"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)', transform: 'skewX(-2deg)' }}>
            {code}
          </div>
          <button type="button" onClick={refresh} title="Đổi mã"
            className="p-1.5 text-white/50 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* Input */}
        <input
          required value={captcha} onChange={(e) => { setCaptcha(e.target.value); setError(false) }}
          maxLength={5} autoComplete="off" placeholder="NHẬP MÃ..."
          className={`${inputCls} flex-1 text-center font-mono tracking-widest uppercase ${error ? 'border-red-400' : ''}`}
        />
      </div>
      {error && <p className="text-red-300 text-xs">Mã không đúng, vui lòng thử lại</p>}

      <button type="submit" disabled={status === 'loading'}
        className="w-full h-10 rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white font-medium text-sm
                   flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
        {status === 'loading'
          ? <><Loader2 className="w-4 h-4 animate-spin" />Đang gửi...</>
          : <><Send className="w-4 h-4" />Gửi tin nhắn</>
        }
      </button>
    </form>
  )
}
