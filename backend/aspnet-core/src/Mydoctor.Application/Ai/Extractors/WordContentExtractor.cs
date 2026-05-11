using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;
using Volo.Abp;

namespace Mydoctor.Ai;

public class WordContentExtractor : IContentExtractor
{
    private const int MaxDocxBytes = 20 * 1024 * 1024;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public bool CanHandle(AiSourceType type) => type == AiSourceType.Word;

    public Task<List<ContentPayload>> ExtractAsync(AiSource source, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(source.ConfigJson))
            throw new BusinessException("Ai:Word:MissingConfig").WithData("sourceId", source.Id);

        SourceConfig? config;
        try { config = JsonSerializer.Deserialize<SourceConfig>(source.ConfigJson, JsonOptions); }
        catch (JsonException ex)
        {
            throw new BusinessException("Ai:Word:InvalidConfig")
                .WithData("sourceId", source.Id)
                .WithData("reason", ex.Message);
        }

        if (config == null || string.IsNullOrWhiteSpace(config.Base64))
            throw new BusinessException("Ai:Word:MissingFile").WithData("sourceId", source.Id);

        byte[] bytes;
        try { bytes = Convert.FromBase64String(config.Base64); }
        catch (FormatException ex)
        {
            throw new BusinessException("Ai:Word:InvalidBase64")
                .WithData("sourceId", source.Id)
                .WithData("reason", ex.Message);
        }

        if (bytes.Length == 0 || bytes.Length > MaxDocxBytes)
        {
            throw new BusinessException("Ai:Word:InvalidFileSize")
                .WithData("sourceId", source.Id)
                .WithData("maxBytes", MaxDocxBytes);
        }

        var fileName = string.IsNullOrWhiteSpace(config.FileName) ? source.Name + ".docx" : config.FileName.Trim();
        if (!fileName.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
        {
            throw new BusinessException("Ai:Word:UnsupportedFile")
                .WithData("sourceId", source.Id)
                .WithData("fileName", fileName);
        }

        var text = ExtractDocxText(bytes).Trim();
        if (text.Length < 20)
        {
            throw new BusinessException("Ai:Word:EmptyContent")
                .WithData("sourceId", source.Id)
                .WithData("fileName", fileName);
        }

        var title = string.IsNullOrWhiteSpace(config.Title)
            ? Path.GetFileNameWithoutExtension(fileName)
            : config.Title.Trim();

        var metadataJson = JsonSerializer.Serialize(new
        {
            sourceType = "word",
            fileName,
            contentType = config.ContentType,
            characterCount = text.Length
        });

        return Task.FromResult(new List<ContentPayload>
        {
            new(
                source.Id,
                title,
                text,
                ExternalId: "word:" + source.Id,
                Url: config.Url,
                MetadataJson: metadataJson)
        });
    }

    private static string ExtractDocxText(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes);
        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: false);

        var parts = new[]
        {
            "word/document.xml",
            "word/footnotes.xml",
            "word/endnotes.xml"
        }
            .Concat(archive.Entries
                .Select(e => e.FullName)
                .Where(name =>
                    name.StartsWith("word/header", StringComparison.OrdinalIgnoreCase) ||
                    name.StartsWith("word/footer", StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var sb = new StringBuilder();
        foreach (var partName in parts)
        {
            var entry = archive.GetEntry(partName);
            if (entry == null)
                continue;

            using var entryStream = entry.Open();
            var doc = XDocument.Load(entryStream);
            AppendWordXmlText(doc, sb);
        }

        return NormalizeExtractedText(sb.ToString());
    }

    private static void AppendWordXmlText(XDocument doc, StringBuilder sb)
    {
        XNamespace w = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
        var body = doc.Root?.Element(w + "body") ?? doc.Root;
        if (body == null)
            return;

        foreach (var paragraph in body.Descendants(w + "p"))
        {
            var text = ExtractParagraphText(paragraph, w).Trim();
            if (!string.IsNullOrWhiteSpace(text))
            {
                sb.AppendLine(text);
                sb.AppendLine();
            }
        }
    }

    private static string ExtractParagraphText(XElement paragraph, XNamespace w)
    {
        var sb = new StringBuilder();
        foreach (var node in paragraph.Descendants())
        {
            if (node.Name == w + "t")
            {
                sb.Append(node.Value);
            }
            else if (node.Name == w + "tab")
            {
                sb.Append('\t');
            }
            else if (node.Name == w + "br")
            {
                sb.AppendLine();
            }
        }

        return sb.ToString();
    }

    private static string NormalizeExtractedText(string text)
    {
        var lines = text
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Split('\n')
            .Select(line => string.Join(' ', line.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)))
            .ToList();

        var sb = new StringBuilder();
        var blank = false;
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line))
            {
                if (!blank && sb.Length > 0)
                {
                    sb.AppendLine();
                    blank = true;
                }

                continue;
            }

            sb.AppendLine(line);
            blank = false;
        }

        return sb.ToString().Trim();
    }

    private sealed record SourceConfig(
        string? FileName,
        string? ContentType,
        string? Base64,
        string? Title,
        string? Url);
}
