using System;
using System.Diagnostics;
using System.Globalization;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Mydoctor.Ai.Dtos;
using Mydoctor.Ai.Providers;
using Mydoctor.Permissions;
using Volo.Abp;
using Volo.Abp.SettingManagement;

namespace Mydoctor.Ai;

[Authorize(MydoctorPermissions.Ai.Settings.Default)]
public class AiSettingAppService : MydoctorAppService, IAiSettingAppService
{
    private readonly ISettingManager _settingManager;
    private readonly IAiProviderFactory _providerFactory;

    public AiSettingAppService(ISettingManager settingManager, IAiProviderFactory providerFactory)
    {
        _settingManager = settingManager;
        _providerFactory = providerFactory;
    }

    public async Task<AiSettingsDto> GetAsync()
    {
        var llmProvider = await GetString(AiSettings.LlmProvider);
        var llmModel = AiModelDefaults.NormalizeLlmModel(
            llmProvider,
            await GetString(AiSettings.LlmModel));
        var embeddingProvider = await GetString(AiSettings.EmbeddingProvider);
        var embeddingModel = AiModelDefaults.NormalizeEmbeddingModel(
            embeddingProvider,
            await GetString(AiSettings.EmbeddingModel));

        return new AiSettingsDto
        {
            LlmProvider = llmProvider,
            EmbeddingProvider = embeddingProvider,
            LlmModel = llmModel,
            EmbeddingModel = embeddingModel,

            GeminiApiKey = AiMappers.Mask(await GetRaw(AiSettings.GeminiApiKey)),
            OpenAiApiKey = AiMappers.Mask(await GetRaw(AiSettings.OpenAiApiKey)),
            ClaudeApiKey = AiMappers.Mask(await GetRaw(AiSettings.ClaudeApiKey)),
            DeepSeekApiKey = AiMappers.Mask(await GetRaw(AiSettings.DeepSeekApiKey)),

            TopK = await GetInt(AiSettings.TopK, AiConsts.DefaultTopK),
            ChunkSize = await GetInt(AiSettings.ChunkSize, 1000),
            ChunkOverlap = await GetInt(AiSettings.ChunkOverlap, 150),
            Temperature = await GetDouble(AiSettings.Temperature, 0.2),
            MaxOutputTokens = await GetInt(AiSettings.MaxOutputTokens, 2048),
            CacheEnabled = await GetBool(AiSettings.CacheEnabled, true),
            CacheTtlDays = await GetInt(AiSettings.CacheTtlDays, 7),
            DailyAnonymousLimit = await GetInt(AiSettings.DailyAnonymousLimit, 50),
            DailyUserLimit = await GetInt(AiSettings.DailyUserLimit, 200),
            DailyTokenWarningLimit = await GetInt(AiSettings.DailyTokenWarningLimit, 100000),
            FallbackLlmProviders = await GetRaw(AiSettings.FallbackLlmProviders),

            SystemPrompt = await GetString(AiSettings.SystemPrompt),
            FallbackAnswer = await GetRaw(AiSettings.FallbackAnswer),
            QueryExpansionSynonyms = await GetRaw(AiSettings.QueryExpansionSynonyms),

            WidgetEnabled = await GetBool(AiSettings.WidgetEnabled, true),
            WidgetTitle = await GetString(AiSettings.WidgetTitle),
            WidgetGreeting = await GetString(AiSettings.WidgetGreeting)
        };
    }

