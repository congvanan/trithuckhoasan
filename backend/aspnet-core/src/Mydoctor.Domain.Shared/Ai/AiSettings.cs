namespace Mydoctor.Ai;

/// <summary>
/// Setting keys for the AI / RAG subsystem. Consumed by <c>ISettingManager</c>,
/// the setting definition provider, and encryption helpers for API keys.
/// </summary>
public static class AiSettings
{
    private const string Prefix = "Mydoctor.Ai.";

    public const string LlmProvider = Prefix + "LlmProvider";
    public const string EmbeddingProvider = Prefix + "EmbeddingProvider";
    public const string LlmModel = Prefix + "LlmModel";
    public const string EmbeddingModel = Prefix + "EmbeddingModel";

    public const string GeminiApiKey = Prefix + "GeminiApiKey";
    public const string OpenAiApiKey = Prefix + "OpenAiApiKey";
    public const string ClaudeApiKey = Prefix + "ClaudeApiKey";
    public const string DeepSeekApiKey = Prefix + "DeepSeekApiKey";

    public const string TopK = Prefix + "TopK";
    public const string ChunkSize = Prefix + "ChunkSize";
    public const string ChunkOverlap = Prefix + "ChunkOverlap";
    public const string Temperature = Prefix + "Temperature";
    public const string MaxOutputTokens = Prefix + "MaxOutputTokens";
    public const string CacheEnabled = Prefix + "CacheEnabled";
    public const string CacheTtlDays = Prefix + "CacheTtlDays";
    public const string DailyAnonymousLimit = Prefix + "DailyAnonymousLimit";
    public const string DailyUserLimit = Prefix + "DailyUserLimit";
    public const string DailyTokenWarningLimit = Prefix + "DailyTokenWarningLimit";
    public const string FallbackLlmProviders = Prefix + "FallbackLlmProviders";

    public const string SystemPrompt = Prefix + "SystemPrompt";
    public const string FallbackAnswer = Prefix + "FallbackAnswer";
    public const string QueryExpansionSynonyms = Prefix + "QueryExpansionSynonyms";

    public const string WidgetEnabled = Prefix + "WidgetEnabled";
    public const string WidgetTitle = Prefix + "WidgetTitle";
    public const string WidgetGreeting = Prefix + "WidgetGreeting";

    public const string DefaultSystemPrompt =
        "Bạn là trợ lý y tế của website Tri Thức Khỏe Sản. " +
        "Chỉ trả lời dựa trên ngữ cảnh (context) được cung cấp. " +
        "Nếu không tìm thấy thông tin trong ngữ cảnh, hãy trả lời lịch sự rằng bạn chưa có dữ liệu. " +
        "Trích dẫn nguồn bằng số thứ tự [1], [2] sau mỗi ý. Trả lời bằng tiếng Việt.";

    public const string DefaultFallbackAnswer =
        "Xin lỗi, hiện tôi chưa có thông tin phù hợp trong kho kiến thức để trả lời câu hỏi này.";
    public const string DefaultQueryExpansionSynonyms = "{}";
}
