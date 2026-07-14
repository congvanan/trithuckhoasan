using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.CmsKit.Blogs;

namespace Mydoctor.Ai;

public class CmsBlogPostExtractor : IContentExtractor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IRepository<BlogPost, Guid> _blogPostRepository;
    private readonly IAsyncQueryableExecuter _asyncExecuter;

    public CmsBlogPostExtractor(
        IRepository<BlogPost, Guid> blogPostRepository,
        IAsyncQueryableExecuter asyncExecuter)
    {
        _blogPostRepository = blogPostRepository;
        _asyncExecuter = asyncExecuter;
    }

    public bool CanHandle(AiSourceType type) => type == AiSourceType.CmsBlogPost;

    public async Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default)
    {
        var config = ParseConfig(source);
        var query = await _blogPostRepository.GetQueryableAsync();
        var selectedById = config.EntityId.HasValue;

        if (selectedById)
        {
            var entityId = config.EntityId!.Value;
            query = query.Where(x => x.Id == entityId);
        }
        else if (!string.IsNullOrWhiteSpace(config.Slug))
            query = query.Where(x => x.Slug == config.Slug);
        else
            throw new BusinessException("Ai:Source:MissingCmsSelector")
                .WithData("sourceType", source.Type.ToString());

        var posts = await _asyncExecuter.ToListAsync(query, ct);
        if (posts.Count == 0)
            throw new BusinessException("Ai:Source:CmsContentNotFound")
                .WithData("sourceType", source.Type.ToString());
        if (!selectedById && posts.Count > 1)
            throw new BusinessException("Ai:Source:CmsSelectorAmbiguous")
                .WithData("sourceType", source.Type.ToString())
                .WithData("slug", config.Slug!)
                .WithData("matchCount", posts.Count);

        return posts
            .Where(x => !string.IsNullOrWhiteSpace(x.Content))
            .Select(x => new ContentPayload(
                source.Id,
                x.Title,
                BuildText(x.ShortDescription, x.Content),
                x.Id.ToString(),
                $"/blog/{x.Slug}",
                Sections: BuildSections(x.ShortDescription, x.Content)))
            .ToList();
    }

    private static List<ContentSection>? BuildSections(string? summary, string? html)
    {
        var sections = HtmlSectionParser.Parse(html);
        if (sections == null) return null;

        var desc = ExtractSummaryText(summary);
        if (!string.IsNullOrWhiteSpace(desc))
            sections.Insert(0, new ContentSection(null, desc));
        return sections;
    }

    private static string? ExtractSummaryText(string? summary)
    {
        if (string.IsNullOrWhiteSpace(summary)) return null;
        // shortDescription theo convention "coverImageUrl|mô tả thực" (parseCoverImage.ts) —
        // chỉ lấy phần mô tả, không embed URL ảnh
        var idx = summary.IndexOf('|');
        var desc = (idx >= 0 ? summary[(idx + 1)..] : summary).Trim();
        return desc.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? null : desc;
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
        if (!string.IsNullOrWhiteSpace(cfg.BlogPostId) && Guid.TryParse(cfg.BlogPostId, out var pid))
            entityId = pid;

        return cfg with { EntityId = entityId, Slug = cfg.Slug?.Trim() };
    }

    private static string BuildText(string? summary, string? html)
    {
        var parts = new[] { summary, HtmlSectionParser.HtmlToText(html) }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim());
        var text = string.Join(Environment.NewLine + Environment.NewLine, parts);
        if (string.IsNullOrWhiteSpace(text))
            throw new BusinessException("Ai:Source:MissingContent");
        return text;
    }

    private sealed record CmsConfig(string? BlogPostId, string? Slug, Guid? EntityId = null);
}
