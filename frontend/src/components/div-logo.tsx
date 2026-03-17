function DivIcon({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="40" height="40" rx="4" fill="white" stroke="#1a56a0" strokeWidth="1.5"/>
      <text x="21" y="17" textAnchor="middle" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="#1a56a0">DIV</text>
      <polygon points="21,22 27,28 21,34 15,28" fill="none" stroke="#1a56a0" strokeWidth="1.5"/>
      <polygon points="21,24 25,28 21,32 17,28" fill="#1a56a0"/>
      <circle cx="8" cy="28" r="2.5" fill="none" stroke="#1a56a0" strokeWidth="1.2"/>
      <circle cx="34" cy="28" r="2.5" fill="none" stroke="#1a56a0" strokeWidth="1.2"/>
      <line x1="10.5" y1="28" x2="15" y2="28" stroke="#1a56a0" strokeWidth="1.2"/>
      <line x1="27" y1="28" x2="31.5" y2="28" stroke="#1a56a0" strokeWidth="1.2"/>
    </svg>
  )
}

// Logo đầy đủ dùng cho navbar ngang (topbar, mobile menu)
export function DivLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ minWidth: 0 }}>
      <DivIcon size={42} />
      <div className="flex flex-col leading-tight" style={{ minWidth: 0 }}>
        <span className="font-extrabold text-[13px] tracking-wide text-[#1a56a0] uppercase whitespace-nowrap">
          BẢO HIỂM TIỀN GỬI VIỆT NAM
        </span>
        <span className="text-[10px] italic font-semibold text-[#e8330a] whitespace-nowrap">
          Deposit Insurance of Vietnam
        </span>
      </div>
    </div>
  )
}

// Logo dạng nhỏ gọn dùng cho sidebar (chữ xuống dòng để vừa chiều rộng)
export function DivLogoCompact({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DivIcon size={36} />
      <div className="flex flex-col leading-tight">
        <span className="font-extrabold text-[11px] tracking-wide text-[#1a56a0] uppercase leading-tight">
          BẢO HIỂM TIỀN GỬI<br />VIỆT NAM
        </span>
        <span className="text-[9px] italic font-semibold text-[#e8330a]">
          Deposit Insurance of Vietnam
        </span>
      </div>
    </div>
  )
}
