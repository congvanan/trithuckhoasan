'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useEffect, useCallback, useRef, useState } from 'react'

const TEXT_COLORS = [
  '#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff',
  '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
  '#2563eb', '#7c3aed', '#db2777', '#0f766e', '#1d4ed8',
]

const HIGHLIGHT_COLORS = [
  '#fef08a', '#fed7aa', '#fecaca', '#bbf7d0', '#bae6fd',
  '#e9d5ff', '#fce7f3', '#d1fae5', '#ffedd5', '#f3f4f6',
]

interface RichTextFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const btn = (active: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  padding: '3px 7px',
  borderRadius: 4,
  border: active ? '2px solid #2563eb' : '1px solid #d1d5db',
  background: active ? '#eff6ff' : '#fff',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1.5,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 28,
  ...extra,
})

const sep: React.CSSProperties = { width: 1, background: '#d1d5db', margin: '0 3px', alignSelf: 'stretch' }

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
  // Format Painter state
  const [isPainting, setIsPainting] = useState(false)
  const paintMarks = useRef<{ bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; color?: string; highlight?: string } | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height:300px;padding:12px;outline:none;font-size:14px;line-height:1.8;`,
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            const loadingText = '⏳ Đang upload ảnh...'
            view.dispatch(view.state.tr.insertText(loadingText))
            uploadImageToCloud(file).then((url) => {
              if (!url) return
              const { state } = view
              const from = state.selection.from - loadingText.length
              const tr = state.tr.delete(from, from + loadingText.length).insertText('')
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
            view.dispatch(tr.replaceSelectionWith(node))
          }
        })
        return true
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  // Format Painter: khi active, apply marks vào selection tiếp theo
  useEffect(() => {
    if (!editor || !isPainting) return
    const handleSelectionUpdate = () => {
      if (!paintMarks.current) return
      const { bold, italic, underline, strike, color, highlight } = paintMarks.current
      const chain = editor.chain().focus()
      if (bold) chain.setBold() ; else chain.unsetBold()
      if (italic) chain.setItalic() ; else chain.unsetItalic()
      if (underline) chain.setUnderline() ; else chain.unsetUnderline()
      if (strike) chain.setStrike() ; else chain.unsetStrike()
      if (color) chain.setColor(color) ; else chain.unsetColor()
      if (highlight) chain.setHighlight({ color: highlight }) ; else chain.unsetHighlight()
      chain.run()
      setIsPainting(false)
      paintMarks.current = null
    }
    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => { editor.off('selectionUpdate', handleSelectionUpdate) }
  }, [editor, isPainting])

  const handleFormatPainter = useCallback(() => {
    if (!editor) return
    paintMarks.current = {
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      color: (editor.getAttributes('textStyle') as { color?: string }).color,
      highlight: (editor.getAttributes('highlight') as { color?: string }).color,
    }
    setIsPainting(true)
  }, [editor])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''
    const url = await uploadImageToCloud(file)
    if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run()
  }, [editor])

  const handleAddLink = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Nhập URL:', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Toolbar row 1 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '6px 8px', background: '#f9fafb', borderRadius: '6px 6px 0 0', border: '1px solid #e5e7eb', borderBottom: 'none', alignItems: 'center' }}>

        {/* Undo / Redo */}
        <button style={btn(false)} title="Hoàn tác (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>↩</button>
        <button style={btn(false)} title="Làm lại (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>↪</button>

        <span style={sep} />

        {/* Format Painter */}
        <button
          style={btn(isPainting, { background: isPainting ? '#fef9c3' : undefined, border: isPainting ? '2px solid #ca8a04' : undefined })}
          title="Format Painter — chọn text có định dạng → nhấn nút → chọn text muốn áp dụng"
          onClick={handleFormatPainter}
        >
          🖌️
        </button>

        {/* Clear formatting */}
        <button style={btn(false)} title="Xóa tất cả định dạng" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
          <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>A</span>╳
        </button>

        <span style={sep} />

        {/* Basic marks */}
        <button style={btn(editor.isActive('bold'), { fontWeight: 900 })} title="Đậm (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button style={btn(editor.isActive('italic'), { fontStyle: 'italic' })} title="Nghiêng (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button style={btn(editor.isActive('underline'), { textDecoration: 'underline' })} title="Gạch chân (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button style={btn(editor.isActive('strike'), { textDecoration: 'line-through' })} title="Gạch ngang" onClick={() => editor.chain().focus().toggleStrike().run()}>S</button>
        <button style={btn(editor.isActive('subscript'))} title="Chỉ số dưới (H₂O)" onClick={() => editor.chain().focus().toggleSubscript().run()}>X₂</button>
        <button style={btn(editor.isActive('superscript'))} title="Chỉ số trên (m²)" onClick={() => editor.chain().focus().toggleSuperscript().run()}>X²</button>

        <span style={sep} />

        {/* Headings */}
        <button style={btn(editor.isActive('heading', { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button style={btn(editor.isActive('heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button style={btn(editor.isActive('heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>

        <span style={sep} />

        {/* Align */}
        <button style={btn(editor.isActive({ textAlign: 'left' }))} title="Căn trái" onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬛︎≡</button>
        <button style={btn(editor.isActive({ textAlign: 'center' }))} title="Căn giữa" onClick={() => editor.chain().focus().setTextAlign('center').run()}>≡</button>
        <button style={btn(editor.isActive({ textAlign: 'right' }))} title="Căn phải" onClick={() => editor.chain().focus().setTextAlign('right').run()}>≡⬛︎</button>
        <button style={btn(editor.isActive({ textAlign: 'justify' }))} title="Căn đều" onClick={() => editor.chain().focus().setTextAlign('justify').run()}>▤</button>

        <span style={sep} />

        {/* Lists */}
        <button style={btn(editor.isActive('bulletList'))} title="Danh sách chấm" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button style={btn(editor.isActive('orderedList'))} title="Danh sách số" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button style={btn(editor.isActive('blockquote'))} title="Trích dẫn" onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</button>

        <span style={sep} />

        {/* Link + Image + HR */}
        <button style={btn(editor.isActive('link'))} title="Chèn/xóa liên kết" onClick={handleAddLink}>🔗</button>
        <label style={{ ...btn(false), cursor: 'pointer' }} title="Chèn ảnh">
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        <button style={btn(false)} title="Đường kẻ ngang" onClick={() => editor.chain().focus().setHorizontalRule().run()}>─</button>
      </div>

      {/* Toolbar row 2: màu chữ + highlight */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, padding: '5px 8px', background: '#f9fafb', border: '1px solid #e5e7eb', borderBottom: 'none', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Màu chữ:</span>
        {TEXT_COLORS.map((c) => (
          <button key={c} title={c} onClick={() => editor.chain().focus().setColor(c).run()}
            style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: c, border: editor.isActive('textStyle', { color: c }) ? '2px solid #2563eb' : '1px solid #9ca3af', cursor: 'pointer', padding: 0 }} />
        ))}
        <input type="color" title="Màu tùy chỉnh" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          style={{ width: 22, height: 22, border: '1px solid #d1d5db', borderRadius: 3, cursor: 'pointer', padding: 1 }} />
        <button style={{ ...btn(false), fontSize: 11, marginLeft: 4 }} title="Xóa màu chữ" onClick={() => editor.chain().focus().unsetColor().run()}>✕</button>

        <span style={{ ...sep, marginLeft: 8 }} />

        <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Nền:</span>
        {HIGHLIGHT_COLORS.map((c) => (
          <button key={c} title={`Highlight ${c}`} onClick={() => editor.chain().focus().toggleHighlight({ color: c }).run()}
            style={{ width: 18, height: 18, borderRadius: 3, backgroundColor: c, border: editor.isActive('highlight', { color: c }) ? '2px solid #2563eb' : '1px solid #9ca3af', cursor: 'pointer', padding: 0 }} />
        ))}
        <button style={{ ...btn(false), fontSize: 11, marginLeft: 4 }} title="Xóa highlight" onClick={() => editor.chain().focus().unsetHighlight().run()}>✕</button>
      </div>

      {/* Editor */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '0 0 6px 6px', background: '#fff' }}>
        <style>{`
          .ProseMirror img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; cursor: pointer; }
          .ProseMirror img.ProseMirror-selectednode { outline: 3px solid #2563eb; }
          .ProseMirror a { color: #2563eb; text-decoration: underline; }
          .ProseMirror blockquote { border-left: 4px solid #d1d5db; padding-left: 12px; color: #6b7280; font-style: italic; margin: 8px 0; }
          .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 16px 0; }
          .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 6px 0; }
          .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 6px 0; }
          .ProseMirror li > p { display: inline; }
          .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {isPainting && (
        <p style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 4, padding: '4px 8px', margin: 0 }}>
          🖌️ Format Painter đang active — hãy chọn đoạn text muốn áp dụng định dạng
        </p>
      )}
      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
        💡 Ctrl+Z hoàn tác · Paste ảnh / kéo thả ảnh → tự upload · 🖌️ Format Painter: copy định dạng rồi áp sang đoạn khác
      </p>
    </div>
  )
}
