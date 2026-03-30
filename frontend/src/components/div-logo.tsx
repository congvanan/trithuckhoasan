// Logo đầy đủ dùng cho navbar ngang (topbar, mobile menu)
export function DivLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ minWidth: 0 }}>
      {/* Logo image với viền teal gradient */}
      <div className="relative shrink-0 p-[2.5px] rounded-full"
        style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6, #0d9488)' }}>
        <div className="rounded-full bg-white p-[2px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/logo-san-khoa.png"
            alt="Tri Thức Sản Khoa"
            width={44}
            height={44}
            style={{ flexShrink: 0, objectFit: 'contain', borderRadius: '50%', display: 'block' }}
          />
        </div>
      </div>
      <span className="font-extrabold text-[15px] tracking-wide text-[#1e3a6e] uppercase whitespace-nowrap">
        TRI THỨC SẢN KHOA
      </span>
    </div>
  )
}

// Logo dạng nhỏ gọn dùng cho sidebar (chữ xuống dòng để vừa chiều rộng)
export function DivLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/logo-san-khoa.png"
        alt="Tri Thức Sản Khoa"
        width={40}
        height={40}
        style={{ flexShrink: 0, objectFit: 'contain' }}
      />
      <span className="font-extrabold text-[12px] tracking-wide text-[#1e3a6e] uppercase leading-tight">
        TRI THỨC<br />SẢN KHOA
      </span>
    </div>
  )
}
