'use client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { aiSettingApi, AiSettingsDto } from '@/lib/api/ai'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Loader2, Save, Sliders, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type ProviderStatus = { ok: boolean; message?: string; latencyMs?: number } | null
type ModelOption = { value: string; label: string }
type TestKind = 'llm' | 'embedding'

const LLM_PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'openai', label: 'OpenAI (ChatGPT)' },
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'deepseek', label: 'DeepSeek' },
]

const EMBEDDING_PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'openai', label: 'OpenAI' },
]

const LLM_MODEL_OPTIONS: Record<string, ModelOption[]> = {
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (legacy)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (legacy)' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
    { value: 'claude-3-opus-latest', label: 'Claude 3 Opus' },
  ],
  deepseek: [
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  ],
}

const EMBEDDING_MODEL_OPTIONS: Record<string, ModelOption[]> = {
  gemini: [{ value: 'gemini-embedding-001', label: 'Gemini Embedding 001 (768 dim)' }],
  openai: [
    { value: 'text-embedding-3-small', label: 'text-embedding-3-small (1536 dim)' },
    { value: 'text-embedding-3-large', label: 'text-embedding-3-large (3072 dim)' },
  ],
}

const getModelOptions = (
  groups: Record<string, ModelOption[]>,
  provider: string,
  currentValue?: string | null
) => {
  const options = groups[provider] ?? []
  if (!currentValue || options.some((option) => option.value === currentValue)) return options
  return [{ value: currentValue, label: `${currentValue} (current)` }, ...options]
}

const getDefaultModel = (
  groups: Record<string, ModelOption[]>,
  provider: string,
  fallback: string
) => groups[provider]?.[0]?.value ?? fallback

const isMaskedApiKey = (value?: string | null) =>
  !!value && (value.includes('*') || value.includes('•') || value.includes('â€¢'))

const Field = ({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: React.ReactNode
}) => (
  <div>
    <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
  </div>
)

const ProviderStatusBadge = ({ status }: { status: ProviderStatus }) => {
  if (!status) return null
  return status.ok ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle2 className="w-3 h-3" /> {status.message}{' '}
      {status.latencyMs != null && `(${status.latencyMs} ms)`}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-red-600">
      <XCircle className="w-3 h-3" /> {status.message}
    </span>
  )
}

