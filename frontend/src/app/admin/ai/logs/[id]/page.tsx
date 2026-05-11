'use client'
import { aiLogApi, AiMessageDto } from '@/lib/api/ai'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Bot, User } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { memo, useMemo } from 'react'

const dateFmt = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
})

const MessageBubble = memo(function MessageBubble({ m }: { m: AiMessageDto }) {
  const isUser = m.role === 1
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] rounded-lg px-4 py-3 ${isUser ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-200'}`}>
        <p className="whitespace-pre-wrap text-sm">{m.content}</p>
        {m.llmModel && (
          <p className="text-[10px] text-gray-400 mt-2">
            {m.llmModel}
            {m.tokensIn != null && ` · in ${m.tokensIn} tok`}
            {m.tokensOut != null && ` · out ${m.tokensOut} tok`}
            {m.latencyMs != null && ` · ${m.latencyMs} ms`}
          </p>
        )}
        <p className="text-[10px] text-gray-400 mt-1">{dateFmt.format(new Date(m.creationTime))}</p>
      </div>
    </div>
  )
})

export default function AiConversationDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ai-conv', id],
    queryFn: () => aiLogApi.conversation(id),
    enabled: !!id,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

  const headerInfo = useMemo(() => {
    if (!data) return null
    return `Session ${data.sessionId} · ${data.messageCount} tin nhắn · ${dateFmt.format(new Date(data.creationTime))}`
  }, [data])

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8 px-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex gap-3 ${i % 2 ? '' : 'flex-row-reverse'}`}>
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-16 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (error || !data) return <div className="p-6 text-red-500">Không tải được hội thoại.</div>

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8">
      {/* Sticky header — luôn hiện khi cuộn */}
      <div className="sticky top-0 z-10 -mx-4 px-4 bg-white/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 py-3">
          <Link
            href="/admin/ai/logs"
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-700 hover:bg-gray-100 transition shrink-0"
            title="Quay lại danh sách"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-semibold truncate text-gray-800">
              {data.title || `Hội thoại ${data.id.slice(0, 8)}…`}
            </h1>
            <p className="text-[11px] text-gray-500 truncate">{headerInfo}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-6">
        {data.messages.map((m) => <MessageBubble key={m.id} m={m} />)}
      </div>

      {/* Floating back button — hiện khi cuộn xuống xa */}
      <Link
        href="/admin/ai/logs"
        className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm shadow-lg hover:bg-gray-700 transition"
        title="Quay lại danh sách"
      >
        <ArrowLeft className="w-4 h-4" />
        Danh sách
      </Link>
    </div>
  )
}
