using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Mydoctor.Ai;

public record VectorChunk(
    Guid Id,
    Guid DocumentId,
    Guid SourceId,
    int ChunkIndex,
    string Text,
    int TokenCount,
    float[] Embedding,
    string EmbeddingModel,
    Guid? TenantId = null,
    string? MetadataJson = null);

public record VectorSearchHit(
    Guid ChunkId,
    Guid DocumentId,
    Guid SourceId,
    int ChunkIndex,
    string Text,
    double Score,
    string DocumentTitle,
    string? DocumentUrl);

public interface IVectorStore
{
    Task UpsertChunksAsync(IEnumerable<VectorChunk> chunks, CancellationToken ct = default);
    Task DeleteByDocumentAsync(Guid documentId, CancellationToken ct = default);
    Task DeleteBySourceAsync(Guid sourceId, CancellationToken ct = default);
    Task<List<VectorSearchHit>> SearchAsync(float[] queryEmbedding, int topK, Guid? tenantId, CancellationToken ct = default);
    Task<List<VectorSearchHit>> SearchByTextAsync(IReadOnlyCollection<string> queries, int topK, Guid? tenantId, CancellationToken ct = default);
}
