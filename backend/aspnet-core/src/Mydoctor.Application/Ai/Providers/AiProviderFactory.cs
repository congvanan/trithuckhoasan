using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Mydoctor.Ai.Providers;
using Volo.Abp;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Settings;

namespace Mydoctor.Ai.Providers;

public class AiProviderFactory : IAiProviderFactory, ITransientDependency
{
    private readonly ISettingProvider _settingProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILoggerFactory _loggerFactory;

    public AiProviderFactory(
        ISettingProvider settingProvider,
        IHttpClientFactory httpClientFactory,
        ILoggerFactory loggerFactory)
    {
        _settingProvider = settingProvider;
        _httpClientFactory = httpClientFactory;
        _loggerFactory = loggerFactory;
    }

    public async Task<ILlmProvider> GetLlmAsync(string? provider = null)
    {
        var name = (provider ?? await _settingProvider.GetOrNullAsync(AiSettings.LlmProvider) ?? "gemini").ToLowerInvariant();
        return name switch
        {
            "gemini" => new GeminiLlmProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.GeminiApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<GeminiLlmProvider>()),
            "openai" => new OpenAiLlmProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.OpenAiApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<OpenAiLlmProvider>()),
            "claude" => new ClaudeLlmProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.ClaudeApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<ClaudeLlmProvider>()),
            "deepseek" => new DeepSeekLlmProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.DeepSeekApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<DeepSeekLlmProvider>()),
            _ => throw new BusinessException("Ai:Provider:Unknown").WithData("provider", name)
        };
    }

    public async Task<IEmbeddingProvider> GetEmbeddingAsync(string? provider = null)
    {
        var name = (provider ?? await _settingProvider.GetOrNullAsync(AiSettings.EmbeddingProvider) ?? "gemini").ToLowerInvariant();
        return name switch
        {
            "gemini" => new GeminiEmbeddingProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.GeminiApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<GeminiEmbeddingProvider>()),
            "openai" => new OpenAiEmbeddingProvider(
                _httpClientFactory.CreateClient("ai"),
                await _settingProvider.GetOrNullAsync(AiSettings.OpenAiApiKey) ?? string.Empty,
                _loggerFactory.CreateLogger<OpenAiEmbeddingProvider>()),
            _ => throw new BusinessException("Ai:Provider:Unknown").WithData("provider", name)
        };
    }
}
