'use client'

interface TextFormatFieldProps {
  value: string   // e.g. "bold|italic|underline"
  onChange: (value: string) => void
}

const FORMATS = [
  { key: 'bold',      label: 'B',  style: { fontWeight: 700 as const } },
  { key: 'italic',    label: 'I',  style: { fontStyle: 'italic' as const } },
  { key: 'underline', label: 'U',  style: { textDecoration: 'underline' as const } },
]

export function TextFormatField({ value, onChange }: TextFormatFieldProps) {
  const active = (value ?? '').split('|').filter(Boolean)

  const toggle = (key: string) => {
    const next = active.includes(key) ? active.filter((k) => k !== key) : [...active, key]
    onChange(next.join('|'))
  }

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {FORMATS.map(({ key, label, style }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          title={key}
          style={{
            width: 36,
            height: 36,
            borderRadius: 6,
            border: active.includes(key) ? '2px solid #2563eb' : '1px solid #d1d5db',
            background: active.includes(key) ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            fontSize: 14,
            ...style,
          }}
        >
          {label}
        </button>
      ))}
      {active.length > 0 && (
        <button
          onClick={() => onChange('')}
          title="Xóa định dạng"
          style={{
            padding: '0 10px',
            height: 36,
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          Xóa
        </button>
      )}
    </div>
  )
}

/** Chuyển format string thành CSS style object */
export function parseTextFormat(fmt?: string): React.CSSProperties {
  const parts = (fmt ?? '').split('|').filter(Boolean)
  return {
    fontWeight: parts.includes('bold') ? 700 : undefined,
    fontStyle: parts.includes('italic') ? 'italic' : undefined,
    textDecoration: parts.includes('underline') ? 'underline' : undefined,
  }
}
