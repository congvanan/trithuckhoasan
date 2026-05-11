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

public class DeepSeekLlmProvider : ILlmProvider, ITransientDependency
{
    public string Name => "deepseek";

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<DeepSeekLlmProvider> _logger;

    public DeepSeekLlmProvider(HttpClient http, string apiKey, ILogger<DeepSeekLlmProvider> logger)
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

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.deepseek.com/chat/completions")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using var resp = await _http.SendAsync(req, cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("DeepSeek LLM error {Status}: {Body}", resp.StatusCode, err);
            var snippet = err.Length > 500 ? err[..500] : err;
            throw new BusinessException("Ai:Provider:UpstreamError")
                .WithData("provider", Name)
                .WithData("status", (int)resp.StatusCode)
                .WithData("body", snippet);
        }

        using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = doc.RootElement;
        var text = root.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? string.Empty;
        int? tokensIn = null;
        int? tokensOut = null;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("prompt_tokens", out var pi)) tokensIn = pi.GetInt32();
            if (usage.TryGetProperty("completion_tokens", out var po)) tokensOut = po.GetInt32();
        }

        return new LlmResponse(text, tokensIn, tokensOut, request.Model);
    }
}
