using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.CmsKit.Pages;

namespace Mydoctor.Ai;

public class CmsPageExtractor : IContentExtractor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<Page, Guid> _pageRepository;
    private readonly IAsyncQueryableExecuter _asyncExecuter;

    public CmsPageExtractor(
        IRepository<Page, Guid> pageRepository,
        IAsyncQueryableExecuter asyncExecuter)
    {
        _pageRepository = pageRepository;
        _asyncExecuter = asyncExecuter;
    }

    public bool CanHandle(AiSourceType type) => type == AiSourceType.CmsPage;

    public async Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default)
    {
        var config = ParseConfig(source);
        var query = await _pageRepository.GetQueryableAsync();

        if (config.EntityId.HasValue)
            query = query.Where(x => x.Id == config.EntityId.Value);
        else if (!string.IsNullOrWhiteSpace(config.Slug))
            query = query.Where(x => x.Slug == config.Slug);
        else
            throw new BusinessException("Ai:Source:MissingCmsSelector")
                .WithData("sourceType", source.Type.ToString());

        var pages = await _asyncExecuter.ToListAsync(query, ct);
        if (pages.Count == 0)
            throw new BusinessException("Ai:Source:CmsContentNotFound")
                .WithData("sourceType", source.Type.ToString());

        return pages
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .Select(x => new ContentPayload(
                source.Id,
                x.Title,
                CmsBlogPostExtractor.StripHtml(x.Content),
                x.Id.ToString(),
                $"/{x.Slug}"))
            .ToList();
    }

    private static CmsConfig ParseConfig(AiSource source)
    {
        if (string.IsNullOrWhiteSpace(source.ConfigJson))
            throw new BusinessException("Ai:Source:MissingConfig").WithData("sourceId", source.Id);

        CmsConfig? cfg;
        try { cfg = JsonSerializer.Deserialize<CmsConfig>(source.ConfigJson, JsonOptions); }
        catch (JsonException ex)
        {
            throw new BusinessException("Ai:Source:InvalidConfig")
                .WithData("sourceId", source.Id).WithData("reason", ex.Message);
        }
        if (cfg == null)
            throw new BusinessException("Ai:Source:InvalidConfig").WithData("sourceId", source.Id);

        Guid? entityId = null;
        if (!string.IsNullOrWhiteSpace(cfg.PageId) && Guid.TryParse(cfg.PageId, out var pid))
            entityId = pid;

        return cfg with { EntityId = entityId, Slug = cfg.Slug?.Trim() };
    }

    private sealed record CmsConfig(string? PageId, string? Slug, Guid? EntityId = null);
}
