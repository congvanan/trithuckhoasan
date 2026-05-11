'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  aiChatApi,
  aiPublicApi,
  type AiAskResult,
  type AiCitation,
  type AiSessionMessage,
  type AiWidgetConfig,
} from '@/lib/api/ai'
import { cn } from '@/lib/utils'
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, Loader2, RotateCcw } from 'lucide-react'

const SESSION_KEY = 'ttks.ai.sessionId'
const CONV_KEY = 'ttks.ai.conversationId'
const SESSION_UPDATED_KEY = 'ttks.ai.sessionUpdatedAt'
const SESSION_TTL_MS = 2 * 60 * 60 * 1000

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AiCitation[] | null
  pending?: boolean
  error?: boolean
  feedback?: 1 | -1
}

function genSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function stripInlineCitations(text: string): string {
  return text.replace(/\s*\[(?:\d+\s*(?:,\s*\d+\s*)*)\]/g, '').trim()
}

function getChatStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function clearPersistedChat() {
  if (typeof window === 'undefined') return
  for (const storage of [window.sessionStorage, window.localStorage]) {
    storage.removeItem(SESSION_KEY)
    storage.removeItem(CONV_KEY)
    storage.removeItem(SESSION_UPDATED_KEY)
  }
}

function createSession(): string {
  const sid = genSessionId()
  const storage = getChatStorage()
  storage?.setItem(SESSION_KEY, sid)
  storage?.setItem(SESSION_UPDATED_KEY, String(Date.now()))
  storage?.removeItem(CONV_KEY)
  return sid
}

function touchSession() {
  getChatStorage()?.setItem(SESSION_UPDATED_KEY, String(Date.now()))
}

function mapSessionMessage(m: AiSessionMessage): UiMessage {
  // Backend enum: System=0, User=1, Assistant=2, Tool=3
  return {
    id: m.id,
    role: m.role === 2 ? 'assistant' : 'user',
    content: m.content,
    citations: m.citations ?? null,
  }
}

