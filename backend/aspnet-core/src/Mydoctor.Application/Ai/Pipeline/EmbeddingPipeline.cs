using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Mydoctor.Ai.Providers;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Guids;
using Volo.Abp.Settings;

namespace Mydoctor.Ai;

public class EmbeddingPipeline : IEmbeddingPipeline, ITransientDependency
{
    private readonly IAiProviderFactory _providerFactory;
    private readonly ISettingProvider _settingProvider;
    private readonly IGuidGenerator _guidGenerator;

    public EmbeddingPipeline(
        IAiProviderFactory providerFactory,
        ISettingProvider settingProvider,
        IGuidGenerator guidGenerator)
    {
        _providerFactory = providerFactory;
        _settingProvider = settingProvider;
        _guidGenerator = guidGenerator;
    }

    public async Task<List<VectorChunk>> ProcessAsync(
        ContentPayload payload,
        Guid documentId,
        Guid? tenantId,
        CancellationToken ct = default)
    {
        var chunkSize = await GetIntSetting(AiSettings.ChunkSize, 1000);
        var chunkOverlap = await GetIntSetting(AiSettings.ChunkOverlap, 150);
        var embeddingProvider = await _settingProvider.GetOrNullAsync(AiSettings.EmbeddingProvider) ?? AiModelDefaults.GeminiProvider;
        var embedModel = AiModelDefaults.NormalizeEmbeddingModel(
            embeddingProvider,
            await _settingProvider.GetOrNullAsync(AiSettings.EmbeddingModel));

        var embedder = await _providerFactory.GetEmbeddingAsync();
        var result = new List<VectorChunk>();

        // Structure-aware: nếu extractor cung cấp sections theo heading thì chunk
        // trong phạm vi từng section và gắn header ngữ cảnh (title › heading path)
        // vào mỗi chunk — cải thiện retrieval vì chunk tự mang ngữ cảnh của nó.
        // Không có sections thì giữ nguyên hành vi chunk phẳng như cũ.
        if (payload.Sections is { Count: > 0 })
        {
            foreach (var section in payload.Sections)
            {
                ct.ThrowIfCancellationRequested();
                var header = string.IsNullOrWhiteSpace(section.HeadingPath)
                    ? payload.Title.Trim()
                    : payload.Title.Trim() + " › " + section.HeadingPath.Trim();
                var effectiveSize = Math.Min(chunkSize, AiConsts.MaxChunkTextLength - header.Length - 2);

                foreach (var text in ChunkText(section.Text, effectiveSize, chunkOverlap))
                {
                    var chunkText = string.IsNullOrWhiteSpace(header) ? text : header + "\n\n" + text;
                    if (chunkText.Length > AiConsts.MaxChunkTextLength)
                        chunkText = chunkText[..AiConsts.MaxChunkTextLength];
                    await EmbedAndAddAsync(chunkText, ct);
                }
            }
        }
        else
        {
            foreach (var text in ChunkText(payload.Text, chunkSize, chunkOverlap))
            {
                ct.ThrowIfCancellationRequested();
                await EmbedAndAddAsync(text, ct);
            }
        }

        return result;

        async Task EmbedAndAddAsync(string text, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            var emb = await embedder.EmbedAsync(new EmbeddingRequest(embedModel, text));
            result.Add(new VectorChunk(
                _guidGenerator.Create(),
                documentId,
                payload.SourceId,
                result.Count,
                text,
                EstimateTokens(text),
                emb.Vector,
                embedder.Name + ":" + embedModel,
                tenantId,
                payload.MetadataJson));
        }
    }

    private async Task<int> GetIntSetting(string key, int fallback)
    {
        var raw = await _settingProvider.GetOrNullAsync(key);
        return int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var v) ? v : fallback;
    }

    private static int EstimateTokens(string text) => text.Length / 4;

    private static List<string> ChunkText(string text, int chunkSize, int overlap)
    {
        var result = new List<string>();
        if (string.IsNullOrWhiteSpace(text)) return result;

        chunkSize = Math.Clamp(chunkSize, 200, AiConsts.MaxChunkTextLength);
        overlap = Math.Clamp(overlap, 0, chunkSize / 3);

        var clean = string.Join("\n", text
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Split('\n')
            .Select(line => string.Join(' ', line.Split(' ', StringSplitOptions.RemoveEmptyEntries)))
            .Where(line => !string.IsNullOrWhiteSpace(line)))
            .Trim();
        if (clean.Length <= chunkSize) { result.Add(clean); return result; }

        var start = 0;
        while (start < clean.Length)
        {
            start = SkipLeadingSeparators(clean, start);
            if (start >= clean.Length) break;

            var hardEnd = Math.Min(start + chunkSize, clean.Length);
            var end = hardEnd == clean.Length ? hardEnd : FindChunkEnd(clean, start, hardEnd, chunkSize);
            var slice = clean[start..end].Trim();
            if (!string.IsNullOrWhiteSpace(slice)) result.Add(slice);
            if (end >= clean.Length) break;

            var nextStart = FindNextStart(clean, start, end, overlap);
            start = nextStart <= start ? end : nextStart;
        }
        return result;
    }

    private static int FindChunkEnd(string text, int start, int hardEnd, int chunkSize)
    {
        var minEnd = start + Math.Max(80, chunkSize / 2);
        var paragraphBreak = text.LastIndexOf("\n\n", hardEnd - 1, hardEnd - start, StringComparison.Ordinal);
        if (paragraphBreak >= minEnd) return paragraphBreak + 2;

        var sentenceBreak = text.LastIndexOfAny(new[] { '.', '!', '?', '。', '！', '？', '\n' }, hardEnd - 1, hardEnd - start);
        if (sentenceBreak >= minEnd) return sentenceBreak + 1;

        var wordBreak = text.LastIndexOfAny(new[] { ' ', ',', ';', ':', ')' }, hardEnd - 1, hardEnd - start);
        return wordBreak >= minEnd ? wordBreak + 1 : hardEnd;
    }

    private static int FindNextStart(string text, int start, int end, int overlap)
    {
        if (overlap <= 0) return end;

        var next = Math.Max(start + 1, end - overlap);
        while (next < end && !char.IsWhiteSpace(text[next - 1])) next++;
        return SkipLeadingSeparators(text, next);
    }

    private static int SkipLeadingSeparators(string text, int index)
    {
        while (index < text.Length && (char.IsWhiteSpace(text[index]) || char.IsPunctuation(text[index])))
        {
            index++;
        }

        return index;
    }
}
