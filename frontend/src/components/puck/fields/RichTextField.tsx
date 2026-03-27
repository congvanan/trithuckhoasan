'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useEffect, useCallback } from 'react'

const COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#db2777', '#0f766e', '#1d4ed8',
]

interface RichTextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
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

async function uploadImageToCloud(file: File): Promise<string | null> {
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form })
    const data = await res.json()
    return data.url ?? null
  } catch {
    return null
  }
}

export function RichTextField({ value, onChange, placeholder }: RichTextFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height:300px;padding:12px;outline:none;font-size:14px;line-height:1.7;${placeholder ? '' : ''}`,
      },
      // Xử lý paste ảnh từ clipboard
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            // Hiển thị placeholder loading
            const loadingText = '⏳ Đang upload ảnh...'
            view.dispatch(view.state.tr.insertText(loadingText))
            uploadImageToCloud(file).then((url) => {
              if (!url) return
              // Thay placeholder bằng ảnh thật
              const { state } = view
              const from = state.selection.from - loadingText.length
              const tr = state.tr
                .delete(from, from + loadingText.length)
                .insertText('')
              view.dispatch(tr)
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src: url, alt: file.name })
                )
              )
            })
            return true
          }
        }
        return false
      },
      // Xử lý kéo thả ảnh
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files?.length) return false
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (!imageFiles.length) return false
        event.preventDefault()
        imageFiles.forEach(async (file) => {
          const url = await uploadImageToCloud(file)
          if (url) {
            const { schema, tr } = view.state
            const node = schema.nodes.image.create({ src: url, alt: file.name })
            const transaction = tr.replaceSelectionWith(node)
            view.dispatch(transaction)
          }
        })
        return true
      },
    },
  })

  // Sync khi value thay đổi từ bên ngoài
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  // Upload ảnh từ nút trong toolbar
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''
    const url = await uploadImageToCloud(file)
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px', background: '#f9fafb', borderRadius: 6, border: '1px solid #e5e7eb' }}>
        <button style={{ ...btnStyle(editor.isActive('bold')), fontWeight: 900 }} onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button style={{ ...btnStyle(editor.isActive('italic')), fontStyle: 'italic' }} onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button style={{ ...btnStyle(editor.isActive('underline')), textDecoration: 'underline' }} onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button style={{ ...btnStyle(editor.isActive('strike')), textDecoration: 'line-through' }} onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        <button style={btnStyle(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button style={btnStyle(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button style={btnStyle(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        <button style={btnStyle(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>≡</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>☰</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡</button>
        <button style={btnStyle(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>▤</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        <button style={btnStyle(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button style={btnStyle(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>

        <span style={{ width: 1, background: '#d1d5db', margin: '0 2px' }} />

        {/* Nút upload ảnh */}
        <label style={{ ...btnStyle(false), display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer' }} title="Chèn ảnh">
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

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

      {/* Editor */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: 6, background: '#fff' }}>
        <style>{`
          .ProseMirror img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; cursor: pointer; }
          .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #2563eb; }
          .ProseMirror a { color: #2563eb; text-decoration: underline; }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
        💡 Paste text từ Word giữ nguyên định dạng · Paste ảnh hoặc kéo thả ảnh vào editor để upload tự động · Nhấn 🖼️ để chọn ảnh từ máy
      </p>
    </div>
  )
}
