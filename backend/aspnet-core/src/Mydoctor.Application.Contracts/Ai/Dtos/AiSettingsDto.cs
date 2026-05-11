namespace Mydoctor.Ai.Dtos;

/// <summary>
/// Grouped AI configuration settings surfaced to the admin UI.
/// Keys map to constants in <see cref="AiSettings"/>.
/// </summary>
public class AiSettingsDto
{
    // Provider selection
    public string LlmProvider { get; set; } = "gemini";
    public string EmbeddingProvider { get; set; } = "gemini";

    // Model IDs
    public string LlmModel { get; set; } = "gemini-2.5-flash";
    public string EmbeddingModel { get; set; } = "gemini-embedding-001";

    // API keys — returned as masked strings in GET responses
    public string? GeminiApiKey { get; set; }
    public string? OpenAiApiKey { get; set; }
    public string? ClaudeApiKey { get; set; }
    public string? DeepSeekApiKey { get; set; }

    // RAG tuning
    public int TopK { get; set; } = 6;
    public int ChunkSize { get; set; } = 1000;
    public int ChunkOverlap { get; set; } = 150;
    public double Temperature { get; set; } = 0.2;
    public int MaxOutputTokens { get; set; } = 2048;
    public bool CacheEnabled { get; set; } = true;
    public int CacheTtlDays { get; set; } = 7;
    public int DailyAnonymousLimit { get; set; } = 50;
    public int DailyUserLimit { get; set; } = 200;
    public int DailyTokenWarningLimit { get; set; } = 100000;
    public string? FallbackLlmProviders { get; set; } = string.Empty;

    // Prompts
    public string SystemPrompt { get; set; } = default!;
    public string? FallbackAnswer { get; set; }
    public string QueryExpansionSynonyms { get; set; } = "{}";

    // Widget
    public bool WidgetEnabled { get; set; } = true;
    public string WidgetTitle { get; set; } = "Trợ lý Tri Thức Khỏe Sản";
    public string WidgetGreeting { get; set; } = "Xin chào! Tôi có thể giúp gì cho bạn?";
}
