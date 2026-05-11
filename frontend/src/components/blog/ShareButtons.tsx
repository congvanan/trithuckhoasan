'use client'
import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

interface Props {
  url: string
  title: string
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function ZaloIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zm3.6 13.5H8.4c-.3 0-.55-.17-.67-.44a.74.74 0 0 1 .11-.78l3.22-3.87H8.73a.67.67 0 0 1 0-1.34h6.34c.3 0 .55.17.67.44a.74.74 0 0 1-.11.78l-3.22 3.87h2.19a.67.67 0 0 1 0 1.34z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.17 8.17 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  )
}

const BUTTONS = [
  {
    key: 'facebook',
    label: 'Facebook',
    color: 'hover:bg-[#1877f2] hover:text-white hover:border-[#1877f2]',
    icon: <FacebookIcon />,
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    color: 'hover:bg-black hover:text-white hover:border-black',
    icon: <XIcon />,
    href: (url: string, title: string) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    key: 'zalo',
    label: 'Zalo',
    color: 'hover:bg-[#0068ff] hover:text-white hover:border-[#0068ff]',
    icon: <ZaloIcon />,
    href: (url: string) => `https://zalo.me/share/?u=${encodeURIComponent(url)}`,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    color: 'hover:bg-black hover:text-white hover:border-black',
    icon: <TikTokIcon />,
    href: null, // TikTok không có web share URL, dùng copy link
  },
]

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-medium text-gray-500">Chia sẻ:</span>

      {BUTTONS.map((btn) =>
        btn.href ? (
          <a
            key={btn.key}
            href={btn.href(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            title={btn.label}
            aria-label={`Chia sẻ lên ${btn.label}`}
            className={`w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center
              text-gray-500 transition-all duration-200 hover:scale-110 ${btn.color}`}
          >
            {btn.icon}
          </a>
        ) : (
          <button
            key={btn.key}
            onClick={handleCopy}
            title={copied ? 'Đã sao chép!' : `Sao chép link để chia sẻ lên ${btn.label}`}
            aria-label={`Chia sẻ lên ${btn.label}`}
            className={`w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center
              text-gray-500 transition-all duration-200 hover:scale-110 ${btn.color}`}
          >
            {btn.icon}
          </button>
        )
      )}

      {/* Copy link */}
      <button
        onClick={handleCopy}
        title={copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
        className={`w-9 h-9 rounded-full border-2 flex items-center justify-center
          transition-all duration-200 hover:scale-110
          ${copied
            ? 'border-teal-500 bg-teal-500 text-white'
            : 'border-gray-200 text-gray-500 hover:bg-teal-500 hover:text-white hover:border-teal-500'
          }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
