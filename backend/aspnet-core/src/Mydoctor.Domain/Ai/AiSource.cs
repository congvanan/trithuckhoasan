using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiSource : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public string Name { get; protected set; } = default!;

    public string? Description { get; protected set; }

    public AiSourceType Type { get; protected set; }

    public AiSourceStatus Status { get; protected set; }

    /// <summary>Provider-specific config (API key ref, blog slug filter, URL pattern, ...) serialized as JSON.</summary>
    public string? ConfigJson { get; protected set; }

    public DateTime? LastIndexedAt { get; protected set; }

    public int DocumentCount { get; protected set; }

    public int ChunkCount { get; protected set; }

    protected AiSource() { }

    public AiSource(
        Guid id,
        string name,
        AiSourceType type,
        AiSourceStatus status = AiSourceStatus.Active,
        string? description = null,
        string? configJson = null,
        Guid? tenantId = null) : base(id)
    {
        Name = name;
        Type = type;
        Status = status;
        Description = description;
        ConfigJson = configJson;
        TenantId = tenantId;
    }

    public void Update(AiSourceType type, string name, string? description, AiSourceStatus status, string? configJson)
    {
        Type = type;
        Name = name;
        Description = description;
        Status = status;
        ConfigJson = configJson;
    }

    public void MarkIndexed(int documentCount, int chunkCount)
    {
        DocumentCount = documentCount;
        ChunkCount = chunkCount;
        LastIndexedAt = DateTime.UtcNow;
    }

    public void SetStatus(AiSourceStatus status) => Status = status;
}
