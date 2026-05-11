using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Mydoctor.Ai.Providers;
using Volo.Abp;
using Volo.Abp.DependencyInjection;

namespace Mydoctor.Ai.Providers;

internal static class GeminiApi
{
    public const string Version = "v1beta";
    public const string BaseUrl = $"https://generativelanguage.googleapis.com/{Version}";
}

public class GeminiLlmProvider : ILlmProvider, ITransientDependency
{
    public string Name => "gemini";
    private const int MaxRetries = 3;
    private static readonly TimeSpan DefaultRetryDelay = TimeSpan.FromSeconds(5);

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<GeminiLlmProvider> _logger;

    public GeminiLlmProvider(HttpClient http, string apiKey, ILogger<GeminiLlmProvider> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new BusinessException("Ai:Provider:MissingApiKey").WithData("provider", Name);

        var contents = new List<object>();
        foreach (var m in request.History)
        {
            contents.Add(new
            {
                role = m.Role == LlmRole.Assistant ? "model" : "user",
                parts = new[] { new { text = m.Content } }
            });
        }
        contents.Add(new
        {
            role = "user",
            parts = new[] { new { text = request.UserMessage } }
        });

        var body = new
        {
            systemInstruction = new { role = "system", parts = new[] { new { text = request.SystemPrompt } } },
            contents,
            generationConfig = new
            {
                temperature = request.Temperature,
                maxOutputTokens = request.MaxOutputTokens
            }
        };

        var url = $"{GeminiApi.BaseUrl}/models/{Uri.EscapeDataString(request.Model)}:generateContent?key={Uri.EscapeDataString(_apiKey)}";
        for (var attempt = 1; attempt <= MaxRetries + 1; attempt++)
        {
            using var resp = await _http.PostAsJsonAsync(url, body, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(cancellationToken);
                if (ShouldRetry(resp) && attempt <= MaxRetries)
                {
                    var delay = GetRetryDelay(resp, err);
                    _logger.LogWarning(
                        "Gemini LLM transient error {Status} on attempt {Attempt}/{MaxAttempts}. Waiting {DelayMs} ms before retry. Body: {Body}",
                        resp.StatusCode,
                        attempt,
                        MaxRetries + 1,
                        (int)delay.TotalMilliseconds,
                        err);
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                _logger.LogWarning("Gemini LLM error {Status}: {Body}", resp.StatusCode, err);
                var snippet = err.Length > 300 ? err[..300] : err;
                throw new BusinessException("Ai:Provider:UpstreamError")
                    .WithData("provider", Name)
                    .WithData("status", (int)resp.StatusCode)
                    .WithData("body", snippet);
            }

            using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
            var root = doc.RootElement;

            string text = string.Empty;
            string? finishReason = null;
            if (root.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var first = candidates[0];
                if (first.TryGetProperty("finishReason", out var reason))
                {
                    finishReason = reason.GetString();
                }
                if (first.TryGetProperty("content", out var content) && content.TryGetProperty("parts", out var parts))
                {
                    foreach (var p in parts.EnumerateArray())
                    {
                        if (p.TryGetProperty("text", out var t)) text += t.GetString();
                    }
                }
            }
            int? tokensIn = null, tokensOut = null;
            if (root.TryGetProperty("usageMetadata", out var usage))
            {
                if (usage.TryGetProperty("promptTokenCount", out var pi)) tokensIn = pi.GetInt32();
                if (usage.TryGetProperty("candidatesTokenCount", out var po)) tokensOut = po.GetInt32();
            }
            return new LlmResponse(text, tokensIn, tokensOut, request.Model, finishReason);
        }

        throw new BusinessException("Ai:Provider:UpstreamError").WithData("provider", Name);
    }

    private static bool ShouldRetry(HttpResponseMessage response)
        => (int)response.StatusCode is 429 or 500 or 502 or 503 or 504;

    private static TimeSpan GetRetryDelay(HttpResponseMessage response, string errorBody)
    {
        if (response.Headers.RetryAfter?.Delta is TimeSpan headerDelta && headerDelta > TimeSpan.Zero)
            return headerDelta;

        try
        {
            using var doc = JsonDocument.Parse(errorBody);
            if (doc.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("details", out var details))
            {
                foreach (var detail in details.EnumerateArray())
                {
                    if (detail.TryGetProperty("retryDelay", out var retryDelay))
                    {
                        var raw = retryDelay.GetString();
                        if (!string.IsNullOrWhiteSpace(raw) &&
                            raw.EndsWith("s", StringComparison.OrdinalIgnoreCase) &&
                            double.TryParse(raw[..^1], NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds) &&
                            seconds > 0)
                        {
                            return TimeSpan.FromSeconds(seconds);
                        }
                    }
                }
            }
        }
        catch (JsonException)
        {
        }

        return DefaultRetryDelay;
    }
}

public class GeminiEmbeddingProvider : IEmbeddingProvider, ITransientDependency
{
    public string Name => "gemini";
    public int Dimensions => AiConsts.EmbeddingDimensions;
    private const int MaxRetries = 3;
    private static readonly TimeSpan DefaultRetryDelay = TimeSpan.FromSeconds(5);

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<GeminiEmbeddingProvider> _logger;

