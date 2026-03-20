// Logo đầy đủ dùng cho navbar ngang (topbar, mobile menu)
export function DivLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ minWidth: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/logo-san-khoa.png"
        alt="Tri Thức Sản Khoa"
        width={48}
        height={48}
        style={{ flexShrink: 0, objectFit: 'contain' }}
      />
      <div className="flex flex-col leading-tight" style={{ minWidth: 0 }}>
        <span className="font-extrabold text-[15px] tracking-wide text-[#1e3a6e] uppercase whitespace-nowrap">
          TRI THỨC SẢN KHOA
        </span>
        <span className="text-[12px] font-medium italic text-[#e85b8a] whitespace-nowrap text-center">
          Obstetrics Knowledge Hub
        </span>
      </div>
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
      <div className="flex flex-col leading-tight">
        <span className="font-extrabold text-[12px] tracking-wide text-[#1e3a6e] uppercase leading-tight">
          TRI THỨC<br />SẢN KHOA
        </span>
        <span className="text-[10px] font-medium text-[#e85b8a]">
          Obstetrics Knowledge Hub
        </span>
      </div>
    </div>
  )
}