    [Authorize(MydoctorPermissions.Ai.Settings.Edit)]
    public async Task UpdateAsync(UpdateAiSettingsDto input)
    {
        var llmProvider = input.LlmProvider?.Trim().ToLowerInvariant() ?? AiModelDefaults.GeminiProvider;
        var llmModel = AiModelDefaults.NormalizeLlmModel(llmProvider, input.LlmModel);
        var embeddingProvider = input.EmbeddingProvider?.Trim().ToLowerInvariant() ?? AiModelDefaults.GeminiProvider;
        var embeddingModel = AiModelDefaults.NormalizeEmbeddingModel(embeddingProvider, input.EmbeddingModel);

        await SetGlobal(AiSettings.LlmProvider, llmProvider);
        await SetGlobal(AiSettings.EmbeddingProvider, embeddingProvider);
        await SetGlobal(AiSettings.LlmModel, llmModel);
        await SetGlobal(AiSettings.EmbeddingModel, embeddingModel);

        // Only overwrite API keys when caller sends a non-null value.
        // null → keep; "" → clear; value starting with '•' → masked preview (keep).
        await MaybeSetSecret(AiSettings.GeminiApiKey, input.GeminiApiKey);
        await MaybeSetSecret(AiSettings.OpenAiApiKey, input.OpenAiApiKey);
        await MaybeSetSecret(AiSettings.ClaudeApiKey, input.ClaudeApiKey);
        await MaybeSetSecret(AiSettings.DeepSeekApiKey, input.DeepSeekApiKey);

        await SetGlobal(AiSettings.TopK, input.TopK.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.ChunkSize, input.ChunkSize.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.ChunkOverlap, input.ChunkOverlap.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.Temperature, input.Temperature.ToString("0.###", CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.MaxOutputTokens, input.MaxOutputTokens.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.CacheEnabled, input.CacheEnabled ? "true" : "false");
        await SetGlobal(AiSettings.CacheTtlDays, input.CacheTtlDays.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.DailyAnonymousLimit, input.DailyAnonymousLimit.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.DailyUserLimit, input.DailyUserLimit.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.DailyTokenWarningLimit, input.DailyTokenWarningLimit.ToString(CultureInfo.InvariantCulture));
        await SetGlobal(AiSettings.FallbackLlmProviders, input.FallbackLlmProviders ?? string.Empty);

        await SetGlobal(AiSettings.SystemPrompt, input.SystemPrompt);
        await SetGlobal(AiSettings.FallbackAnswer, input.FallbackAnswer ?? string.Empty);
        await SetGlobal(AiSettings.QueryExpansionSynonyms, NormalizeQueryExpansionSynonyms(input.QueryExpansionSynonyms));

        await SetGlobal(AiSettings.WidgetEnabled, input.WidgetEnabled ? "true" : "false");
        await SetGlobal(AiSettings.WidgetTitle, input.WidgetTitle);
        await SetGlobal(AiSettings.WidgetGreeting, input.WidgetGreeting);
    }

    public async Task<AiProviderStatusDto> TestProviderAsync(string provider, string? model = null)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var normalizedProvider = (provider ?? await SettingProvider.GetOrNullAsync(AiSettings.EmbeddingProvider) ?? AiModelDefaults.GeminiProvider)
                .Trim()
                .ToLowerInvariant();

            var configuredModel = string.IsNullOrWhiteSpace(model)
                ? null
                : model.Trim();
            var shouldTestLlm = ShouldTestLlm(normalizedProvider, configuredModel);

            if (shouldTestLlm)
            {
                var llm = await _providerFactory.GetLlmAsync(normalizedProvider);
                var configuredLlmModel = string.IsNullOrWhiteSpace(model)
                    ? await SettingProvider.GetOrNullAsync(AiSettings.LlmModel)
                    : model;
                var llmModel = AiModelDefaults.NormalizeLlmModel(normalizedProvider, configuredLlmModel);
                var llmResult = await llm.GenerateAsync(new LlmRequest(
                    Model: llmModel,
                    SystemPrompt: "Reply with OK.",
                    History: Array.Empty<LlmMessage>(),
                    UserMessage: "OK",
                    Temperature: 0,
                    MaxOutputTokens: 8));
                sw.Stop();
                return new AiProviderStatusDto
                {
                    Ok = true,
                    Message = $"OK - provider {normalizedProvider}, model {llmResult.Model}",
                    LatencyMs = (int)sw.ElapsedMilliseconds
                };
            }

            var embedder = await _providerFactory.GetEmbeddingAsync(normalizedProvider);
            var configuredEmbeddingModel = string.IsNullOrWhiteSpace(model)
                ? await SettingProvider.GetOrNullAsync(AiSettings.EmbeddingModel)
                : model;
            var embedModel = AiModelDefaults.NormalizeEmbeddingModel(normalizedProvider, configuredEmbeddingModel);
            var result = await embedder.EmbedAsync(new EmbeddingRequest(embedModel, "test"));
            sw.Stop();
            return new AiProviderStatusDto
            {
                Ok = true,
                Message = $"OK - {result.Vector.Length} dim, model {embedModel}",
                LatencyMs = (int)sw.ElapsedMilliseconds
            };
        }
        catch (BusinessException bex)
        {
            var status = bex.Data.Contains("status") ? $" (HTTP {bex.Data["status"]})" : string.Empty;
            var body = bex.Data.Contains("body") ? $" | {bex.Data["body"]}" : string.Empty;
            return new AiProviderStatusDto { Ok = false, Message = $"{bex.Code}{status}{body}", LatencyMs = (int)sw.ElapsedMilliseconds };
        }
        catch (Exception ex)
        {
            return new AiProviderStatusDto { Ok = false, Message = ex.Message, LatencyMs = (int)sw.ElapsedMilliseconds };
        }
    }

    private static bool ShouldTestLlm(string provider, string? model)
    {
        if (provider is AiModelDefaults.ClaudeProvider or AiModelDefaults.DeepSeekProvider) return true;
        if (string.IsNullOrWhiteSpace(model)) return false;

        return provider switch
        {
            AiModelDefaults.GeminiProvider => !model.StartsWith("gemini-embedding-", StringComparison.OrdinalIgnoreCase),
            AiModelDefaults.OpenAiProvider => !model.StartsWith("text-embedding-", StringComparison.OrdinalIgnoreCase),
            _ => false
        };
    }

    private async Task<string> GetString(string name)
        => await SettingProvider.GetOrNullAsync(name) ?? string.Empty;

    private async Task<string> GetRaw(string name)
        => await SettingProvider.GetOrNullAsync(name) ?? string.Empty;

    private async Task<int> GetInt(string name, int fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(name);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private async Task<double> GetDouble(string name, double fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(name);
        return double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private async Task<bool> GetBool(string name, bool fallback)
    {
        var raw = await SettingProvider.GetOrNullAsync(name);
        return bool.TryParse(raw, out var v) ? v : fallback;
    }

    private static string NormalizeQueryExpansionSynonyms(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return AiSettings.DefaultQueryExpansionSynonyms;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new BusinessException("Ai:Settings:InvalidQueryExpansionSynonyms");
            }

            return raw.Trim();
        }
        catch (JsonException ex)
        {
            throw new BusinessException("Ai:Settings:InvalidQueryExpansionSynonyms")
                .WithData("error", ex.Message);
        }
    }

    private async Task SetGlobal(string name, string value)
    {
        if (CurrentTenant.IsAvailable)
        {
            await _settingManager.SetForTenantAsync(CurrentTenant.Id!.Value, name, value);
        }
        else
        {
            await _settingManager.SetGlobalAsync(name, value);
        }
    }

    private async Task MaybeSetSecret(string name, string? incoming)
    {
        if (incoming == null) return;                // untouched
        if (IsMaskedSecret(incoming)) return;        // masked preview - keep existing
        await SetGlobal(name, incoming);             // "" clears; otherwise stores raw
    }

    private static bool IsMaskedSecret(string value)
        => value.Contains('*') ||
           value.Contains('•') ||
           value.Contains("â€¢", StringComparison.Ordinal);
}
