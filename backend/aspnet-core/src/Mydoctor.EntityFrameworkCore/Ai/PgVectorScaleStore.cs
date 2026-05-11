using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Mydoctor.Ai;
using Pgvector;
using Pgvector.EntityFrameworkCore;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;

namespace Mydoctor.EntityFrameworkCore;

public class PgVectorScaleStore : IVectorStore, ITransientDependency
{
    private readonly IDbContextProvider<MydoctorDbContext> _dbContextProvider;

    public PgVectorScaleStore(IDbContextProvider<MydoctorDbContext> dbContextProvider)
    {
        _dbContextProvider = dbContextProvider;
    }

    public async Task UpsertChunksAsync(IEnumerable<VectorChunk> chunks, CancellationToken ct = default)
    {
        var db = await _dbContextProvider.GetDbContextAsync();
        foreach (var c in chunks)
        {
            var entity = new AiChunk(c.Id, c.DocumentId, c.SourceId, c.ChunkIndex, c.Text, c.TokenCount, c.MetadataJson, c.TenantId);
            entity.SetEmbedding(new Vector(c.Embedding), c.EmbeddingModel);
            db.Set<AiChunk>().Add(entity);
        }
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteByDocumentAsync(Guid documentId, CancellationToken ct = default)
    {
        var db = await _dbContextProvider.GetDbContextAsync();
        await db.Set<AiChunk>().Where(c => c.DocumentId == documentId).ExecuteDeleteAsync(ct);
    }

    public async Task DeleteBySourceAsync(Guid sourceId, CancellationToken ct = default)
    {
        var db = await _dbContextProvider.GetDbContextAsync();
        await db.Set<AiChunk>().Where(c => c.SourceId == sourceId).ExecuteDeleteAsync(ct);
    }

    public async Task<List<VectorSearchHit>> SearchAsync(
        float[] queryEmbedding,
        int topK,
        Guid? tenantId,
        CancellationToken ct = default)
    {
        var db = await _dbContextProvider.GetDbContextAsync();
        var qVec = new Vector(queryEmbedding);

        var query =
            from c in db.Set<AiChunk>().AsNoTracking()
            join d in db.Set<AiDocument>().AsNoTracking() on c.DocumentId equals d.Id
            join s in db.Set<AiSource>().AsNoTracking() on c.SourceId equals s.Id
            where c.Embedding != null
                  && s.Status == AiSourceStatus.Active
                  && (tenantId == null ? c.TenantId == null : c.TenantId == tenantId)
            orderby c.Embedding!.CosineDistance(qVec)
            select new
            {
                c.Id,
                c.DocumentId,
                c.SourceId,
                c.ChunkIndex,
                c.Text,
                Distance = c.Embedding!.CosineDistance(qVec),
                d.Title,
                d.Url
            };

        var rows = await query.Take(topK).ToListAsync(ct);
        return rows.Select(r => new VectorSearchHit(
            r.Id, r.DocumentId, r.SourceId, r.ChunkIndex, r.Text,
            1.0 - r.Distance, r.Title, r.Url)).ToList();
    }

    public async Task<List<VectorSearchHit>> SearchByTextAsync(
        IReadOnlyCollection<string> queries,
        int topK,
        Guid? tenantId,
        CancellationToken ct = default)
    {
        var normalizedQueries = queries
            .Select(NormalizeKeywordQuery)
            .Where(q => q.Length >= 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(12)
            .ToList();

        if (normalizedQueries.Count == 0 || topK <= 0)
        {
            return new List<VectorSearchHit>();
        }

        var db = await _dbContextProvider.GetDbContextAsync();
        var merged = new Dictionary<Guid, VectorSearchHit>();

        foreach (var queryText in normalizedQueries)
        {
            var pattern = $"%{EscapeLikePattern(queryText)}%";
            var rows = await (
                from c in db.Set<AiChunk>().AsNoTracking()
                join d in db.Set<AiDocument>().AsNoTracking() on c.DocumentId equals d.Id
                join s in db.Set<AiSource>().AsNoTracking() on c.SourceId equals s.Id
                where s.Status == AiSourceStatus.Active
                      && (tenantId == null ? c.TenantId == null : c.TenantId == tenantId)
                      && (EF.Functions.ILike(c.Text, pattern) || EF.Functions.ILike(d.Title, pattern))
                select new
                {
                    c.Id,
                    c.DocumentId,
                    c.SourceId,
                    c.ChunkIndex,
                    c.Text,
                    d.Title,
                    d.Url
                })
                .Take(topK * 4)
                .ToListAsync(ct);

            foreach (var row in rows)
            {
                var score = ScoreKeywordHit(queryText, row.Title, row.Text);
                var hit = new VectorSearchHit(
                    row.Id,
                    row.DocumentId,
                    row.SourceId,
                    row.ChunkIndex,
                    row.Text,
                    score,
                    row.Title,
                    row.Url);

                if (!merged.TryGetValue(row.Id, out var existing) || hit.Score > existing.Score)
                {
                    merged[row.Id] = hit;
                }
            }
        }

        return merged.Values
            .OrderByDescending(h => h.Score)
            .ThenBy(h => h.DocumentTitle)
            .ThenBy(h => h.ChunkIndex)
            .Take(topK)
            .ToList();
    }

    private static string NormalizeKeywordQuery(string text)
        => Regex.Replace(text.Trim(), @"\s+", " ");

    private static string EscapeLikePattern(string text)
        => text.Replace(@"\", @"\\").Replace("%", @"\%").Replace("_", @"\_");

    private static double ScoreKeywordHit(string query, string title, string text)
    {
        var haystack = (title + "\n" + text).ToLowerInvariant();
        var normalizedQuery = query.ToLowerInvariant();
        var terms = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var matchedTerms = terms.Count(term => haystack.Contains(term, StringComparison.Ordinal));
        var exactBoost = haystack.Contains(normalizedQuery, StringComparison.Ordinal) ? 0.25 : 0;
        var titleBoost = title.ToLowerInvariant().Contains(normalizedQuery, StringComparison.Ordinal) ? 0.2 : 0;
        return Math.Min(1.0, 0.45 + exactBoost + titleBoost + matchedTerms * 0.03);
    }
}
