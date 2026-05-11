namespace Mydoctor.Ai;

public static class AiModelDefaults
{
    public const string GeminiProvider = "gemini";
    public const string OpenAiProvider = "openai";
    public const string ClaudeProvider = "claude";
    public const string DeepSeekProvider = "deepseek";

    public const string GeminiLlmModel = "gemini-2.5-flash";
    public const string OpenAiLlmModel = "gpt-4o-mini";
    public const string ClaudeLlmModel = "claude-3-5-haiku-latest";
    public const string DeepSeekLlmModel = "deepseek-v4-flash";
    public const string GeminiEmbeddingModel = "gemini-embedding-001";
    public const string OpenAiEmbeddingModel = "text-embedding-3-small";

    public static string NormalizeLlmModel(string? provider, string? model)
    {
        var normalizedProvider = (provider ?? string.Empty).Trim().ToLowerInvariant();
        var normalizedModel = (model ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(normalizedModel))
        {
            return normalizedProvider switch
            {
                OpenAiProvider => OpenAiLlmModel,
                ClaudeProvider => ClaudeLlmModel,
                DeepSeekProvider => DeepSeekLlmModel,
                _ => GeminiLlmModel
            };
        }

        return normalizedProvider switch
        {
            GeminiProvider when normalizedModel.StartsWith("gpt-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("claude-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("deepseek-", System.StringComparison.OrdinalIgnoreCase)
                => GeminiLlmModel,
            OpenAiProvider when normalizedModel.StartsWith("gemini-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("claude-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("deepseek-", System.StringComparison.OrdinalIgnoreCase)
                => OpenAiLlmModel,
            ClaudeProvider when normalizedModel.StartsWith("gemini-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("gpt-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("deepseek-", System.StringComparison.OrdinalIgnoreCase)
                => ClaudeLlmModel,
            DeepSeekProvider when normalizedModel.StartsWith("gemini-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("gpt-", System.StringComparison.OrdinalIgnoreCase)
                || normalizedModel.StartsWith("claude-", System.StringComparison.OrdinalIgnoreCase)
                => DeepSeekLlmModel,
            _ => normalizedModel
        };
    }

    public static string NormalizeEmbeddingModel(string? provider, string? model)
    {
        var normalizedProvider = (provider ?? string.Empty).Trim().ToLowerInvariant();
        var normalizedModel = (model ?? string.Empty).Trim();

        return normalizedProvider switch
        {
            GeminiProvider => normalizedModel is GeminiEmbeddingModel
                ? normalizedModel
                : GeminiEmbeddingModel,
            OpenAiProvider => string.IsNullOrWhiteSpace(normalizedModel) || normalizedModel.StartsWith("gemini-", System.StringComparison.OrdinalIgnoreCase)
                ? OpenAiEmbeddingModel
                : normalizedModel,
            _ => string.IsNullOrWhiteSpace(normalizedModel) ? GeminiEmbeddingModel : normalizedModel
        };
    }
}
