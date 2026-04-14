// Logo đầy đủ dùng cho navbar ngang (topbar, mobile menu)
export function DivLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/logo-sanphukhoa360.svg"
      alt="SanKhoa360"
      className={className}
      style={{
        height: '80px',
        width: 'auto',
        maxWidth: '320px',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}

// Logo dạng nhỏ gọn dùng cho sidebar
export function DivLogoCompact({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/logo-sanphukhoa360.svg"
      alt="SanKhoa360"
      className={className}
      style={{
        height: 'auto',
        width: '100%',
        maxWidth: '180px',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  )
}
