using Volo.Abp.Localization;
using Volo.Abp.Settings;
using Mydoctor.Localization;

namespace Mydoctor.Ai;

public class AiSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        context.Add(
            new SettingDefinition(AiSettings.LlmProvider, "gemini", L("Setting:Ai.LlmProvider")),
            new SettingDefinition(AiSettings.EmbeddingProvider, "gemini", L("Setting:Ai.EmbeddingProvider")),
            new SettingDefinition(AiSettings.LlmModel, AiModelDefaults.GeminiLlmModel, L("Setting:Ai.LlmModel")),
            new SettingDefinition(AiSettings.EmbeddingModel, AiModelDefaults.GeminiEmbeddingModel, L("Setting:Ai.EmbeddingModel")),

            new SettingDefinition(AiSettings.GeminiApiKey, "", L("Setting:Ai.GeminiApiKey"), isEncrypted: true),
            new SettingDefinition(AiSettings.OpenAiApiKey, "", L("Setting:Ai.OpenAiApiKey"), isEncrypted: true),
            new SettingDefinition(AiSettings.ClaudeApiKey, "", L("Setting:Ai.ClaudeApiKey"), isEncrypted: true),
            new SettingDefinition(AiSettings.DeepSeekApiKey, "", L("Setting:Ai.DeepSeekApiKey"), isEncrypted: true),

            new SettingDefinition(AiSettings.TopK, "6", L("Setting:Ai.TopK")),
            new SettingDefinition(AiSettings.ChunkSize, "1000", L("Setting:Ai.ChunkSize")),
            new SettingDefinition(AiSettings.ChunkOverlap, "150", L("Setting:Ai.ChunkOverlap")),
            new SettingDefinition(AiSettings.Temperature, "0.2", L("Setting:Ai.Temperature")),
            new SettingDefinition(AiSettings.MaxOutputTokens, "2048", L("Setting:Ai.MaxOutputTokens")),
            new SettingDefinition(AiSettings.CacheEnabled, "true", L("Setting:Ai.CacheEnabled")),
            new SettingDefinition(AiSettings.CacheTtlDays, "7", L("Setting:Ai.CacheTtlDays")),
            new SettingDefinition(AiSettings.DailyAnonymousLimit, "50", L("Setting:Ai.DailyAnonymousLimit")),
            new SettingDefinition(AiSettings.DailyUserLimit, "200", L("Setting:Ai.DailyUserLimit")),
            new SettingDefinition(AiSettings.DailyTokenWarningLimit, "100000", L("Setting:Ai.DailyTokenWarningLimit")),
            new SettingDefinition(AiSettings.FallbackLlmProviders, string.Empty, L("Setting:Ai.FallbackLlmProviders")),

            new SettingDefinition(AiSettings.SystemPrompt, AiSettings.DefaultSystemPrompt, L("Setting:Ai.SystemPrompt")),
            new SettingDefinition(AiSettings.FallbackAnswer, AiSettings.DefaultFallbackAnswer, L("Setting:Ai.FallbackAnswer")),
            new SettingDefinition(AiSettings.QueryExpansionSynonyms, AiSettings.DefaultQueryExpansionSynonyms, L("Setting:Ai.QueryExpansionSynonyms")),

            new SettingDefinition(AiSettings.WidgetEnabled, "true", L("Setting:Ai.WidgetEnabled")),
            new SettingDefinition(AiSettings.WidgetTitle, "Trợ lý Tri Thức Khỏe Sản", L("Setting:Ai.WidgetTitle")),
            new SettingDefinition(AiSettings.WidgetGreeting, "Xin chào! Tôi có thể giúp gì cho bạn?", L("Setting:Ai.WidgetGreeting"))
        );
    }

    private static LocalizableString L(string name)
        => LocalizableString.Create<MydoctorResource>(name);
}
