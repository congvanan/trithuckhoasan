'use client'
import Link from 'next/link'

// ✏️ Cập nhật thông tin liên hệ tại đây
const PHONE_NUMBER = '0979047955'           // Số điện thoại
const ZALO_LINK = 'https://zalo.me/0979047955'   // Link Zalo cá nhân
const MESSENGER_LINK = 'https://m.me/your.facebook.username' // Link Messenger

// SVG Zalo logo
function ZaloIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6">
      <text x="4" y="36" fontSize="32" fontWeight="900" fill="white" fontFamily="Arial, sans-serif">Z</text>
    </svg>
  )
}

// SVG Messenger logo
function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.91 1.395 5.51 3.578 7.227V22l3.27-1.793A10.6 10.6 0 0 0 12 20.485c5.523 0 10-4.145 10-9.242C22 6.145 17.523 2 12 2zm1.007 12.43-2.55-2.717-4.974 2.717 5.471-5.807 2.613 2.717 4.91-2.717-5.47 5.807z" />
    </svg>
  )
}

// SVG Phone icon
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  )
}

export function FloatingContact() {
  return (
    <div className="fixed right-4 bottom-24 z-50 flex flex-col gap-3">
      {/* Phone */}
      <div className="relative group">
        <Link
          href={`tel:${PHONE_NUMBER}`}
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #ff6b35, #f7431b)' }}
          aria-label="Gọi điện"
        >
          <span className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ background: 'linear-gradient(135deg, #ff6b35, #f7431b)' }} />
          <PhoneIcon />
        </Link>
        {/* Tooltip */}
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {PHONE_NUMBER}
        </span>
      </div>

      {/* Zalo */}
      <div className="relative group">
        <Link
          href={ZALO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #0068ff, #0052cc)' }}
          aria-label="Chat Zalo"
        >
          <ZaloIcon />
        </Link>
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat Zalo
        </span>
      </div>

      {/* Messenger */}
      <div className="relative group">
        <Link
          href={MESSENGER_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #0084ff, #a033ff)' }}
          aria-label="Chat Messenger"
        >
          <MessengerIcon />
        </Link>
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Chat Messenger
        </span>
      </div>
    </div>
  )
}
