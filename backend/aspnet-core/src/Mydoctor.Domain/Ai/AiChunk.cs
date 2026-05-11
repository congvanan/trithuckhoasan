using System;
using Pgvector;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiChunk : FullAuditedEntity<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public Guid DocumentId { get; protected set; }

    public Guid SourceId { get; protected set; }

    public int ChunkIndex { get; protected set; }

    public string Text { get; protected set; } = default!;

    public int TokenCount { get; protected set; }

    /// <summary>Embedding vector. Dimensions fixed to AiConsts.EmbeddingDimensions (768).</summary>
    public Vector? Embedding { get; protected set; }

    /// <summary>Name of the model that produced the embedding — used to detect stale embeddings after a provider swap.</summary>
    public string? EmbeddingModel { get; protected set; }

    public string? MetadataJson { get; protected set; }

    protected AiChunk() { }

    public AiChunk(
        Guid id,
        Guid documentId,
        Guid sourceId,
        int chunkIndex,
        string text,
        int tokenCount,
        string? metadataJson = null,
        Guid? tenantId = null) : base(id)
    {
        DocumentId = documentId;
        SourceId = sourceId;
        ChunkIndex = chunkIndex;
        Text = text;
        TokenCount = tokenCount;
        MetadataJson = metadataJson;
        TenantId = tenantId;
    }

    public void SetEmbedding(Vector embedding, string embeddingModel)
    {
        Embedding = embedding;
        EmbeddingModel = embeddingModel;
    }
}
