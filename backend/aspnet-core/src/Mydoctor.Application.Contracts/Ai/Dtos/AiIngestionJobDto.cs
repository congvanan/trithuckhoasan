using System;
using Volo.Abp.Application.Dtos;

namespace Mydoctor.Ai.Dtos;

public class AiIngestionJobDto : EntityDto<Guid>
{
    public Guid SourceId { get; set; }
    public string? SourceName { get; set; }
    public AiJobStatus Status { get; set; }
    public int Progress { get; set; }
    public int Total { get; set; }
    public int ProcessedDocumentCount { get; set; }
    public int ProcessedChunkCount { get; set; }
    public string? Error { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }
    public DateTime CreationTime { get; set; }
}