export default function AiSettingsPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin-ai-settings'],
    queryFn: () => aiSettingApi.get(),
    retry: false,
  })
  const [form, setForm] = useState<AiSettingsDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, ProviderStatus>>({})
  const [keyProvider, setKeyProvider] = useState<'gemini' | 'openai' | 'claude' | 'deepseek'>('gemini')

  // Khi đổi LLM provider, tự nhảy sang đúng ô API key tương ứng để admin không phải tìm.
  useEffect(() => {
    if (
      form?.llmProvider === 'gemini' ||
      form?.llmProvider === 'openai' ||
      form?.llmProvider === 'claude' ||
      form?.llmProvider === 'deepseek'
    ) {
      setKeyProvider(form.llmProvider)
    }
  }, [form?.llmProvider])

  useEffect(() => {
    if (data && !form) setForm(structuredClone(data))
  }, [data, form])

  if (isPending) {
    return <div className="p-6 text-muted-foreground">Đang tải cấu hình AI…</div>
  }

  if (isError) {
    return (
      <div className="p-6 space-y-3">
        <div className="text-red-600 font-medium">Không tải được cấu hình AI</div>
        <pre className="text-xs bg-red-50 border border-red-200 rounded p-3 whitespace-pre-wrap break-all">
          {(error as Error)?.message || 'Unknown error'}
        </pre>
        <p className="text-xs text-gray-500">
          Kiểm tra: backend đã chạy chưa? User hiện tại có quyền <code>Ai.Settings</code> không?
          Proxy <code>/api/app/ai-setting</code> có trả về JSON?
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    )
  }

  if (!form) {
    return <div className="p-6 text-muted-foreground">Đang khởi tạo biểu mẫu…</div>
  }

  const update = <K extends keyof AiSettingsDto>(key: K, value: AiSettingsDto[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const updateLlmProvider = (provider: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            llmProvider: provider,
            llmModel: getDefaultModel(LLM_MODEL_OPTIONS, provider, f.llmModel),
          }
        : f
    )

  const updateEmbeddingProvider = (provider: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            embeddingProvider: provider,
            embeddingModel: getDefaultModel(EMBEDDING_MODEL_OPTIONS, provider, f.embeddingModel),
          }
        : f
    )

  const llmModelOptions = getModelOptions(LLM_MODEL_OPTIONS, form.llmProvider, form.llmModel)
  const embeddingModelOptions = getModelOptions(
    EMBEDDING_MODEL_OPTIONS,
    form.embeddingProvider,
    form.embeddingModel
  )

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      // Do not send masked API key previews back to the backend.
      const payload: AiSettingsDto = { ...form }
      for (const key of ['geminiApiKey', 'openAiApiKey', 'claudeApiKey', 'deepSeekApiKey'] as const) {
        if (isMaskedApiKey(payload[key])) payload[key] = null
      }
      await aiSettingApi.update(payload)
      toast({ title: 'Đã lưu cấu hình AI' })
      qc.invalidateQueries({ queryKey: ['admin-ai-settings'] })
    } catch (err) {
      toast({ title: 'Lỗi', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const getTestKey = (provider: string, kind: TestKind) => `${provider}:${kind}`

  const handleTest = async (provider: string, kind: TestKind) => {
    const testKey = getTestKey(provider, kind)
    setTesting(testKey)
    try {
      const model = kind === 'llm' ? form.llmModel : form.embeddingModel
      const res = await aiSettingApi.testProvider(provider, model)
      setTestResult((r) => ({ ...r, [testKey]: res }))
    } catch (err) {
      setTestResult((r) => ({ ...r, [testKey]: { ok: false, message: (err as Error).message } }))
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/ai" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Sliders className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Cấu hình AI</h1>
          <p className="text-sm text-gray-500">Provider, API key, RAG tuning, widget</p>
        </div>
        <Button className="ml-auto" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
      </div>

      {/* Provider */}
      <section className="border rounded-lg p-4 mb-4 bg-white">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Provider</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="LLM provider">
            <select
              value={form.llmProvider}
              onChange={(e) => updateLlmProvider(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {LLM_PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="LLM model">
            <select
              value={form.llmModel}
              onChange={(e) => update('llmModel', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {llmModelOptions.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Embedding provider">
            <select
              value={form.embeddingProvider}
              onChange={(e) => updateEmbeddingProvider(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {EMBEDDING_PROVIDER_OPTIONS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Embedding model">
            <select
              value={form.embeddingModel}
              onChange={(e) => update('embeddingModel', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              {embeddingModelOptions.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* API key */}
      <section className="border rounded-lg p-4 mb-4 bg-white">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">API key</h2>
        <p className="text-xs text-gray-500 mb-3">
          Chọn provider muốn cấu hình rồi nhập key. Giá trị hiển thị đã được mask — nhập giá trị mới
          để thay thế, để trống để giữ nguyên, nhập <code>-</code> rồi xoá để xoá hẳn.
        </p>
        {(() => {
          const field =
            keyProvider === 'openai'
              ? 'openAiApiKey'
              : keyProvider === 'deepseek'
                ? 'deepSeekApiKey'
              : (`${keyProvider}ApiKey` as keyof AiSettingsDto)
          const placeholder = keyProvider === 'gemini' ? 'AIza…' : 'sk-…'
          const docUrl =
            keyProvider === 'gemini'
              ? 'https://aistudio.google.com/apikey'
              : keyProvider === 'openai'
                ? 'https://platform.openai.com/api-keys'
                : keyProvider === 'deepseek'
                  ? 'https://platform.deepseek.com/api_keys'
                  : 'https://console.anthropic.com/settings/keys'
          const isActive =
            form.llmProvider === keyProvider || form.embeddingProvider === keyProvider
          const canTestLlm = form.llmProvider === keyProvider
          const canTestEmbedding = form.embeddingProvider === keyProvider
          const llmTestKey = getTestKey(keyProvider, 'llm')
          const embeddingTestKey = getTestKey(keyProvider, 'embedding')
          return (
            <div className="space-y-3">
              {/* Hàng trên: Provider + API key — labels & inputs cùng cao */}
              <div className="grid grid-cols-[220px_1fr] gap-3 items-start">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Provider</label>
                  <select
                    value={keyProvider}
                    onChange={(e) => setKeyProvider(e.target.value as 'gemini' | 'openai' | 'claude' | 'deepseek')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white h-10"
                  >
                    <option value="gemini">Gemini (Google)</option>
                    <option value="openai">OpenAI (ChatGPT)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {`API key${isActive ? ' (đang dùng)' : ''}`}
                  </label>
                  <Input
                    type="password"
                    value={(form[field] as string) ?? ''}
                    onChange={(e) => update(field, e.target.value as never)}
                    placeholder={placeholder}
                    className="h-10"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Lấy key tại{' '}
                    <a
                      className="text-blue-600 hover:underline"
                      href={docUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {docUrl}
                    </a>
                  </p>
                </div>
              </div>

              {/* Hàng dưới: nút Test + status */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500 mr-1">Kiểm tra kết nối:</span>
                {canTestLlm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(keyProvider, 'llm')}
                    disabled={testing === llmTestKey}
                  >
                    {testing === llmTestKey ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Test LLM
                  </Button>
                )}
                {canTestEmbedding && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTest(keyProvider, 'embedding')}
                    disabled={testing === embeddingTestKey}
                  >
                    {testing === embeddingTestKey ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Test Embedding
                  </Button>
                )}
                {!canTestLlm && !canTestEmbedding && (
                  <span className="text-xs text-amber-600">
                    Provider này chưa được chọn làm LLM hoặc Embedding — không có gì để test.
                  </span>
                )}
                <div className="ml-auto flex flex-col gap-0.5 items-end">
                  <ProviderStatusBadge status={testResult[llmTestKey] ?? null} />
                  <ProviderStatusBadge status={testResult[embeddingTestKey] ?? null} />
                </div>
              </div>
            </div>
          )
        })()}
        {!(form.llmProvider === keyProvider || form.embeddingProvider === keyProvider) && (
          <p className="text-[11px] text-amber-600 mt-2">
            ⚠ Provider đang chọn không phải LLM hay Embedding hiện hành — key vẫn được lưu nhưng sẽ
            không có hiệu lực cho đến khi đổi provider ở mục trên.
          </p>
        )}
      </section>

      {/* RAG tuning */}
      <section className="border rounded-lg p-4 mb-4 bg-white">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">RAG tuning</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Top-K" hint="Số chunk truy hồi cho mỗi câu hỏi">
            <Input
              type="number"
              min={1}
              max={20}
              value={form.topK}
              onChange={(e) => update('topK', Number(e.target.value))}
            />
          </Field>
          <Field label="Chunk size" hint="Độ dài mỗi chunk (ký tự)">
            <Input
              type="number"
              min={200}
              max={4000}
              value={form.chunkSize}
              onChange={(e) => update('chunkSize', Number(e.target.value))}
            />
          </Field>
          <Field label="Chunk overlap" hint="Độ chồng lấn (ký tự)">
            <Input
              type="number"
              min={0}
              max={500}
              value={form.chunkOverlap}
              onChange={(e) => update('chunkOverlap', Number(e.target.value))}
            />
          </Field>
          <Field label="Temperature" hint="0 = chính xác; 1 = sáng tạo">
            <Input
              type="number"
              step={0.1}
              min={0}
              max={1.5}
              value={form.temperature}
              onChange={(e) => update('temperature', Number(e.target.value))}
            />
          </Field>
          <Field label="Max output tokens">
            <Input
              type="number"
              min={512}
              max={8192}
              value={form.maxOutputTokens}
              onChange={(e) => update('maxOutputTokens', Number(e.target.value))}
            />
          </Field>
          <Field label="Cache TTL days" hint="0 = tắt cache theo thời hạn">
            <Input
              type="number"
              min={0}
              max={30}
              value={form.cacheTtlDays}
              onChange={(e) => update('cacheTtlDays', Number(e.target.value))}
            />
          </Field>
          <Field label="Anonymous/day">
            <Input
              type="number"
              min={0}
              max={10000}
              value={form.dailyAnonymousLimit}
              onChange={(e) => update('dailyAnonymousLimit', Number(e.target.value))}
            />
          </Field>
          <Field label="User/day">
            <Input
              type="number"
              min={0}
              max={10000}
              value={form.dailyUserLimit}
              onChange={(e) => update('dailyUserLimit', Number(e.target.value))}
            />
          </Field>
          <Field label="Token warning/day">
            <Input
              type="number"
              min={0}
              max={10000000}
              value={form.dailyTokenWarningLimit}
              onChange={(e) => update('dailyTokenWarningLimit', Number(e.target.value))}
            />
          </Field>
          <Field label="Fallback providers" hint="Thứ tự phụ, phân tách bằng dấu phẩy">
            <Input
              value={form.fallbackLlmProviders ?? ''}
              onChange={(e) => update('fallbackLlmProviders', e.target.value)}
              placeholder="openai,claude"
            />
          </Field>
          <Field label="Cache enabled">
            <label className="inline-flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.cacheEnabled}
                onChange={(e) => update('cacheEnabled', e.target.checked)}
              />
              Bật cache câu hỏi giống nhau
            </label>
          </Field>
        </div>
      </section>

      {/* Prompts */}
      <section className="border rounded-lg p-4 mb-4 bg-white">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Prompts</h2>
        <Field label="System prompt">
          <textarea
            rows={5}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={form.systemPrompt}
            onChange={(e) => update('systemPrompt', e.target.value)}
          />
        </Field>
        <div className="mt-3" />
        <Field
          label="Câu trả lời khi không có ngữ cảnh"
          hint="Dùng khi RAG không tìm được chunk phù hợp"
        >
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={form.fallbackAnswer ?? ''}
            onChange={(e) => update('fallbackAnswer', e.target.value)}
          />
        </Field>
        <div className="mt-3" />
        <Field
          label="Query expansion synonyms"
          hint='JSON object. Ví dụ: {"bảo hiểm tiền gửi":["deposit insurance","DIV","Bảo hiểm tiền gửi Việt Nam"]}'
        >
          <textarea
            rows={5}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
            value={form.queryExpansionSynonyms ?? '{}'}
            onChange={(e) => update('queryExpansionSynonyms', e.target.value)}
          />
        </Field>
      </section>

      {/* Widget */}
      <section className="border rounded-lg p-4 mb-4 bg-white">
        <h2 className="font-semibold text-sm text-gray-700 mb-3">Widget công khai</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kích hoạt widget trên website">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.widgetEnabled}
                onChange={(e) => update('widgetEnabled', e.target.checked)}
              />
              {form.widgetEnabled ? 'Đang bật' : 'Đang tắt'}
            </label>
          </Field>
          <Field label="Tiêu đề widget">
            <Input
              value={form.widgetTitle}
              onChange={(e) => update('widgetTitle', e.target.value)}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Lời chào">
              <Input
                value={form.widgetGreeting}
                onChange={(e) => update('widgetGreeting', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  )
}
