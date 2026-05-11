using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiDocument : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public Guid SourceId { get; protected set; }

    /// <summary>Original ID in the source system (e.g. BlogPost.Id, file path, external URL).</summary>
    public string? ExternalId { get; protected set; }

    public string Title { get; protected set; } = default!;

    public string? Url { get; protected set; }

    /// <summary>SHA-256 of the raw content — lets us skip re-embedding when unchanged.</summary>
    public string? ContentHash { get; protected set; }

    /// <summary>Extra metadata (author, publish date, tags, mime, size) as JSON.</summary>
    public string? MetadataJson { get; protected set; }

    public int ChunkCount { get; protected set; }

    public DateTime? LastIndexedAt { get; protected set; }

    protected AiDocument() { }

    public AiDocument(
        Guid id,
        Guid sourceId,
        string title,
        string? externalId = null,
        string? url = null,
        string? contentHash = null,
        string? metadataJson = null,
        Guid? tenantId = null) : base(id)
    {
        SourceId = sourceId;
        Title = title;
        ExternalId = externalId;
        Url = url;
        ContentHash = contentHash;
        MetadataJson = metadataJson;
        TenantId = tenantId;
    }

    public void Update(string title, string? url, string? contentHash, string? metadataJson)
    {
        Title = title;
        Url = url;
        ContentHash = contentHash;
        MetadataJson = metadataJson;
    }

    public void MarkIndexed(int chunkCount)
    {
        ChunkCount = chunkCount;
        LastIndexedAt = DateTime.UtcNow;
    }
}