    public GeminiEmbeddingProvider(HttpClient http, string apiKey, ILogger<GeminiEmbeddingProvider> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<EmbeddingResponse> EmbedAsync(EmbeddingRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new BusinessException("Ai:Provider:MissingApiKey").WithData("provider", Name);

        var url = $"{GeminiApi.BaseUrl}/models/{Uri.EscapeDataString(request.Model)}:embedContent?key={Uri.EscapeDataString(_apiKey)}";
        var body = new
        {
            content = new { parts = new[] { new { text = request.Text } } },
            output_dimensionality = Dimensions
        };
        for (var attempt = 1; attempt <= MaxRetries + 1; attempt++)
        {
            using var resp = await _http.PostAsJsonAsync(url, body, cancellationToken);
            if (resp.IsSuccessStatusCode)
            {
                using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
                using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
                var values = doc.RootElement.GetProperty("embedding").GetProperty("values");
                var len = values.GetArrayLength();
                var vec = new float[len];
                for (int i = 0; i < len; i++) vec[i] = values[i].GetSingle();
                if (vec.Length != Dimensions)
                    throw new BusinessException("Ai:Provider:UnexpectedEmbeddingDimensions")
                        .WithData("provider", Name)
                        .WithData("expected", Dimensions)
                        .WithData("actual", vec.Length)
                        .WithData("model", request.Model);
                return new EmbeddingResponse(vec, request.Model);
            }

            var err = await resp.Content.ReadAsStringAsync(cancellationToken);
            if ((int)resp.StatusCode == 429 && attempt <= MaxRetries)
            {
                var delay = GetRetryDelay(resp, err);
                _logger.LogWarning(
                    "Gemini Embedding rate-limited on attempt {Attempt}/{MaxAttempts}. Waiting {DelayMs} ms before retry. Body: {Body}",
                    attempt,
                    MaxRetries + 1,
                    (int)delay.TotalMilliseconds,
                    err);
                await Task.Delay(delay, cancellationToken);
                continue;
            }

            _logger.LogWarning("Gemini Embedding error {Status}: {Body}", resp.StatusCode, err);
            var snippet = err.Length > 300 ? err[..300] : err;
            throw new BusinessException("Ai:Provider:UpstreamError")
                .WithData("provider", Name)
                .WithData("status", (int)resp.StatusCode)
                .WithData("body", snippet);
        }

        throw new BusinessException("Ai:Provider:UpstreamError").WithData("provider", Name).WithData("status", 429);
    }

    private static TimeSpan GetRetryDelay(HttpResponseMessage response, string errorBody)
    {
        if (response.Headers.RetryAfter?.Delta is TimeSpan headerDelta && headerDelta > TimeSpan.Zero)
            return headerDelta;

        try
        {
            using var doc = JsonDocument.Parse(errorBody);
            if (doc.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("details", out var details))
            {
                foreach (var detail in details.EnumerateArray())
                {
                    if (detail.TryGetProperty("retryDelay", out var retryDelay))
                    {
                        var raw = retryDelay.GetString();
                        if (!string.IsNullOrWhiteSpace(raw) &&
                            raw.EndsWith("s", StringComparison.OrdinalIgnoreCase) &&
                            double.TryParse(raw[..^1], NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds) &&
                            seconds > 0)
                        {
                            return TimeSpan.FromSeconds(seconds);
                        }
                    }
                }
            }
        }
        catch (JsonException)
        {
        }

        return DefaultRetryDelay;
    }
}
