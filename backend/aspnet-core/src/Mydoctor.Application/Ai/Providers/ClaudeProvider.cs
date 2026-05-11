using System;
using System.Collections.Generic;
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

public class ClaudeLlmProvider : ILlmProvider, ITransientDependency
{
    public string Name => "claude";

    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly ILogger<ClaudeLlmProvider> _logger;

    public ClaudeLlmProvider(HttpClient http, string apiKey, ILogger<ClaudeLlmProvider> logger)
    {
        _http = http;
        _apiKey = apiKey;
        _logger = logger;
    }

    public async Task<LlmResponse> GenerateAsync(LlmRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            throw new BusinessException("Ai:Provider:MissingApiKey").WithData("provider", Name);

        var messages = new List<object>();
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
            system = request.SystemPrompt,
            messages,
            temperature = request.Temperature,
            max_tokens = request.MaxOutputTokens
        };

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(body)
        };
        req.Headers.Add("x-api-key", _apiKey);
        req.Headers.Add("anthropic-version", "2023-06-01");

        using var resp = await _http.SendAsync(req, cancellationToken);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Claude error {Status}: {Body}", resp.StatusCode, err);
            throw new BusinessException("Ai:Provider:UpstreamError").WithData("provider", Name).WithData("status", (int)resp.StatusCode);
        }
        using var stream = await resp.Content.ReadAsStreamAsync(cancellationToken);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = doc.RootElement;
        string text = string.Empty;
        if (root.TryGetProperty("content", out var content))
        {
            foreach (var block in content.EnumerateArray())
            {
                if (block.TryGetProperty("type", out var t) && t.GetString() == "text" &&
                    block.TryGetProperty("text", out var bt))
                {
                    text += bt.GetString();
                }
            }
        }
        int? tokensIn = null, tokensOut = null;
        if (root.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("input_tokens", out var pi)) tokensIn = pi.GetInt32();
            if (usage.TryGetProperty("output_tokens", out var po)) tokensOut = po.GetInt32();
        }
        return new LlmResponse(text, tokensIn, tokensOut, request.Model);
    }
}
