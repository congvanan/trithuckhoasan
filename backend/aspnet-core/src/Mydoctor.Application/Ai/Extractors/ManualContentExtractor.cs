using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp;

namespace Mydoctor.Ai;

public class ManualContentExtractor : IContentExtractor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public bool CanHandle(AiSourceType type) =>
        type is AiSourceType.Manual or AiSourceType.PlainText;

    public Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(source.ConfigJson))
            throw new BusinessException("Ai:Source:MissingConfig").WithData("sourceId", source.Id);

        SourceConfig? config;
        try { config = JsonSerializer.Deserialize<SourceConfig>(source.ConfigJson, JsonOptions); }
        catch (JsonException ex)
        {
            throw new BusinessException("Ai:Source:InvalidConfig")
                .WithData("sourceId", source.Id).WithData("reason", ex.Message);
        }

        if (config == null || string.IsNullOrWhiteSpace(config.Content))
            throw new BusinessException("Ai:Source:MissingContent").WithData("sourceId", source.Id);

        var title = string.IsNullOrWhiteSpace(config.Title) ? source.Name : config.Title;
        var payload = new ContentPayload(source.Id, title, config.Content, Url: config.Url);
        return Task.FromResult(new List<ContentPayload> { payload });
    }

    private sealed record SourceConfig(string? Title, string? Content, string? Url);
}
