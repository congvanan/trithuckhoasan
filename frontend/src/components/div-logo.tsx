// Logo đầy đủ dùng cho navbar ngang (topbar, mobile menu)
export function DivLogo({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/logo-sankhoa360.png"
      alt="SanKhoa360"
      className={className}
      style={{ height: '80px', width: 'auto', maxWidth: '400px', objectFit: 'contain', display: 'block' }}
    />
  )
}

// Logo dạng nhỏ gọn dùng cho sidebar
export function DivLogoCompact({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/logo-sankhoa360.png"
      alt="SanKhoa360"
      className={className}
      style={{ height: '48px', width: 'auto', maxWidth: '150px', objectFit: 'contain', display: 'block' }}
    />
  )
}
