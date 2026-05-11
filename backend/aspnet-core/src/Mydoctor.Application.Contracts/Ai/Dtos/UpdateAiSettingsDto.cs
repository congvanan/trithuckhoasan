namespace Mydoctor.Ai.Dtos;

public class UpdateAiSettingsDto
{
    public string LlmProvider { get; set; } = default!;
    public string EmbeddingProvider { get; set; } = default!;
    public string LlmModel { get; set; } = default!;
    public string EmbeddingModel { get; set; } = default!;

    /// <summary>Plain value or null to keep unchanged. Empty string "" clears the key.</summary>
    public string? GeminiApiKey { get; set; }
    public string? OpenAiApiKey { get; set; }
    public string? ClaudeApiKey { get; set; }
    public string? DeepSeekApiKey { get; set; }

    public int TopK { get; set; }
    public int ChunkSize { get; set; }
    public int ChunkOverlap { get; set; }
    public double Temperature { get; set; }
    public int MaxOutputTokens { get; set; }
    public bool CacheEnabled { get; set; }
    public int CacheTtlDays { get; set; }
    public int DailyAnonymousLimit { get; set; }
    public int DailyUserLimit { get; set; }
    public int DailyTokenWarningLimit { get; set; }
    public string? FallbackLlmProviders { get; set; }

    public string SystemPrompt { get; set; } = default!;
    public string? FallbackAnswer { get; set; }
    public string? QueryExpansionSynonyms { get; set; }

    public bool WidgetEnabled { get; set; }
    public string WidgetTitle { get; set; } = default!;
    public string WidgetGreeting { get; set; } = default!;
}
