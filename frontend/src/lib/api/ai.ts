/**
 * Thin fetch wrappers cho các endpoint quản trị AI.
 * Tất cả đều đi qua /api/[...slug] (Next.js proxy → ABP backend).
 * SDK @/client sẽ tự sinh sau khi backend đăng ký xong — tạm dùng fetch để admin page chạy ngay.
 */

export type AiSourceType =
  | 0 // CmsBlogPost
  | 1 // CmsPage
  | 10 // Pdf
  | 11 // Word
  | 12 // Image
  | 13 // Html
  | 14 // PlainText
  | 20 // Url
  | 30 // Manual

export type AiSourceStatus = 0 | 1 | 2 // Inactive | Active | Error
export type AiJobStatus = 0 | 1 | 2 | 3 | 4 // Pending | Running | Completed | Failed | Cancelled

export const AI_SOURCE_TYPE_LABEL: Record<number, string> = {
  0: 'Bài viết CMS',
  1: 'Trang CMS',
  10: 'PDF',
  11: 'Word',
  12: 'Ảnh (OCR)',
  13: 'HTML',
  14: 'Văn bản',
  20: 'URL',
  30: 'Thủ công',
}

export const AI_SOURCE_STATUS_LABEL: Record<number, string> = {
  0: 'Tắt',
  1: 'Bật',
  2: 'Lỗi',
}

export const AI_JOB_STATUS_LABEL: Record<number, string> = {
  0: 'Chờ',
  1: 'Đang chạy',
  2: 'Hoàn tất',
  3: 'Thất bại',
  4: 'Đã huỷ',
}

export interface AiSourceListDto {
  id: string
  name: string
  type: AiSourceType
  status: AiSourceStatus
  lastIndexedAt?: string | null
  documentCount: number
  chunkCount: number
  creationTime: string
}

export interface AiSourceDto extends AiSourceListDto {
  description?: string | null
  configJson?: string | null
  concurrencyStamp?: string | null
}

export interface CreateUpdateAiSourceDto {
  name: string
  description?: string | null
  type: AiSourceType
  status: AiSourceStatus
  configJson?: string | null
  concurrencyStamp?: string | null
}

export interface PreviewAiSourceInput {
  name?: string | null
  type: AiSourceType
  configJson?: string | null
}

export interface AiSourcePreviewDto {
  title: string
  text: string
  url?: string | null
  characterCount: number
  wordCount: number
}

export interface AiSettingsDto {
  llmProvider: string
  embeddingProvider: string
  llmModel: string
  embeddingModel: string
  geminiApiKey?: string | null
  openAiApiKey?: string | null
  claudeApiKey?: string | null
  deepSeekApiKey?: string | null
  topK: number
  chunkSize: number
  chunkOverlap: number
  temperature: number
  maxOutputTokens: number
  cacheEnabled: boolean
  cacheTtlDays: number
  dailyAnonymousLimit: number
  dailyUserLimit: number
  dailyTokenWarningLimit: number
  fallbackLlmProviders?: string | null
  systemPrompt: string
  fallbackAnswer?: string | null
  queryExpansionSynonyms?: string | null
  widgetEnabled: boolean
  widgetTitle: string
  widgetGreeting: string
}

export interface AiIngestionJobDto {
  id: string
  sourceId: string
  sourceName?: string | null
  status: AiJobStatus
  progress: number
  total: number
  processedDocumentCount: number
  processedChunkCount: number
  error?: string | null
  startedAt?: string | null
  finishedAt?: string | null
  creationTime: string
}

export interface AiConversationListDto {
  id: string
  userId?: string | null
  sessionId: string
  title?: string | null
  clientIp?: string | null
  messageCount: number
  creationTime: string
  lastMessageAt?: string | null
  lastUserMessage?: string | null
}

export interface AiMessageDto {
  id: string
  conversationId: string
  role: 0 | 1 | 2 | 3
  content: string
  citationsJson?: string | null
  llmModel?: string | null
  tokensIn?: number | null
  tokensOut?: number | null
  latencyMs?: number | null
  creationTime: string
}

export interface AiConversationDto {
  id: string
  userId?: string | null
  sessionId: string
  title?: string | null
  clientIp?: string | null
  messageCount: number
  creationTime: string
  messages: AiMessageDto[]
}