export function ChatWidget() {
  const [config, setConfig] = useState<AiWidgetConfig | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load widget config once
  useEffect(() => {
    let cancelled = false
    aiPublicApi
      .widgetConfig()
      .then((c) => {
        if (!cancelled) setConfig(c)
      })
      .catch(() => {
        if (!cancelled) setConfig({ enabled: false, title: '', greeting: '' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Restore the current tab session only. Old localStorage sessions are cleared so stale chats
  // from previous visits do not come back unexpectedly.
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(SESSION_KEY)
    window.localStorage.removeItem(CONV_KEY)
    window.localStorage.removeItem(SESSION_UPDATED_KEY)

    const storage = getChatStorage()
    const updatedAt = Number(storage?.getItem(SESSION_UPDATED_KEY) ?? 0)
    const expired = !updatedAt || Date.now() - updatedAt > SESSION_TTL_MS
    let sid = storage?.getItem(SESSION_KEY)

    if (!sid || expired) {
      clearPersistedChat()
      sid = createSession()
    } else {
      touchSession()
    }
    setSessionId(sid)
    const cid = storage?.getItem(CONV_KEY)
    if (cid) setConversationId(cid)
  }, [])

  // Load history when opened the first time
  const loadedRef = useRef(false)
  useEffect(() => {
    if (!open || !sessionId || loadedRef.current) return
    loadedRef.current = true
    aiChatApi
      .session(sessionId)
      .then((s) => {
        if (s?.conversationId) {
          setConversationId(s.conversationId)
          getChatStorage()?.setItem(CONV_KEY, s.conversationId)
        }
        if (s?.messages?.length) setMessages(s.messages.map(mapSessionMessage))
      })
      .catch(() => {})
  }, [open, sessionId])

  // Auto-scroll on new message
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, open])

  // Focus input on open
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = useCallback(async () => {
    const question = input.trim()
    if (!question || sending || !sessionId) return

    const userMsg: UiMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: question,
    }
    const placeholderId = `a_${Date.now()}`
    const placeholder: UiMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      pending: true,
    }
    setMessages((prev) => [...prev, userMsg, placeholder])
    setInput('')
    setSending(true)

    try {
      const result: AiAskResult = await aiChatApi.ask({
        question,
        sessionId,
        conversationId,
      })
      if (result.conversationId && result.conversationId !== conversationId) {
        setConversationId(result.conversationId)
        getChatStorage()?.setItem(CONV_KEY, result.conversationId)
      }
      touchSession()
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                id: result.messageId,
                role: 'assistant',
                content: result.answer,
                citations: result.citations,
              }
            : m,
        ),
      )
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                pending: false,
                error: true,
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
              }
            : m,
        ),
      )
    } finally {
      setSending(false)
    }
  }, [input, sending, sessionId, conversationId])

  const onFeedback = useCallback(async (messageId: string, rating: 1 | -1) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m)),
    )
    try {
      await aiChatApi.feedback({ messageId, rating })
    } catch {
      // silent — optimistic UI
    }
  }, [])

  const startNew = useCallback(() => {
    clearPersistedChat()
    const sid = createSession()
    setMessages([])
    setSessionId(sid)
    setConversationId(null)
    loadedRef.current = false
    inputRef.current?.focus()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const showGreeting = useMemo(() => messages.length === 0, [messages.length])

  if (!config?.enabled) return null

  return (
    <>
      {/* Bubble */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng trợ lý' : 'Mở trợ lý'}
        className={cn(
          'fixed right-4 bottom-4 z-[60] flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-transform duration-200 hover:scale-110',
          'bg-gradient-to-br from-teal-600 to-teal-800 text-white',
        )}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label={config.title || 'Trợ lý AI'}
          className={cn(
            'fixed z-[60] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden',
            'right-4 bottom-20 w-[min(380px,calc(100vw-2rem))] h-[min(600px,calc(100vh-6rem))]',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-br from-teal-700 to-teal-900 text-white">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-5 h-5 shrink-0" />
              <div className="font-semibold truncate">{config.title || 'Trợ lý'}</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={startNew}
                title="Cuộc trò chuyện mới"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Đóng"
                className="p-1.5 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
            {showGreeting && config.greeting && (
              <MessageBubble
                role="assistant"
                content={config.greeting}
              />
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                role={m.role}
                content={m.content}
                pending={m.pending}
                error={m.error}
                feedback={m.feedback}
                onFeedback={m.role === 'assistant' && !m.pending && !m.error
                  ? (r) => onFeedback(m.id, r)
                  : undefined}
              />
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi..."
                disabled={sending}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 max-h-32"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !input.trim()}
                className={cn(
                  'shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-white transition',
                  sending || !input.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700',
                )}
                aria-label="Gửi"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MessageBubble({
  role,
  content,
  pending,
  error,
  feedback,
  onFeedback,
}: {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
  error?: boolean
  feedback?: 1 | -1
  onFeedback?: (rating: 1 | -1) => void
}) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words shadow-sm',
            isUser
              ? 'bg-teal-600 text-white rounded-br-sm'
              : error
                ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm',
          )}
        >
          {pending ? (
            <span className="inline-flex gap-1 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
            </span>
          ) : (
            stripInlineCitations(content)
          )}
        </div>

        {!isUser && !pending && !error && onFeedback && (
          <div className="flex gap-1 mt-0.5">
            <button
              type="button"
              onClick={() => onFeedback(1)}
              disabled={feedback !== undefined}
              title="Hữu ích"
              className={cn(
                'p-1 rounded transition',
                feedback === 1
                  ? 'text-teal-600 bg-teal-50'
                  : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50',
                feedback !== undefined && feedback !== 1 && 'opacity-30',
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onFeedback(-1)}
              disabled={feedback !== undefined}
              title="Không hữu ích"
              className={cn(
                'p-1 rounded transition',
                feedback === -1
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50',
                feedback !== undefined && feedback !== -1 && 'opacity-30',
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatWidget
