using System;
using Volo.Abp.Domain.Entities.Auditing;
using Volo.Abp.MultiTenancy;

namespace Mydoctor.Ai;

public class AiIngestionJob : FullAuditedAggregateRoot<Guid>, IMultiTenant
{
    public Guid? TenantId { get; protected set; }

    public Guid SourceId { get; protected set; }

    public AiJobStatus Status { get; protected set; }

    public int Progress { get; protected set; }

    public int Total { get; protected set; }

    public int ProcessedDocumentCount { get; protected set; }

    public int ProcessedChunkCount { get; protected set; }

    public string? Error { get; protected set; }

    public DateTime? StartedAt { get; protected set; }

    public DateTime? FinishedAt { get; protected set; }

    protected AiIngestionJob() { }

    public AiIngestionJob(Guid id, Guid sourceId, Guid? tenantId = null) : base(id)
    {
        SourceId = sourceId;
        Status = AiJobStatus.Pending;
        TenantId = tenantId;
    }

    public void Start(int total)
    {
        Status = AiJobStatus.Running;
        Total = total;
        StartedAt = DateTime.UtcNow;
    }

    public void ReportProgress(int progress, int processedDocuments, int processedChunks)
    {
        Progress = progress;
        ProcessedDocumentCount = processedDocuments;
        ProcessedChunkCount = processedChunks;
    }

    public void Complete(int processedDocuments, int processedChunks)
    {
        Status = AiJobStatus.Completed;
        ProcessedDocumentCount = processedDocuments;
        ProcessedChunkCount = processedChunks;
        Progress = Total;
        FinishedAt = DateTime.UtcNow;
    }

    public void Fail(string error)
    {
        Status = AiJobStatus.Failed;
        Error = error;
        FinishedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        Status = AiJobStatus.Cancelled;
        FinishedAt = DateTime.UtcNow;
    }
}
