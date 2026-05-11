using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Mydoctor.Ai.Providers;
using Volo.Abp;
using Volo.Abp.DependencyInjection;

namespace Mydoctor.Ai.Providers;

public class OpenAiLlmProvider : ILlmProvider, ITransientDependency
{
    public string Name => "openai";

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<OpenAiLlmProvider> _logger;

    public OpenAiLlmProvider(HttpClient http, string apiKey, ILogger<OpenAiLlmProvider> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new BusinessException("Ai:Provider:MissingApiKey").WithData("provider", Name);

        var messages = new List<object>
        {
            new { role = "system", content = request.SystemPrompt }
        };
        foreach (var m in request.History)
        {
            messages.Add(new
            {
                role = m.Role == LlmRole.Assistant ? "assistant" : "user",
                content = m.Content
            });
        }
        messages.Add(new { role = "user", content = request.UserMessage });

        var body = new
        {
            model = request.Model,
            messages,
            temperature = request.Temperature,
            max_tokens = request.MaxOutputTokens
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var resp = await _http.SendAsync(req, cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("OpenAI LLM error {Status}: {Body}", resp.StatusCode, err);
            throw new BusinessException("Ai:Provider:UpstreamError").WithData("provider", Name).WithData("status", (int)resp.StatusCode);
        }
        using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = doc.RootElement;
        var text = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
        int? tokensIn = null, tokensOut = null;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("prompt_tokens", out var pi)) tokensIn = pi.GetInt32();
            if (usage.TryGetProperty("completion_tokens", out var po)) tokensOut = po.GetInt32();
        }
        return new LlmResponse(text, tokensIn, tokensOut, request.Model);
    }
}

public class OpenAiEmbeddingProvider : IEmbeddingProvider, ITransientDependency
{
    public string Name => "openai";
    public int Dimensions => AiConsts.EmbeddingDimensions;

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<OpenAiEmbeddingProvider> _logger;

    public OpenAiEmbeddingProvider(HttpClient http, string apiKey, ILogger<OpenAiEmbeddingProvider> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<EmbeddingResponse> EmbedAsync(EmbeddingRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new BusinessException("Ai:Provider:MissingApiKey").WithData("provider", Name);

        var body = new
        {
            model = request.Model,
            input = request.Text,
            dimensions = AiConsts.EmbeddingDimensions
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/embeddings")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var resp = await _http.SendAsync(req, cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("OpenAI Embedding error {Status}: {Body}", resp.StatusCode, err);
            throw new BusinessException("Ai:Provider:UpstreamError").WithData("provider", Name).WithData("status", (int)resp.StatusCode);
        }
        using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var arr = doc.RootElement.GetProperty("data")[0].GetProperty("embedding");
        var len = arr.GetArrayLength();
        var vec = new float[len];
        for (int i = 0; i < len; i++) vec[i] = arr[i].GetSingle();
        return new EmbeddingResponse(vec, request.Model);
    }
}