export interface AiDocumentDto {
  id: string
  sourceId: string
  externalId?: string | null
  title: string
  url?: string | null
  chunkCount: number
  lastIndexedAt?: string | null
  creationTime: string
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try {
      const errorData = JSON.parse(text)
      if (typeof errorData?.error === 'string') {
        message = errorData.error
      } else if (typeof errorData?.error?.message === 'string') {
        message = errorData.error.message
      }
    } catch {
      // Keep the plain response text when the API does not return JSON.
    }
    throw new Error(message || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

function qs(params: Record<string, unknown>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    usp.append(k, String(v))
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

// ------- AI Sources -------
export const aiSourceApi = {
  list: (params: {
    Filter?: string
    Type?: number
    Status?: number
    MaxResultCount?: number
    SkipCount?: number
    Sorting?: string
  }) => request<PagedResult<AiSourceListDto>>(`/api/app/ai-source${qs(params)}`),

  get: (id: string) => request<AiSourceDto>(`/api/app/ai-source/${id}`),

  create: (body: CreateUpdateAiSourceDto) =>
    request<AiSourceDto>(`/api/app/ai-source`, { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: CreateUpdateAiSourceDto) =>
    request<AiSourceDto>(`/api/app/ai-source/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: string) => request<void>(`/api/app/ai-source/${id}`, { method: 'DELETE' }),

  preview: (body: PreviewAiSourceInput) =>
    request<AiSourcePreviewDto>(`/api/app/ai-source/preview`, { method: 'POST', body: JSON.stringify(body) }),

  documents: (params: {
    SourceId?: string
    Filter?: string
    MaxResultCount?: number
    SkipCount?: number
  }) => request<PagedResult<AiDocumentDto>>(`/api/app/ai-source/documents${qs(params)}`),

  reindex: (id: string) =>
    request<AiIngestionJobDto>(`/api/app/ai-source/${id}/reindex`, { method: 'POST' }),
}

// ------- AI Settings -------
export const aiSettingApi = {
  get: () => request<AiSettingsDto>(`/api/app/ai-setting`),
  update: (body: AiSettingsDto) =>
    request<void>(`/api/app/ai-setting`, { method: 'PUT', body: JSON.stringify(body) }),
  testProvider: (provider: string, model?: string) =>
    request<{ ok: boolean; message?: string; latencyMs?: number }>(
      `/api/app/ai-setting/test-provider${qs({ provider, model })}`,
      { method: 'POST' }
    ),
}

// ------- AI Ingestion Jobs -------
export const aiIngestionApi = {
  list: (params: {
    SourceId?: string
    Status?: number
    MaxResultCount?: number
    SkipCount?: number
    Sorting?: string
  }) => request<PagedResult<AiIngestionJobDto>>(`/api/app/ai-ingestion${qs(params)}`),

  get: (id: string) => request<AiIngestionJobDto>(`/api/app/ai-ingestion/${id}`),

  trigger: (sourceId: string) =>
    request<AiIngestionJobDto>(`/api/app/ai-ingestion/trigger${qs({ sourceId })}`, {
      method: 'POST',
    }),

  cancel: (id: string) => request<void>(`/api/app/ai-ingestion/${id}/cancel`, { method: 'POST' }),

  delete: (id: string) =>
    request<void>(`/api/app/ai-ingestion/${id}`, { method: 'DELETE' }),

  clearFailed: () => request<void>(`/api/app/ai-ingestion/clear-failed`, { method: 'POST' }),
}

// ------- AI Chat (public, no auth) -------
export interface AiCitation {
  documentId?: string | null
  title?: string | null
  url?: string | null
  chunkIndex?: number | null
  score?: number | null
}

export interface AiAskResult {
  conversationId: string
  messageId: string
  answer: string
  citations: AiCitation[]
  latencyMs: number
  llmModel?: string | null
  usedFallback: boolean
}

export interface AiSessionMessage {
  id: string
  role: 0 | 1 | 2 | 3
  content: string
  citations?: AiCitation[] | null
  creationTime: string
}

export interface AiSession {
  conversationId?: string | null
  messages: AiSessionMessage[]
}

export interface AiWidgetConfig {
  enabled: boolean
  title: string
  greeting: string
}

export const aiChatApi = {
  ask: (body: { question: string; sessionId: string; conversationId?: string | null }) =>
    request<AiAskResult>(`/api/app/ai-chat/ask`, { method: 'POST', body: JSON.stringify(body) }),

  session: (sessionId: string) =>
    request<AiSession>(`/api/app/ai-chat/session/${encodeURIComponent(sessionId)}`),

  feedback: (body: { messageId: string; rating: number; comment?: string | null }) =>
    request<void>(`/api/app/ai-chat/submit-feedback`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const aiPublicApi = {
  widgetConfig: () => request<AiWidgetConfig>(`/api/app/ai-public/widget-config`),
}

// ------- Manual ingestion (admin) -------
export interface IngestTextInput {
  sourceId: string
  title: string
  content: string
  url?: string | null
  externalId?: string | null
}

export interface AiIngestionResult {
  documentId: string
  chunkCount: number
  latencyMs: number
}

export const aiIngestionTextApi = {
  ingestText: (body: IngestTextInput) =>
    request<AiIngestionResult>(`/api/app/ai-ingestion/ingest-text`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

// ------- AI Logs -------
export const aiLogApi = {
  conversations: (params: {
    Filter?: string
    FromDate?: string
    ToDate?: string
    MaxResultCount?: number
    SkipCount?: number
    Sorting?: string
  }) => request<PagedResult<AiConversationListDto>>(`/api/app/ai-log/conversations${qs(params)}`),

  conversation: (id: string) => request<AiConversationDto>(`/api/app/ai-log/${id}/conversation`),

  deleteConversation: (id: string) =>
    request<void>(`/api/app/ai-log/${id}/conversation`, { method: 'DELETE' }),

  export: async (params: { Filter?: string; FromDate?: string; ToDate?: string }) => {
    const res = await fetch(`/api/app/ai-log/export`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(params.Filter ? { filter: params.Filter } : {}),
        ...(params.FromDate ? { fromDate: params.FromDate } : {}),
        ...(params.ToDate ? { toDate: params.ToDate } : {}),
        maxResultCount: 1000,
        skipCount: 0,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      let message = text
      try {
        const e = JSON.parse(text)
        if (typeof e?.error === 'string') message = e.error
        else if (typeof e?.error?.message === 'string') message = e.error.message
      } catch { /* ignore */ }
      throw new Error(message || `${res.status} ${res.statusText}`)
    }
    return res.blob()
  },
}
