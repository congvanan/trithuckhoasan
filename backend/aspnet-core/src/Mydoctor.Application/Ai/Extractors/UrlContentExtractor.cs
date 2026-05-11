using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Volo.Abp;

namespace Mydoctor.Ai;

public class UrlContentExtractor : IContentExtractor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<UrlContentExtractor> _logger;

    public UrlContentExtractor(IHttpClientFactory httpClientFactory, ILogger<UrlContentExtractor> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public bool CanHandle(AiSourceType type) => type == AiSourceType.Url;

    public async Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(source.ConfigJson))
            throw new BusinessException("Ai:Url:MissingConfig").WithData("sourceId", source.Id);

        SourceConfig? config;
        try { config = JsonSerializer.Deserialize<SourceConfig>(source.ConfigJson, JsonOptions); }
        catch (JsonException ex)
        {
            throw new BusinessException("Ai:Url:InvalidConfig")
                .WithData("sourceId", source.Id)
                .WithData("reason", ex.Message);
        }

        var url = NormalizeUrl(config?.Url);
        var html = await FetchHtmlAsync(url, ct);
        var title = string.IsNullOrWhiteSpace(config?.Title)
            ? ExtractTitle(html) ?? source.Name
            : config.Title.Trim();
        var text = ExtractReadableText(html, config?.ContentSelector);

        if (text.Length < 80)
        {
            throw new BusinessException("Ai:Url:EmptyContent")
                .WithData("sourceId", source.Id)
                .WithData("url", url);
        }

        return new List<ContentPayload>
        {
            new(source.Id, title, text, ExternalId: url, Url: url)
        };
    }

    private async Task<string> FetchHtmlAsync(string url, CancellationToken ct)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(45));

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Accept.ParseAdd("text/html,application/xhtml+xml,text/plain;q=0.8");
        request.Headers.UserAgent.ParseAdd("MydoctorRagBot/1.0");

        var http = _httpClientFactory.CreateClient("ai");
        using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token);

        if (!response.IsSuccessStatusCode)
        {
            throw new BusinessException("Ai:Url:FetchFailed")
                .WithData("status", (int)response.StatusCode)
                .WithData("url", url);
        }

        var mediaType = response.Content.Headers.ContentType?.MediaType;
        if (!string.IsNullOrWhiteSpace(mediaType) &&
            !mediaType.Contains("html", StringComparison.OrdinalIgnoreCase) &&
            !mediaType.Contains("text", StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessException("Ai:Url:UnsupportedContentType")
                .WithData("contentType", mediaType)
                .WithData("url", url);
        }

        var html = await response.Content.ReadAsStringAsync(timeoutCts.Token);
        _logger.LogInformation("Fetched URL source {Url} with {Length} characters.", url, html.Length);
        return html;
    }

    private static string NormalizeUrl(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            throw new BusinessException("Ai:Url:MissingUrl");

        if (!Uri.TryCreate(raw.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new BusinessException("Ai:Url:InvalidUrl").WithData("url", raw);
        }

        return uri.ToString();
    }

    private static string? ExtractTitle(string html)
    {
        var match = Regex.Match(html, @"<title[^>]*>(.*?)</title>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        if (!match.Success)
            return null;

        var title = WebUtility.HtmlDecode(StripTags(match.Groups[1].Value)).Trim();
        return string.IsNullOrWhiteSpace(title) ? null : title;
    }

    private static string ExtractReadableText(string html, string? contentSelector = null)
    {
        var articleHtml = string.IsNullOrWhiteSpace(contentSelector)
            ? ExtractMainContentHtml(html)
            : ExtractBySelector(html, contentSelector);
        var text = RemoveBoilerplate(articleHtml);

        text = Regex.Replace(text, @"<(br|hr)\s*/?>", "\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"</(p|div|section|article|li|h[1-6]|tr)>", "\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"<li[^>]*>", "- ", RegexOptions.IgnoreCase);
        text = StripTags(text);
        text = WebUtility.HtmlDecode(text);
        text = Regex.Replace(text, @"[ \t\f\v]+", " ");
        text = Regex.Replace(text, @"\s*\n\s*", "\n");
        text = Regex.Replace(text, @"\n{3,}", "\n\n");
        text = RemoveTrailingNonArticleSections(text);

        return text.Trim();
    }

    private static string ExtractBySelector(string html, string selector)
    {
        var normalized = selector.Trim();
        var matches = normalized[0] switch
        {
            '#' => FindBlocksByAttribute(html, "id", normalized[1..]),
            '.' => FindBlocksByAttribute(html, "class", normalized[1..]),
            _ => FindBlocks(html, normalized)
        };

        var blocks = matches.Where(x => !string.IsNullOrWhiteSpace(x)).ToList();
        if (blocks.Count == 0)
        {
            throw new BusinessException("Ai:Url:ContentSelectorNotFound")
                .WithData("selector", selector);
        }

        return string.Join("\n", blocks);
    }

    private static string ExtractMainContentHtml(string html)
    {
        var body = ExtractBody(html);
        var cleaned = RemoveBoilerplate(body);

        var accordionBodies = FindBlocksByAttribute(cleaned, "class", "accordion-body").ToList();
        if (accordionBodies.Count > 0)
        {
            var accordionHtml = string.Join("\n", accordionBodies);
            if (ScoreCandidate(accordionHtml) > 300)
            {
                return accordionHtml;
            }
        }

        var candidates = new List<string> { cleaned };

        candidates.AddRange(FindBlocks(cleaned, "article"));
        candidates.AddRange(FindBlocks(cleaned, "main"));
        candidates.AddRange(FindContentLikeBlocks(cleaned));

        return candidates
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => new { Html = x, Score = ScoreCandidate(x) })
            .OrderByDescending(x => x.Score)
            .First()
            .Html;
    }

    private static string ExtractBody(string html)
    {
        var match = Regex.Match(html, @"<body[^>]*>(.*?)</body>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        return match.Success ? match.Groups[1].Value : html;
    }

    private static IEnumerable<string> FindBlocks(string html, string tag)
    {
        if (!Regex.IsMatch(tag, @"^[a-zA-Z][a-zA-Z0-9-]*$"))
            return Array.Empty<string>();

        var pattern = $@"<\s*{tag}\b[^>]*>.*?<\s*/\s*{tag}\s*>";
        return Regex.Matches(html, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline)
            .Cast<Match>()
            .Select(m => m.Value);
    }

    private static IEnumerable<string> FindBlocksByAttribute(string html, string attribute, string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !Regex.IsMatch(value, @"^[a-zA-Z0-9_-]+$"))
            return Array.Empty<string>();

        var pattern =
            $@"<(?<tag>article|main|section|div)\b[^>]*\b{attribute}\s*=\s*[""'][^""']*\b{Regex.Escape(value)}\b[^""']*[""'][^>]*>.*?<\s*/\s*\k<tag>\s*>";

        if (attribute.Equals("id", StringComparison.OrdinalIgnoreCase))
        {
            pattern =
                $@"<(?<tag>article|main|section|div)\b[^>]*\bid\s*=\s*[""']{Regex.Escape(value)}[""'][^>]*>.*?<\s*/\s*\k<tag>\s*>";
        }

        return Regex.Matches(html, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline)
            .Cast<Match>()
            .Select(m => m.Value);
    }

    private static IEnumerable<string> FindContentLikeBlocks(string html)
    {
        const string positiveNames =
            "article|post|entry|detail|content|main|body|news|blog|single|accordion|collapse";
        var pattern =
            $@"<(?<tag>div|section)\b[^>]*(?:id|class)\s*=\s*[""'][^""']*(?:{positiveNames})[^""']*[""'][^>]*>.*?<\s*/\s*\k<tag>\s*>";

        return Regex.Matches(html, pattern, RegexOptions.IgnoreCase | RegexOptions.Singleline)
            .Cast<Match>()
            .Select(m => m.Value);
    }

    private static int ScoreCandidate(string html)
    {
        var text = WebUtility.HtmlDecode(StripTags(html));
        var wordCount = Regex.Matches(text, @"\p{L}+", RegexOptions.IgnoreCase).Count;
        var paragraphCount = Regex.Matches(html, @"<\s*p\b", RegexOptions.IgnoreCase).Count;
        var headingCount = Regex.Matches(html, @"<\s*h[1-6]\b", RegexOptions.IgnoreCase).Count;
        var positiveAttrCount = Regex.Matches(
            html,
            @"(?:id|class)\s*=\s*[""'][^""']*(article|post|entry|detail|content|main|body|news|blog|single|accordion|collapse)[^""']*[""']",
            RegexOptions.IgnoreCase).Count;
        var negativeAttrCount = Regex.Matches(
            html,
            @"(?:id|class)\s*=\s*[""'][^""']*(sidebar|related|recommend|popular|latest|menu|nav|footer|header|breadcrumb|comment|share|tag)[^""']*[""']",
            RegexOptions.IgnoreCase).Count;

        return wordCount + paragraphCount * 80 + headingCount * 120 + positiveAttrCount * 250 - negativeAttrCount * 350;
    }

    private static string RemoveBoilerplate(string html)
    {
        var text = Regex.Replace(
            html,
            @"<!--.*?-->",
            " ",
            RegexOptions.Singleline);

        text = Regex.Replace(
            text,
            @"<\s*(script|style|noscript|svg|head|nav|header|footer|aside|form|iframe)[^>]*>.*?<\s*/\s*\1\s*>",
            " ",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);

        text = Regex.Replace(
            text,
            @"<(?<tag>div|section|ul)\b[^>]*(?:id|class)\s*=\s*[""'][^""']*(sidebar|related|recommend|popular|latest|menu|nav|footer|header|breadcrumb|comment|share|tag|social)[^""']*[""'][^>]*>.*?<\s*/\s*\k<tag>\s*>",
            " ",
            RegexOptions.IgnoreCase | RegexOptions.Singleline);

        return text;
    }

    private static string RemoveTrailingNonArticleSections(string text)
    {
        var cutMarkers = new[]
        {
            @"(^|\n)\s*(\d+\.\s*)?Tài liệu tham khảo\s*(\n|$)",
            @"(^|\n)\s*(\d+\.\s*)?TLTK\s*[:\n]",
            @"(^|\n)\s*Từ khóa\s*:",
            @"(^|\n)\s*Bài viết liên quan\s*(\n|$)",
            @"(^|\n)\s*Tin liên quan\s*(\n|$)",
            @"(^|\n)\s*Có thể bạn quan tâm\s*(\n|$)",
            @"(^|\n)\s*Các bài viết khác\s*(\n|$)"
        };

        var earliestCut = text.Length;
        foreach (var marker in cutMarkers)
        {
            var match = Regex.Match(text, marker, RegexOptions.IgnoreCase);
            if (match.Success && match.Index > 200)
            {
                earliestCut = Math.Min(earliestCut, match.Index);
            }
        }

        if (earliestCut < text.Length)
        {
            text = text[..earliestCut];
        }

        // Remove table-of-contents lines that only duplicate section titles.
        text = Regex.Replace(
            text,
            @"(^|\n)\s*Nội dung chính\s*(-\s*[^\n]+)+",
            "\n",
            RegexOptions.IgnoreCase);

        return Regex.Replace(text, @"\n{3,}", "\n\n").Trim();
    }

    private static string StripTags(string value) =>
        Regex.Replace(value, "<[^>]+>", " ");

    private sealed record SourceConfig(string? Url, string? Title, string? ContentSelector);
}
