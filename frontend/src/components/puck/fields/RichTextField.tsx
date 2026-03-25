'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import { useEffect } from 'react'

const COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#db2777', '#0f766e', '#1d4ed8',
]

interface RichTextFieldProps {
  value: string
  onChange: (value: string) => void
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  padding: '3px 8px',
  borderRadius: 4,
  border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
  background: active ? '#eff6ff' : '#fff',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.4,
})

export function RichTextField({ value, onChange }: RichTextFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        style: 'min-height:120px;padding:8px;outline:none;font-size:14px;line-height:1.6',
      },
    },
  })

  // Sync khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px', background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
        {/* Bold / Italic / Underline */}
        <button style={{ ...btnStyle(editor.isActive('bold')), fontWeight: 900 }} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button style={{ ...btnStyle(editor.isActive('italic')), fontStyle: 'italic' }} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button style={{ ...btnStyle(editor.isActive('underline')), textDecoration: 'underline' }} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button style={{ ...btnStyle(editor.isActive('strike')), textDecoration: 'line-through' }} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        {/* Heading */}
        <button style={btnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button style={btnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button style={btnStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        {/* Alignment */}
        <button style={btnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>≡</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>☰</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>▤</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        {/* List */}
        <button style={btnStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button style={btnStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        {/* Color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              style={{
                width: 18, height: 18, borderRadius: 3,
                backgroundColor: c,
                border: editor.isActive('textStyle', { color: c }) ? '2px solid #2563eb' : '1px solid #9ca3af',
                cursor: 'pointer', padding: 0,
              }}
            />
          ))}
          <input
            type="color"
            title="Màu tùy chỉnh"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            style={{ width: 22, height: 22, border: '1px solid #d1d5db', borderRadius: 3, cursor: 'pointer', padding: 1 }}
          />
        </div>
      </div>

      {/* Editor content */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: 6, background: '#fff' }}>
        <EditorContent editor={editor} />
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
        💡 Paste trực tiếp từ Word — giữ nguyên định dạng
      </p>
    </div>
  )
}
