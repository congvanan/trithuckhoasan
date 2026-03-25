'use client'

const PALETTE = [
  // Trắng & xám
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#374151', '#1f2937', '#111827', '#000000',
  // Xanh dương
  '#dbeafe', '#93c5fd', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  // Xanh lá
  '#dcfce7', '#86efac', '#22c55e', '#16a34a', '#15803d',
  // Đỏ & hồng (y tế)
  '#fee2e2', '#fca5a5', '#ef4444', '#dc2626', '#b91c1c',
  '#fce7f3', '#f9a8d4', '#ec4899', '#db2777',
  // Cam & vàng
  '#ffedd5', '#fed7aa', '#f97316', '#ea580c',
  '#fef9c3', '#fde68a', '#eab308', '#ca8a04',
  // Tím
  '#ede9fe', '#c4b5fd', '#8b5cf6', '#7c3aed',
  // Xanh ngọc (y tế)
  '#cffafe', '#67e8f9', '#06b6d4', '#0891b2',
  '#ccfbf1', '#5eead4', '#14b8a6', '#0f766e',
]

interface ColorPickerFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function ColorPickerField({ value, onChange }: ColorPickerFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Bảng màu */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gap: 4,
      }}>
        {PALETTE.map((color) => (
          <button
            key={color}
            title={color}
            onClick={() => onChange(color)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              backgroundColor: color,
              border: value === color ? '2px solid #2563eb' : '1px solid #d1d5db',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
            }}
          />
        ))}
      </div>

      {/* Row: color input + hex text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={value?.startsWith('#') ? value : '#374151'}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 36,
            height: 36,
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            padding: 2,
          }}
        />
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#374151 hoặc rgba(...)"
          style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 13,
            fontFamily: 'monospace',
          }}
        />
        {/* Preview */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          backgroundColor: value,
          border: '1px solid #d1d5db',
          flexShrink: 0,
        }} />
      </div>
    </div>
  )
}
